import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
export function WorkspaceGate({ title }: { title: string }) {
  return <div><header className="border-b pb-5"><h1 className="text-xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-sm text-neutral-500">Your team’s work, in one place.</p></header><div className="mx-auto flex max-w-sm flex-col items-center py-24 text-center"><span className="mb-5 grid size-12 place-items-center rounded-xl border bg-neutral-50 text-neutral-500"><Layers3 size={22}/></span><h2 className="text-base font-semibold">Open your workspace</h2><p className="mt-2 text-sm leading-6 text-neutral-500">Sign in to explore {title.toLowerCase()}, create records, and keep work moving with your team.</p><Link className="ui-button mt-6" href="/sign-in">Sign in to workspace <ArrowRight size={14}/></Link></div></div>;
}
