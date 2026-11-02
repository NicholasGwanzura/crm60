"use client";

import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { unstable_rethrow } from "next/navigation";
import { X } from "lucide-react";

const CloseModal = createContext<() => void>(() => {});

export function Modal({ title, description, trigger, children, triggerClassName = "ui-button-secondary" }: {
  title: string; description?: string; trigger: React.ReactNode; children: React.ReactNode; triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  return <>
    <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>{trigger}</button>
    {open && <dialog ref={dialog} aria-labelledby={id} aria-describedby={description ? `${id}-description` : undefined} onClose={() => setOpen(false)} onClick={(e) => { if (e.target === e.currentTarget) dialog.current?.close(); }} className="workspace-dialog">
      <CloseModal.Provider value={() => dialog.current?.close()}>
        <div className="border-b px-6 py-5"><div className="flex items-center justify-between gap-4"><h2 id={id} className="text-base font-semibold tracking-tight">{title}</h2><button type="button" onClick={() => dialog.current?.close()} aria-label={`Close ${title}`} className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800"><X size={18}/></button></div>{description && <p id={`${id}-description`} className="mt-1 text-sm text-neutral-500">{description}</p>}</div>
        <div className="p-6">{children}</div>
      </CloseModal.Provider>
    </dialog>}
  </>;
}

function FormFields({ children, submitLabel }: { children: React.ReactNode; submitLabel: string }) {
  const { pending } = useFormStatus();
  const close = useContext(CloseModal);
  return <fieldset disabled={pending} className="min-w-0 space-y-5"><div className="grid gap-4 sm:grid-cols-2">{children}</div><div className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={close} className="ui-button-secondary">Cancel</button><button type="submit" className="ui-button" disabled={pending}>{pending ? "Saving…" : submitLabel}</button></div></fieldset>;
}

export function ModalForm({ action, children, submitLabel = "Save changes" }: { action: (data: FormData) => Promise<void>; children: React.ReactNode; submitLabel?: string }) {
  const close = useContext(CloseModal);
  const [error, setError] = useState("");
  return <form action={async (data) => { setError(""); try { await action(data); close(); } catch (error) { unstable_rethrow(error); setError("Could not save. Check the fields and your access, then try again."); } }}>
    {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <FormFields submitLabel={submitLabel}>{children}</FormFields>
  </form>;
}
