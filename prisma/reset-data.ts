import dotenv from "dotenv";
import path from "path";
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const d1 = await prisma.guest.deleteMany();
  const d2 = await prisma.booking.deleteMany();
  const d3 = await prisma.availability.deleteMany();
  const d4 = await prisma.syncLog.deleteMany();
  console.log(`Deleted: ${d1.count} guests, ${d2.count} bookings, ${d3.count} availability, ${d4.count} syncLogs`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
