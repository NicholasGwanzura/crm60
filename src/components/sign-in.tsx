"use client";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { createAuthClient } from "better-auth/react";
const client = createAuthClient();
export function SignIn() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  return <form className="space-y-5" onSubmit={async (event) => { event.preventDefault(); setError(""); setLoading(true); try { const form = new FormData(event.currentTarget); const result = await client.signIn.email({ email: String(form.get("email")), password: String(form.get("password")) }); if (result.error) setError("Unable to sign in. Check your details and try again."); else window.location.assign("/leads"); } catch { setError("The sign-in service is unavailable. Please try again."); } finally { setLoading(false); } }}>
    <label className="block space-y-2 text-sm font-medium text-neutral-800"><span>Work email</span><input required type="email" name="email" autoComplete="email" placeholder="you@company.com" className="ui-input" /></label>
    <label className="block space-y-2 text-sm font-medium text-neutral-800"><span>Password</span><span className="relative block"><input required type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" placeholder="Enter your password" className="ui-input pr-11"/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label>
    {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <button disabled={loading} className="ui-button mt-2 w-full">{loading ? "Signing in…" : "Sign in"}<ArrowRight size={16}/></button>
  </form>;
}
