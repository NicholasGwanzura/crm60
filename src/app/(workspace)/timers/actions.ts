"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskScope,canManageTask,projectScope,canWriteOrganisation } from "@/lib/permissions";
export async function changeTimer(_: {error?:string},form:FormData):Promise<{error?:string}>{
 const user=await currentUser();if(!user)return {error:"Sign in to track time."};
 const parsed=z.object({operation:z.enum(["start","stop"]),type:z.enum(["task","issue"]),id:z.uuid()}).safeParse(Object.fromEntries(form));if(!parsed.success)return {error:"Invalid timer request."};
 const {operation,type,id}=parsed.data;
 if(operation==="stop"){
  await db.timeEntry.updateMany({where:{userId:user.id,stoppedAt:null,...(type==="task"?{taskId:id}:{issueId:id})},data:{stoppedAt:new Date()}});
 }else{
  if(type==="task"){const task=await db.task.findFirst({where:{AND:[{id,completedAt:null},await taskScope(user.id)]}});if(!task||!await canManageTask(user.id,task))return {error:"This task is unavailable or complete."};}
  else{const issue=await db.issue.findFirst({where:{id,status:{not:"RESOLVED"},project:await projectScope(user.id)},include:{project:{select:{organisationId:true}}}});if(!issue||!await canWriteOrganisation(user.id,issue.project.organisationId))return {error:"This issue is unavailable or resolved."};}
  try{await db.$transaction(async tx=>{const running=await tx.timeEntry.findFirst({where:{userId:user.id,stoppedAt:null}});if(running)throw new Error("RUNNING");
   if(type==="task"){const claim=await tx.task.updateMany({where:{id,completedAt:null},data:{updatedAt:new Date()}});if(!claim.count)throw new Error("COMPLETED");}else{const claim=await tx.issue.updateMany({where:{id,status:{not:"RESOLVED"}},data:{status:"IN_PROGRESS"}});if(!claim.count)throw new Error("RESOLVED");}
   await tx.timeEntry.create({data:{userId:user.id,...(type==="task"?{taskId:id}:{issueId:id})}});
  });}catch{return {error:"Stop your active timer first, or refresh if this item was completed."};}
 }
 revalidatePath("/my-work");revalidatePath("/issues");revalidatePath(`/issues/${id}`);revalidatePath("/", "layout");return {};
}
