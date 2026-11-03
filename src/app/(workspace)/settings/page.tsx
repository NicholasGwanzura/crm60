import { DEFAULT_DEEPSEEK_MODEL } from "@/lib/ai-settings-input";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AiSettingsForm } from "@/components/ai-settings-form";
export default async function SettingsPage() {
  const user = await requireUser();
  const admin = await db.organisationMembership.findFirst({ where: { userId: user.id, role: "PLATFORM_ADMIN" } });
  if (!admin) notFound();
  const config = await db.aiConfiguration.findUnique({ where: { id: "deepseek" }, select: { model: true, enabled: true, encryptedKey: true } });
  return <div className="max-w-2xl"><header className="mb-8 border-b pb-5"><h1 className="text-xl font-semibold tracking-tight">Settings</h1><p className="mt-1 text-sm text-neutral-500">Connections that power your workspace.</p></header><div className="mb-6 flex items-center justify-between"><div><h2 className="text-sm font-semibold">DeepSeek AI</h2><p className="mt-1 text-xs text-neutral-500">Lead summaries and suggested next steps.</p></div><span className="border px-2 py-1 text-xs text-neutral-500">{config?.enabled || (!config && process.env.DEEPSEEK_API_KEY) ? "Enabled" : "Disabled"}</span></div><AiSettingsForm model={config?.model?.trim() || process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL} enabled={config?.enabled ?? !!process.env.DEEPSEEK_API_KEY} hasKey={!!config?.encryptedKey || !!process.env.DEEPSEEK_API_KEY}/></div>;
}
