import { parsedQuerySchema, type ParsedQuery } from "@kol-finder/schemas";
import { NICHE_TAXONOMY } from "@kol-finder/shared";
import { getAnthropicClient } from "./anthropicClient.js";
import { interpretQueryDeterministically } from "./deterministicQueryFallback.js";
import { aiConfig } from "./config.js";

const TOOL_NAME = "emit_parsed_query";

const SYSTEM_PROMPT = `You convert a KOL sourcing team's natural-language search (Indonesian or English) into
structured TikTok search parameters. Only extract what's actually implied by the query; never invent a
location, follower range, or time window the user didn't ask for. Niche hints must come from this list: ${NICHE_TAXONOMY.join(", ")}.`;

/**
 * AI-assisted query interpretation (PRD section 18.1). The AI only parses the query into
 * structured search parameters — it never scrapes and never computes the ranking score.
 * Falls back to the deterministic template on missing key, API error, or invalid output.
 */
export async function interpretQuery(rawQuery: string): Promise<ParsedQuery> {
  const client = getAnthropicClient();
  if (!client) {
    return interpretQueryDeterministically(rawQuery);
  }

  try {
    const response = await client.messages.create({
      model: aiConfig.model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: rawQuery }],
      tools: [
        {
          name: TOOL_NAME,
          description: "Emit the structured search parameters parsed from the query.",
          input_schema: {
            type: "object",
            properties: {
              primaryKeyword: { type: "string" },
              keywordVariations: { type: "array", items: { type: "string" } },
              category: { type: ["string", "null"] },
              location: { type: ["string", "null"] },
              nicheHints: { type: "array", items: { type: "string" } },
              timeRangeDays: { type: ["number", "null"] },
              minimumViews: { type: "number" },
              minimumFollowers: { type: ["number", "null"] },
              maximumFollowers: { type: ["number", "null"] },
              creatorType: { type: ["string", "null"] },
              maximumCreators: { type: "number" },
              recentVideoLimit: { type: "number" },
              sortMode: {
                type: "string",
                enum: ["balanced", "best_match", "most_recent", "highest_views", "highest_followers"],
              },
            },
            required: ["primaryKeyword", "keywordVariations"],
          },
        },
      ],
      tool_choice: { type: "tool", name: TOOL_NAME },
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Model did not return a tool_use block");
    }

    return parsedQuerySchema.parse(toolUse.input);
  } catch (error) {
    console.warn("[kol-finder] query interpretation failed, falling back to deterministic parsing:", error);
    return interpretQueryDeterministically(rawQuery);
  }
}
