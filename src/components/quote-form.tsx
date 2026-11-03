"use client";
import { useState } from "react";
import { Modal, ModalForm } from "@/components/modal";
import { Field } from "@/components/crm-ui";
import { saveQuote } from "@/app/(workspace)/quotes/actions";
import { quoteTotals, money } from "@/lib/crm-format";
type Item={description:string;quantity:string;unitPrice:string};
export function QuoteForm({leads,quote}:{leads:{id:string;title:string;currency:string}[];quote?:{id:string;leadId:string;title:string;currency:string;taxRate:string;notes:string;validUntil:string;items:Item[]}}){
 const [items,setItems]=useState<Item[]>(quote?.items??[{description:"",quantity:"1",unitPrice:"0"}]);const [currency,setCurrency]=useState(quote?.currency??leads[0]?.currency??"USD");const [tax,setTax]=useState(quote?.taxRate??"0");
 let total="—";try{if(/^[A-Z]{3}$/.test(currency))total=money(quoteTotals(items,tax).total,currency);}catch{}
 function itemField(index:number,key:keyof Item,value:string){setItems(items.map((item,i)=>i===index?{...item,[key]:value}:item));}
 return <Modal title={quote?"Edit quote":"New quote"} trigger={quote?"Edit quote":"Create quote"} triggerClassName={quote?"ui-button-secondary":"ui-button"}><ModalForm action={saveQuote} submitLabel={quote?"Save draft":"Create draft"}>
 {quote?<><input type="hidden" name="id" value={quote.id}/><input type="hidden" name="leadId" value={quote.leadId}/></>:<Field label="Lead" wide><select name="leadId" required onChange={e=>setCurrency(leads.find(l=>l.id===e.target.value)?.currency??"USD")}>{leads.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></Field>}
 <Field label="Quote title" wide><input name="title" required minLength={2} maxLength={160} defaultValue={quote?.title}/></Field>
 <Field label="Currency"><input name="currency" value={currency} onChange={e=>setCurrency(e.target.value.toUpperCase())} required pattern="[A-Z]{3}" maxLength={3}/></Field><Field label="Valid through (Harare)"><input type="date" name="validUntil" required defaultValue={quote?.validUntil}/></Field>
 <input type="hidden" name="items" value={JSON.stringify(items)}/>
 <div className="space-y-4 sm:col-span-2"><div className="flex items-center justify-between"><h3 className="text-sm font-medium">Line items</h3><span className="text-xs text-neutral-400">{items.length} / 50</span></div>{items.map((item,i)=><div className="border p-3" key={i}><label className="grid gap-1 text-xs text-neutral-500">Description<input aria-label={`Item ${i+1} description`} required maxLength={500} value={item.description} onChange={e=>itemField(i,"description",e.target.value)}/></label><div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-3"><label className="grid gap-1 text-xs text-neutral-500">Quantity<input aria-label={`Item ${i+1} quantity`} type="number" min="0.01" max="9999999.99" step="0.01" required value={item.quantity} onChange={e=>itemField(i,"quantity",e.target.value)}/></label><label className="grid gap-1 text-xs text-neutral-500">Unit price<input aria-label={`Item ${i+1} unit price`} type="number" min="0" max="9999999999.99" step="0.01" required value={item.unitPrice} onChange={e=>itemField(i,"unitPrice",e.target.value)}/></label><button type="button" className="ui-button-secondary" aria-label={`Remove item ${i+1}`} disabled={items.length===1} onClick={()=>setItems(items.filter((_,n)=>n!==i))}>×</button></div></div>)}<button type="button" className="ui-button-secondary" disabled={items.length>=50} onClick={()=>setItems([...items,{description:"",quantity:"1",unitPrice:"0"}])}>Add line item</button></div>
 <Field label="Tax (%)"><input name="taxRate" type="number" min="0" max="100" step="0.01" value={tax} onChange={e=>setTax(e.target.value)} required/></Field><div className="self-end pb-2 text-right text-sm font-medium">Total: {total}</div><Field label="Terms / notes" wide><textarea name="notes" maxLength={5000} defaultValue={quote?.notes}/></Field>
 </ModalForm></Modal>;
}
