"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, Layers3, Users, Settings2 } from "lucide-react";
export function WorkspaceNav({ signedIn, isAdmin }: { signedIn: boolean; isAdmin: boolean }) {
  const pathname = usePathname();
  const items = [{ href: "/leads", name: "Leads", icon: Layers3 }, { href: "/projects", name: "Projects", icon: FolderKanban }, ...(signedIn ? [{ href: "/team", name: "Team", icon: Users }] : []), ...(isAdmin ? [{ href: "/settings", name: "Settings", icon: Settings2 }] : [])];
  return <nav aria-label="Main navigation" className="flex gap-1 px-3 pb-3 md:block md:space-y-1">{items.map(({ href, name, icon: Icon }) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined} className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${pathname.startsWith(href) ? "bg-neutral-200/60 text-neutral-950" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"}`}><Icon size={16}/>{name}</Link>)}</nav>;
}
