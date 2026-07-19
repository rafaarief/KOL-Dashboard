import Anthropic from "@anthropic-ai/sdk";
import { aiConfig } from "./config.js";

let cachedClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic | null {
  if (!aiConfig.apiKey) return null;
  if (cachedClient) return cachedClient;
  cachedClient = new Anthropic({ apiKey: aiConfig.apiKey });
  return cachedClient;
}
