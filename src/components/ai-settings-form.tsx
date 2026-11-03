"use client";
import { Field } from "@/components/crm-ui";
import { useActionState,useState,useEffect } from "react";
import { saveAiSettings } from "@/app/(workspace)/settings/actions";
import { DEFAULT_DEEPSEEK_MODEL,DEEPSEEK_MODELS } from "@/lib/ai-settings-input";
export function AiSettingsForm({enabled,model,hasKey}:{enabled:boolean;model:string;hasKey:boolean}){
 const initial=model.trim()||DEFAULT_DEEPSEEK_MODEL;
 const [selected,setSelected]=useState(DEEPSEEK_MODELS.some(m=>m.id===initial)?initial:"custom");
 const [custom,setCustom]=useState(initial);
 const [apiKey,setApiKey]=useState("");
 const [aiEnabled,setAiEnabled]=useState(enabled);
 const [state,action,pending]=useActionState(saveAiSettings,{});
 useEffect(()=>{if(state.success)setApiKey("");},[state]);
 return <form action={action} className="space-y-6"><fieldset disabled={pending} className="space-y-5">
 <Field label="DeepSeek API key" hint="Paste only the key. Encrypted on the server; leave blank to keep an existing key."><input type="password" name="apiKey" value={apiKey} onChange={e=>setApiKey(e.target.value)} autoComplete="off" maxLength={4096} aria-invalid={!!state.fieldErrors?.apiKey} aria-describedby={state.fieldErrors?.apiKey?"ai-key-error":undefined} placeholder={hasKey?"Key configured · leave blank to keep it":"Paste your DeepSeek API key"}/></Field>{state.fieldErrors?.apiKey&&<p id="ai-key-error" role="alert" className="text-xs text-red-700">{state.fieldErrors.apiKey}</p>}
 <Field label="Model" hint="Flash is recommended for summaries and next steps. Pro is available for more complex analysis."><select value={selected} onChange={e=>setSelected(e.target.value)} aria-label="DeepSeek model">{DEEPSEEK_MODELS.map(m=><option value={m.id} key={m.id}>{m.label}</option>)}<option value="custom">Custom / saved model identifier</option></select></Field>
 {selected==="custom"?<Field label="Custom model identifier" hint="Use an exact identifier returned by DeepSeek's models API, without spaces."><input name="model" required maxLength={100} value={custom} onChange={e=>setCustom(e.target.value)} placeholder="deepseek-flash" aria-invalid={!!state.fieldErrors?.model} aria-describedby={state.fieldErrors?.model?"ai-model-error":undefined}/></Field>:<input name="model" type="hidden" value={selected}/>}
 {state.fieldErrors?.model&&<p id="ai-model-error" role="alert" className="text-xs text-red-700">{state.fieldErrors.model}</p>}
 <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" name="enabled" checked={aiEnabled} onChange={e=>setAiEnabled(e.target.checked)}/> Enable AI lead summaries</label>
 <p className="text-xs leading-5 text-neutral-500">When a team member chooses Generate summary, the lead’s title, company, description, stage and recent notes are sent to DeepSeek. API usage is billed to your DeepSeek account.</p><button className="ui-button" disabled={pending}>{pending?"Checking connection…":"Save connection"}</button>
 </fieldset>{state.error&&<p role="alert" className="text-sm text-red-700">{state.error}</p>}{state.success&&<p role="status" className="text-sm text-emerald-700">{state.success}</p>}</form>;
}
