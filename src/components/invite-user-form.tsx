"use client";
import { useState } from "react";
import { Copy, UserPlus } from "lucide-react";
import { createInvitation } from "@/app/(workspace)/team/actions";
import { INVITABLE_ROLES, ROLE_LABELS } from "@/lib/roles";

export type InviteOrg = { id: string; name: string; canAssignPlatformAdmin: boolean };

export function InviteUserForm({ organisations }: { organisations: InviteOrg[] }) {
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [orgId, setOrgId] = useState(organisations[0]?.id ?? "");
  const org = organisations.find((o) => o.id === orgId) ?? organisations[0];

  if (!org) return <p className="text-sm text-neutral-500">You aren't an administrator of any organisation.</p>;

  const roles = org.canAssignPlatformAdmin ? ["PLATFORM_ADMIN", ...INVITABLE_ROLES] : [...INVITABLE_ROLES];
  const fullLink = result?.link ? `${window.location.origin}${result.link}` : "";

  return (
    <div className="space-y-4">
      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setResult(null); const fd = new FormData(e.currentTarget); try { setResult(await createInvitation(fd)); } catch { setResult({ error: "Could not create the invitation. Please try again." }); } setBusy(false); }}>
        <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">Email</span><input name="email" type="email" required placeholder="teammate@company.com" /></label>
        <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">Organisation</span><select name="organisationId" value={orgId} onChange={(e) => setOrgId(e.target.value)}>{organisations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
        <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">Role</span><select name="role">{roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></label>
        <button disabled={busy} className="button"><UserPlus size={15} /> {busy ? "Inviting…" : "Invite"}</button>
      </form>

      {result?.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{result.error}</p>}
      {result?.link && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm"><p className="font-medium text-emerald-800">Invitation created</p><p className="mt-1 text-emerald-700">Share this link. It expires in 7 days.</p><div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1.5 text-xs text-emerald-900">{fullLink}</code><button type="button" onClick={() => navigator.clipboard.writeText(fullLink)} className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50"><Copy size={13} /> Copy</button></div></div>}
    </div>
  );
}
