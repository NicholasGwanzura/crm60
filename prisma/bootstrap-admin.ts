import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Administrator";
  const orgSlug = process.env.BOOTSTRAP_ADMIN_ORG_SLUG?.trim() || "spiritus";

  if (!email || !password) {
    console.error("Missing configuration. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (and optionally BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_ORG_SLUG).");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  const organisation = await db.organisation.findUnique({ where: { slug: orgSlug } });
  if (!organisation) {
    console.error(`Organisation with slug "${orgSlug}" was not found. Run "npm run db:seed" first.`);
    process.exit(1);
  }

  const user = await db.user.upsert({ where: { email }, update: { name, emailVerified: true }, create: { email, name, emailVerified: true } });
  const credential = await db.account.findFirst({ where: { userId: user.id, providerId: "credential" } });
  if (credential) {
    await db.account.update({ where: { id: credential.id }, data: { password: await hashPassword(password) } });
  } else {
    await db.account.create({ data: { id: randomUUID(), accountId: user.id, providerId: "credential", userId: user.id, password: await hashPassword(password) } });
  }
  await db.organisationMembership.upsert({
    where: { userId_organisationId: { userId: user.id, organisationId: organisation.id } },
    update: { role: "PLATFORM_ADMIN" },
    create: { userId: user.id, organisationId: organisation.id, role: "PLATFORM_ADMIN" },
  });
  console.log(`Admin ready: ${email} (${name}) in ${organisation.name}`);
}

main().finally(() => db.$disconnect());
