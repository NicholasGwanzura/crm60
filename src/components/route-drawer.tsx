"use client";
import { useEffect,useRef } from "react";
import { useRouter } from "next/navigation";
import { X,ArrowUpRight } from "lucide-react";
export function RouteDrawer({children,href}:{children:React.ReactNode;href?:string}){
 const dialog=useRef<HTMLDialogElement>(null);const router=useRouter();
 useEffect(()=>{const element=dialog.current;element?.showModal();const previous=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{element?.close();document.body.style.overflow=previous;};},[]);
 return <dialog ref={dialog} aria-label="Lead details" className="record-drawer" onCancel={e=>{e.preventDefault();router.back();}} onClick={e=>{if(e.target===e.currentTarget)router.back();}}><div className="drawer-toolbar flex items-center justify-between border-b bg-white px-5 py-3"><button onClick={()=>router.back()} aria-label="Close lead details" className="p-1 text-neutral-500 hover:text-neutral-900"><X size={18}/></button>{href?<a href={href} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900">Open full page <ArrowUpRight size={13}/></a>:<span className="text-xs text-neutral-400">Loading opportunity…</span>}</div><div className="p-5 md:p-7">{children}</div></dialog>;
}
