import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";

// GET /api/room-types
export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const types = await prisma.roomType.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ success: true, data: types });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST /api/room-types — seed default room types or create custom
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description, maxAdults, maxChildren, amenities } = body;

    const type = await prisma.roomType.create({
      data: {
        name,
        description,
        maxAdults: maxAdults ?? 2,
        maxChildren: maxChildren ?? 0,
        amenities: amenities ?? [],
      },
    });

    return NextResponse.json({ success: true, data: type }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
