import { LeadDetail } from "@/components/lead-detail";
import { RouteDrawer } from "@/components/route-drawer";
export default async function LeadDrawer({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{tab?:string}>}){const {id}=await params;return <RouteDrawer href={`/leads/${id}`}><LeadDetail id={id} tab={(await searchParams).tab} drawer/></RouteDrawer>;}
