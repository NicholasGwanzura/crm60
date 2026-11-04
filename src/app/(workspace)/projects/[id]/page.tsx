import { Field } from "@/components/crm-ui";
import { Modal, ModalForm } from "@/components/modal";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditProject, canWriteOrganisation, canEditLeadRecord, accessProfile, leadScope, projectScope } from "@/lib/permissions";
import { LeadPipeline, type PipelineBoard } from "@/components/lead-pipeline";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { assignLeadToProject, updateProject, updateProjectStatus } from "../actions";
import { PROJECT_STATUSES, STATUS_LABELS, STATUS_STYLES, type ProjectStatus } from "@/lib/project-status";

import { ProjectWorkItems } from "@/components/project-work-items";
import { IssueForm } from "@/components/issue-form";

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string; tab?: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const project = await db.project.findFirst({ where: { AND: [{ id }, await projectScope(user.id)] }, include: { organisation: { include: { stages: { orderBy: { position: "asc" } } } }, owner: true, leads: { where: await leadScope(user.id), include: { stage: true, owner: { select: { name: true } } }, orderBy: { updatedAt: "desc" } } } });
  if (!project) notFound();

  const query = await searchParams;
  const view = query.view === "board" ? "board" : "list";
  const section = query.tab === "leads" ? "leads" : "issues";
  const writable = await canWriteOrganisation(user.id, project.organisationId);
  const [issues, memberships] = await Promise.all([
    db.issue.findMany({
      where: { projectId: id },
      select: { id: true, title: true, status: true, priority: true, assignee: { select: { name: true } } },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    }),
    writable ? db.organisationMembership.findMany({
      where: { organisationId: project.organisationId, role: { not: "VIEWER" }, user: { suspended: false } },
      select: { organisationId: true, userId: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }) : [],
  ]);
  const members = memberships.map(({ organisationId, userId, user }) => ({ organisationId, userId, name: user.name }));
  const issueProject = { id, name: project.name, organisationId: project.organisationId };
  const profile=await accessProfile(user.id);
  const editable = await canEditProject(user.id, id);

  const editIds=new Set(project.leads.filter(l=>canEditLeadRecord(profile,l)).map(l=>l.id));

  const board: PipelineBoard = {
    organisationId: project.organisationId,
    organisationName: project.name,
    stages: project.organisation.stages.map((s) => ({ id: s.id, name: s.name })),
    leads: project.leads.map((l) => ({ id: l.id, title: l.title, companyName: l.companyName, value: l.estimatedValue?.toString() ?? null, currency: l.currency, owner: l.owner.name, editable: editIds.has(l.id), stageId: l.stageId })),
  };

  const unassignedAll = await db.lead.findMany({ where: { AND: [{ organisationId: project.organisationId, projectId: null }, await leadScope(user.id)] }, select: { id: true, title: true, companyName: true, ownerId: true, organisationId: true }, orderBy: { updatedAt: "desc" } });

  const unassigned=unassignedAll.filter(l=>canEditLeadRecord(profile,l));
  const status = project.status as ProjectStatus;

  return <div className="-mx-4 -mt-5 min-h-[calc(100vh-4rem)] bg-white md:-mx-8 md:-mt-7">
    <div className="border-b px-5 py-4 md:px-8">
      <nav className="mb-4 flex items-center gap-2 text-xs text-neutral-500"><Link className="hover:text-neutral-900" href="/projects">Projects</Link><span>/</span><span>{project.name}</span></nav>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center border bg-neutral-50 text-lg">{project.emoji || project.name.slice(0, 1).toUpperCase()}</span>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-lg font-semibold tracking-tight">{project.name}</h1><span className={`px-2 py-0.5 text-[11px] ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span></div><p className="mt-0.5 truncate text-xs text-neutral-500">{project.organisation.name} · {project.owner.name}</p></div>
        </div>
        <div className="flex items-center gap-2">{editable && <Modal title="Edit project" trigger="···"><ModalForm action={updateProject}><input type="hidden" name="id" value={id}/><Field label="Project icon"><input name="emoji" maxLength={8} defaultValue={project.emoji??""}/></Field><Field label="Project name"><input name="name" required minLength={2} maxLength={160} defaultValue={project.name}/></Field><Field label="Description" wide><textarea name="description" rows={4} defaultValue={project.description??""} maxLength={5000}/></Field></ModalForm></Modal>}{writable && <IssueForm projects={[issueProject]} members={members} projectCreate={{ status: "OPEN" }} />}</div>
      </header>
      {project.description && <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-500">{project.description}</p>}
    </div>
    <nav aria-label="Project sections" className="flex gap-6 border-b px-5 md:px-8">
      <Link href={`/projects/${id}?tab=issues`} className={`border-b-2 py-3 text-sm ${section === "issues" ? "border-neutral-900 font-medium text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900"}`}>Issues <span className="ml-1 text-xs text-neutral-400">{issues.filter(i => i.status !== "RESOLVED").length}</span></Link>
      <Link href={`/projects/${id}?tab=leads`} className={`border-b-2 py-3 text-sm ${section === "leads" ? "border-neutral-900 font-medium text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900"}`}>Leads <span className="ml-1 text-xs text-neutral-400">{project.leads.length}</span></Link>
    </nav>
    <main className="p-5 md:p-8">
      {section === "issues" ? <ProjectWorkItems project={issueProject} issues={issues} members={members} view={view} writable={writable} /> : <section aria-label="Linked lead pipeline"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-semibold">Linked leads</h2><p className="mt-1 text-xs text-neutral-500">Opportunities connected to this project</p></div>{editable && unassigned.length > 0 && <Modal title="Link a lead" description="Choose an unassigned opportunity for this project." trigger="Link lead"><ModalForm action={assignLeadToProject} submitLabel="Link lead"><input type="hidden" name="projectId" value={id}/><Field label="Lead" wide><select name="leadId" aria-label="Lead to add" defaultValue="">{unassigned.map(l=><option key={l.id} value={l.id}>{l.title} · {l.companyName}</option>)}</select></Field></ModalForm></Modal>}</div><LeadPipeline boards={[board]} /></section>}
      <details className="mt-8 border-t pt-4">
        <summary className="cursor-pointer text-xs font-medium text-neutral-500">Project settings and details</summary>
        <div className="mt-4 grid gap-8 md:grid-cols-2">
          <div className="max-w-md space-y-4">
          <h2 className="text-sm font-semibold">Details</h2>
          {editable ? <div className="space-y-4">
            <form action={updateProjectStatus} className="space-y-1.5">
              <input type="hidden" name="id" value={id} />
              <label className="text-xs text-neutral-500">Status</label>
              <div className="flex gap-2"><select name="status" defaultValue={project.status} aria-label="Project status">{PROJECT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select><button className="ui-button-secondary shrink-0">Save</button></div>
            </form>
            <DeleteProjectButton projectId={id} />
          </div> : <div className="space-y-2 text-sm text-neutral-600"><p><span className="text-neutral-400">Status:</span> {STATUS_LABELS[status]}</p><p><span className="text-neutral-400">Owner:</span> {project.owner.name}</p><p><span className="text-neutral-400">Created:</span> {project.createdAt.toLocaleDateString()}</p></div>}
          </div><p className="text-xs text-neutral-500">Created {project.createdAt.toLocaleDateString()}</p>
        </div>
      </details>
    </main>
  </div>;
}
