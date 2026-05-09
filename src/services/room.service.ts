import { prisma } from "@/lib/db";
import type { CreateRoomInput, UpdateAvailabilityInput, CreateRatePlanInput } from "@/types";
import { RoomStatus } from "@/generated/prisma/client";
import { getDateRange } from "@/lib/utils";
import { format } from "date-fns";

export class RoomService {
  /** Get all rooms for a property, with availability for a date range */
  static async getRooms(propertyId: string) {
    return prisma.room.findMany({
      where: { propertyId },
      include: {
        roomType: true,
        ratePlans: { where: { isActive: true } },
        _count: {
          select: {
            bookings: {
              where: {
                status: { in: ["CONFIRMED", "CHECKED_IN"] },
                checkIn: { lte: new Date() },
                checkOut: { gte: new Date() },
              },
            },
          },
        },
      },
      orderBy: { roomNumber: "asc" },
    });
  }

  /** Create a room */
  static async createRoom(data: CreateRoomInput) {
    return prisma.room.create({
      data: {
        name: data.name,
        roomNumber: data.roomNumber,
        floorNumber: data.floorNumber,
        basePrice: data.basePrice,
        propertyId: data.propertyId,
        roomTypeId: data.roomTypeId,
      },
      include: { roomType: true },
    });
  }

  /** Update room status */
  static async updateRoomStatus(roomId: string, status: RoomStatus) {
    return prisma.room.update({
      where: { id: roomId },
      data: { status },
    });
  }

  /** Get availability grid for calendar view */
  static async getAvailabilityGrid(propertyId: string, from: string, to: string) {
    const rooms = await prisma.room.findMany({
      where: { propertyId },
      include: {
        availability: {
          where: {
            date: { gte: new Date(from), lte: new Date(to) },
          },
        },
        bookings: {
          where: {
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
            checkIn: { lte: new Date(to) },
            checkOut: { gte: new Date(from) },
          },
          include: { guest: true },
        },
      },
      orderBy: { roomNumber: "asc" },
    });

    const dateRange = getDateRange(from, to);

    return rooms.map((room) => ({
      roomId: room.id,
      roomName: room.name,
      roomNumber: room.roomNumber,
      days: dateRange.map((date) => {
        // Use format() (local timezone) instead of toISOString() (UTC) to avoid
        // off-by-one errors in IST and other UTC+ timezones.
        const avail = room.availability.find(
          (a) => format(a.date, "yyyy-MM-dd") === date
        );
        const booking = room.bookings.find(
          (b) =>
            format(b.checkIn, "yyyy-MM-dd") <= date &&
            format(b.checkOut, "yyyy-MM-dd") > date
        );
        return {
          date,
          isBlocked: avail?.isBlocked ?? false,
          booking: booking
            ? {
                id: booking.id,
                bookingRef: booking.bookingRef,
                guestName: booking.guest
                  ? `${booking.guest.firstName} ${booking.guest.lastName}`
                  : "Guest",
                checkIn: format(booking.checkIn, "yyyy-MM-dd"),
                checkOut: format(booking.checkOut, "yyyy-MM-dd"),
                status: booking.status,
                source: booking.source,
              }
            : undefined,
        };
      }),
    }));
  }

  /** Bulk update availability */
  static async updateAvailability(input: UpdateAvailabilityInput) {
    return prisma.$transaction(
      input.dates.map((date) =>
        prisma.availability.upsert({
          where: { roomId_date: { roomId: input.roomId, date: new Date(date) } },
          create: {
            roomId: input.roomId,
            date: new Date(date),
            isBlocked: input.isBlocked,
            minStay: input.minStay ?? 1,
          },
          update: {
            isBlocked: input.isBlocked,
            minStay: input.minStay ?? 1,
          },
        })
      )
    );
  }

  /** Get room types */
  static async getRoomTypes() {
    return prisma.roomType.findMany({ orderBy: { name: "asc" } });
  }

  /** Create/update rate plan */
  static async upsertRatePlan(data: CreateRatePlanInput, id?: string) {
    const payload = {
      roomId: data.roomId,
      name: data.name,
      type: data.type as never,
      price: data.price,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      daysOfWeek: data.daysOfWeek ?? [],
      minStay: data.minStay ?? 1,
    };

    if (id) {
      return prisma.ratePlan.update({ where: { id }, data: payload });
    }
    return prisma.ratePlan.create({ data: payload });
  }
}
