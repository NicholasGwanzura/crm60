import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {canEditLeadRecord,canEditProjectRecord,canWriteOrganisationRecord,organisationRole} from "@/lib/access-policy";
export {canEditLeadRecord,canEditProjectRecord,canWriteOrganisationRecord} from "@/lib/access-policy";
// React cache deduplicates only within one server render/request, never across users or requests.
export const accessProfile=cache(async(userId:string)=>{
 const memberships=await db.organisationMembership.findMany({where:{userId},select:{organisationId:true,role:true}});
 return {userId,memberships,platformAdmin:memberships.some(m=>m.role==="PLATFORM_ADMIN")};
});
export const leadScope=cache(async(userId:string):Promise<Prisma.LeadWhereInput>=>{
 const profile=await accessProfile(userId);const orgIds=profile.memberships.map(m=>m.organisationId);
 if(profile.platformAdmin)return {deletedAt:null};
 return {deletedAt:null,OR:[{visibility:"PERSONAL",ownerId:userId},{visibility:"PERSONAL",organisationId:{in:profile.memberships.filter(m=>m.role==="ORG_ADMIN").map(m=>m.organisationId)}},{visibility:"PRIVATE",organisationId:{in:orgIds}},{visibility:"SHARED",access:{some:{organisationId:{in:orgIds}}}}]};
});
export const projectScope=cache(async(userId:string):Promise<Prisma.ProjectWhereInput>=>{const profile=await accessProfile(userId);return profile.platformAdmin?{deletedAt:null}:{deletedAt:null,organisationId:{in:profile.memberships.map(m=>m.organisationId)}};});
export const organisationScope=cache(async(userId:string):Promise<Prisma.OrganisationWhereInput>=>{const profile=await accessProfile(userId);return profile.platformAdmin?{}:{id:{in:profile.memberships.map(m=>m.organisationId)}};});
export async function isPlatformAdmin(userId:string){return (await accessProfile(userId)).platformAdmin;}
export async function canWriteOrganisation(userId:string,id:string){return canWriteOrganisationRecord(await accessProfile(userId),id);}
export async function canApproveQuote(userId:string,id:string){const p=await accessProfile(userId);const role=organisationRole(p,id);return p.platformAdmin||role==="ORG_ADMIN"||role==="SALES_MANAGER";}
export const canEditLead=cache(async(userId:string,id:string)=>{const [profile,lead]=await Promise.all([accessProfile(userId),db.lead.findFirst({where:{AND:[{id},await leadScope(userId)]},select:{organisationId:true,ownerId:true}})]);return !!lead&&canEditLeadRecord(profile,lead);});
export const canEditProject=cache(async(userId:string,id:string)=>{const [profile,project]=await Promise.all([accessProfile(userId),db.project.findFirst({where:{AND:[{id},await projectScope(userId)]},select:{organisationId:true,ownerId:true}})]);return !!project&&canEditProjectRecord(profile,project);});
export const taskScope=cache(async(userId:string):Promise<Prisma.TaskWhereInput>=>({OR:[{lead:await leadScope(userId)},{leadId:null,assigneeId:userId,organisation:await organisationScope(userId)}]}));
export async function canManageTask(userId:string,task:{leadId:string|null;assigneeId:string;organisationId:string|null}){
 if(task.leadId){if(await canEditLead(userId,task.leadId))return true;return task.assigneeId===userId&&!!task.organisationId&&await canWriteOrganisation(userId,task.organisationId)&&!!await db.lead.findFirst({where:{AND:[{id:task.leadId},await leadScope(userId)]},select:{id:true}});}
 return task.assigneeId===userId&&!!task.organisationId&&await canWriteOrganisation(userId,task.organisationId);
}
