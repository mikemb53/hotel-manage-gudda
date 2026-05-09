/**
 * iCal Channel Service
 * Handles reading availability from iCal feeds (Airbnb, Booking.com, etc.)
 * and generating iCal feeds for export.
 *
 * iCal is the universal fallback when a direct API integration is not available.
 */

import ical from "ical-generator";
import { parseISO, format } from "date-fns";
import { prisma } from "@/lib/db";
import { BookingStatus } from "@/generated/prisma/client";

export interface ICalEvent {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
  description?: string;
}

export class ICalService {
  /**
   * Parse an iCal feed URL and extract blocked/booked date events.
   * Used for importing bookings from Airbnb, Vrbo etc. via iCal URL.
   */
  static async parseICalFeed(icalUrl: string): Promise<ICalEvent[]> {
    // Dynamic import to avoid SSR issues
    const nodeIcal = await import("node-ical");
    const data = await nodeIcal.default.fromURL(icalUrl);

    const events: ICalEvent[] = [];
    for (const key in data) {
      const event = data[key];
      if (event && event.type === "VEVENT" && event.start && event.end) {
        events.push({
          uid: event.uid ?? key,
          summary: String(event.summary ?? "Blocked"),
          start: new Date(event.start),
          end: new Date(event.end),
          description: event.description ? String(event.description) : undefined,
        });
      }
    }

    return events;
  }

  /**
   * Generate an iCal feed for a room — to be pushed/linked to OTA portals.
   * OTAs can subscribe to this URL to receive real-time availability.
   */
  static async generateRoomICalFeed(roomId: string): Promise<string> {
    const room = await prisma.room.findUniqueOrThrow({
      where: { id: roomId },
      include: {
        property: true,
        bookings: {
          where: {
            status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
            checkOut: { gte: new Date() },
          },
          include: { guest: true },
        },
      },
    });

    const calendar = ical({
      name: `${room.property.name} - ${room.name}`,
      timezone: room.property.timezone,
    });

    for (const booking of room.bookings) {
      const ev = calendar.createEvent({
        start: booking.checkIn,
        end: booking.checkOut,
        summary: booking.guest
          ? `BLOCKED - ${booking.guest.firstName} ${booking.guest.lastName[0]}.`
          : "BLOCKED",
        description: `Booking Ref: ${booking.bookingRef} | Source: ${booking.source}`,
      });
      ev.uid(booking.id);
    }

    return calendar.toString();
  }

  /**
   * Sync an iCal feed for a channel — pulls events and creates bookings.
   */
  static async syncICalChannel(channelId: string) {
    const channel = await prisma.channel.findUniqueOrThrow({
      where: { id: channelId },
      include: { property: { include: { rooms: true } } },
    });

    if (!channel.icalUrl) {
      throw new Error("No iCal URL configured for this channel");
    }

    const events = await ICalService.parseICalFeed(channel.icalUrl);
    let synced = 0;

    for (const event of events) {
      // Check if booking already exists by channelRef
      const existing = await prisma.booking.findFirst({
        where: { channelRef: event.uid, channelId },
      });

      if (!existing && channel.property.rooms.length > 0) {
        // For iCal, we block the first room by default (configure per channel in proper implementation)
        const room = channel.property.rooms[0];
        const checkIn = format(event.start, "yyyy-MM-dd");
        const checkOut = format(event.end, "yyyy-MM-dd");

        try {
          await prisma.booking.create({
            data: {
              bookingRef: `ICAL-${event.uid.substring(0, 8).toUpperCase()}`,
              channelRef: event.uid,
              roomId: room.id,
              channelId,
              source: "ICAL",
              checkIn: new Date(checkIn),
              checkOut: new Date(checkOut),
              nights: Math.ceil(
                (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60 * 24)
              ),
              totalAmount: 0,
              status: BookingStatus.CONFIRMED,
              notes: event.summary,
              guest: {
                create: {
                  firstName: "iCal",
                  lastName: "Import",
                  email: null,
                },
              },
            },
          });
          synced++;
        } catch {
          // Skip duplicate errors
        }
      }
    }

    // Update channel sync status
    await prisma.channel.update({
      where: { id: channelId },
      data: { lastSyncAt: new Date(), syncStatus: "SUCCESS" },
    });

    await prisma.syncLog.create({
      data: {
        channelId,
        type: "BOOKING_PULL",
        status: "SUCCESS",
        message: `Synced ${synced} new bookings from iCal feed`,
        details: { totalEvents: events.length, newBookings: synced },
      },
    });

    return { synced, total: events.length };
  }
}
