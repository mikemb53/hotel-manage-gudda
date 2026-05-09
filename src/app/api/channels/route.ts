import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createChannelSchema } from "@/lib/validations";
import { getErrorMessage } from "@/lib/utils";

// GET /api/channels?propertyId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const channels = await prisma.channel.findMany({
      where: { propertyId },
      include: {
        _count: { select: { bookings: true } },
        syncLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: channels });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST /api/channels — add a new channel
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = createChannelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
    }

    const channel = await prisma.channel.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type as never,
        propertyId: parsed.data.propertyId,
        icalUrl: parsed.data.icalUrl || null,
        credentials: (parsed.data.credentials ?? {}) as never,
        isActive: false,
      },
    });

    return NextResponse.json({ success: true, data: channel }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
