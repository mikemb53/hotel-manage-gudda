import { NextRequest, NextResponse } from "next/server";
import { ICalService } from "@/services/channel/ical.service";
import { getErrorMessage } from "@/lib/utils";

/**
 * GET /api/ical/[roomId]
 * Serves the iCal feed for a room.
 * OTA portals subscribe to this URL to receive real-time availability.
 * No auth required — publicly accessible (only exposes availability, not guest data).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const icalContent = await ICalService.generateRoomICalFeed(roomId);

    return new NextResponse(icalContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="room-${roomId}.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
