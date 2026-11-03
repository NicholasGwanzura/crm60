import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
export const leadFilterSchema=z.object({q:z.string().max(100).default(""),org:z.string().max(100).default(""),stage:z.string().max(100).default(""),owner:z.string().max(200).default(""),mode:z.enum(["all","mine","stale"]).default("all"),view:z.enum(["board","list"]).default("board"),closed:z.enum(["hide","show"]).default("hide")});
export type LeadFilters=z.infer<typeof leadFilterSchema>;
export function parseLeadFilters(params:Record<string,unknown>):LeadFilters{return leadFilterSchema.parse({q:typeof params.q==="string"?params.q.slice(0,100):"",org:typeof params.org==="string"?params.org.slice(0,100):"",stage:typeof params.stage==="string"?params.stage.slice(0,100):"",owner:typeof params.owner==="string"?params.owner.slice(0,200):"",mode:["mine","stale"].includes(String(params.mode))?params.mode:"all",view:params.view==="list"?"list":"board",closed:params.closed==="show"?"show":"hide"});}
export function leadFilterWhere(filters:LeadFilters,userId:string,now=new Date()):Prisma.LeadWhereInput[]{
 return [filters.org?{organisationId:filters.org}:{},filters.stage?{stageId:filters.stage}:{},filters.owner?{ownerId:filters.owner}:{},filters.mode==="mine"?{ownerId:userId}:{},filters.mode==="stale"?{updatedAt:{lte:new Date(now.getTime()-14*86400000)},stage:{name:{notIn:["Won","Lost"]}}}:{},filters.closed==="hide"?{stage:{name:{notIn:["Won","Lost"]}}}:{},filters.q?{OR:[{title:{contains:filters.q,mode:"insensitive"}},{companyName:{contains:filters.q,mode:"insensitive"}}]}:{}];
}
export function filtersHref(filters:LeadFilters){const p=new URLSearchParams();for(const [key,value] of Object.entries(filters))if(value)p.set(key,value);return `/leads?${p}`;}
