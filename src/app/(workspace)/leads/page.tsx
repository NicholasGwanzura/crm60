import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { leadScope } from "@/lib/permissions";
import { LeadPipeline, type PipelineBoard } from "@/components/lead-pipeline";
import { NewLeadForm, type NewLeadOrg } from "@/components/new-lead-form";

const EDITABLE_ROLES = new Set(["PLATFORM_ADMIN", "ORG_ADMIN", "SALES_MANAGER"]);

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const user = await currentUser(); const params = await searchParams;
  if (!user) {
    const organisations = await db.organisation.findMany({ select: { id: true, name: true, stages: { orderBy: { position: "asc" }, select: { id: true, name: true } } }, orderBy: { name: "asc" } });
    return <div className="space-y-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Spiritus × Velocity Workspace</p><h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Leads pipeline</h1><p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">A shared view of how opportunities move from first contact to delivery.</p></div><span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">Workspace preview</span></div><section className="ui-card p-6 md:p-8"><h2 className="text-lg font-semibold tracking-tight">Workspace setup is in progress</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">The organisations and pipeline stages are ready. Client records stay private while team access is being set up.</p></section><div className="grid gap-5 lg:grid-cols-2">{organisations.map((org) => <section key={org.id} className="ui-card overflow-hidden"><div className="border-b border-neutral-100 px-5 py-4"><h2 className="font-semibold text-neutral-900">{org.name}</h2><p className="mt-1 text-xs text-neutral-500">Lead pipeline</p></div><div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">{org.stages.map((stage, index) => <div key={stage.id} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-3"><div className="mb-2 text-[11px] font-medium text-neutral-400">{String(index + 1).padStart(2, "0")}</div><div className="text-sm font-medium text-neutral-700">{stage.name}</div></div>)}</div></section>)}</div><p className="text-xs text-neutral-400">HONOR Sans is used under its copyright license.</p></div>;
  }

  const q = (params.q ?? "").slice(0, 100);
  const memberships = await db.organisationMembership.findMany({ where: { userId: user.id }, select: { organisationId: true, role: true } });
  const editableOrgIds = new Set(memberships.filter((m) => EDITABLE_ROLES.has(m.role)).map((m) => m.organisationId));
  const creatableOrgIds = new Set(memberships.filter((m) => m.role !== "VIEWER").map((m) => m.organisationId));

  const where = { AND: [await leadScope(user.id), q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { companyName: { contains: q, mode: "insensitive" as const } }] } : {}] };
  const leads = await db.lead.findMany({ where, include: { owner: { select: { name: true } } }, orderBy: { updatedAt: "desc" } });

  const orgIds = [...new Set([...memberships.map((m) => m.organisationId), ...leads.map((l) => l.organisationId)])];
  const organisations = await db.organisation.findMany({ where: { id: { in: orgIds } }, include: { stages: { orderBy: { position: "asc" } } }, orderBy: { name: "asc" } });

  const boards: PipelineBoard[] = organisations.map((org) => ({
    organisationId: org.id,
    organisationName: org.name,
    stages: org.stages.map((s) => ({ id: s.id, name: s.name })),
    leads: leads.filter((l) => l.organisationId === org.id).map((l) => ({ id: l.id, title: l.title, companyName: l.companyName, value: l.estimatedValue?.toString() ?? null, owner: l.owner.name, editable: l.ownerId === user.id || editableOrgIds.has(l.organisationId), stageId: l.stageId })),
  }));

  const newLeadOrgs: NewLeadOrg[] = organisations.filter((org) => creatableOrgIds.has(org.id)).map((org) => ({ id: org.id, name: org.name, stages: org.stages.map((s) => ({ id: s.id, name: s.name })) }));

  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm text-blue-800">CRM</p><h1 className="text-3xl font-semibold mt-1">Leads</h1><p className="text-neutral-500 mt-2">{leads.length} accessible leads</p></div>
      <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Search leads or companies" aria-label="Search leads"/><button className="button">Search</button></form>
    </div>
    {newLeadOrgs.length > 0 && <section className="panel p-5 md:p-6"><h2 className="mb-4 text-lg font-semibold">New lead</h2><NewLeadForm organisations={newLeadOrgs} /></section>}
    {boards.length > 0 ? <LeadPipeline boards={boards} /> : <div className="panel p-10 text-center text-neutral-500">No pipeline organisations found.</div>}
  </div>;
}
