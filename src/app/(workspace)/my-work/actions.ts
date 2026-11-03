"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditLead,canWriteOrganisation,taskScope,canManageTask,leadScope } from "@/lib/permissions";
function refresh(leadId:string|null){revalidatePath("/my-work");if(leadId)revalidatePath(`/leads/${leadId}`);revalidatePath("/dashboard");revalidatePath("/", "layout");}
export async function saveTask(form:FormData){
 const user=await requireUser();const id=form.get("id")?z.uuid().parse(form.get("id")):null;const old=id?await db.task.findFirst({where:{AND:[{id},await taskScope(user.id)]}}):null;
 if(id&&(!old||!await canManageTask(user.id,old)))throw new Error("Not authorised");
 const leadId=form.get("leadId")?z.uuid().parse(form.get("leadId")):null;
 if(old&&old.leadId!==leadId)throw new Error("Task context cannot be changed after creation");
 const lead=leadId?await db.lead.findUnique({where:{id:leadId}}):null;
 if(leadId&&(!lead||!await canEditLead(user.id,leadId)))throw new Error("Not authorised");
 const organisationId=lead?.organisationId??z.uuid().parse(form.get("organisationId"));
 if(!await canWriteOrganisation(user.id,organisationId))throw new Error("Not authorised");
 const input=z.object({title:z.string().trim().min(2).max(200),description:z.string().max(5000),assigneeId:z.string().min(1).max(200),dueAt:z.iso.date(),priority:z.enum(["LOW","NORMAL","HIGH"])}).parse(Object.fromEntries(form));
 if(!leadId&&input.assigneeId!==user.id)throw new Error("Personal tasks can only be assigned to yourself");
 const member=await db.organisationMembership.findFirst({where:{organisationId,userId:input.assigneeId,role:{not:"VIEWER"},user:{suspended:false}}});if(!member)throw new Error("Invalid assignee");
 if(leadId&&!await db.lead.findFirst({where:{AND:[{id:leadId},await leadScope(input.assigneeId)]},select:{id:true}}))throw new Error("Assignee cannot access this lead");
 const data={...input,leadId,organisationId,dueAt:new Date(`${input.dueAt}T23:59:59+02:00`)};
 await db.$transaction(async tx=>{if(id)await tx.task.update({where:{id},data});else await tx.task.create({data});if(leadId)await tx.activity.create({data:{leadId,actorId:user.id,kind:"SYSTEM",description:`${id?"Updated":"Scheduled"} task: ${input.title}`}});});refresh(leadId);
}
export async function toggleTask(form:FormData){
 const user=await requireUser();const id=z.uuid().parse(form.get("id"));const task=await db.task.findFirst({where:{AND:[{id},await taskScope(user.id)]}});
 if(!task||!await canManageTask(user.id,task))throw new Error("Not authorised");
 const complete=form.get("complete")==="true";
 await db.$transaction(async tx=>{await tx.task.update({where:{id},data:{completedAt:complete?new Date():null}});if(complete)await tx.timeEntry.updateMany({where:{taskId:id,stoppedAt:null},data:{stoppedAt:new Date()}});if(task.leadId)await tx.activity.create({data:{leadId:task.leadId,actorId:user.id,kind:"SYSTEM",description:`${complete?"Completed":"Reopened"} task: ${task.title}`}});});refresh(task.leadId);
}
