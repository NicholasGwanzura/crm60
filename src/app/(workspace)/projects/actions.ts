"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditProject, canEditLead } from "@/lib/permissions";

const statusEnum = z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]);
const projectInput = z.object({ name: z.string().trim().min(2).max(160), emoji: z.string().trim().max(8), description: z.string().max(5000), organisationId: z.uuid(), status: statusEnum });

export async function createProject(form: FormData) {
  const user = await requireUser();
  const input = projectInput.parse(Object.fromEntries(form));
  const member = await db.organisationMembership.findFirst({ where: { userId: user.id, organisationId: input.organisationId, role: { not: "VIEWER" } } });
  if (!member) throw new Error("Not authorised");
  const project = await db.project.create({ data: { name: input.name, emoji: input.emoji || null, description: input.description || null, status: input.status, organisationId: input.organisationId, ownerId: user.id } });
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(form: FormData) {
  const user = await requireUser();
  const id = z.uuid().parse(form.get("id"));
  const name = z.string().trim().min(2).max(160).parse(form.get("name"));
  const emoji = z.string().trim().max(8).parse(form.get("emoji"));
  const description = z.string().max(5000).parse(form.get("description"));
  if (!await canEditProject(user.id, id)) throw new Error("Not authorised");
  await db.project.update({ where: { id }, data: { name, emoji: emoji || null, description: description || null } });
  revalidatePath(`/projects/${id}`); revalidatePath("/projects");
}

export async function updateProjectStatus(form: FormData) {
  const user = await requireUser();
  const id = z.uuid().parse(form.get("id"));
  const status = statusEnum.parse(form.get("status"));
  if (!await canEditProject(user.id, id)) throw new Error("Not authorised");
  await db.project.update({ where: { id }, data: { status } });
  revalidatePath(`/projects/${id}`); revalidatePath("/projects");
}

export async function deleteProject(form: FormData) {
  const user = await requireUser();
  const id = z.uuid().parse(form.get("id"));
  if (!await canEditProject(user.id, id)) throw new Error("Not authorised");
  await db.project.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/projects");
  redirect("/projects");
}

export async function assignLeadToProject(form: FormData) {
  const user = await requireUser();
  const projectId = z.uuid().parse(form.get("projectId"));
  const leadId = z.uuid().parse(form.get("leadId"));
  if (!await canEditProject(user.id, projectId)) throw new Error("Not authorised");
  const project = await db.project.findFirst({ where: { id: projectId, deletedAt: null } });
  if (!project) throw new Error("Invalid project");
  const lead = await db.lead.findFirst({ where: { id: leadId, organisationId: project.organisationId, deletedAt: null } });
  if (!lead || !await canEditLead(user.id, leadId)) throw new Error("Invalid lead");
  await db.lead.update({ where: { id: leadId }, data: { projectId } });
  revalidatePath(`/projects/${projectId}`); revalidatePath(`/leads/${leadId}`);
}

export async function unassignLeadFromProject(form: FormData) {
  const user = await requireUser();
  const projectId = z.uuid().parse(form.get("projectId"));
  const leadId = z.uuid().parse(form.get("leadId"));
  if (!await canEditProject(user.id, projectId)) throw new Error("Not authorised");
  const lead = await db.lead.findFirst({ where: { id: leadId, projectId, deletedAt: null } });
  if (!lead || !await canEditLead(user.id, leadId)) throw new Error("Invalid lead");
  await db.lead.update({ where: { id: leadId }, data: { projectId: null } });
  revalidatePath(`/projects/${projectId}`); revalidatePath(`/leads/${leadId}`);
}
