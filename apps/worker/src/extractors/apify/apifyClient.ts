import { ApifyClient } from "apify-client";
import { config } from "../../config.js";

let client: ApifyClient | null = null;

/** Lazily constructed so importing this module doesn't require APIFY_API_TOKEN unless it's actually used. */
export function getApifyClient(): ApifyClient {
  if (!client) {
    client = new ApifyClient({ token: config.apifyApiToken });
  }
  return client;
}
