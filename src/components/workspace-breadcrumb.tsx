"use client";
import { usePathname } from "next/navigation";

export function WorkspaceBreadcrumb() {
  const pathname = usePathname();
  const label = pathname.startsWith("/projects") ? "Projects" : "Leads";
  return <div className="flex items-center gap-2 text-sm"><span className="text-neutral-400">Workspace</span><span className="text-neutral-300">/</span><span className="font-medium">{label}</span></div>;
}
