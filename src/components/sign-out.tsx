"use client";
import { createAuthClient } from "better-auth/react";
export function SignOut() { return <button onClick={async () => { await createAuthClient().signOut(); window.location.assign("/sign-in"); }} className="text-sm text-neutral-500 hover:text-neutral-900">Sign out</button>; }
