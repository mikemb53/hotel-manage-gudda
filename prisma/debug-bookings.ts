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
  const bookings = await prisma.booking.findMany({
    include: { room: true, guest: true },
    orderBy: { checkIn: "asc" },
  });

  console.log(`\nTotal bookings: ${bookings.length}\n`);
  for (const b of bookings) {
    const ci = b.checkIn.toISOString();
    const co = b.checkOut.toISOString();
    const ciLocal = b.checkIn.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
    const coLocal = b.checkOut.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
    console.log(`${b.room.roomNumber} | ${b.status.padEnd(12)} | ${b.source.padEnd(12)} | checkIn: ${ci} (IST: ${ciLocal}) | checkOut: ${co} (IST: ${coLocal})`);
  }

  // Simulate what the calendar API does for March 2026
  const from = "2026-03-01";
  const to   = "2026-03-31";
  const inRange = await prisma.booking.findMany({
    where: {
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      checkIn:  { lte: new Date(to) },
      checkOut: { gte: new Date(from) },
    },
  });
  console.log(`\nBookings matching March 2026 calendar query: ${inRange.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
