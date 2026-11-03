"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canWriteOrganisation, canEditLead } from "@/lib/permissions";
const companyInput = z.object({name:z.string().trim().min(2).max(160),website:z.union([z.url().refine(v=>/^https?:/.test(v)),z.literal("")]),industry:z.string().trim().max(100),description:z.string().max(5000)});
export async function saveCompany(form: FormData) {
  const user = await requireUser(); const id = form.get("id") ? z.uuid().parse(form.get("id")) : null;
  const existing = id ? await db.company.findUnique({where:{id}}) : null;
  if (id && !existing) throw new Error("Unavailable company");
  const organisationId = existing?.organisationId ?? z.uuid().parse(form.get("organisationId"));
  if (!await canWriteOrganisation(user.id,organisationId)) throw new Error("Not authorised");
  const input=companyInput.parse(Object.fromEntries(form));
  const data={...input,website:input.website||null,industry:input.industry||null,description:input.description||null};
  const result=await db.$transaction(async tx=>{
    const company=id ? await tx.company.update({where:{id},data}) : await tx.company.create({data:{...data,organisationId}});
    if(id) await tx.lead.updateMany({where:{companyId:id},data:{companyName:data.name}});
    return company;
  });
  revalidatePath("/companies"); revalidatePath("/leads"); revalidatePath(`/companies/${result.id}`);
  if (!id) redirect(`/companies/${result.id}`);
}
export async function saveContact(form:FormData) {
  const user=await requireUser(); const companyId=z.uuid().parse(form.get("companyId"));
  const company=await db.company.findUnique({where:{id:companyId}});
  if(!company||!await canWriteOrganisation(user.id,company.organisationId)) throw new Error("Not authorised");
  const input=z.object({name:z.string().trim().min(2).max(160),jobTitle:z.string().trim().max(120),email:z.union([z.email(),z.literal("")]),phone:z.string().trim().max(60)}).parse(Object.fromEntries(form));
  const id=form.get("id")?z.uuid().parse(form.get("id")):null;
  if(id&&!await db.contact.findFirst({where:{id,companyId}}))throw new Error("Unavailable contact");
  const data={...input,email:input.email||null,phone:input.phone||null,jobTitle:input.jobTitle||null};
  if(id)await db.contact.update({where:{id},data});else await db.contact.create({data:{...data,companyId}});
  revalidatePath(`/companies/${companyId}`);
}
export async function linkCompany(form:FormData) {
  const user=await requireUser();const leadId=z.uuid().parse(form.get("leadId"));
  if(!await canEditLead(user.id,leadId))throw new Error("Not authorised");
  const lead=await db.lead.findUniqueOrThrow({where:{id:leadId}});
  const companyId=form.get("companyId")?z.uuid().parse(form.get("companyId")):null;
  const company=companyId?await db.company.findFirst({where:{id:companyId,organisationId:lead.organisationId}}):null;
  if(companyId&&!company)throw new Error("Invalid company");
  await db.lead.update({where:{id:leadId},data:{companyId, ...(company?{companyName:company.name}:{})}});
  revalidatePath(`/leads/${leadId}`);revalidatePath("/companies");
}
