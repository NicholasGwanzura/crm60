"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createProject } from "@/app/(workspace)/projects/actions";
import { PROJECT_STATUSES, STATUS_LABELS } from "@/lib/project-status";

export type NewProjectOrg = { id: string; name: string };

export function NewProjectButton({ organisations }: { organisations: NewProjectOrg[] }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-violet-600 px-3.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-violet-700"><Plus size={16} /> New project</button>;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-900/30 p-4 pt-[10vh]" onClick={() => setOpen(false)}>
      <div className="ui-card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">New project</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-neutral-400 hover:text-neutral-700"><X size={18} /></button>
        </div>
        <form action={createProject} className="grid gap-4">
          <div className="grid grid-cols-[64px_1fr] gap-3">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-neutral-700">Icon</span>
              <input name="emoji" maxLength={8} placeholder="🚀" className="text-center" aria-label="Project icon" />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-neutral-700">Name</span>
              <input name="name" required minLength={2} placeholder="Project name" aria-label="Project name" />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-neutral-700">Description</span>
            <textarea name="description" rows={3} placeholder="What is this project about?" aria-label="Description" />
          </label>
          <div className="grid grid-cols-2 gap-3">
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
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="ui-button-secondary">Cancel</button>
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700">Create project</button>
          </div>
        </form>
      </div>
    </div>
  );
}
