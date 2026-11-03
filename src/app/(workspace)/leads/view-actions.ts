"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditLead,leadScope } from "@/lib/permissions";
import { leadFilterSchema } from "@/lib/lead-filters";
export async function saveLeadView(form:FormData){
 const user=await requireUser();const name=z.string().trim().min(2).max(60).parse(form.get("name"));const raw=z.string().max(2000).parse(form.get("filters"));const filters=leadFilterSchema.parse(JSON.parse(raw));
 if(await db.savedView.count({where:{userId:user.id}})>=30)throw new Error("Limit of 30 saved views reached");
 await db.savedView.create({data:{name,userId:user.id,filters}});revalidatePath("/leads");
}
export async function deleteLeadView(form:FormData){const user=await requireUser();const id=z.uuid().parse(form.get("id"));await db.savedView.deleteMany({where:{id,userId:user.id}});revalidatePath("/leads");}
export async function bulkUpdateLeads(_: {error?:string;success?:string},form:FormData):Promise<{error?:string;success?:string}>{
 const user=await requireUser();const parsed=z.object({ids:z.array(z.uuid()).min(1).max(100),operation:z.enum(["stage","owner"]),target:z.string().min(1).max(200)}).safeParse({ids:form.getAll("ids"),operation:form.get("operation"),target:form.get("target")});
 if(!parsed.success)return {error:"Select up to 100 leads and an action."};
 const {ids:rawIds,operation,target}=parsed.data;const ids=[...new Set(rawIds)];
 const leads=await db.lead.findMany({where:{AND:[{id:{in:ids}},await leadScope(user.id)]},select:{id:true,organisationId:true,stageId:true}});
 if(leads.length!==ids.length||!(await Promise.all(leads.map(l=>canEditLead(user.id,l.id)))).every(Boolean))return {error:"You do not have edit access to every selected lead."};
 const orgs=[...new Set(leads.map(l=>l.organisationId))];
 if(operation==="stage"&&(orgs.length!==1||!await db.leadStage.findFirst({where:{id:target,organisationId:orgs[0]}})))return {error:"Stage changes require leads from one organisation and a matching stage."};
 if(operation==="owner"&&await db.organisationMembership.count({where:{userId:target,organisationId:{in:orgs},role:{not:"VIEWER"},user:{suspended:false}}})!==orgs.length)return {error:"The new owner must be an active member of every selected organisation."};
 try{await db.$transaction(async tx=>{for(const lead of leads){await tx.lead.update({where:{id:lead.id},data:operation==="owner"?{ownerId:target}:{stageId:target,...(lead.stageId!==target?{stageChangedAt:new Date()}:{})}});await tx.activity.create({data:{leadId:lead.id,actorId:user.id,kind:operation==="stage"?"STAGE_CHANGE":"SYSTEM",description:operation==="stage"?"Stage updated in bulk":"Owner reassigned in bulk"}});}});revalidatePath("/leads");revalidatePath("/dashboard");return {success:`Updated ${ids.length} lead${ids.length===1?"":"s"}.`};}catch{return {error:"Could not update the leads. Please try again."};}
}
