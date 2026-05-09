import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BookingService } from "@/services/booking.service";
import { getErrorMessage } from "@/lib/utils";

// GET /api/bookings/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        guest: true,
        room: { include: { roomType: true, property: true } },
        channel: true,
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// PATCH /api/bookings/[id] — update status / notes
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Handle cancellation specially (unblocks dates)
    if (body.status === "CANCELLED") {
      const booking = await BookingService.cancelBooking(id);
      return NextResponse.json({ success: true, data: booking });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.specialRequests !== undefined && { specialRequests: body.specialRequests }),
      },
      include: { guest: true, room: true, channel: true },
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
