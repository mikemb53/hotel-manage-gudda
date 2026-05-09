import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RoomService } from "@/services/room.service";
import { createRatePlanSchema } from "@/lib/validations";
import { getErrorMessage } from "@/lib/utils";

// GET /api/rate-plans?roomId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    const ratePlans = await prisma.ratePlan.findMany({
      where: roomId ? { roomId } : {},
      include: { room: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: ratePlans });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST /api/rate-plans
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = createRatePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
    }

    const ratePlan = await RoomService.upsertRatePlan(parsed.data, body.id);
    return NextResponse.json({ success: true, data: ratePlan }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
