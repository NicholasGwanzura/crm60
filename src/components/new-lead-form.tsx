"use client";
import { useState } from "react";
import { createLead } from "@/app/(workspace)/leads/actions";

export type NewLeadOrg = { id: string; name: string; stages: { id: string; name: string }[] };

export function NewLeadForm({ organisations }: { organisations: NewLeadOrg[] }) {
  const [orgId, setOrgId] = useState(organisations[0]?.id ?? "");
  const org = organisations.find((o) => o.id === orgId) ?? organisations[0];

  if (!org) return null;

  return (
    <form action={createLead} className="grid gap-4 md:grid-cols-2">
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-neutral-700">Organisation</span>
        <select name="organisationId" value={orgId} onChange={(e) => setOrgId(e.target.value)} aria-label="Organisation">
          {organisations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-neutral-700">Stage</span>
        <select key={org.id} name="stageId" defaultValue={org.stages[0]?.id} aria-label="Stage" required>
          {org.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <input name="title" required minLength={2} placeholder="Lead title" aria-label="Lead title" />
      <input name="companyName" required minLength={2} placeholder="Company name" aria-label="Company name" />
      <input name="email" type="email" placeholder="Email" aria-label="Email" />
      <textarea name="description" placeholder="Description" aria-label="Description" className="md:col-span-2" />
      <button className="button justify-self-start md:col-span-2">Create lead</button>
    </form>
  );
}
