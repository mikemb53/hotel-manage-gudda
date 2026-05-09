import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RoomService } from "@/services/room.service";
import { createRoomSchema } from "@/lib/validations";
import { getErrorMessage } from "@/lib/utils";

// GET /api/rooms?propertyId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const rooms = await RoomService.getRooms(propertyId);
    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST /api/rooms — create a room
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
    }

    const room = await RoomService.createRoom(parsed.data);
    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
