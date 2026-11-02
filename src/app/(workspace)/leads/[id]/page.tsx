import { LeadAiSummary } from "@/components/lead-ai-summary";
import { Modal, ModalForm } from "@/components/modal";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditLead, leadScope } from "@/lib/permissions";
import { addNote, changeLeadStage, setLeadProject, updateLead } from "../actions";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const lead = await db.lead.findFirst({ where: { AND: [{ id }, await leadScope(user.id)] }, include: { stage: true, project: { select: { id: true, name: true } }, organisation: { include: { stages: { orderBy: { position: "asc" } } } }, notes: { include: { author: true }, orderBy: { createdAt: "desc" } }, activities: { include: { actor: true }, orderBy: { createdAt: "desc" } } } });
  if (!lead) notFound(); const editable = await canEditLead(user.id, id);
  const orgProjects = await db.project.findMany({ where: { organisationId: lead.organisationId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <Link className="text-sm text-blue-700" href="/leads">← Leads</Link>
      <header>
        <p className="text-sm text-blue-700">{lead.organisation.name}</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">{lead.title}</h1>
        <p className="text-neutral-500 mt-2">{lead.companyName} · {lead.visibility.toLowerCase()}</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_290px]">
        <div className="space-y-5">
          <section className="panel p-6">
            <h2 className="font-semibold mb-3">Overview</h2>
            <p className="whitespace-pre-wrap text-sm">{lead.description || "No description yet."}</p>
            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {lead.email && <div><dt className="text-xs text-neutral-400">Email</dt><dd>{lead.email}</dd></div>}
              {lead.phone && <div><dt className="text-xs text-neutral-400">Phone</dt><dd>{lead.phone}</dd></div>}
              <div><dt className="text-xs text-neutral-400">Country</dt><dd>{lead.country}</dd></div>
              <div><dt className="text-xs text-neutral-400">Value</dt><dd>{lead.estimatedValue ? `${lead.currency} ${lead.estimatedValue.toString()}` : "—"}</dd></div>
            </dl>
          </section>

          {editable && (
            <Modal title="Edit lead" trigger="Edit details"><ModalForm action={updateLead}>
                <input type="hidden" name="id" value={id} />
                <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">Title</span><input name="title" required minLength={2} defaultValue={lead.title} aria-label="Title" /></label>
                <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">Company</span><input name="companyName" required minLength={2} defaultValue={lead.companyName} aria-label="Company name" /></label>
                <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">Email</span><input name="email" type="email" defaultValue={lead.email ?? ""} aria-label="Email" /></label>
                <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">Phone</span><input name="phone" defaultValue={lead.phone ?? ""} aria-label="Phone" /></label>
                <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">Country</span><input name="country" defaultValue={lead.country} aria-label="Country" /></label>
                <div className="grid grid-cols-[1fr_90px] gap-2">
                  <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">Estimated value</span><input name="estimatedValue" inputMode="decimal" defaultValue={lead.estimatedValue?.toString() ?? ""} aria-label="Estimated value" /></label>
                  <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">Currency</span><input name="currency" maxLength={3} defaultValue={lead.currency} aria-label="Currency" /></label>
                </div>
                <label className="block space-y-1.5 text-sm sm:col-span-2"><span className="font-medium text-neutral-700">Description</span><textarea name="description" rows={4} defaultValue={lead.description ?? ""} aria-label="Description" /></label>
                </ModalForm></Modal>
          )}

          <section className="panel p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Notes <span className="ml-1 text-xs font-normal text-neutral-400">{lead.notes.length}</span></h2>{editable && <Modal title="Add note" trigger="Add note"><ModalForm action={addNote} submitLabel="Add note"><input type="hidden" name="id" value={id} /><textarea className="sm:col-span-2" name="body" required placeholder="Log a conversation or update" aria-label="New note" /></ModalForm></Modal>}</div>
            {lead.notes.length === 0 && <p className="text-sm text-neutral-500">No notes yet.</p>}
            {lead.notes.map((note) => <article className="border-t py-4" key={note.id}><p className="whitespace-pre-wrap text-sm">{note.body}</p><p className="text-xs text-neutral-500 mt-2">{note.author.name} · {note.createdAt.toLocaleString()}</p></article>)}
          </section>

          <LeadAiSummary leadId={id}/>
          <section className="panel p-6">
            <h2 className="font-semibold mb-4">Activity</h2>
            {lead.activities.length === 0 && <p className="text-sm text-neutral-500">No activity yet.</p>}
            {lead.activities.map((item) => <div className="border-l-2 border-blue-200 pl-4 pb-5" key={item.id}><p className="text-sm">{item.description}</p><p className="text-xs text-neutral-500 mt-1">{item.actor.name} · {item.createdAt.toLocaleString()}</p></div>)}
          </section>
        </div>

        <aside className="panel p-5 h-fit">
          <h2 className="font-semibold mb-4">Details</h2>
          <p className="text-xs text-neutral-500 mb-2">Stage</p>
          {editable ? <form action={changeLeadStage} className="flex gap-2"><input type="hidden" name="id" value={id} /><select name="stageId" defaultValue={lead.stageId} aria-label="Lead stage">{lead.organisation.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button className="button">Save</button></form> : <p>{lead.stage.name}</p>}
          <p className="text-xs text-neutral-500 mt-6 mb-2">Project</p>
          {editable ? <form action={setLeadProject} className="flex gap-2"><input type="hidden" name="id" value={id} /><select name="projectId" defaultValue={lead.projectId ?? ""} aria-label="Project"><option value="">No project</option>{orgProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="button">Save</button></form> : <p>{lead.project ? <Link className="text-violet-700 hover:underline" href={`/projects/${lead.project.id}`}>{lead.project.name}</Link> : "None"}</p>}
          <p className="text-xs text-neutral-500 mt-6">Created {lead.createdAt.toLocaleDateString()}</p>
        </aside>
      </div>
    </div>
  );
}
