import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SyncService } from "@/services/sync.service";
import { getErrorMessage } from "@/lib/utils";

// POST /api/channels/[id]/sync — trigger manual sync
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await SyncService.syncChannel(id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
