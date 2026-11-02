import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { SignIn } from "@/components/sign-in";

export default async function SignInPage() {
  const user = await currentUser();
  if (user) redirect("/leads");
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-neutral-900 text-white"><Sparkles size={16} /></span>
          <span className="text-sm font-semibold tracking-tight">Spiritus <span className="text-neutral-400">×</span> Velocity</span>
        </div>
        <div className="ui-card p-6">
          <h1 className="mb-1 text-lg font-semibold tracking-tight">Sign in</h1>
          <p className="mb-5 text-sm text-neutral-500">Use your work email and password.</p>
          <SignIn />
        </div>
        <p className="mt-4 text-center text-xs text-neutral-400"><Link className="hover:underline" href="/leads">← Back to workspace preview</Link></p>
      </div>
    </div>
  );
}
