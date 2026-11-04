"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectScope,canWriteOrganisation } from "@/lib/permissions";
const inputSchema=z.object({title:z.string().trim().min(3).max(180),description:z.string().trim().min(1).max(10000),priority:z.enum(["LOW","NORMAL","HIGH","URGENT"]),assigneeId:z.string().min(1).max(200)});
export async function saveIssue(form:FormData){
 const user=await requireUser();const id=form.get("id")?z.uuid().parse(form.get("id")):null;
 const existing=id?await db.issue.findFirst({where:{id,project:await projectScope(user.id)}}):null;if(id&&!existing)throw new Error("Unavailable issue");
 const projectId=existing?.projectId??z.uuid().parse(form.get("projectId"));const project=await db.project.findFirst({where:{AND:[{id:projectId},await projectScope(user.id)]}});
 if(!project||!await canWriteOrganisation(user.id,project.organisationId))throw new Error("Not authorised");
 const projectCreateStatus=z.enum(["OPEN","IN_PROGRESS"]).optional().parse(form.get("projectCreateStatus")??undefined);
 const input=inputSchema.parse(Object.fromEntries(form));const member=await db.organisationMembership.findFirst({where:{organisationId:project.organisationId,userId:input.assigneeId,role:{not:"VIEWER"},user:{suspended:false}}});if(!member)throw new Error("Invalid assignee");
 const issue=await db.$transaction(async tx=>{if(id){const updated=await tx.issue.updateMany({where:{id,status:{not:"RESOLVED"}},data:input});if(!updated.count)throw new Error("Reopen the issue before editing it");await tx.issueEvent.create({data:{issueId:id,actorId:user.id,description:"Issue details updated"}});return {id};}return tx.issue.create({data:{...input,status:projectCreateStatus,projectId,reporterId:user.id,events:{create:{actorId:user.id,description:"Issue reported"}}}});});
 revalidatePath("/issues");revalidatePath(`/issues/${issue.id}`);revalidatePath(`/projects/${projectId}`);if(!id&&!projectCreateStatus)redirect(`/issues/${issue.id}`);
}
export async function changeIssueStatus(form:FormData){
 const user=await requireUser();const id=z.uuid().parse(form.get("id"));const status=z.enum(["OPEN","IN_PROGRESS","RESOLVED"]).parse(form.get("status"));const resolution=z.string().trim().max(5000).parse(form.get("resolution")??"");
 const issue=await db.issue.findFirst({where:{id,project:await projectScope(user.id)},include:{project:{select:{organisationId:true}}}});
 if(!issue||!await canWriteOrganisation(user.id,issue.project.organisationId))throw new Error("Not authorised");if(status==="RESOLVED"&&resolution.length<5)throw new Error("A resolution note is required");
 const transitions:Record<string,string[]>={OPEN:["IN_PROGRESS","RESOLVED"],IN_PROGRESS:["OPEN","RESOLVED"],RESOLVED:["OPEN"]};if(!transitions[issue.status].includes(status))throw new Error("Invalid transition");
 await db.$transaction(async tx=>{const claimed=await tx.issue.updateMany({where:{id,status:issue.status},data:{status,resolution:status==="RESOLVED"?resolution:null,resolvedAt:status==="RESOLVED"?new Date():null}});if(!claimed.count)throw new Error("Issue changed; refresh and try again");if(status==="RESOLVED")await tx.timeEntry.updateMany({where:{issueId:id,stoppedAt:null},data:{stoppedAt:new Date()}});await tx.issueEvent.create({data:{issueId:id,actorId:user.id,description:status==="RESOLVED"?`Resolved: ${resolution}`:status==="OPEN"?"Issue reopened":"Work started"}});});revalidatePath("/issues");revalidatePath(`/issues/${id}`);revalidatePath(`/projects/${issue.projectId}`);revalidatePath("/", "layout");
}
