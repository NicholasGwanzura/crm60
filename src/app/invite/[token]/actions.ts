"use server";
import { createHash, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/lib/db";

export async function acceptInvitation(form: FormData) {
  const token = z.string().min(10).parse(form.get("token"));
  const name = z.string().trim().min(2).max(160).parse(form.get("name"));
  const password = z.string().min(12).max(200).parse(form.get("password"));

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invitation = await db.invitation.findUnique({ where: { tokenHash } });
  if (!invitation) throw new Error("This invitation link is invalid.");
  if (invitation.acceptedAt) throw new Error("This invitation has already been accepted.");
  if (invitation.expiresAt < new Date()) throw new Error("This invitation has expired.");

  const user = await db.user.upsert({ where: { email: invitation.email }, update: { name }, create: { email: invitation.email, name, emailVerified: true } });
  const credential = await db.account.findFirst({ where: { userId: user.id, providerId: "credential" } });
  if (credential) {
    await db.account.update({ where: { id: credential.id }, data: { password: await hashPassword(password) } });
  } else {
    await db.account.create({ data: { id: randomUUID(), accountId: user.id, providerId: "credential", userId: user.id, password: await hashPassword(password) } });
  }
  await db.organisationMembership.upsert({
    where: { userId_organisationId: { userId: user.id, organisationId: invitation.organisationId } },
    update: { role: invitation.role },
    create: { userId: user.id, organisationId: invitation.organisationId, role: invitation.role },
  });
  await db.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
  redirect("/sign-in");
}
