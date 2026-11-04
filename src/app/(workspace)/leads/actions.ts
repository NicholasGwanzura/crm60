"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditLead, canWriteOrganisation, leadScope } from "@/lib/permissions";

const leadInput = z.object({ title: z.string().trim().min(2).max(160), companyName: z.string().trim().min(2).max(160), email: z.union([z.email(), z.literal("")]), organisationId: z.uuid(), stageId: z.uuid(), description: z.string().max(5000) });

export async function createLead(form: FormData) {
  const user = await requireUser();
  const input = leadInput.parse(Object.fromEntries(form));
  const canWrite = await canWriteOrganisation(user.id, input.organisationId);
  const stage = await db.leadStage.findFirst({ where: { id: input.stageId, organisationId: input.organisationId } });
  if (!canWrite || !stage) throw new Error("Not authorised");
  const companyId=form.get("companyId")?z.uuid().parse(form.get("companyId")):null;
  const company=companyId?await db.company.findFirst({where:{id:companyId,organisationId:input.organisationId}}):null;
  if(companyId&&!company)throw new Error("Invalid company");
  const lead = await db.lead.create({ data: { title: input.title, companyName: company?.name ?? input.companyName, companyId, email: input.email || null, description: input.description, organisationId: input.organisationId, ownerId: user.id, stageId: stage.id, activities: { create: { kind: "SYSTEM", description: "Lead created", actorId: user.id } } } });
  revalidatePath("/leads"); redirect(`/leads/${lead.id}`);
}

async function applyStageChange(userId: string, leadId: string, stageId: string) {
  if (!await canEditLead(userId, leadId)) throw new Error("Not authorised");
  const lead = await db.lead.findFirstOrThrow({ where: { AND: [{ id: leadId }, await leadScope(userId)] }, include: { stage: true } });
  const stage = await db.leadStage.findFirst({ where: { id: stageId, organisationId: lead.organisationId } });
  if (!stage) throw new Error("Invalid stage");
  if (lead.stageId === stageId) return;
  await db.$transaction([db.lead.update({ where: { id: leadId }, data: { stageId, stageChangedAt: new Date() } }), db.activity.create({ data: { leadId, actorId: userId, kind: "STAGE_CHANGE", description: `${lead.stage.name} → ${stage.name}` } })]);
  revalidatePath(`/leads/${leadId}`); revalidatePath("/leads");
}

export async function changeLeadStage(form: FormData) {
  const user = await requireUser();
  const id = z.uuid().parse(form.get("id")); const stageId = z.uuid().parse(form.get("stageId"));
  await applyStageChange(user.id, id, stageId);
}

export async function moveLeadStage(leadId: string, stageId: string) {
  const user = await requireUser();
  await applyStageChange(user.id, z.uuid().parse(leadId), z.uuid().parse(stageId));
}

export async function setLeadProject(form: FormData) {
  const user = await requireUser();
  const id = z.uuid().parse(form.get("id"));
  const projectIdRaw = form.get("projectId");
  if (!await canEditLead(user.id, id)) throw new Error("Not authorised");
  const lead = await db.lead.findFirstOrThrow({ where: { AND: [{ id }, await leadScope(user.id)] } });
  if (projectIdRaw) {
    const projectId = z.uuid().parse(projectIdRaw);
    const project = await db.project.findFirst({ where: { id: projectId, organisationId: lead.organisationId, deletedAt: null } });
    if (!project) throw new Error("Invalid project");
    await db.lead.update({ where: { id }, data: { projectId } });
  } else {
    await db.lead.update({ where: { id }, data: { projectId: null } });
  }
  revalidatePath(`/leads/${id}`); revalidatePath("/projects");
}

const leadUpdate = z.object({
  title: z.string().trim().min(2).max(160),
  companyName: z.string().trim().min(2).max(160),
  email: z.union([z.email(), z.literal("")]),
  phone: z.string().trim().max(60),
  description: z.string().max(5000),
  country: z.string().trim().min(1).max(100),
  currency: z.string().trim().regex(/^[A-Z]{3}$/),
  expectedCloseAt: z.union([z.iso.date(),z.literal("")]),
  estimatedValue: z.string().trim().max(30),
});

export async function updateLead(form: FormData) {
  const user = await requireUser();
  const id = z.uuid().parse(form.get("id"));
  if (!await canEditLead(user.id, id)) throw new Error("Not authorised");
  const input = leadUpdate.parse(Object.fromEntries(form));
  const estimatedValue = input.estimatedValue ? z.string().regex(/^\d{1,13}(\.\d{1,2})?$/).parse(input.estimatedValue) : null;
  const expectedCloseAt = input.expectedCloseAt ? new Date(`${input.expectedCloseAt}T12:00:00+02:00`) : null;
  if(expectedCloseAt && !Number.isFinite(expectedCloseAt.getTime())) throw new Error("Invalid close date");
  const linked = await db.lead.findUnique({where:{id},select:{company:{select:{name:true}}}});
  await db.$transaction([
    db.lead.update({ where: { id }, data: { title: input.title, companyName: linked?.company?.name ?? input.companyName, email: input.email || null, phone: input.phone || null, description: input.description || null, country: input.country || "Zimbabwe", currency: input.currency || "USD", estimatedValue, expectedCloseAt } }),
    db.activity.create({ data: { leadId: id, actorId: user.id, kind: "SYSTEM", description: "Lead updated" } }),
  ]);
  revalidatePath(`/leads/${id}`); revalidatePath("/leads");
}

export async function addNote(form: FormData) {
  const user = await requireUser(); const id = z.uuid().parse(form.get("id")); const body = z.string().trim().min(1).max(10000).parse(form.get("body"));
  if (!await canEditLead(user.id, id)) throw new Error("Not authorised");
  await db.$transaction([db.note.create({ data: { leadId: id, authorId: user.id, body } }), db.activity.create({ data: { leadId: id, actorId: user.id, kind: "NOTE", description: "Added a note" } })]);
  revalidatePath(`/leads/${id}`);
}
