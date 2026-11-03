import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisationScope, leadScope, canWriteOrganisation } from "@/lib/permissions";
import { CompanyForm } from "@/components/company-forms";
import { PageHeader, EmptyState } from "@/components/crm-ui";
export default async function Companies({searchParams}:{searchParams:Promise<{q?:string}>}){
 const user=await requireUser();const q=((await searchParams).q??"").slice(0,100);const scope=await organisationScope(user.id);const ls=await leadScope(user.id);
 const [companies,organisations]=await Promise.all([db.company.findMany({where:{organisation:scope,...(q?{name:{contains:q,mode:"insensitive" as const}}:{})},include:{organisation:{select:{name:true}},_count:{select:{contacts:true,leads:{where:ls}}}},orderBy:{name:"asc"}}),db.organisation.findMany({where:scope,select:{id:true,name:true},orderBy:{name:"asc"}})]);
 const writable=(await Promise.all(organisations.map(async o=>await canWriteOrganisation(user.id,o.id)?o:null))).filter(o=>o!==null);
 return <><PageHeader title="Companies & contacts" description="People, opportunities, and conversations in one place." action={writable.length>0?<CompanyForm organisations={writable}/>:undefined}/><form className="mb-6 flex max-w-md gap-2"><input name="q" defaultValue={q} placeholder="Search companies" aria-label="Search companies"/><button className="ui-button-secondary">Search</button></form>{companies.length===0?<EmptyState title={q?"No matching companies":"Build your customer directory"}>Add a company, then attach contacts and opportunities.</EmptyState>:<div className="overflow-x-auto"><table className="crm-table"><thead><tr><th>Company</th><th>Industry</th><th>Contacts</th><th>Leads</th><th>Organisation</th></tr></thead><tbody>{companies.map(c=><tr key={c.id}><td><Link href={`/companies/${c.id}`} className="font-medium hover:underline">{c.name}</Link></td><td>{c.industry||"—"}</td><td>{c._count.contacts}</td><td>{c._count.leads}</td><td>{c.organisation.name}</td></tr>)}</tbody></table></div>}</>;
}
