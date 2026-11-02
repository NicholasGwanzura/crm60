import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectScope } from "@/lib/permissions";
import { NewProjectButton } from "@/components/new-project-form";
import { STATUS_LABELS, STATUS_STYLES, type ProjectStatus } from "@/lib/project-status";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await currentUser(); const params = await searchParams;
  if (!user) {
    const organisations = await db.organisation.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
    return <div className="space-y-8"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-violet-600">Spiritus × Velocity Workspace</p><h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Projects</h1><p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">Plan and track the work that ships.</p></div><section className="ui-card p-6 md:p-8"><h2 className="text-lg font-semibold tracking-tight">Workspace setup is in progress</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Projects stay private while team access is being set up.</p></section><div className="grid gap-3">{organisations.map((org) => <div key={org.id} className="ui-card px-5 py-4 text-sm font-medium text-neutral-700">{org.name}</div>)}</div></div>;
  }

  const q = (params.q ?? "").slice(0, 100);
  const where = { AND: [await projectScope(user.id), q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }] } : {}] };
  const [projects, memberships] = await Promise.all([
    db.project.findMany({ where, include: { organisation: { select: { name: true } }, owner: { select: { name: true } }, _count: { select: { leads: { where: { deletedAt: null } } } } }, orderBy: { updatedAt: "desc" } }),
    db.organisationMembership.findMany({ where: { userId: user.id, role: { not: "VIEWER" } }, select: { organisationId: true }, distinct: ["organisationId"] }),
  ]);
  const creatableOrgs = await db.organisation.findMany({ where: { id: { in: memberships.map((m) => m.organisationId) } }, select: { id: true, name: true }, orderBy: { name: "asc" } });

  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm text-violet-700">Workspace</p><h1 className="text-3xl font-semibold mt-1">Projects</h1><p className="text-neutral-500 mt-2">{projects.length} projects</p></div>
      <div className="flex items-center gap-2"><form><input name="q" defaultValue={q} placeholder="Search projects" aria-label="Search projects"/></form>{creatableOrgs.length > 0 && <NewProjectButton organisations={creatableOrgs} />}</div>
    </div>
    {projects.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map((project) => {
      const status = project.status as ProjectStatus;
      return <Link key={project.id} href={`/projects/${project.id}`} className="ui-card group p-5 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <span className="grid size-10 place-items-center rounded-lg bg-violet-50 text-lg">{project.emoji || project.name.slice(0, 1).toUpperCase()}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
        </div>
        <h2 className="mt-3 font-semibold text-neutral-900 group-hover:text-violet-700">{project.name}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{project.description || "No description yet."}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-neutral-400"><span>{project._count.leads} leads</span><span>{project.organisation.name} · {project.updatedAt.toLocaleDateString()}</span></div>
      </Link>;
    })}</div> : <div className="ui-card p-12 text-center"><p className="font-medium text-neutral-700">No projects yet</p><p className="mt-1 text-sm text-neutral-500">Create your first project to start tracking work.</p></div>}
  </div>;
}
