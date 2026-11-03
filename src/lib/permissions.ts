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
  return await isPlatformAdmin(userId) || (!!membership && membership.role !== "VIEWER" && (lead.ownerId === userId || membership.role === "ORG_ADMIN" || membership.role === "SALES_MANAGER"));
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
  return await isPlatformAdmin(userId) || (!!membership && membership.role !== "VIEWER" && (project.ownerId === userId || membership.role === "ORG_ADMIN" || membership.role === "PROJECT_MANAGER"));
}

export async function isPlatformAdmin(userId: string) {
  return !!await db.organisationMembership.findFirst({ where: { userId, role: "PLATFORM_ADMIN" }, select: { id: true } });
}
export async function organisationScope(userId: string) {
  if (await isPlatformAdmin(userId)) return {};
  return { memberships: { some: { userId } } };
}
export async function canWriteOrganisation(userId: string, organisationId: string) {
  if (await isPlatformAdmin(userId)) return true;
  return !!await db.organisationMembership.findFirst({ where: { userId, organisationId, role: { not: "VIEWER" } } });
}
export async function canApproveQuote(userId: string, organisationId: string) {
  return await isPlatformAdmin(userId) || !!await db.organisationMembership.findFirst({ where: { userId, organisationId, role: { in: ["ORG_ADMIN", "SALES_MANAGER"] } } });
}

export async function taskScope(userId:string):Promise<Prisma.TaskWhereInput>{
 return {OR:[{lead:await leadScope(userId)},{leadId:null,assigneeId:userId,organisation:await organisationScope(userId)}]};
}
export async function canManageTask(userId:string,task:{leadId:string|null;assigneeId:string;organisationId:string|null}){
 if(task.leadId)return await canEditLead(userId,task.leadId)||(task.assigneeId===userId&&!!await db.task.findFirst({where:{leadId:task.leadId,assigneeId:userId,lead:await leadScope(userId)}})&&!!task.organisationId&&await canWriteOrganisation(userId,task.organisationId));
 return task.assigneeId===userId&&!!task.organisationId&&await canWriteOrganisation(userId,task.organisationId);
}
