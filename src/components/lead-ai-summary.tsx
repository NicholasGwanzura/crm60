"use client";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { summarizeLead } from "@/app/(workspace)/leads/ai-actions";
export function LeadAiSummary({ leadId }: { leadId: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ text?: string; error?: string }>({});
  return <section className="panel p-6"><div className="mb-2 flex items-center gap-2"><Sparkles size={15}/><h2 className="text-sm font-semibold">AI insights</h2></div><p className="mb-4 text-xs leading-5 text-neutral-500">Generate a summary and next steps using DeepSeek. This sends the lead’s title, company, description, stage and recent notes to DeepSeek.</p><button className="ui-button-secondary" disabled={pending} onClick={() => start(async () => { try { setResult(await summarizeLead(leadId)); } catch { setResult({error:"Could not reach the AI service. Please try again."}); } })}>{pending ? "Generating…" : "Generate summary"}</button><div aria-live="polite" aria-busy={pending}>{result.error && <p role="alert" className="mt-4 text-sm text-red-700">{result.error}</p>}{result.text && <><p className="mt-5 whitespace-pre-wrap border-t pt-5 text-sm leading-7 text-neutral-700">{result.text}</p><p className="mt-3 text-xs text-neutral-400">AI generated. Review suggestions before acting.</p></>}</div></section>;
}
