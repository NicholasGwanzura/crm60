import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const stageNames = ["New Lead", "Contacted", "Discovery", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost", "On Hold"];
for (const [slug, name] of [["spiritus", "Spiritus Systems"], ["velocity", "Velocity Africa"]]) {
  const org = await db.organisation.upsert({ where: { slug }, update: {}, create: { slug, name } });
  for (const [position, stageName] of stageNames.entries()) await db.leadStage.upsert({ where: { organisationId_name: { organisationId: org.id, name: stageName } }, update: {}, create: { organisationId: org.id, name: stageName, position } });
}
await db.$disconnect();
