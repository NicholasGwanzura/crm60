"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { moveLeadStage, changeLeadStage } from "@/app/(workspace)/leads/actions";

export type PipelineLead = {
  id: string;
  title: string;
  companyName: string;
  value: string | null;
  owner: string;
  editable: boolean;
  stageId: string;
};
export type PipelineStage = { id: string; name: string };
export type PipelineBoard = { organisationId: string; organisationName: string; stages: PipelineStage[]; leads: PipelineLead[] };

export function LeadPipeline({ boards }: { boards: PipelineBoard[] }) {
  return <div className="space-y-8">{boards.map((board) => <Board key={board.organisationId} board={board} />)}</div>;
}

function Board({ board }: { board: PipelineBoard }) {
  const [isPending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const drop = (stageId: string) => (event: React.DragEvent) => {
    event.preventDefault();
    const leadId = event.dataTransfer.getData("text/plain");
    setDraggingId(null);
    if (!leadId) return;
    const lead = board.leads.find((l) => l.id === leadId);
    if (!lead || !lead.editable || lead.stageId === stageId) return;
    setError("");
    startTransition(async () => {
      try { await moveLeadStage(leadId, stageId); }
      catch { setError("Could not move the lead. It may no longer be editable."); }
    });
  };

  return (
    <section className="ui-card p-4 md:p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-neutral-900">{board.organisationName}</h2>
        <span className="text-xs text-neutral-500">{board.leads.length} leads</span>
      </div>
      {error && <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {board.stages.map((stage) => {
          const leads = board.leads.filter((l) => l.stageId === stage.id);
          return (
            <div key={stage.id} onDragOver={(e) => e.preventDefault()} onDrop={drop(stage.id)} className="w-60 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50/60">
              <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2.5">
                <span className="text-sm font-medium text-neutral-800">{stage.name}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-neutral-500">{leads.length}</span>
              </div>
              <div className="space-y-2 p-2">
                {leads.map((lead) => (
                  <div key={lead.id} className={`rounded-md border border-neutral-200 bg-white shadow-xs transition-opacity ${draggingId === lead.id ? "opacity-40" : ""} ${isPending ? "opacity-60" : ""}`}>
                    <Link
                      href={`/leads/${lead.id}`}
                      draggable={lead.editable}
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", lead.id); e.dataTransfer.effectAllowed = "move"; setDraggingId(lead.id); }}
                      onDragEnd={() => setDraggingId(null)}
                      className={`block p-3 pb-1 hover:bg-neutral-50 ${lead.editable ? "cursor-grab" : "cursor-pointer"}`}
                    >
                      <p className="text-sm font-medium text-neutral-900">{lead.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">{lead.companyName}</p>
                    </Link>
                    <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-1.5">
                      {lead.value ? <span className="text-xs font-medium text-neutral-700">${lead.value}</span> : <span className="text-xs text-neutral-400">{lead.owner}</span>}
                      {lead.editable ? <form action={changeLeadStage} className="shrink-0"><input type="hidden" name="id" value={lead.id} /><select name="stageId" defaultValue={lead.stageId} onChange={(e) => e.currentTarget.form?.requestSubmit()} aria-label={`Move ${lead.title}`} className="rounded border border-neutral-200 bg-white px-1.5 py-1 text-xs text-neutral-700 outline-none hover:border-neutral-300">{board.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></form> : <span className="text-xs text-neutral-400">{lead.owner}</span>}
                    </div>
                  </div>
                ))}
                {!leads.length && <p className="rounded-md border border-dashed border-neutral-200 px-3 py-6 text-center text-xs text-neutral-400">Drop leads here</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
