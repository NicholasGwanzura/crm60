"use client";
import { useTransition } from "react";
import { deleteProject } from "@/app/(workspace)/projects/actions";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this project? Linked leads are kept.")) return;
        const fd = new FormData();
        fd.set("id", projectId);
        startTransition(() => deleteProject(fd));
      }}
      className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
    >
      {pending ? "Deleting…" : "Delete project"}
    </button>
  );
}
