export function money(value: string | number, currency = "USD") {
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value));
}
export function date(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Harare", day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
export function daysInStage(value: Date) { return Math.max(0, Math.floor((Date.now() - value.getTime()) / 86400000)); }
export function stageKind(name: string): "won" | "lost" | "open" {
  return /^won$/i.test(name) ? "won" : /^lost$/i.test(name) ? "lost" : "open";
}
export function decimalUnits(value: string, scale = 2): bigint {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Invalid decimal");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * (10n ** BigInt(scale)) + BigInt(fraction.padEnd(scale, "0"));
}
export function quoteTotals(items: { quantity: string; unitPrice: string }[], taxRate: string) {
  const lines = items.map((item) => (decimalUnits(item.quantity) * decimalUnits(item.unitPrice) + 50n) / 100n);
  const subtotal = lines.reduce((a, b) => a + b, 0n);
  const tax = (subtotal * decimalUnits(taxRate) + 5000n) / 10000n;
  const asDecimal = (n: bigint) => `${n / 100n}.${String(n % 100n).padStart(2, "0")}`;
  return { lines: lines.map(asDecimal), subtotal: asDecimal(subtotal), tax: asDecimal(tax), total: asDecimal(subtotal + tax) };
}
export function trackedTime(entries:{startedAt:Date;stoppedAt:Date|null}[]){return entries.filter(t=>t.stoppedAt).reduce((s,t)=>s+Math.max(0,(t.stoppedAt!.getTime()-t.startedAt.getTime())/1000),0);}
export function timeLabel(seconds:number){if(seconds<60)return `${Math.max(0,Math.floor(seconds))}s`;const minutes=Math.floor(seconds/60);return `${Math.floor(minutes/60)}h ${minutes%60}m`;}
