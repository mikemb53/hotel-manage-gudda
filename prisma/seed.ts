import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Load .env then override with .env.local (if present — local dev mode)
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const isSQLite = (process.env.DATABASE_URL ?? "").startsWith("file:");
// SQLite stores arrays as JSON strings; PostgreSQL uses native arrays
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function arr<T>(values: T[]): any { return isSQLite ? JSON.stringify(values) : values; }

function createClient() {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("file:")) {
    const adapter = new PrismaBetterSqlite3({ url });
    return new PrismaClient({ adapter });
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

const prisma = createClient();

// ─── helpers ────────────────────────────────────────────────────────────────

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function ref() {
  return "BK" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding database...\n");

  // ── 1. Admin user ──────────────────────────────────────────────────────────
  const adminEmail = "admin@hotel.com";
  const adminPassword = "Admin@123";

  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (admin) {
    console.log(`ℹ️   Admin already exists (${adminEmail})`);
  } else {
    admin = await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: "ADMIN",
      },
    });
    console.log(`✅  Admin created: ${adminEmail} / ${adminPassword}`);
  }

  // ── 2. Property ────────────────────────────────────────────────────────────
  let property = await prisma.property.findFirst({ where: { ownerId: admin.id } });
  if (property) {
    console.log(`ℹ️   Property already exists (${property.name})`);
  } else {
    property = await prisma.property.create({
      data: {
        name: "The Grand Marigold Hotel",
        address: "42 Marine Drive",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        postalCode: "400001",
        phone: "+91-22-1234-5678",
        email: "reservations@grandmarigold.in",
        website: "https://grandmarigold.in",
        description:
          "A heritage boutique hotel on Mumbai's iconic Marine Drive with stunning sea views.",
        timezone: "Asia/Kolkata",
        currency: "INR",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        ownerId: admin.id,
      },
    });
    console.log(`✅  Property created: ${property.name}`);
  }

  // ── 3. Room types ──────────────────────────────────────────────────────────
  const roomTypeData = [
    {
      name: "Standard Room",
      description: "Cozy room with city view, queen bed, and modern amenities.",
      maxAdults: 2,
      maxChildren: 1,
      amenities: arr(["WiFi", "AC", "TV", "Mini Fridge"]),
    },
    {
      name: "Deluxe Sea View",
      description: "Spacious room with panoramic Arabian Sea view and king bed.",
      maxAdults: 2,
      maxChildren: 2,
      amenities: arr(["WiFi", "AC", "TV", "Mini Bar", "Sea View", "Bathtub"]),
    },
    {
      name: "Suite",
      description: "Luxury suite with separate living area and private balcony.",
      maxAdults: 3,
      maxChildren: 2,
      amenities: arr(["WiFi", "AC", "Smart TV", "Bar", "Balcony", "Jacuzzi", "Butler Service"]),
    },
  ];

  const roomTypes: { id: string; name: string }[] = [];
  for (const rt of roomTypeData) {
    let found = await prisma.roomType.findFirst({ where: { name: rt.name } });
    if (!found) found = await prisma.roomType.create({ data: rt });
    roomTypes.push(found);
  }
  console.log(`✅  ${roomTypes.length} room types ready`);

  // ── 4. Rooms ───────────────────────────────────────────────────────────────
  const roomDefs = [
    { name: "Room 101", roomNumber: "101", floorNumber: 1, basePrice: 3500, typeIdx: 0 },
    { name: "Room 102", roomNumber: "102", floorNumber: 1, basePrice: 3500, typeIdx: 0 },
    { name: "Room 103", roomNumber: "103", floorNumber: 1, basePrice: 3800, typeIdx: 0 },
    { name: "Room 201", roomNumber: "201", floorNumber: 2, basePrice: 5500, typeIdx: 1 },
    { name: "Room 202", roomNumber: "202", floorNumber: 2, basePrice: 5500, typeIdx: 1 },
    { name: "Room 203", roomNumber: "203", floorNumber: 2, basePrice: 5800, typeIdx: 1 },
    { name: "Suite 301", roomNumber: "301", floorNumber: 3, basePrice: 9500, typeIdx: 2 },
    { name: "Suite 302", roomNumber: "302", floorNumber: 3, basePrice: 12000, typeIdx: 2 },
  ];

  const rooms: { id: string; name: string }[] = [];
  for (const rd of roomDefs) {
    let room = await prisma.room.findFirst({
      where: { propertyId: property.id, roomNumber: rd.roomNumber },
    });
    if (!room) {
      room = await prisma.room.create({
        data: {
          name: rd.name,
          roomNumber: rd.roomNumber,
          floorNumber: rd.floorNumber,
          basePrice: rd.basePrice,
          status: "AVAILABLE",
          propertyId: property.id,
          roomTypeId: roomTypes[rd.typeIdx].id,
        },
      });
    }
    rooms.push(room);
  }
  console.log(`✅  ${rooms.length} rooms ready`);

  // ── 5. Rate plans ──────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const room of rooms) {
    const existing = await prisma.ratePlan.findFirst({ where: { roomId: room.id } });
    if (!existing) {
      await prisma.ratePlan.createMany({
        data: [
          {
            name: "Standard Rate",
            type: "STANDARD",
            price: 0, // uses room basePrice
            daysOfWeek: arr([0, 1, 2, 3, 4, 5, 6]),
            minStay: 1,
            isActive: true,
            roomId: room.id,
          },
          {
            name: "Weekend Premium",
            type: "WEEKEND",
            price: 500,
            daysOfWeek: arr([5, 6]),
            minStay: 2,
            isActive: true,
            roomId: room.id,
          },
        ],
      });
    }
  }
  console.log(`✅  Rate plans ready`);

  // ── 6. Channels ────────────────────────────────────────────────────────────
  const channelDefs = [
    {
      name: "Airbnb",
      type: "AIRBNB",
      isActive: true,
      syncStatus: "SUCCESS",
      lastSyncAt: addDays(today, -1),
      icalUrl: `http://localhost:3000/api/ical/demo`,
    },
    {
      name: "Booking.com",
      type: "BOOKING_COM",
      isActive: true,
      syncStatus: "SUCCESS",
      lastSyncAt: addDays(today, -1),
      icalUrl: null,
    },
    {
      name: "MakeMyTrip",
      type: "MAKEMYTRIP",
      isActive: true,
      syncStatus: "SUCCESS",
      lastSyncAt: today,
      icalUrl: null,
    },
    {
      name: "Direct Booking",
      type: "DIRECT",
      isActive: true,
      syncStatus: "SUCCESS",
      lastSyncAt: today,
      icalUrl: null,
    },
    {
      name: "Goibibo",
      type: "GOIBIBO",
      isActive: false,
      syncStatus: "IDLE",
      lastSyncAt: null,
      icalUrl: null,
    },
  ];

  const channels: { id: string; name: string }[] = [];
  for (const cd of channelDefs) {
    let ch = await prisma.channel.findFirst({
      where: { propertyId: property.id, type: cd.type },
    });
    if (!ch) {
      ch = await prisma.channel.create({
        data: {
          name: cd.name,
          type: cd.type,
          isActive: cd.isActive,
          syncStatus: cd.syncStatus,
          lastSyncAt: cd.lastSyncAt,
          icalUrl: cd.icalUrl,
          propertyId: property.id,
        },
      });
    } else {
      // Update lastSyncAt and icalUrl even if channel already exists
      ch = await prisma.channel.update({
        where: { id: ch.id },
        data: {
          lastSyncAt: cd.lastSyncAt,
          syncStatus: cd.syncStatus,
          icalUrl: cd.icalUrl ?? ch.icalUrl,
        },
      });
    }
    channels.push(ch);
  }
  console.log(`✅  ${channels.length} channels ready`);

  // ── 7. Bookings + Guests ─────────────────────────────────────────────────
  const existingBookings = await prisma.booking.count({ where: { room: { propertyId: property.id } } });
  if (existingBookings > 0) {
    console.log(`ℹ️   Bookings already seeded (${existingBookings} found)`);
  } else {
    const guestPool = [
      { firstName: "Arjun", lastName: "Sharma", email: "arjun.sharma@email.com", phone: "+91-98100-11111", country: "India" },
      { firstName: "Priya", lastName: "Patel", email: "priya.patel@email.com", phone: "+91-98200-22222", country: "India" },
      { firstName: "Rahul", lastName: "Mehta", email: "rahul.mehta@email.com", phone: "+91-98300-33333", country: "India" },
      { firstName: "Sarah", lastName: "Johnson", email: "sarah.j@email.com", phone: "+1-555-0101", country: "USA" },
      { firstName: "David", lastName: "Chen", email: "d.chen@email.com", phone: "+86-138-0000-1111", country: "China" },
      { firstName: "Emma", lastName: "Wilson", email: "emma.w@email.com", phone: "+44-7911-123456", country: "UK" },
      { firstName: "Vikram", lastName: "Singh", email: "vikram.s@email.com", phone: "+91-97400-44444", country: "India" },
      { firstName: "Ananya", lastName: "Rao", email: "ananya.r@email.com", phone: "+91-96500-55555", country: "India" },
    ];

    type BookingDef = {
      roomIdx: number;
      checkInOffset: number; // days from today
      nights: number;
      adults: number;
      children: number;
      status: string;
      source: string;
      channelIdx: number;
      guestIdx: number;
      commissionRate: number;
    };

    const bookingDefs: BookingDef[] = [
      // Past bookings (completed/checked-out)
      { roomIdx: 0, checkInOffset: -20, nights: 3, adults: 2, children: 0, status: "CHECKED_OUT", source: "AIRBNB",       channelIdx: 0, guestIdx: 0, commissionRate: 14 },
      { roomIdx: 1, checkInOffset: -15, nights: 2, adults: 1, children: 0, status: "CHECKED_OUT", source: "BOOKING_COM",  channelIdx: 1, guestIdx: 1, commissionRate: 18 },
      { roomIdx: 3, checkInOffset: -12, nights: 4, adults: 2, children: 1, status: "CHECKED_OUT", source: "MAKEMYTRIP",   channelIdx: 2, guestIdx: 2, commissionRate: 12 },
      { roomIdx: 4, checkInOffset: -10, nights: 2, adults: 2, children: 0, status: "CHECKED_OUT", source: "DIRECT",       channelIdx: 3, guestIdx: 3, commissionRate: 0  },
      { roomIdx: 6, checkInOffset: -8,  nights: 3, adults: 2, children: 0, status: "CHECKED_OUT", source: "AIRBNB",       channelIdx: 0, guestIdx: 4, commissionRate: 14 },
      { roomIdx: 2, checkInOffset: -5,  nights: 1, adults: 1, children: 0, status: "CHECKED_OUT", source: "BOOKING_COM",  channelIdx: 1, guestIdx: 5, commissionRate: 18 },
      { roomIdx: 5, checkInOffset: -7,  nights: 5, adults: 2, children: 2, status: "CHECKED_OUT", source: "MAKEMYTRIP",   channelIdx: 2, guestIdx: 6, commissionRate: 12 },
      { roomIdx: 7, checkInOffset: -14, nights: 2, adults: 3, children: 0, status: "CHECKED_OUT", source: "DIRECT",       channelIdx: 3, guestIdx: 7, commissionRate: 0  },

      // Active bookings (checked-in)
      { roomIdx: 0, checkInOffset: -1,  nights: 3, adults: 2, children: 0, status: "CHECKED_IN",  source: "AIRBNB",       channelIdx: 0, guestIdx: 1, commissionRate: 14 },
      { roomIdx: 3, checkInOffset: -2,  nights: 5, adults: 2, children: 1, status: "CHECKED_IN",  source: "DIRECT",       channelIdx: 3, guestIdx: 0, commissionRate: 0  },
      { roomIdx: 6, checkInOffset: 0,   nights: 2, adults: 2, children: 0, status: "CHECKED_IN",  source: "BOOKING_COM",  channelIdx: 1, guestIdx: 3, commissionRate: 18 },

      // Upcoming confirmed bookings
      { roomIdx: 1, checkInOffset: 2,   nights: 3, adults: 1, children: 0, status: "CONFIRMED",   source: "AIRBNB",       channelIdx: 0, guestIdx: 2, commissionRate: 14 },
      { roomIdx: 2, checkInOffset: 3,   nights: 2, adults: 2, children: 0, status: "CONFIRMED",   source: "BOOKING_COM",  channelIdx: 1, guestIdx: 4, commissionRate: 18 },
      { roomIdx: 4, checkInOffset: 5,   nights: 4, adults: 2, children: 2, status: "CONFIRMED",   source: "MAKEMYTRIP",   channelIdx: 2, guestIdx: 5, commissionRate: 12 },
      { roomIdx: 5, checkInOffset: 7,   nights: 3, adults: 2, children: 0, status: "CONFIRMED",   source: "DIRECT",       channelIdx: 3, guestIdx: 6, commissionRate: 0  },
      { roomIdx: 7, checkInOffset: 10,  nights: 5, adults: 2, children: 1, status: "CONFIRMED",   source: "AIRBNB",       channelIdx: 0, guestIdx: 7, commissionRate: 14 },
      { roomIdx: 0, checkInOffset: 14,  nights: 2, adults: 2, children: 0, status: "CONFIRMED",   source: "BOOKING_COM",  channelIdx: 1, guestIdx: 0, commissionRate: 18 },
      { roomIdx: 3, checkInOffset: 12,  nights: 7, adults: 2, children: 0, status: "CONFIRMED",   source: "DIRECT",       channelIdx: 3, guestIdx: 1, commissionRate: 0  },

      // Cancelled / no-show
      { roomIdx: 1, checkInOffset: -3,  nights: 2, adults: 1, children: 0, status: "CANCELLED",   source: "AIRBNB",       channelIdx: 0, guestIdx: 3, commissionRate: 14 },
      { roomIdx: 5, checkInOffset: -6,  nights: 3, adults: 2, children: 0, status: "NO_SHOW",     source: "BOOKING_COM",  channelIdx: 1, guestIdx: 4, commissionRate: 18 },
    ];

    // Numeric base prices per room
    const basePrices = [3500, 3500, 3800, 5500, 5500, 5800, 9500, 12000];

    for (const bd of bookingDefs) {
      const checkIn  = addDays(today, bd.checkInOffset);
      const checkOut = addDays(checkIn, bd.nights);
      const basePrice = basePrices[bd.roomIdx];
      const totalAmount = basePrice * bd.nights;
      const netAmount = totalAmount * (1 - bd.commissionRate / 100);

      const booking = await prisma.booking.create({
        data: {
          bookingRef: ref(),
          status: bd.status,
          checkIn,
          checkOut,
          nights: bd.nights,
          adults: bd.adults,
          children: bd.children,
          totalAmount,
          currency: "INR",
          commissionRate: bd.commissionRate,
          netAmount,
          source: bd.source,
          roomId: rooms[bd.roomIdx].id,
          channelId: channels[bd.channelIdx].id,
        },
      });

      const g = guestPool[bd.guestIdx];
      await prisma.guest.create({
        data: {
          firstName: g.firstName,
          lastName: g.lastName,
          email: g.email,
          phone: g.phone,
          country: g.country,
          bookingId: booking.id,
        },
      });
    }

    console.log(`✅  ${bookingDefs.length} bookings + guests created`);
  }

  // ── 8. Availability blocks (maintenance/blocked dates) ──────────────────
  const existingBlocks = await prisma.availability.count({ where: { room: { propertyId: property.id } } });
  if (existingBlocks > 0) {
    console.log(`ℹ️   Availability blocks already seeded`);
  } else {
    // Block Suite 302 for maintenance next week
    const suite302 = rooms[7];
    const blocks = [];
    for (let i = 3; i <= 5; i++) {
      blocks.push({ roomId: suite302.id, date: addDays(today, i), isBlocked: true, minStay: 1 });
    }
    await prisma.availability.createMany({ data: blocks });
    console.log(`✅  ${blocks.length} availability blocks created`);
  }

  console.log("\n🎉  Seed complete!");
  console.log(`\n   Open http://localhost:3000/dashboard`);
  console.log(`   Property: ${property.name}`);
  console.log(`   Rooms   : ${rooms.length}`);
  console.log(`   Channels: ${channels.map((c) => c.name).join(", ")}`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
