import dotenv from "dotenv";
import path from "path";
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { RoomService } from "../src/services/room.service";

const url = process.env.DATABASE_URL ?? "";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const properties = await prisma.property.findMany();
  if (!properties.length) { console.log("No properties found!"); return; }
  
  const prop = properties[0];
  console.log(`Property: ${prop.name} (id=${prop.id})\n`);

  const grid = await RoomService.getAvailabilityGrid(prop.id, "2026-03-01", "2026-03-31");

  let totalBooked = 0;
  for (const row of grid) {
    const bookedDays = row.days.filter((d: { booking?: unknown }) => d.booking);
    const blockedDays = row.days.filter((d: { isBlocked?: boolean; booking?: unknown }) => d.isBlocked && !d.booking);
    totalBooked += bookedDays.length;
    if (bookedDays.length > 0 || blockedDays.length > 0) {
      console.log(`Room ${row.roomNumber} - ${row.roomName}:`);
      for (const d of bookedDays) {
        const b = d.booking;
        console.log(`  ${d.date}  ${b.source.padEnd(12)} ${b.status.padEnd(12)} guest="${b.guestName}" ref=${b.bookingRef}`);
      }
      if (blockedDays.length) {
        console.log(`  BLOCKED: ${blockedDays.map((d: { date: string }) => d.date).join(", ")}`);
      }
    }
  }
  console.log(`\nTotal cells with bookings: ${totalBooked}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
