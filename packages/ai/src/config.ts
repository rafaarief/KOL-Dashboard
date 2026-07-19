export const aiConfig = {
  apiKey: process.env.AI_API_KEY ?? "",
  model: process.env.AI_MODEL ?? "claude-sonnet-5",
  defaultMinimumViews: Number.parseInt(process.env.DEFAULT_MINIMUM_VIEWS ?? "10000", 10),
  defaultResultLimit: Number.parseInt(process.env.DEFAULT_RESULT_LIMIT ?? "30", 10),
  recentVideoLimit: Number.parseInt(process.env.SCRAPER_VIDEO_LIMIT ?? "5", 10),
};
