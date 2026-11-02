import { createHash } from "node:crypto";
import { Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/roles";
import { acceptInvitation } from "./actions";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invitation = await db.invitation.findUnique({ where: { tokenHash }, include: { organisation: { select: { name: true } } } });
  const valid = !!invitation && !invitation.acceptedAt && invitation.expiresAt >= new Date();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-neutral-900 text-white"><Sparkles size={16} /></span>
          <span className="text-sm font-semibold tracking-tight">Spiritus <span className="text-neutral-400">×</span> Velocity</span>
        </div>
        <div className="ui-card p-6">
          {!valid ? (
            <div>
              <h1 className="mb-2 text-lg font-semibold tracking-tight">Invitation unavailable</h1>
              <p className="text-sm text-neutral-500">{invitation?.acceptedAt ? "This invitation has already been accepted." : invitation ? "This invitation has expired." : "This invitation link is invalid."}</p>
            </div>
          ) : (
            <div>
              <h1 className="mb-1 text-lg font-semibold tracking-tight">Accept your invitation</h1>
              <p className="mb-5 text-sm text-neutral-500">Join {invitation.organisation.name} as {ROLE_LABELS[invitation.role]}. Set your name and password.</p>
              <form action={acceptInvitation} className="space-y-4">
                <input type="hidden" name="token" value={token} />
                <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">Email</span><input type="email" value={invitation.email} disabled className="ui-input" /></label>
                <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">Full name</span><input name="name" required minLength={2} placeholder="Your name" className="ui-input" /></label>
                <label className="block space-y-1.5 text-sm"><span className="font-medium text-neutral-700">Password</span><input name="password" type="password" required minLength={12} autoComplete="new-password" placeholder="At least 12 characters" className="ui-input" /></label>
                <button className="ui-button w-full">Create account</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
