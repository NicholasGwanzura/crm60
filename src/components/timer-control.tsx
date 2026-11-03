"use client";
import { useActionState,useEffect,useState } from "react";
import { Play,Square,Timer } from "lucide-react";
import { changeTimer } from "@/app/(workspace)/timers/actions";
export function TimerControl({id,type,seconds=0,startedAt,disabled=false}:{id:string;type:"task"|"issue";seconds?:number;startedAt?:string;disabled?:boolean}){
 const [state,action,pending]=useActionState(changeTimer,{});const [now,setNow]=useState(Date.now());
 useEffect(()=>{setNow(Date.now());if(!startedAt)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[startedAt]);
 const elapsed=Math.max(0,Math.floor(seconds+(startedAt?(now-new Date(startedAt).getTime())/1000:0)));const display=`${String(Math.floor(elapsed/3600)).padStart(2,"0")}:${String(Math.floor(elapsed/60)%60).padStart(2,"0")}:${String(elapsed%60).padStart(2,"0")}`;
 return <div><form action={action} className="flex items-center gap-2"><input name="id" type="hidden" value={id}/><input name="type" type="hidden" value={type}/><input name="operation" type="hidden" value={startedAt?"stop":"start"}/><span className={`flex items-center gap-1.5 text-xs tabular-nums ${startedAt?"text-sky-700":"text-neutral-500"}`} suppressHydrationWarning><Timer size={13}/>{display}</span><button className="ui-button-secondary" disabled={pending||(!startedAt&&disabled)} aria-label={startedAt?"Stop timer":"Start timer"}>{startedAt?<Square size={11}/>:<Play size={11}/>}<span className="text-xs">{startedAt?"Stop":"Start"}</span></button></form>{state.error&&<p role="alert" className="mt-2 text-xs text-red-700">{state.error}</p>}</div>;
}
