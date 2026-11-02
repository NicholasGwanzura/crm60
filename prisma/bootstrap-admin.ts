import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { bootstrapAdmin } from "./admin";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  if (!process.env.BOOTSTRAP_ADMIN_EMAIL || !process.env.BOOTSTRAP_ADMIN_PASSWORD) {
    console.error("Missing configuration. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (and optionally BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_ORG_SLUG).");
    process.exit(1);
  }
  await bootstrapAdmin(db);
}

main().finally(() => db.$disconnect());
