import { WorkspaceGate } from "@/components/workspace-gate";
import { Modal } from "@/components/modal";
import { ArrowUpRight, FolderKanban } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectScope, leadScope } from "@/lib/permissions";
import { NewProjectButton } from "@/components/new-project-form";
import { STATUS_LABELS, STATUS_STYLES, type ProjectStatus } from "@/lib/project-status";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await currentUser(); const params = await searchParams;
  if (!user) return <WorkspaceGate title="Projects" />;

  const q = (params.q ?? "").slice(0, 100);
  const where = { AND: [await projectScope(user.id), q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }] } : {}] };
  const [projects, memberships] = await Promise.all([
    db.project.findMany({ where, include: { organisation: { select: { name: true } }, owner: { select: { name: true } }, _count: { select: { leads: { where: await leadScope(user.id) } } } }, orderBy: { updatedAt: "desc" } }),
    db.organisationMembership.findMany({ where: { userId: user.id, role: { not: "VIEWER" } }, select: { organisationId: true }, distinct: ["organisationId"] }),
  ]);
  const creatableOrgs = await db.organisation.findMany({ where: { id: { in: memberships.map((m) => m.organisationId) } }, select: { id: true, name: true }, orderBy: { name: "asc" } });

  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-xl font-semibold tracking-tight">Projects <span className="ml-2 text-sm font-normal text-neutral-400">{projects.length}</span></h1><p className="mt-1 text-sm text-neutral-500">A clear view of the work moving forward.</p></div>
      <div className="flex items-center gap-2"><form><input name="q" defaultValue={q} placeholder="Search projects" aria-label="Search projects"/></form>{creatableOrgs.length > 0 && <NewProjectButton organisations={creatableOrgs} />}</div>
    </div>
    <div className="flex items-center gap-2 border-y py-3 text-xs text-neutral-500"><FolderKanban size={14}/> All projects <span className="ml-auto">Select a project to explore its pipeline</span></div>
    {projects.length > 0 ? <div className="divide-y rounded-lg border">{projects.map((project) => {
      const status = project.status as ProjectStatus;
      return <div key={project.id} className="group flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-neutral-50">
        <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-neutral-50 text-sm">{project.emoji || project.name.slice(0, 1).toUpperCase()}</span>
        <Link href={`/projects/${project.id}`} className="min-w-0 flex-1"><h2 className="text-sm font-medium text-neutral-900">{project.name}</h2><p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{project.description || project.organisation.name}</p></Link>
        <span className={`rounded-md px-2 py-1 text-[11px] font-medium ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
        <span className="hidden text-xs text-neutral-400 lg:block">{project._count.leads} leads</span>
        <Modal title={project.name} description={project.organisation.name} trigger="Quick view" triggerClassName="rounded-md px-2 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
          <p className="mb-6 whitespace-pre-wrap text-sm leading-6 text-neutral-600">{project.description || "No description yet."}</p>
          <dl className="mb-6 grid grid-cols-2 gap-5 text-sm"><div><dt className="mb-1 text-xs text-neutral-400">Status</dt><dd>{STATUS_LABELS[status]}</dd></div><div><dt className="mb-1 text-xs text-neutral-400">Owner</dt><dd>{project.owner.name}</dd></div><div><dt className="mb-1 text-xs text-neutral-400">Linked leads</dt><dd>{project._count.leads}</dd></div><div><dt className="mb-1 text-xs text-neutral-400">Updated</dt><dd>{project.updatedAt.toLocaleDateString()}</dd></div></dl>
          <Link href={`/projects/${project.id}`} className="ui-button w-full">Open project <ArrowUpRight size={14}/></Link>
        </Modal>
      </div>;
    })}</div> : <div className="rounded-lg border border-dashed py-16 text-center"><FolderKanban size={24} className="mx-auto mb-3 text-neutral-300"/><p className="text-sm font-medium">{q ? "No projects match your search" : "Your next project starts here"}</p><p className="mt-1 text-sm text-neutral-500">{q ? "Try a different name or description." : "Group related leads and track their progress together."}</p></div>}
  </div>;
}
