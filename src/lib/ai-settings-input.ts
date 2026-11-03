import { z } from "zod";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-flash";
export const DEEPSEEK_MODELS = [
  { id: "deepseek-flash", label: "DeepSeek Flash · Recommended for CRM summaries" },
  { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro · More complex analysis" },
];
export const aiSettingsInput = z.object({
  apiKey: z.string().trim().max(4096, "The API key is too long.").regex(/^\S*$/, "Paste only the API key, without Bearer or spaces."),
  model: z.string().trim().min(1, "Choose a model, such as deepseek-flash.").max(100, "The model identifier is too long.").regex(/^[a-zA-Z0-9._:/-]+$/, "Use an API identifier such as deepseek-flash, without spaces."),
  enabled: z.boolean(),
});
