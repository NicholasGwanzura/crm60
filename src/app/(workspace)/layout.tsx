import {Suspense} from "react";
import Link from "next/link";
import {Sparkles} from "lucide-react";
import {currentUser} from "@/lib/auth";
import {accessProfile,taskScope} from "@/lib/permissions";
import {db} from "@/lib/db";
import {WorkspaceNav} from "@/components/workspace-nav";
import {WorkspaceBreadcrumb} from "@/components/workspace-breadcrumb";
import {TimerControl} from "@/components/timer-control";
import {SignOut} from "@/components/sign-out";
async function Sidebar({userId}:{userId:string}){
 const [profile,overdue]=await Promise.all([accessProfile(userId),db.task.count({where:{assigneeId:userId,completedAt:null,dueAt:{lt:new Date()},AND:[await taskScope(userId)]}})]);
 return <WorkspaceNav signedIn isAdmin={profile.platformAdmin} overdue={overdue}/>;
}
async function ActiveTimer({userId}:{userId:string}){
 const timer=await db.timeEntry.findFirst({where:{userId,stoppedAt:null},select:{taskId:true,issueId:true,startedAt:true}});
 return timer?<div className="hidden sm:block"><TimerControl id={timer.taskId??timer.issueId!} type={timer.taskId?"task":"issue"} startedAt={timer.startedAt.toISOString()}/></div>:null;
}
export default async function WorkspaceLayout({children}:{children:React.ReactNode}){
 const user=await currentUser();
 return <div className="min-h-screen bg-white md:flex"><aside className="border-b bg-neutral-50/80 md:sticky md:top-0 md:h-screen md:w-[224px] md:shrink-0 md:border-b-0 md:border-r"><div className="flex h-14 items-center gap-2.5 px-5"><span className="grid size-8 place-items-center bg-neutral-900 text-white"><Sparkles size={16}/></span><span className="text-sm font-semibold tracking-tight">Spiritus <span className="text-neutral-400">×</span> Velocity</span></div><div className="hidden h-5 md:block"/>{user?<Suspense fallback={<WorkspaceNav signedIn isAdmin={false}/>}><Sidebar userId={user.id}/></Suspense>:<WorkspaceNav signedIn={false} isAdmin={false}/>}<div className="absolute bottom-5 left-0 hidden w-[224px] px-4 md:block">{user?<div className="flex items-center gap-3 border p-2"><span className="grid size-8 place-items-center bg-blue-100 text-xs font-semibold text-blue-800">{user.name.slice(0,2).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-xs font-medium">{user.name}</span><SignOut/></div>:<div className="border border-blue-100 bg-blue-50 p-3 text-xs"><p className="font-medium text-blue-800">Workspace preview</p><p className="mt-1 text-blue-700/80">Records stay private until you sign in.</p><Link className="mt-2 inline-block font-medium text-blue-700 hover:underline" href="/sign-in">Sign in</Link></div>}</div></aside><div className="min-w-0 flex-1"><header className="flex h-14 items-center justify-between border-b bg-white px-5 md:px-9"><WorkspaceBreadcrumb/>{user&&<Suspense fallback={null}><ActiveTimer userId={user.id}/></Suspense>}{user?<span className="px-2.5 py-1 text-xs text-neutral-500">{user.name}</span>:<Link className="ui-button" href="/sign-in">Sign in</Link>}</header><main className="mx-auto max-w-[1600px] px-5 py-6 md:px-8 md:py-8">{children}</main></div></div>;
}
