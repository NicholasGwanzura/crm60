import type { Role } from "@/generated/prisma/client";
export type AccessProfile={userId:string;platformAdmin:boolean;memberships:{organisationId:string;role:Role}[]};
export type OwnedRecord={organisationId:string;ownerId:string};
export function organisationRole(profile:AccessProfile,id:string){return profile.memberships.find(m=>m.organisationId===id)?.role;}
// These helpers are for records already returned by a scoped query.
export function canEditLeadRecord(profile:AccessProfile,lead:OwnedRecord){const role=organisationRole(profile,lead.organisationId);return profile.platformAdmin||!!role&&role!=="VIEWER"&&(lead.ownerId===profile.userId||role==="ORG_ADMIN"||role==="SALES_MANAGER");}
export function canEditProjectRecord(profile:AccessProfile,project:OwnedRecord){const role=organisationRole(profile,project.organisationId);return profile.platformAdmin||!!role&&role!=="VIEWER"&&(project.ownerId===profile.userId||role==="ORG_ADMIN"||role==="PROJECT_MANAGER");}
export function canWriteOrganisationRecord(profile:AccessProfile,id:string){const role=organisationRole(profile,id);return profile.platformAdmin||!!role&&role!=="VIEWER";}
