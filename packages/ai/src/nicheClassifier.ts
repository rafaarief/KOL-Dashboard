import { nicheClassificationSchema, type NicheClassification } from "@kol-finder/schemas";
import { NICHE_TAXONOMY, isValidNiche } from "@kol-finder/shared";
import { getAnthropicClient } from "./anthropicClient.js";
import { classifyNicheDeterministically, type NicheClassificationInput } from "./deterministicNicheFallback.js";
import { aiConfig } from "./config.js";

const TOOL_NAME = "emit_niche_classification";

const SYSTEM_PROMPT = `You classify a TikTok creator's likely content niche from their public bio, recent
captions, and hashtags. Choose primaryNiche and secondaryNiches ONLY from this taxonomy: ${NICHE_TAXONOMY.join(
  ", "
)}. Always include a short, specific reason grounded in what you were given.`;

/**
 * AI-assisted niche classification (PRD section 18.10). Output is validated against the
 * approved niche enum; on any failure (no key, API error, invalid/unknown niche) this falls
 * back to the deterministic keyword-based classifier so a search never stalls on this step.
 */
export async function classifyNiche(input: NicheClassificationInput): Promise<NicheClassification> {
  const client = getAnthropicClient();
  if (!client) {
    return classifyNicheDeterministically(input);
  }

  try {
    const response = await client.messages.create({
      model: aiConfig.model,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
      tools: [
        {
          name: TOOL_NAME,
          description: "Emit the creator's niche classification.",
          input_schema: {
            type: "object",
            properties: {
              primaryNiche: { type: "string" },
              secondaryNiches: { type: "array", items: { type: "string" } },
              confidence: { type: "number" },
              reason: { type: "string" },
            },
            required: ["primaryNiche", "confidence", "reason"],
          },
        },
      ],
      tool_choice: { type: "tool", name: TOOL_NAME },
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Model did not return a tool_use block");
    }

    const parsed = nicheClassificationSchema.parse(toolUse.input);

    if (!isValidNiche(parsed.primaryNiche) || parsed.secondaryNiches.some((niche) => !isValidNiche(niche))) {
      throw new Error("Model returned a niche outside the approved taxonomy");
    }

    return parsed;
  } catch (error) {
    console.warn("[kol-finder] niche classification failed, falling back to deterministic classification:", error);
    return classifyNicheDeterministically(input);
  }
}
