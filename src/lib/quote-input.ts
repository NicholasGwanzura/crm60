import { z } from "zod";
import { quoteTotals } from "@/lib/crm-format";
export const quoteInput=z.object({
 title:z.string().trim().min(2).max(160),currency:z.string().trim().regex(/^[A-Z]{3}$/),taxRate:z.string().regex(/^\d{1,3}(\.\d{1,2})?$/).refine(v=>Number(v)<=100),notes:z.string().max(5000),validUntil:z.iso.date(),
 items:z.array(z.object({description:z.string().trim().min(1).max(500),quantity:z.string().regex(/^\d{1,7}(\.\d{1,2})?$/).refine(v=>Number(v)>0),unitPrice:z.string().regex(/^\d{1,10}(\.\d{1,2})?$/)})).min(1).max(50),
}).refine(v=>{try{return Number(quoteTotals(v.items,v.taxRate).total)<=999999999999;}catch{return false;}},{message:"Quote total exceeds the supported amount"});
export const QUOTE_LABELS:Record<string,string>={DRAFT:"Draft",SENT:"Awaiting approval",APPROVED:"Approved",REJECTED:"Rejected",CONVERTED:"Converted"};
