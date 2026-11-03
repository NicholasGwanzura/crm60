import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { leadScope,canEditLeadRecord,accessProfile } from "@/lib/permissions";
import { PageHeader,EmptyState } from "@/components/crm-ui";
import { QuoteForm } from "@/components/quote-form";
import { QUOTE_LABELS } from "@/lib/quote-input";
import { quoteTotals,money,date } from "@/lib/crm-format";
export default async function Quotes({searchParams}:{searchParams:Promise<{status?:string}>}){
 const user=await requireUser();const status=(await searchParams).status??"";const [scope,profile]=await Promise.all([leadScope(user.id),accessProfile(user.id)]);
 const [all,leads]=await Promise.all([db.quote.findMany({where:{lead:scope},include:{lead:{select:{title:true,companyName:true}},items:{orderBy:{position:"asc"}}},orderBy:{updatedAt:"desc"}}),db.lead.findMany({where:scope,select:{id:true,title:true,currency:true,organisationId:true,ownerId:true},orderBy:{title:"asc"}})]);
 const editable=leads.filter(l=>canEditLeadRecord(profile,l));const quotes=all.filter(q=>!status||q.status===status);
 return <><PageHeader title="Quotes & proposals" description="Draft, approve, and turn proposals into projects." action={editable.length>0?<QuoteForm leads={editable}/>:undefined}/><nav className="mb-6 flex flex-wrap gap-4 border-b text-xs"><Link className={`pb-3 ${!status?"border-b-2 border-neutral-900":"text-neutral-500"}`} href="/quotes">All quotes</Link>{Object.entries(QUOTE_LABELS).map(([key,label])=><Link key={key} className={`pb-3 ${status===key?"border-b-2 border-neutral-900":"text-neutral-500"}`} href={`/quotes?status=${key}`}>{label}</Link>)}</nav>{quotes.length===0?<EmptyState title="No quotes in this view">Create a quote from an editable lead to get started.</EmptyState>:<div className="overflow-x-auto"><table className="crm-table"><thead><tr><th>Quote</th><th>Customer</th><th>Status</th><th>Total</th><th>Valid through</th></tr></thead><tbody>{quotes.map(q=>{const totals=quoteTotals(q.items.map(i=>({quantity:i.quantity.toString(),unitPrice:i.unitPrice.toString()})),q.taxRate.toString());return <tr key={q.id}><td><Link className="font-medium hover:underline" href={`/quotes/${q.id}`}><span className="mr-2 text-xs text-neutral-400">Q-{String(q.number).padStart(4,"0")}</span>{q.title}</Link></td><td>{q.lead.companyName}</td><td><span className="status-tag">{QUOTE_LABELS[q.status]}</span></td><td>{money(totals.total,q.currency)}</td><td>{date(q.validUntil)}</td></tr>;})}</tbody></table></div>}</>;
}
