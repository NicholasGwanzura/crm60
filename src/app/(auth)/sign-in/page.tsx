import { ArrowUpRight, LockKeyhole, Sparkles } from "lucide-react";
import { SignIn } from "@/components/sign-in";

export default function Page() {
  return <main className="grid min-h-screen bg-[#f8f9fb] lg:grid-cols-[minmax(0,1fr)_minmax(480px,1fr)]">
    <section className="relative hidden min-h-screen overflow-hidden bg-[#111827] px-12 py-11 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
      <div className="pointer-events-none absolute -left-32 top-1/3 h-[480px] w-[480px] rounded-full bg-blue-500/20 blur-[110px]" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-[480px] w-[480px] rounded-full bg-indigo-400/15 blur-[120px]" />
      <div className="relative flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white text-[#111827] shadow-lg shadow-black/10"><Sparkles size={18} strokeWidth={1.8} /></span><span className="text-sm font-semibold tracking-tight">Spiritus <span className="text-white/45">×</span> Velocity</span></div>
      <div className="relative max-w-xl pb-8"><div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-blue-200"><span className="size-1.5 rounded-full bg-blue-400" /> One shared workspace</div><h1 className="text-[clamp(2.75rem,4.3vw,4.5rem)] font-semibold leading-[1.08] tracking-[-0.055em]">Better work starts with a clear view.</h1><p className="mt-6 max-w-md text-base leading-7 text-slate-300">Keep opportunities, relationships, and delivery moving together in one considered space.</p><div className="mt-10 flex items-center gap-2 text-sm text-white/75">Built for Spiritus Systems and Velocity Africa <ArrowUpRight size={16}/></div></div>
      <div className="relative text-xs text-white/40">© {new Date().getFullYear()} Spiritus × Velocity Workspace</div>
    </section>
    <section className="flex min-h-screen flex-col justify-between px-6 py-8 sm:px-10 lg:px-14 xl:px-24">
      <div className="flex items-center justify-between lg:justify-end"><div className="flex items-center gap-2 font-semibold tracking-tight lg:hidden"><span className="grid size-8 place-items-center rounded-lg bg-neutral-900 text-white"><Sparkles size={16}/></span> Spiritus × Velocity</div><span className="hidden text-xs font-medium text-neutral-400 lg:block">WORKSPACE ACCESS</span></div>
      <div className="mx-auto w-full max-w-[390px] py-16"><div className="mb-8 flex size-12 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-xs"><LockKeyhole size={20} strokeWidth={1.7} className="text-neutral-700"/></div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Welcome back</p><h2 className="text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-neutral-900">Sign in to your workspace</h2><p className="mt-3 mb-8 text-sm leading-6 text-neutral-500">Enter your work email and password to continue.</p><SignIn/><div className="mt-8 border-t border-neutral-200 pt-6 text-sm text-neutral-500">New to the team? <span className="font-medium text-neutral-800">Access is by invitation.</span></div></div>
      <div className="text-center text-xs text-neutral-400 lg:text-right">Private workspace · Secure access · HONOR Sans is used under its copyright license</div>
    </section>
  </main>;
}
