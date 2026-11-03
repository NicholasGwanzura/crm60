"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditLead, canApproveQuote, leadScope } from "@/lib/permissions";
import { quoteInput } from "@/lib/quote-input";
function refresh(id:string){revalidatePath("/quotes");revalidatePath(`/quotes/${id}`);revalidatePath("/leads");revalidatePath("/projects");}
export async function saveQuote(form:FormData){
 const user=await requireUser();const id=form.get("id")?z.uuid().parse(form.get("id")):null;
 const existing=id?await db.quote.findFirst({where:{id,lead:await leadScope(user.id)}}):null;
 if(id&&!existing)throw new Error("Unavailable quote");
 const leadId=existing?.leadId??z.uuid().parse(form.get("leadId"));
 if(!await canEditLead(user.id,leadId))throw new Error("Not authorised");
 const raw=z.string().max(60000).parse(form.get("items"));
 const input=quoteInput.parse({...Object.fromEntries(form),items:JSON.parse(raw)});
 const validUntil=new Date(`${input.validUntil}T23:59:59+02:00`);if(!Number.isFinite(validUntil.getTime()))throw new Error("Invalid date");
 const {items,...rest}=input;const data={...rest,validUntil};
 const quote=await db.$transaction(async tx=>{
  if(id){const claimed=await tx.quote.updateMany({where:{id,status:{in:["DRAFT","REJECTED"]}},data:{...data,status:"DRAFT"}});if(!claimed.count)throw new Error("Only draft or rejected quotes can be edited");await tx.quoteItem.deleteMany({where:{quoteId:id}});await tx.quoteItem.createMany({data:items.map((item,position)=>({...item,position,quoteId:id}))});return {id};}
  return tx.quote.create({data:{...data,leadId,items:{create:items.map((item,position)=>({...item,position}))}}});
 });
 refresh(quote.id);revalidatePath(`/leads/${leadId}`);if(!id)redirect(`/quotes/${quote.id}`);
}
export async function changeQuoteStatus(form:FormData){
 const user=await requireUser();const id=z.uuid().parse(form.get("id"));const status=z.enum(["SENT","APPROVED","REJECTED"]).parse(form.get("status"));
 const quote=await db.quote.findFirst({where:{id,lead:await leadScope(user.id)},include:{lead:{select:{organisationId:true}}}});
 if(!quote)throw new Error("Unavailable quote");
 if(status==="SENT"?!await canEditLead(user.id,quote.leadId):!await canApproveQuote(user.id,quote.lead.organisationId))throw new Error("Not authorised");
 if(status==="APPROVED"&&quote.validUntil<new Date())throw new Error("Quote has expired; edit and resubmit");
 await db.$transaction(async tx=>{
  const updated=await tx.quote.updateMany({where:{id,status:status==="SENT"?"DRAFT":"SENT"},data:{status}});if(!updated.count)throw new Error("Invalid status transition");
  await tx.activity.create({data:{leadId:quote.leadId,actorId:user.id,kind:"SYSTEM",description:`Quote Q-${quote.number}: ${status==="SENT"?"submitted for approval":status.toLowerCase()}`}});
 });refresh(id);revalidatePath(`/leads/${quote.leadId}`);
}
export async function convertQuote(form:FormData){
 const user=await requireUser();const id=z.uuid().parse(form.get("id"));
 const quote=await db.quote.findFirst({where:{id,lead:await leadScope(user.id)},include:{lead:true}});
 if(!quote||!await canEditLead(user.id,quote.leadId))throw new Error("Not authorised");
 if(quote.validUntil<new Date())throw new Error("Quote expired");
 const project=await db.$transaction(async tx=>{
  const claim=await tx.quote.updateMany({where:{id,status:"APPROVED",projectId:null},data:{status:"CONVERTED"}});if(!claim.count)throw new Error("Quote must be approved and not already converted");
  const created=await tx.project.create({data:{name:quote.title,description:`Created from quote Q-${quote.number}. ${quote.notes??""}`,organisationId:quote.lead.organisationId,ownerId:user.id,status:"PLANNING"}});
  await tx.quote.update({where:{id},data:{projectId:created.id}});
  await tx.lead.update({where:{id:quote.leadId},data:{projectId:created.id}});
  await tx.activity.create({data:{leadId:quote.leadId,actorId:user.id,kind:"SYSTEM",description:`Quote Q-${quote.number} converted to project: ${quote.title}`}});
  return created;
 });refresh(id);revalidatePath(`/leads/${quote.leadId}`);redirect(`/projects/${project.id}`);
}
