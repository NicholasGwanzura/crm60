"use client";
import { deleteProject } from "@/app/(workspace)/projects/actions";
import { Modal, ModalForm } from "@/components/modal";
export function DeleteProjectButton({ projectId }: { projectId: string }) {
  return <Modal title="Delete project?" description="The project will be removed from your workspace. Linked leads will be kept." trigger="Delete project" triggerClassName="text-xs text-red-600 hover:text-red-800"><ModalForm action={deleteProject} submitLabel="Delete project"><input type="hidden" name="id" value={projectId}/></ModalForm></Modal>;
}
