import {afterAll,beforeAll,describe,expect,it,vi} from "vitest";
import {randomUUID} from "node:crypto";
import {hashPassword} from "better-auth/crypto";
const auth=vi.hoisted(()=>({id:"",name:"Test"}));
vi.mock("@/lib/auth",()=>({requireUser:async()=>({...auth}),currentUser:async()=>({...auth})}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:(path:string)=>{throw new Error(`REDIRECT:${path}`);}}));
import {db} from "@/lib/db";
import {saveCompany,saveContact} from "@/app/(workspace)/companies/actions";
import {createLead,changeLeadStage,updateLead} from "@/app/(workspace)/leads/actions";
import {saveTask,toggleTask} from "@/app/(workspace)/my-work/actions";
import {saveQuote,changeQuoteStatus,convertQuote} from "@/app/(workspace)/quotes/actions";
import {saveLeadView,deleteLeadView,bulkUpdateLeads} from "@/app/(workspace)/leads/view-actions";
import {saveIssue,changeIssueStatus} from "@/app/(workspace)/issues/actions";
import {changeTimer} from "@/app/(workspace)/timers/actions";
import {canEditLead,leadScope,taskScope} from "@/lib/permissions";
function form(data:Record<string,string>){const f=new FormData();for(const [k,v]of Object.entries(data))f.set(k,v);return f;}
async function follow(action:()=>Promise<void>){try{await action();}catch(e){if(e instanceof Error&&e.message.startsWith("REDIRECT:"))return;throw e;}}
describe.runIf(process.env.CRM_INTEGRATION==="1")("isolated CRM workflows",()=>{
 const admin=randomUUID(),rep=randomUUID(),viewer=randomUUID(),other=randomUUID();let org="",otherOrg="",newStage="",wonStage="",leadId="";
 beforeAll(async()=>{
  if(!new URL(process.env.DATABASE_URL!).pathname.startsWith("/crm60_verify_"))throw new Error("Integration checks require a disposable crm60_verify_ database");
  await db.user.createMany({data:[{id:admin,name:"Review Admin",email:"ui-review@example.invalid",emailVerified:true},{id:rep,name:"Sales Person",email:"rep@example.invalid",emailVerified:true},{id:viewer,name:"Read Only",email:"viewer@example.invalid",emailVerified:true},{id:other,name:"Other Team",email:"other@example.invalid",emailVerified:true}]});
  await db.account.create({data:{id:randomUUID(),userId:admin,accountId:admin,providerId:"credential",password:await hashPassword("Local-Review-Only-9284!")}});
  const primary=await db.organisation.create({data:{name:"Review Workspace",slug:"review-workspace"}});org=primary.id;otherOrg=(await db.organisation.create({data:{name:"Other Workspace",slug:"other-workspace"}})).id;
  await db.organisationMembership.createMany({data:[{userId:admin,organisationId:org,role:"PLATFORM_ADMIN"},{userId:rep,organisationId:org,role:"SALES_REP"},{userId:viewer,organisationId:org,role:"VIEWER"},{userId:other,organisationId:otherOrg,role:"SALES_REP"}]});
  newStage=(await db.leadStage.create({data:{organisationId:org,name:"New Lead",position:0}})).id;wonStage=(await db.leadStage.create({data:{organisationId:org,name:"Won",position:1}})).id;await db.leadStage.createMany({data:[{organisationId:org,name:"Qualified",position:2},{organisationId:org,name:"Negotiation",position:3},{organisationId:org,name:"Lost",position:4}]});
  auth.id=admin;
 },30000);
 afterAll(async()=>{await db.$disconnect();},30000);
 it("creates a company/contact, scoped lead, tasks, approval, project, issue and timer",async()=>{
  await follow(()=>saveCompany(form({organisationId:org,name:"Acme Systems",website:"https://example.com",industry:"Technology",description:"A customer profile for review."})));
  const company=await db.company.findFirstOrThrow({where:{name:"Acme Systems"}});
  await saveContact(form({companyId:company.id,name:"Customer Contact",jobTitle:"Operations lead",email:"contact@example.invalid",phone:"+263000000"}));expect(await db.contact.count({where:{companyId:company.id}})).toBe(1);
  auth.id=rep;await follow(()=>createLead(form({organisationId:org,stageId:newStage,title:"Customer platform rollout",companyName:company.name,companyId:company.id,email:"contact@example.invalid",description:"Deploy a unified customer portal with a clear onboarding process."})));
  const lead=await db.lead.findFirstOrThrow({where:{title:"Customer platform rollout"}});leadId=lead.id;expect(lead.companyId).toBe(company.id);
  await updateLead(form({id:leadId,title:lead.title,companyName:company.name,email:"contact@example.invalid",phone:"",country:"Zimbabwe",currency:"USD",description:lead.description!,estimatedValue:"5000.50",expectedCloseAt:"2026-12-15"}));
  auth.id=viewer;expect(await canEditLead(viewer,leadId)).toBe(false);await expect(changeLeadStage(form({id:leadId,stageId:wonStage}))).rejects.toThrow();
  auth.id=other;expect(await db.lead.count({where:{AND:[{id:leadId},await leadScope(other)]}})).toBe(0);await expect(saveContact(form({companyId:company.id,name:"Intruder",jobTitle:"",email:"",phone:""}))).rejects.toThrow();
  auth.id=rep;await saveTask(form({leadId,title:"Discuss the implementation plan",description:"Confirm scope and next steps.",dueAt:"2026-12-01",priority:"HIGH",assigneeId:rep}));
  const task=await db.task.findFirstOrThrow({where:{leadId}});expect(task.organisationId).toBe(org);
  expect(await changeTimer({},form({operation:"start",type:"task",id:task.id}))).toEqual({});expect((await changeTimer({},form({operation:"start",type:"task",id:task.id}))).error).toBeTruthy();
  await db.timeEntry.updateMany({where:{taskId:task.id},data:{startedAt:new Date(Date.now()-65000)}});await toggleTask(form({id:task.id,complete:"true"}));expect(await db.timeEntry.count({where:{taskId:task.id,stoppedAt:null}})).toBe(0);
  await saveTask(form({leadId:"",organisationId:org,title:"Plan the day",description:"Daily priorities",dueAt:"2026-12-01",priority:"NORMAL",assigneeId:rep}));const personal=await db.task.findFirstOrThrow({where:{leadId:null,assigneeId:rep}});expect(await db.task.count({where:{AND:[{id:personal.id},await taskScope(other)]}})).toBe(0);
  const quoteFields={leadId,title:"Customer platform implementation",currency:"USD",taxRate:"15",notes:"Payment due within 30 days.",validUntil:"2099-12-31",items:JSON.stringify([{description:"Implementation",quantity:"1",unitPrice:"4500"},{description:"Support",quantity:"2",unitPrice:"250"}])};
  await follow(()=>saveQuote(form(quoteFields)));const quote=await db.quote.findFirstOrThrow({where:{leadId}});await changeQuoteStatus(form({id:quote.id,status:"SENT"}));await expect(changeQuoteStatus(form({id:quote.id,status:"APPROVED"}))).rejects.toThrow();auth.id=admin;await changeQuoteStatus(form({id:quote.id,status:"APPROVED"}));
  await follow(()=>convertQuote(form({id:quote.id})));expect(await db.project.count({where:{name:quote.title}})).toBe(1);await expect(convertQuote(form({id:quote.id}))).rejects.toThrow();const project=await db.project.findFirstOrThrow({where:{name:quote.title}});
  await follow(()=>saveIssue(form({projectId:project.id,title:"Account permissions need review",description:"A customer cannot access the reporting screen. Check the assigned access level.",priority:"HIGH",assigneeId:rep})));const issue=await db.issue.findFirstOrThrow({where:{projectId:project.id}});
  auth.id=other;expect((await changeTimer({},form({operation:"start",type:"issue",id:issue.id}))).error).toBeTruthy();auth.id=rep;expect(await changeTimer({},form({operation:"start",type:"issue",id:issue.id}))).toEqual({});await expect(changeIssueStatus(form({id:issue.id,status:"RESOLVED",resolution:""}))).rejects.toThrow();await changeIssueStatus(form({id:issue.id,status:"RESOLVED",resolution:"Updated the role mapping and verified reporting access."}));expect(await db.timeEntry.count({where:{issueId:issue.id,stoppedAt:null}})).toBe(0);expect((await db.issue.findUniqueOrThrow({where:{id:issue.id}})).resolution).toContain("role mapping");
  await saveLeadView(form({name:"My opportunities",filters:JSON.stringify({q:"",org:"",stage:"",owner:"",mode:"mine",view:"list",closed:"hide"})}));const view=await db.savedView.findFirstOrThrow({where:{userId:rep}});auth.id=other;await deleteLeadView(form({id:view.id}));expect(await db.savedView.count({where:{id:view.id}})).toBe(1);
  const f=form({operation:"stage",target:wonStage});f.append("ids",leadId);expect((await bulkUpdateLeads({},f)).error).toBeTruthy();auth.id=rep;expect((await bulkUpdateLeads({},f)).success).toContain("Updated 1");expect((await db.lead.findUniqueOrThrow({where:{id:leadId}})).stageId).toBe(wonStage);
  // Leave a populated open opportunity and project for visual checks in this disposable database.
  await changeLeadStage(form({id:leadId,stageId:newStage}));await toggleTask(form({id:task.id,complete:"false"}));
 },180000);
});
