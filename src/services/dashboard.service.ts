import { prisma } from "@/lib/db";
import { format, subDays } from "date-fns";

export class DashboardService {
  /** Compute all dashboard stats for a property */
  static async getStats(propertyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalRooms,
      occupiedCount,
      pendingBookings,
      todayCheckIns,
      todayCheckOuts,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.room.count({ where: { propertyId } }),
      prisma.booking.count({
        where: {
          room: { propertyId },
          status: "CHECKED_IN",
        },
      }),
      prisma.booking.count({
        where: { room: { propertyId }, status: "PENDING" },
      }),
      prisma.booking.count({
        where: {
          room: { propertyId },
          checkIn: { gte: today, lt: tomorrow },
          status: "CONFIRMED",
        },
      }),
      prisma.booking.count({
        where: {
          room: { propertyId },
          checkOut: { gte: today, lt: tomorrow },
          status: "CHECKED_IN",
        },
      }),
      prisma.booking.aggregate({
        where: {
          room: { propertyId },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
          checkIn: { gte: monthStart, lte: monthEnd },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalRooms,
      availableRooms: totalRooms - occupiedCount,
      occupiedRooms: occupiedCount,
      todayCheckIns,
      todayCheckOuts,
      monthlyRevenue: Number(monthlyRevenue._sum.totalAmount ?? 0),
      occupancyRate:
        totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0,
      pendingBookings,
    };
  }

  /** Revenue chart data for the last 30 days */
  static async getRevenueChart(propertyId: string, days = 30) {
    const from = subDays(new Date(), days);

    const bookings = await prisma.booking.findMany({
      where: {
        room: { propertyId },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        checkIn: { gte: from },
      },
      select: { checkIn: true, totalAmount: true },
    });

    // Group by date
    const map = new Map<string, number>();
    for (const b of bookings) {
      const key = format(b.checkIn, "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + Number(b.totalAmount));
    }

    return Array.from(map.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /** Bookings per channel for source distribution chart */
  static async getChannelDistribution(propertyId: string) {
    const results = await prisma.booking.groupBy({
      by: ["source"],
      where: {
        room: { propertyId },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    return results.map((r) => ({
      source: r.source,
      count: r._count.id,
      revenue: Number(r._sum.totalAmount ?? 0),
    }));
  }
}
