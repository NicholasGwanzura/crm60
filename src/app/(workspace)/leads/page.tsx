import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { leadScope } from "@/lib/permissions";
import { createLead } from "./actions";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const user = await requireUser(); const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100); const page = Math.max(1, Number(params.page) || 1);
  const where = { AND: [await leadScope(user.id), q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { companyName: { contains: q, mode: "insensitive" as const } }] } : {}] };
  const [leads, count, memberships] = await Promise.all([
    db.lead.findMany({ where, include: { stage: true, organisation: true }, orderBy: { updatedAt: "desc" }, take: 20, skip: (page - 1) * 20 }),
    db.lead.count({ where }),
    db.organisationMembership.findMany({ where: { userId: user.id, role: { not: "VIEWER" } }, include: { organisation: { include: { stages: { orderBy: { position: "asc" } } } } } }),
  ]);
  return <div className="space-y-7"><div><p className="text-sm text-blue-800">CRM</p><h1 className="text-3xl font-semibold mt-1">Leads</h1><p className="text-neutral-500 mt-2">{count} accessible leads</p></div>
    <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Search leads or companies" aria-label="Search leads"/><button className="button">Search</button></form>
    <div className="panel overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-neutral-500 border-b"><tr><th className="p-4">Lead</th><th>Company</th><th>Stage</th><th>Organisation</th><th>Updated</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id} className="border-b last:border-0 hover:bg-neutral-50"><td className="p-4 font-medium"><Link className="hover:text-blue-700" href={`/leads/${lead.id}`}>{lead.title}</Link></td><td>{lead.companyName}</td><td>{lead.stage.name}</td><td>{lead.organisation.name}</td><td>{lead.updatedAt.toLocaleDateString()}</td></tr>)}</tbody></table>{!leads.length && <p className="p-8 text-center text-neutral-500">No accessible leads found.</p>}</div>
    <div className="flex justify-between text-sm">{page > 1 ? <Link href={`/leads?q=${encodeURIComponent(q)}&page=${page - 1}`}>Previous</Link> : <span/>}{page * 20 < count && <Link href={`/leads?q=${encodeURIComponent(q)}&page=${page + 1}`}>Next</Link>}</div>
    {memberships.map((membership) => <section key={membership.id} className="panel p-6"><h2 className="text-lg font-semibold mb-4">Add a lead · {membership.organisation.name}</h2><form action={createLead} className="grid md:grid-cols-2 gap-4"><input type="hidden" name="organisationId" value={membership.organisationId}/><input name="title" required minLength={2} placeholder="Lead title" aria-label="Lead title"/><input name="companyName" required minLength={2} placeholder="Company name" aria-label="Company name"/><input name="email" type="email" placeholder="Email" aria-label="Email"/><select name="stageId" aria-label="Stage" required>{membership.organisation.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select><textarea name="description" placeholder="Description" aria-label="Description" className="md:col-span-2"/><button className="button justify-self-start">Create lead</button></form></section>)}
  </div>;
}
