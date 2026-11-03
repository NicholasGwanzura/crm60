"use client";
import { Field } from "@/components/crm-ui";
import { useActionState } from "react";
import { saveAiSettings } from "@/app/(workspace)/settings/actions";
export function AiSettingsForm({ enabled, model, hasKey }: { enabled: boolean; model: string; hasKey: boolean }) {
  const [state, action, pending] = useActionState(saveAiSettings, {});
  return <form action={action} className="space-y-6"><fieldset disabled={pending} className="space-y-5">
    <Field label="DeepSeek API key" hint="Encrypted on the server. Leave blank to keep the configured key."><input type="password" name="apiKey" autoComplete="off" maxLength={512} placeholder={hasKey ? "Key configured · leave blank to keep it" : "Enter your DeepSeek API key"}/></Field>
    <Field label="Model" hint="Choose a model available to your DeepSeek account."><input name="model" defaultValue={model} required maxLength={100}/></Field>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" name="enabled" defaultChecked={enabled}/> Enable AI lead summaries</label>
    <p className="text-xs leading-5 text-neutral-500">Team members can send a lead’s title, company, description, stage and recent notes to DeepSeek when they choose Generate summary. DeepSeek API usage is billed to your account.</p>
    <button className="ui-button" disabled={pending}>{pending ? "Checking connection…" : "Save connection"}</button>
  </fieldset>{state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}{state.success && <p role="status" className="text-sm text-emerald-700">{state.success}</p>}</form>;
}
