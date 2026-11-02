"use client";
import { Modal, ModalForm } from "@/components/modal";
import { Plus } from "lucide-react";
import { createProject } from "@/app/(workspace)/projects/actions";
import { PROJECT_STATUSES, STATUS_LABELS } from "@/lib/project-status";

export type NewProjectOrg = { id: string; name: string };

export function NewProjectButton({ organisations }: { organisations: NewProjectOrg[] }) {
  return <Modal title="New project" description="Bring related opportunities into one place." trigger={<><Plus size={15}/> New project</>} triggerClassName="ui-button">
        <ModalForm action={createProject} submitLabel="Create project">

          <div className="grid grid-cols-[64px_1fr] gap-3 sm:col-span-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-neutral-700">Icon</span>
              <input name="emoji" maxLength={8} placeholder="🚀" className="text-center" aria-label="Project icon" />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-neutral-700">Name</span>
              <input name="name" required minLength={2} placeholder="Project name" aria-label="Project name" />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-neutral-700">Description</span>
            <textarea name="description" rows={3} placeholder="What is this project about?" aria-label="Description" />
          </label>
          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-neutral-700">Organisation</span>
              <select name="organisationId" aria-label="Organisation">
                {organisations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-neutral-700">Status</span>
              <select name="status" defaultValue="PLANNING" aria-label="Status">
                {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </label>
          </div>
        </ModalForm>
    </Modal>;
}
