import { LeadDetail } from "@/components/lead-detail";
export default async function LeadPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{tab?:string}>}){return <LeadDetail id={(await params).id} tab={(await searchParams).tab}/>;}
