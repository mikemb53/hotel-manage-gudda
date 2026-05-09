import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BookingService } from "@/services/booking.service";
import { createBookingSchema } from "@/lib/validations";
import { getErrorMessage } from "@/lib/utils";

// GET /api/bookings?propertyId=xxx&status=xxx&page=1
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const result = await BookingService.getBookings({
      propertyId,
      status: searchParams.get("status") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 20),
      search: searchParams.get("search") ?? undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST /api/bookings — create a booking
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
    }

    const booking = await BookingService.createBooking(parsed.data);
    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    const msg = getErrorMessage(error);
    const status = msg.includes("not available") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
