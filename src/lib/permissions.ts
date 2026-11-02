import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export async function leadScope(userId: string): Promise<Prisma.LeadWhereInput> {
  const memberships = await db.organisationMembership.findMany({ where: { userId }, select: { organisationId: true, role: true } });
  const orgIds = memberships.map((m) => m.organisationId);
  if (memberships.some((m) => m.role === "PLATFORM_ADMIN")) return { deletedAt: null };
  return { deletedAt: null, OR: [
    { visibility: "PERSONAL", ownerId: userId },
    { visibility: "PERSONAL", organisationId: { in: memberships.filter((m) => m.role === "ORG_ADMIN").map((m) => m.organisationId) } },
    { visibility: "PRIVATE", organisationId: { in: orgIds } },
    { visibility: "SHARED", access: { some: { organisationId: { in: orgIds } } } },
  ] };
}

export async function canEditLead(userId: string, leadId: string) {
  const lead = await db.lead.findFirst({ where: { AND: [{ id: leadId }, await leadScope(userId)] }, select: { organisationId: true, ownerId: true } });
  if (!lead) return false;
  const membership = await db.organisationMembership.findFirst({ where: { userId, organisationId: lead.organisationId } });
  return lead.ownerId === userId || membership?.role === "PLATFORM_ADMIN" || membership?.role === "ORG_ADMIN" || membership?.role === "SALES_MANAGER";
}

export async function projectScope(userId: string): Promise<Prisma.ProjectWhereInput> {
  const memberships = await db.organisationMembership.findMany({ where: { userId }, select: { organisationId: true, role: true } });
  if (memberships.some((m) => m.role === "PLATFORM_ADMIN")) return { deletedAt: null };
  return { deletedAt: null, organisationId: { in: memberships.map((m) => m.organisationId) } };
}

export async function canEditProject(userId: string, projectId: string) {
  const project = await db.project.findFirst({ where: { AND: [{ id: projectId }, await projectScope(userId)] }, select: { organisationId: true, ownerId: true } });
  if (!project) return false;
  const membership = await db.organisationMembership.findFirst({ where: { userId, organisationId: project.organisationId } });
  return project.ownerId === userId || membership?.role === "PLATFORM_ADMIN" || membership?.role === "ORG_ADMIN" || membership?.role === "PROJECT_MANAGER";
}
