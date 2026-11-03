"use client";
import { Modal,ModalForm } from "@/components/modal";
import { Field } from "@/components/crm-ui";
import { Plus } from "lucide-react";
import { createProject } from "@/app/(workspace)/projects/actions";
import { PROJECT_STATUSES,STATUS_LABELS } from "@/lib/project-status";
export type NewProjectOrg={id:string;name:string};
export function NewProjectButton({organisations}:{organisations:NewProjectOrg[]}){return <Modal title="New project" description="A focused space for related opportunities and delivery." trigger={<><Plus size={14}/> New project</>} triggerClassName="ui-button"><ModalForm action={createProject} submitLabel="Create project"><Field label="Project name" wide><input name="name" required minLength={2} maxLength={160} placeholder="e.g. Customer platform rollout"/></Field><Field label="Organisation"><select name="organisationId" required>{organisations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></Field><Field label="Project status"><select name="status" required defaultValue="PLANNING">{PROJECT_STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></Field><Field label="Project icon" hint="Optional emoji or short identifier."><input name="emoji" maxLength={8} placeholder="↗"/></Field><Field label="Description" wide><textarea name="description" maxLength={5000} rows={4} placeholder="Outline the project goal and what success looks like."/></Field></ModalForm></Modal>;}
