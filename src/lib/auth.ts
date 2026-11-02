import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12 },
});

export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, suspended: true } });
  return user && !user.suspended ? user : null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/");
  return user;
}
