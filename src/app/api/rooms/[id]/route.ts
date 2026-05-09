import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getErrorMessage } from "@/lib/utils";

// GET /api/rooms/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        roomType: true,
        ratePlans: true,
        availability: {
          where: { date: { gte: new Date() } },
          orderBy: { date: "asc" },
        },
        bookings: {
          where: { status: { notIn: ["CANCELLED", "NO_SHOW"] } },
          include: { guest: true },
          orderBy: { checkIn: "asc" },
          take: 20,
        },
      },
    });

    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: room });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// PATCH /api/rooms/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.basePrice && { basePrice: body.basePrice }),
        ...(body.status && { status: body.status }),
        ...(body.floorNumber !== undefined && { floorNumber: body.floorNumber }),
      },
      include: { roomType: true },
    });

    return NextResponse.json({ success: true, data: room });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// DELETE /api/rooms/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.room.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Room deleted" });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
