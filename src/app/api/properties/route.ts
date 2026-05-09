import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getErrorMessage } from "@/lib/utils";

// GET /api/properties — get all properties for logged-in user
export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id?: string })?.id;

    const properties = await prisma.property.findMany({
      where: { ownerId: userId },
      include: {
        _count: { select: { rooms: true, channels: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: properties });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST /api/properties — create property
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id?: string })?.id as string;

    const body = await req.json();
    const { name, address, city, state, country, postalCode, phone, email, website, description, timezone, currency, checkInTime, checkOutTime } = body;

    if (!name || !address || !city || !country) {
      return NextResponse.json({ error: "name, address, city, country are required" }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        name,
        address,
        city,
        state,
        country,
        postalCode,
        phone,
        email,
        website,
        description,
        timezone: timezone ?? "Asia/Kolkata",
        currency: currency ?? "INR",
        checkInTime: checkInTime ?? "14:00",
        checkOutTime: checkOutTime ?? "11:00",
        ownerId: userId,
      },
    });

    return NextResponse.json({ success: true, data: property }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
