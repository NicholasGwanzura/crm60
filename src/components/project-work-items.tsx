import Link from "next/link";
import { Circle, CircleCheck, CircleDot, Columns3, List } from "lucide-react";
import { IssueForm } from "@/components/issue-form";

const groups = [
  { status: "OPEN", label: "Open", icon: Circle, tone: "text-neutral-500" },
  { status: "IN_PROGRESS", label: "In progress", icon: CircleDot, tone: "text-amber-600" },
  { status: "RESOLVED", label: "Resolved", icon: CircleCheck, tone: "text-emerald-600" },
] as const;

type Issue = {
  id: string;
  title: string;
  status: (typeof groups)[number]["status"];
  priority: string;
  assignee: { name: string };
};

export function ProjectWorkItems({ project, issues, members, view, writable }: {
  project: { id: string; name: string; organisationId: string };
  issues: Issue[];
  members: { userId: string; name: string; organisationId: string }[];
  view: "list" | "board";
  writable: boolean;
}) {
  const base = `/projects/${project.id}`;
  return <section className="min-w-0 border bg-white" aria-label="Work items">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <h2 className="text-sm font-semibold">Work items <span className="ml-2 text-xs font-normal text-neutral-500">{issues.length}</span></h2>
      <nav className="flex border" aria-label="Work item layout">
        {([{ value: "list", label: "List", icon: List }, { value: "board", label: "Board", icon: Columns3 }] as const).map(({ value, label, icon: Icon }) =>
          <Link key={value} href={`${base}?view=${value}`} aria-current={view === value ? "page" : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors motion-reduce:transition-none ${view === value ? "bg-neutral-100 font-semibold text-neutral-900" : "text-neutral-500 hover:bg-neutral-50"}`}>
            <Icon size={14} aria-hidden />{label}
          </Link>
        )}
      </nav>
    </div>
    <div className={view === "board" ? "grid grid-cols-[repeat(3,minmax(14rem,1fr))] gap-3 overflow-x-auto bg-neutral-50 p-3" : "divide-y"}>
      {groups.map(({ status, label, icon: Icon, tone }) => {
        const items = issues.filter(issue => issue.status === status);
        return <section key={status} aria-label={label} className={view === "board" ? "min-w-0 border bg-white" : undefined}>
          <header className="flex flex-wrap items-center gap-2 bg-neutral-50 px-3 py-2 text-xs">
            <Icon size={15} className={tone} aria-hidden />
            <h3 className="font-semibold">{label}</h3><span className="text-neutral-500">{items.length}</span>
            {writable && status !== "RESOLVED" && <div className="ml-auto">
              <IssueForm projects={[project]} members={members} projectCreate={{ status, compact: true }} />
            </div>}
          </header>
          {items.length === 0 ? <p className="border-t px-3 py-4 text-xs text-neutral-500">No issues</p> :
            <ul className={view === "board" ? "space-y-2 border-t p-2" : "divide-y border-t"}>
              {items.map(issue => <li key={issue.id}>
                <Link href={`/issues/${issue.id}`} scroll={false}
                  className={`flex gap-2 px-3 py-3 text-sm transition-colors hover:bg-neutral-50 motion-reduce:transition-none ${view === "board" ? "flex-col border" : "flex-wrap items-center justify-between"}`}>
                  <span className="min-w-0 break-words font-medium">{issue.title}</span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <span className={`border px-1.5 py-0.5 capitalize ${issue.priority === "URGENT" ? "border-red-200 bg-red-50 text-red-700" : "bg-neutral-50"}`}>{issue.priority.toLowerCase()}</span>
                    <span>{issue.assignee.name}</span>
                  </span>
                </Link>
              </li>)}
            </ul>}
        </section>;
      })}
    </div>
  </section>;
}
