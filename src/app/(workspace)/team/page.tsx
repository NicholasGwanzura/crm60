import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { InviteUserForm } from "@/components/invite-user-form";
import { ROLE_LABELS } from "@/lib/roles";
import { revokeInvitation } from "./actions";

export default async function TeamPage() {
  const user = await requireUser();
  const memberships = await db.organisationMembership.findMany({ where: { userId: user.id }, include: { organisation: true } });
  const isPlatformAdmin = memberships.some((m) => m.role === "PLATFORM_ADMIN");
  const adminOrgs = memberships.filter((m) => m.role === "PLATFORM_ADMIN" || m.role === "ORG_ADMIN").map((m) => m.organisation);
  const orgIds = memberships.map((m) => m.organisationId);

  const orgMembers = orgIds.length
    ? await db.organisationMembership.findMany({ where: { organisationId: { in: orgIds } }, include: { user: { select: { name: true, email: true } }, organisation: { select: { name: true } } }, orderBy: { organisationId: "asc" } })
    : [];
  const invitations = adminOrgs.length
    ? await db.invitation.findMany({ where: { organisationId: { in: adminOrgs.map((o) => o.id) }, acceptedAt: null, expiresAt: { gt: new Date() } }, include: { organisation: { select: { name: true } } }, orderBy: { createdAt: "desc" } })
    : [];

  return (
    <div className="space-y-8">
      <div><p className="text-sm text-blue-800">Workspace</p><h1 className="text-3xl font-semibold mt-1">Team</h1><p className="text-neutral-500 mt-2">{orgMembers.length} members across your organisations</p></div>

      {adminOrgs.length > 0 && (
        <section className="panel p-5 md:p-6">
          <h2 className="mb-4 text-lg font-semibold">Invite a teammate</h2>
          <InviteUserForm organisations={adminOrgs.map((o) => ({ id: o.id, name: o.name, canAssignPlatformAdmin: isPlatformAdmin }))} />
        </section>
      )}

      {invitations.length > 0 && (
        <section className="panel overflow-hidden">
          <h2 className="border-b border-neutral-100 px-5 py-4 font-semibold">Pending invitations</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500 border-b"><tr><th className="p-4">Email</th><th>Organisation</th><th>Role</th><th>Expires</th><th /></tr></thead>
            <tbody>{invitations.map((inv) => <tr key={inv.id} className="border-b last:border-0"><td className="p-4 font-medium">{inv.email}</td><td>{inv.organisation.name}</td><td>{ROLE_LABELS[inv.role]}</td><td>{inv.expiresAt.toLocaleDateString()}</td><td className="p-4 text-right"><form action={revokeInvitation}><input type="hidden" name="id" value={inv.id} /><button className="text-xs text-red-600 hover:underline">Revoke</button></form></td></tr>)}</tbody>
          </table>
        </section>
      )}

      <section className="panel overflow-hidden">
        <h2 className="border-b border-neutral-100 px-5 py-4 font-semibold">Members</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-500 border-b"><tr><th className="p-4">Name</th><th>Email</th><th>Organisation</th><th>Role</th></tr></thead>
          <tbody>{orgMembers.map((m) => <tr key={m.id} className="border-b last:border-0"><td className="p-4 font-medium">{m.user.name}</td><td>{m.user.email}</td><td>{m.organisation.name}</td><td>{ROLE_LABELS[m.role]}</td></tr>)}</tbody>
        </table>
        {orgMembers.length === 0 && <p className="p-6 text-sm text-neutral-500">No members found.</p>}
      </section>
    </div>
  );
}
