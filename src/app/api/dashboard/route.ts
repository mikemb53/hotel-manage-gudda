import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DashboardService } from "@/services/dashboard.service";
import { getErrorMessage } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const [stats, revenueChart, channelDistribution] = await Promise.all([
      DashboardService.getStats(propertyId),
      DashboardService.getRevenueChart(propertyId),
      DashboardService.getChannelDistribution(propertyId),
    ]);

    return NextResponse.json({ success: true, data: { stats, revenueChart, channelDistribution } });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
