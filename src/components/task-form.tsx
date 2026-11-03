"use client";
import { useState } from "react";
import { Modal,ModalForm } from "@/components/modal";
import { saveTask } from "@/app/(workspace)/my-work/actions";
import { Field } from "@/components/crm-ui";
export type TaskLeadOption={id:string;title:string;organisationId:string};
export type TaskMemberOption={userId:string;name:string;organisationId:string};
export function TaskForm({leads,members,task,organisations=[],userId}:{leads:TaskLeadOption[];members:TaskMemberOption[];organisations?:{id:string;name:string}[];userId?:string;task?:{id:string;leadId:string|null;organisationId?:string|null;title:string;description:string;dueAt:string;priority:string;assigneeId:string}}){
 const [leadId,setLeadId]=useState(task?.leadId??(organisations.length?"":leads[0]?.id??""));const [orgId,setOrgId]=useState(task?.organisationId??organisations[0]?.id??"");const lead=leads.find(l=>l.id===leadId);const available=members.filter(m=>m.organisationId===(lead?.organisationId??orgId)&&(!leadId?m.userId===userId:true));
 return <Modal title={task?"Edit task":"Schedule a task"} description="Give the next step an owner and a due date." trigger={task?"Edit":"Add task"} triggerClassName={task?"text-xs text-neutral-500 hover:text-neutral-900":"ui-button"}><ModalForm action={saveTask} submitLabel={task?"Save task":"Schedule task"}>
 {task&&<><input type="hidden" name="id" value={task.id}/><input type="hidden" name="leadId" value={task.leadId??""}/></>}
 <Field label="Linked opportunity" wide hint="Personal tasks are only visible to you."><select name={task?undefined:"leadId"} disabled={!!task} value={leadId} onChange={e=>setLeadId(e.target.value)}>{organisations.length>0&&<option value="">Personal daily task</option>}{leads.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></Field>
 {!leadId&&<Field label="Organisation" wide><select name="organisationId" value={orgId} required onChange={e=>setOrgId(e.target.value)}>{organisations.map(o=><option value={o.id} key={o.id}>{o.name}</option>)}</select></Field>}
 <Field label="Task" wide><input name="title" required minLength={2} maxLength={200} defaultValue={task?.title} placeholder="e.g. Prepare the proposal for review"/></Field>
 <Field label="Due date (Harare)"><input type="date" name="dueAt" required defaultValue={task?.dueAt??new Date(Date.now()+7200000).toISOString().slice(0,10)}/></Field><Field label="Priority"><select name="priority" defaultValue={task?.priority??"NORMAL"}><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option></select></Field>
 <Field label="Assigned to" wide><select key={`${leadId}-${orgId}`} name="assigneeId" required defaultValue={task?.assigneeId}>{available.map(m=><option value={m.userId} key={m.userId}>{m.name}</option>)}</select></Field><Field label="Notes" wide><textarea name="description" defaultValue={task?.description} maxLength={5000} placeholder="Add the context needed to complete this task."/></Field>
 </ModalForm></Modal>;
}
