import { prisma } from "@/lib/db";
import { generateBookingRef, calculateNights, getDateRange } from "@/lib/utils";
import type { CreateBookingInput } from "@/types";
import { BookingStatus } from "@/generated/prisma/client";

export class BookingService {
  /**
   * Create a new booking with atomic availability blocking.
   * Prevents double-booking by using a DB transaction.
   */
  static async createBooking(input: CreateBookingInput) {
    const nights = calculateNights(input.checkIn, input.checkOut);
    if (nights <= 0) throw new Error("Check-out must be after check-in");

    const netAmount = input.commissionRate
      ? input.totalAmount * (1 - input.commissionRate / 100)
      : input.totalAmount;

    return prisma.$transaction(async (tx) => {
      // 1. Check availability — all nights must be unblocked & unbooked
      const dateRange = getDateRange(input.checkIn, input.checkOut);

      const conflictingBookings = await tx.booking.findFirst({
        where: {
          roomId: input.roomId,
          status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
          OR: [
            {
              checkIn: { lt: new Date(input.checkOut) },
              checkOut: { gt: new Date(input.checkIn) },
            },
          ],
        },
      });

      if (conflictingBookings) {
        throw new Error("Room is not available for the selected dates");
      }

      // 2. Create the booking
      const booking = await tx.booking.create({
        data: {
          bookingRef: generateBookingRef(),
          channelRef: input.channelRef,
          roomId: input.roomId,
          channelId: input.channelId,
          source: input.source as never,
          checkIn: new Date(input.checkIn),
          checkOut: new Date(input.checkOut),
          nights,
          adults: input.adults,
          children: input.children ?? 0,
          totalAmount: input.totalAmount,
          commissionRate: input.commissionRate,
          netAmount,
          specialRequests: input.specialRequests,
          status: BookingStatus.CONFIRMED,
          guest: {
            create: {
              firstName: input.guest.firstName,
              lastName: input.guest.lastName,
              email: input.guest.email || null,
              phone: input.guest.phone,
              country: input.guest.country,
            },
          },
        },
        include: { guest: true, room: true, channel: true },
      });

      // 3. Block availability for those dates
      await Promise.all(
        dateRange.map((date) =>
          tx.availability.upsert({
            where: { roomId_date: { roomId: input.roomId, date: new Date(date) } },
            create: { roomId: input.roomId, date: new Date(date), isBlocked: true },
            update: { isBlocked: true },
          })
        )
      );

      return booking;
    });
  }

  /**
   * Cancel a booking and unblock its dates.
   */
  static async cancelBooking(bookingId: string) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUniqueOrThrow({
        where: { id: bookingId },
      });

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      // Unblock the dates
      const dateRange = getDateRange(
        booking.checkIn.toISOString().split("T")[0],
        booking.checkOut.toISOString().split("T")[0]
      );

      await Promise.all(
        dateRange.map((date) =>
          tx.availability.updateMany({
            where: { roomId: booking.roomId, date: new Date(date) },
            data: { isBlocked: false },
          })
        )
      );

      return updated;
    });
  }

  /**
   * Get bookings with filters — paginated.
   */
  static async getBookings({
    propertyId,
    status,
    source,
    page = 1,
    pageSize = 20,
    search,
  }: {
    propertyId: string;
    status?: string;
    source?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }) {
    const skip = (page - 1) * pageSize;

    const where = {
      room: { propertyId },
      ...(status ? { status: status as BookingStatus } : {}),
      ...(source ? { source: source as never } : {}),
      ...(search
        ? {
            OR: [
              { bookingRef: { contains: search, mode: "insensitive" as const } },
              { channelRef: { contains: search, mode: "insensitive" as const } },
              {
                guest: {
                  OR: [
                    { firstName: { contains: search, mode: "insensitive" as const } },
                    { lastName: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { guest: true, room: { include: { roomType: true } }, channel: true },
      }),
      prisma.booking.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * Get today's check-ins and check-outs for a property.
   */
  static async getTodayActivity(propertyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [checkIns, checkOuts] = await Promise.all([
      prisma.booking.findMany({
        where: {
          room: { propertyId },
          checkIn: { gte: today, lt: tomorrow },
          status: BookingStatus.CONFIRMED,
        },
        include: { guest: true, room: true },
      }),
      prisma.booking.findMany({
        where: {
          room: { propertyId },
          checkOut: { gte: today, lt: tomorrow },
          status: BookingStatus.CHECKED_IN,
        },
        include: { guest: true, room: true },
      }),
    ]);

    return { checkIns, checkOuts };
  }
}
