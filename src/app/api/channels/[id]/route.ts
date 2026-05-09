import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getErrorMessage } from "@/lib/utils";

// GET /api/channels/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        syncLogs: { orderBy: { createdAt: "desc" }, take: 10 },
        _count: { select: { bookings: true } },
      },
    });

    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: channel });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// PATCH /api/channels/[id] — toggle active, update credentials/icalUrl
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const channel = await prisma.channel.update({
      where: { id },
      data: {
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.icalUrl !== undefined && { icalUrl: body.icalUrl }),
        ...(body.credentials !== undefined && { credentials: body.credentials }),
        ...(body.name !== undefined && { name: body.name }),
      },
    });

    return NextResponse.json({ success: true, data: channel });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// DELETE /api/channels/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.channel.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Channel removed" });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
