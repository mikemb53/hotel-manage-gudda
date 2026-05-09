import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RoomService } from "@/services/room.service";
import { updateAvailabilitySchema } from "@/lib/validations";
import { getErrorMessage } from "@/lib/utils";

// GET /api/availability?propertyId=xxx&from=yyyy-mm-dd&to=yyyy-mm-dd
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!propertyId || !from || !to) {
      return NextResponse.json(
        { error: "propertyId, from, and to are required" },
        { status: 400 }
      );
    }

    const grid = await RoomService.getAvailabilityGrid(propertyId, from, to);
    return NextResponse.json({ success: true, data: grid });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST /api/availability — bulk block/unblock dates
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = updateAvailabilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
    }

    await RoomService.updateAvailability(parsed.data);
    return NextResponse.json({
      success: true,
      message: `${parsed.data.dates.length} date(s) updated`,
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
