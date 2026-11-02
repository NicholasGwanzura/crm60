"use server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { leadScope } from "@/lib/permissions";
import { deepSeekConfiguration, requestLeadSummary } from "@/lib/deepseek";
import { z } from "zod";
export async function summarizeLead(leadId: string): Promise<{ text?: string; error?: string }> {
  const user = await currentUser();
  if (!user) return { error: "Sign in to use AI." };
  if (!z.uuid().safeParse(leadId).success) return { error: "Invalid lead." };
  const lead = await db.lead.findFirst({ where: { AND: [{ id: leadId }, await leadScope(user.id)] }, select: { title: true, companyName: true, description: true, stage: { select: { name: true } }, notes: { orderBy: { createdAt: "desc" }, take: 3, select: { body: true } } } });
  if (!lead) return { error: "This lead is unavailable." };
  try {
    const config = await deepSeekConfiguration();
    if (!config.enabled || !config.key) return { error: "Ask a platform administrator to connect DeepSeek in Settings." };
    await db.aiRateLimit.upsert({ where: { userId: user.id }, create: { userId: user.id, lastRequestedAt: new Date(0) }, update: {} });
    const claimed = await db.aiRateLimit.updateMany({ where: { userId: user.id, lastRequestedAt: { lt: new Date(Date.now() - 30000) } }, data: { lastRequestedAt: new Date() } });
    if (!claimed.count) return { error: "Please wait 30 seconds between AI requests." };
    const text = await requestLeadSummary(config.key, config.model, { title: lead.title, company: lead.companyName, stage: lead.stage.name, description: lead.description?.slice(0, 6000), recentNotes: lead.notes.map((n) => n.body.slice(0, 2000)) });
    return { text };
  } catch { return { error: "DeepSeek could not generate a summary. Check the connection or try again shortly." }; }
}
