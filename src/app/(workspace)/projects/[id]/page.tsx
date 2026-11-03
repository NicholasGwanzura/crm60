import { Field } from "@/components/crm-ui";
import { Modal, ModalForm } from "@/components/modal";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditProject, canEditLead, leadScope, projectScope } from "@/lib/permissions";
import { LeadPipeline, type PipelineBoard } from "@/components/lead-pipeline";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { assignLeadToProject, updateProject, updateProjectStatus } from "../actions";
import { PROJECT_STATUSES, STATUS_LABELS, STATUS_STYLES, type ProjectStatus } from "@/lib/project-status";

const EDITABLE_ROLES = new Set(["PLATFORM_ADMIN", "ORG_ADMIN", "SALES_MANAGER"]);

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const project = await db.project.findFirst({ where: { AND: [{ id }, await projectScope(user.id)] }, include: { organisation: { include: { stages: { orderBy: { position: "asc" } } } }, owner: true, leads: { where: await leadScope(user.id), include: { stage: true, owner: { select: { name: true } } }, orderBy: { updatedAt: "desc" } } } });
  if (!project) notFound();

  const editable = await canEditProject(user.id, id);

  const editIds=new Set((await Promise.all(project.leads.map(async l=>await canEditLead(user.id,l.id)?l.id:null))).filter(Boolean));

  const board: PipelineBoard = {
    organisationId: project.organisationId,
    organisationName: project.name,
    stages: project.organisation.stages.map((s) => ({ id: s.id, name: s.name })),
    leads: project.leads.map((l) => ({ id: l.id, title: l.title, companyName: l.companyName, value: l.estimatedValue?.toString() ?? null, currency: l.currency, owner: l.owner.name, editable: editIds.has(l.id), stageId: l.stageId })),
  };

  const unassignedAll = await db.lead.findMany({ where: { AND: [{ organisationId: project.organisationId, projectId: null }, await leadScope(user.id)] }, select: { id: true, title: true, companyName: true }, orderBy: { updatedAt: "desc" } });

  const unassigned=(await Promise.all(unassignedAll.map(async l=>await canEditLead(user.id,l.id)?l:null))).filter(l=>l!==null);
  const status = project.status as ProjectStatus;

  return <div className="space-y-6">
    <nav className="text-sm text-neutral-500"><Link className="text-violet-700 hover:underline" href="/projects">Projects</Link> <span className="text-neutral-300">/</span> <span className="text-neutral-700">{project.name}</span></nav>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <span className="grid size-14 place-items-center rounded-xl bg-violet-50 text-2xl">{project.emoji || project.name.slice(0, 1).toUpperCase()}</span>
        <div>
          <div className="flex items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span></div>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">{project.description || "No description yet."}</p>
          <p className="mt-2 text-xs text-neutral-400">{project.organisation.name} · owned by {project.owner.name}</p>
        </div>
      </div>
      <Link href={`/issues?project=${id}`} className="ui-button-secondary">Project issues ↗</Link>
    </header>

    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <LeadPipeline boards={[board]} />
      </div>

      <aside className="space-y-6">
        <section className="panel p-5">
          <h2 className="mb-3 font-semibold">Details</h2>
          {editable ? <div className="space-y-4">
            <form action={updateProjectStatus} className="space-y-1.5">
              <input type="hidden" name="id" value={id} />
              <label className="text-xs text-neutral-500">Status</label>
              <div className="flex gap-2"><select name="status" defaultValue={project.status} aria-label="Project status">{PROJECT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select><button className="ui-button-secondary shrink-0">Save</button></div>
            </form>
            <Modal title="Edit project" trigger="Edit project"><ModalForm action={updateProject}>
              <input type="hidden" name="id" value={id} />
              <Field label="Project icon"><input name="emoji" maxLength={8} defaultValue={project.emoji??""}/></Field><Field label="Project name"><input name="name" required minLength={2} maxLength={160} defaultValue={project.name}/></Field><Field label="Description" wide><textarea name="description" rows={4} defaultValue={project.description??""} maxLength={5000}/></Field>
              </ModalForm></Modal>
            <DeleteProjectButton projectId={id} />
          </div> : <div className="space-y-2 text-sm text-neutral-600"><p><span className="text-neutral-400">Status:</span> {STATUS_LABELS[status]}</p><p><span className="text-neutral-400">Owner:</span> {project.owner.name}</p><p><span className="text-neutral-400">Created:</span> {project.createdAt.toLocaleDateString()}</p></div>}
        </section>

        {editable && <section className="panel p-5">
          <h2 className="mb-3 text-sm font-semibold">Linked leads</h2>
          {unassigned.length > 0 ? <Modal title="Link a lead" description="Choose an unassigned opportunity for this project." trigger="Link existing lead"><ModalForm action={assignLeadToProject} submitLabel="Link lead">
            <input type="hidden" name="projectId" value={id} />
            <Field label="Lead" wide><select name="leadId" aria-label="Lead to add" defaultValue="">{unassigned.map((l) => <option key={l.id} value={l.id}>{l.title} · {l.companyName}</option>)}</select></Field>
            </ModalForm></Modal> : <p className="text-sm text-neutral-500">No unassigned leads in this organisation.</p>}
        </section>}
      </aside>
    </div>
  </div>;
}
