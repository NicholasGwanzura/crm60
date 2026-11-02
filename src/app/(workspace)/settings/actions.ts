"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deepSeekConfiguration, encryptKey, verifyDeepSeekKey } from "@/lib/deepseek";
export type AiSettingsState = { error?: string; success?: string };
export async function saveAiSettings(_: AiSettingsState, form: FormData): Promise<AiSettingsState> {
  const user = await requireUser();
  const admin = await db.organisationMembership.findFirst({ where: { userId: user.id, role: "PLATFORM_ADMIN" } });
  if (!admin) return { error: "Only a platform administrator can configure AI." };
  const input = z.object({ apiKey: z.string().trim().max(512), model: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9._:/-]+$/), enabled: z.boolean() }).safeParse({ apiKey: form.get("apiKey") ?? "", model: form.get("model"), enabled: form.get("enabled") === "on" });
  if (!input.success) return { error: "Enter a valid model identifier and API key." };
  try {
    const key = input.data.apiKey || (input.data.enabled ? (await deepSeekConfiguration()).key : undefined);
    if (input.data.enabled && (!key || !await verifyDeepSeekKey(key, input.data.model))) return { error: "Connection failed. Check the key, model availability, and your DeepSeek account." };
    const encryptedKey = input.data.apiKey ? encryptKey(input.data.apiKey) : undefined;
    await db.aiConfiguration.upsert({ where: { id: "deepseek" }, create: { id: "deepseek", encryptedKey, model: input.data.model, enabled: input.data.enabled }, update: { ...(encryptedKey ? { encryptedKey } : {}), model: input.data.model, enabled: input.data.enabled } });
    revalidatePath("/settings");
    return { success: input.data.enabled ? "DeepSeek connected. Lead summaries are ready." : "AI is disabled. Configuration saved." };
  } catch { return { error: "Could not save the connection. Check the server configuration or try again." }; }
}
