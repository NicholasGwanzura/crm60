import { WorkspaceGate } from "@/components/workspace-gate";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { leadScope } from "@/lib/permissions";
import { LeadPipeline, type PipelineBoard } from "@/components/lead-pipeline";
import { NewLeadButton, type NewLeadOrg } from "@/components/new-lead-form";

const EDITABLE_ROLES = new Set(["PLATFORM_ADMIN", "ORG_ADMIN", "SALES_MANAGER"]);

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; view?: string; org?: string }> }) {
  const user = await currentUser(); const params = await searchParams;
  if (!user) return <WorkspaceGate title="Leads" />;

  const q = (params.q ?? "").slice(0, 100);
  const view = params.view === "list" ? "list" : "board";
  const orgFilter = (params.org ?? "").slice(0, 40);

  const memberships = await db.organisationMembership.findMany({ where: { userId: user.id }, select: { organisationId: true, role: true } });
  const editableOrgIds = new Set(memberships.filter((m) => EDITABLE_ROLES.has(m.role)).map((m) => m.organisationId));
  const creatableOrgIds = new Set(memberships.filter((m) => m.role !== "VIEWER").map((m) => m.organisationId));

  const where = { AND: [await leadScope(user.id), orgFilter ? { organisationId: orgFilter } : {}, q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { companyName: { contains: q, mode: "insensitive" as const } }] } : {}] };
  const leads = await db.lead.findMany({ where, include: { owner: { select: { name: true } }, stage: { select: { name: true } }, organisation: { select: { name: true } } }, orderBy: { updatedAt: "desc" } });

  const orgIds = [...new Set([...memberships.map((m) => m.organisationId), ...leads.map((l) => l.organisationId)])];
  const organisations = await db.organisation.findMany({ where: { id: { in: orgIds } }, include: { stages: { orderBy: { position: "asc" } } }, orderBy: { name: "asc" } });

  const boards: PipelineBoard[] = organisations.map((org) => ({
    organisationId: org.id,
    organisationName: org.name,
    stages: org.stages.map((s) => ({ id: s.id, name: s.name })),
    leads: leads.filter((l) => l.organisationId === org.id).map((l) => ({ id: l.id, title: l.title, companyName: l.companyName, value: l.estimatedValue?.toString() ?? null, owner: l.owner.name, editable: l.ownerId === user.id || editableOrgIds.has(l.organisationId), stageId: l.stageId })),
  }));

  const newLeadOrgs: NewLeadOrg[] = organisations.filter((org) => creatableOrgIds.has(org.id)).map((org) => ({ id: org.id, name: org.name, stages: org.stages.map((s) => ({ id: s.id, name: s.name })) }));

  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (orgFilter) sp.set("org", orgFilter);
  const viewHref = (v: "board" | "list") => { const p = new URLSearchParams(sp); if (v !== "board") p.set("view", v); return p.size ? `/leads?${p}` : "/leads"; };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-xl font-semibold tracking-tight">Leads <span className="ml-2 text-sm font-normal text-neutral-400">{leads.length}</span></h1><p className="mt-1 text-sm text-neutral-500">Every opportunity, from first contact to close.</p></div>{newLeadOrgs.length > 0 && <NewLeadButton organisations={newLeadOrgs} />}
    </div><div className="flex flex-wrap items-center justify-between gap-3 border-y py-3">
        <form className="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(160px,240px)_180px_auto]"><input type="hidden" name="view" value={view}/><input name="q" defaultValue={q} placeholder="Search leads or companies" aria-label="Search leads"/><select name="org" defaultValue={orgFilter} aria-label="Filter by organisation"><option value="">All organisations</option>{organisations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select><button className="button">Filter</button></form>
        <div className="flex items-center gap-1 rounded-md bg-neutral-100 p-1"><Link className={`rounded-md px-2.5 py-1 text-xs font-medium ${view === "board" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-600 hover:bg-neutral-100"}`} href={viewHref("board")}>Board</Link><Link className={`rounded-md px-2.5 py-1 text-xs font-medium ${view === "list" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-600 hover:bg-neutral-100"}`} href={viewHref("list")}>List</Link></div>
    </div>

    {leads.length === 0 ? (
      <div className="panel p-12 text-center">
        <h2 className="font-semibold text-neutral-800">{q || orgFilter ? "No leads match your filters" : "No leads yet"}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">{newLeadOrgs.length > 0 ? "Add your first lead and it will appear in its pipeline stage." : organisations.length === 0 ? "You aren't a member of any organisation yet. An administrator needs to invite you before you can see leads." : "You have read-only access in this workspace. Ask an administrator for a role that can add leads."}</p>
        {newLeadOrgs.length > 0 && !q && !orgFilter && <p className="mt-4 text-sm text-neutral-500">Select Add lead to start an opportunity.</p>}
      </div>
    ) : view === "list" ? (
      <div className="panel overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-neutral-500 border-b"><tr><th className="p-4">Lead</th><th>Company</th><th>Stage</th><th>Value</th><th>Owner</th><th>Organisation</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id} className="border-b last:border-0 hover:bg-neutral-50"><td className="p-4 font-medium"><Link className="hover:text-blue-700" href={`/leads/${lead.id}`}>{lead.title}</Link></td><td>{lead.companyName}</td><td>{lead.stage.name}</td><td>{lead.estimatedValue ? `$${lead.estimatedValue.toString()}` : "—"}</td><td>{lead.owner.name}</td><td>{lead.organisation.name}</td></tr>)}</tbody></table></div>
    ) : (
      <LeadPipeline boards={boards} />
    )}
  </div>;
}
