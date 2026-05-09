import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BookingService } from "@/services/booking.service";
import { generateBookingRef } from "@/lib/utils";

/**
 * POST /api/webhooks/airbnb
 * Receives booking notifications from Airbnb (when using Airbnb API partner access).
 * For iCal-only connections, use the sync endpoint instead.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify Airbnb webhook signature
    const signature = req.headers.get("x-airbnb-signature");
    const webhookSecret = process.env.AIRBNB_WEBHOOK_SECRET;

    if (webhookSecret && !signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const payload = await req.json();
    const { event_type, reservation } = payload;

    // Log the incoming webhook
    const channel = await prisma.channel.findFirst({
      where: { type: "AIRBNB" },
    });

    if (channel) {
      await prisma.syncLog.create({
        data: {
          channelId: channel.id,
          type: "WEBHOOK",
          status: "SUCCESS",
          message: `Received Airbnb webhook: ${event_type}`,
          details: payload,
        },
      });
    }

    // Handle different event types
    switch (event_type) {
      case "reservation.created":
      case "reservation.accepted":
        if (reservation && channel) {
          // Find the matching room
          const room = await prisma.room.findFirst({
            where: { propertyId: channel.propertyId },
          });

          if (room) {
            await BookingService.createBooking({
              roomId: room.id,
              channelId: channel.id,
              channelRef: reservation.confirmation_code,
              source: "AIRBNB",
              checkIn: reservation.start_date,
              checkOut: reservation.end_date,
              adults: reservation.number_of_guests ?? 1,
              totalAmount: reservation.payout_amount ?? 0,
              commissionRate: 3, // Airbnb host fee ~3%
              guest: {
                firstName: reservation.guest?.first_name ?? "Airbnb",
                lastName: reservation.guest?.last_name ?? "Guest",
                email: reservation.guest?.email,
                phone: reservation.guest?.phone,
                country: reservation.guest?.country_of_residence,
              },
            });
          }
        }
        break;

      case "reservation.cancelled":
        if (reservation?.confirmation_code) {
          const booking = await prisma.booking.findFirst({
            where: { channelRef: reservation.confirmation_code },
          });
          if (booking) {
            await BookingService.cancelBooking(booking.id);
          }
        }
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Airbnb webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
