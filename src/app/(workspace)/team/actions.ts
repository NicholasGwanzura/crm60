"use server";
import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const roleEnum = z.enum(["PLATFORM_ADMIN", "ORG_ADMIN", "SALES_MANAGER", "SALES_REP", "PROJECT_MANAGER", "TEAM_MEMBER", "VIEWER"]);

export async function createInvitation(form: FormData): Promise<{ link?: string; error?: string }> {
  const user = await requireUser();
  const email = z.email().parse(form.get("email")).toLowerCase();
  const organisationId = z.uuid().parse(form.get("organisationId"));
  const role = roleEnum.parse(form.get("role"));

  const membership = await db.organisationMembership.findFirst({ where: { userId: user.id, organisationId } });
  const isPlatformAdmin = !!(await db.organisationMembership.findFirst({ where: { userId: user.id, role: "PLATFORM_ADMIN" } }));
  if (!isPlatformAdmin && membership?.role !== "ORG_ADMIN") return { error: "You don't have permission to invite people to this organisation." };
  if (role === "PLATFORM_ADMIN" && !isPlatformAdmin) return { error: "Only a platform admin can invite another platform admin." };

  const organisation = await db.organisation.findUnique({ where: { id: organisationId } });
  if (!organisation) return { error: "Organisation not found." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    const already = await db.organisationMembership.findUnique({ where: { userId_organisationId: { userId: existing.id, organisationId } } });
    if (already) return { error: "That person is already a member of this organisation." };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await db.invitation.create({ data: { email, tokenHash, organisationId, role, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  revalidatePath("/team");
  return { link: `/invite/${token}` };
}

export async function revokeInvitation(form: FormData) {
  const user = await requireUser();
  const id = z.uuid().parse(form.get("id"));
  const invitation = await db.invitation.findUnique({ where: { id } });
  if (!invitation) return;
  const membership = await db.organisationMembership.findFirst({ where: { userId: user.id, organisationId: invitation.organisationId } });
  const isPlatformAdmin = !!(await db.organisationMembership.findFirst({ where: { userId: user.id, role: "PLATFORM_ADMIN" } }));
  if (!isPlatformAdmin && membership?.role !== "ORG_ADMIN") throw new Error("Not authorised");
  await db.invitation.delete({ where: { id } });
  revalidatePath("/team");
}
