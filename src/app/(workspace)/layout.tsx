import { TimerControl } from "@/components/timer-control";
import { taskScope } from "@/lib/permissions";
import { db } from "@/lib/db";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { SignOut } from "@/components/sign-out";
import { WorkspaceBreadcrumb } from "@/components/workspace-breadcrumb";
import { Sparkles } from "lucide-react";
import { WorkspaceNav } from "@/components/workspace-nav";
export default async function WorkspaceLayout({ children, drawer }: { children: React.ReactNode; drawer?: React.ReactNode }) {
  const user = await currentUser();
  const isAdmin = user ? !!await db.organisationMembership.findFirst({ where: { userId: user.id, role: "PLATFORM_ADMIN" }, select: { id: true } }) : false;
  const overdue = user ? await db.task.count({where:{assigneeId:user.id,completedAt:null,dueAt:{lt:new Date()},AND:[await taskScope(user.id)]}}) : 0;
  const timer=user?await db.timeEntry.findFirst({where:{userId:user.id,stoppedAt:null},select:{taskId:true,issueId:true,startedAt:true}}):null;
  return <div className="min-h-screen bg-white md:flex"><aside className="border-b border-neutral-200 bg-neutral-50/80 md:sticky md:top-0 md:h-screen md:w-[224px] md:shrink-0 md:border-b-0 md:border-r"><div className="flex h-14 items-center gap-2.5 px-5"><span className="grid size-8 place-items-center rounded-lg bg-neutral-900 text-white"><Sparkles size={16}/></span><span className="text-sm font-semibold tracking-tight">Spiritus <span className="text-neutral-400">×</span> Velocity</span></div><div className="hidden h-5 md:block"/><WorkspaceNav signedIn={!!user} isAdmin={isAdmin} overdue={overdue}/><div className="absolute bottom-5 left-0 hidden w-[224px] px-4 md:block">{user ? <div className="flex items-center gap-3 rounded-lg border border-neutral-200 p-2"><span className="grid size-8 place-items-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800">{user.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-xs font-medium">{user.name}</span><SignOut /></div> : <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs"><p className="font-medium text-blue-800">Workspace preview</p><p className="mt-1 text-blue-700/80">Records stay private until you sign in.</p><Link className="mt-2 inline-block font-medium text-blue-700 hover:underline" href="/sign-in">Sign in</Link></div>}</div></aside><div className="min-w-0 flex-1"><header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-5 md:px-9"><WorkspaceBreadcrumb />{timer&&<div className="hidden sm:block"><TimerControl id={timer.taskId??timer.issueId!} type={timer.taskId?"task":"issue"} startedAt={timer.startedAt.toISOString()}/></div>}{user ? <span className="px-2.5 py-1 text-xs text-neutral-500">{user.name}</span> : <Link className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800" href="/sign-in">Sign in</Link>}</header><main className="mx-auto max-w-[1600px] px-5 py-6 md:px-8 md:py-8">{children}</main></div>{drawer}</div>;
}
