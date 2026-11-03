"use server";
import { aiSettingsInput } from "@/lib/ai-settings-input";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deepSeekConfiguration, encryptKey, verifyDeepSeekKey } from "@/lib/deepseek";
export type AiSettingsState = { error?: string; success?: string; fieldErrors?: { apiKey?: string; model?: string } };
export async function saveAiSettings(_: AiSettingsState, form: FormData): Promise<AiSettingsState> {
  const user = await requireUser();
  const admin = await db.organisationMembership.findFirst({ where: { userId: user.id, role: "PLATFORM_ADMIN" } });
  if (!admin) return { error: "Only a platform administrator can configure AI." };
  const input = aiSettingsInput.safeParse({ apiKey: form.get("apiKey") ?? "", model: form.get("model") ?? "", enabled: form.get("enabled") === "on" });
  if (!input.success) {
    const fields = input.error.flatten().fieldErrors;
    return { fieldErrors: { apiKey: fields.apiKey?.[0], model: fields.model?.[0] } };
  }
  try {
    const key = input.data.apiKey || (input.data.enabled ? (await deepSeekConfiguration()).key : undefined);
    if (input.data.enabled && !key) return { fieldErrors: { apiKey: "Add your DeepSeek API key to enable AI." } };
    if (input.data.enabled && !await verifyDeepSeekKey(key!, input.data.model)) return { error: "DeepSeek could not verify this key and model. Use deepseek-flash or deepseek-v4-pro and check the key in your DeepSeek account." };
    const encryptedKey = input.data.apiKey ? encryptKey(input.data.apiKey) : undefined;
    await db.aiConfiguration.upsert({ where: { id: "deepseek" }, create: { id: "deepseek", encryptedKey, model: input.data.model, enabled: input.data.enabled }, update: { ...(encryptedKey ? { encryptedKey } : {}), model: input.data.model, enabled: input.data.enabled } });
    revalidatePath("/settings");
    return { success: input.data.enabled ? "DeepSeek connected. Lead summaries are ready." : "AI is disabled. Configuration saved." };
  } catch { return { error: "Could not save the connection. Check the server configuration or try again." }; }
}
