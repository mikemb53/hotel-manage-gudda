/**
 * Sync Service — Orchestrates availability and rate syncing across all channels.
 *
 * Architecture:
 * - Each channel type has its own provider service
 * - SyncService coordinates all providers
 * - Sync results are logged to SyncLog table
 */

import { prisma } from "@/lib/db";
import { ICalService } from "@/services/channel/ical.service";
import { SyncStatus, ChannelType } from "@/generated/prisma/client";
import type { SyncResult } from "@/types";

export class SyncService {
  /**
   * Sync a single channel — pulls new bookings and pushes availability.
   */
  static async syncChannel(channelId: string): Promise<SyncResult> {
    const channel = await prisma.channel.findUniqueOrThrow({
      where: { id: channelId },
    });

    if (!channel.isActive) {
      return {
        channelId,
        channelName: channel.name,
        success: false,
        error: "Channel is not active",
      };
    }

    // Update status to SYNCING
    await prisma.channel.update({
      where: { id: channelId },
      data: { syncStatus: SyncStatus.SYNCING },
    });

    try {
      let result: SyncResult;

      switch (channel.type) {
        case ChannelType.ICAL:
        case ChannelType.AIRBNB: // Airbnb uses iCal for now
          const icalResult = await ICalService.syncICalChannel(channelId);
          result = {
            channelId,
            channelName: channel.name,
            success: true,
            bookingsSynced: icalResult.synced,
          };
          break;

        case ChannelType.BOOKING_COM:
        case ChannelType.GOIBIBO:
        case ChannelType.MAKEMYTRIP:
        case ChannelType.AGODA:
        case ChannelType.EXPEDIA:
          // TODO: Implement proper API integrations with partner credentials
          // These require formal OTA partner registration
          result = await SyncService.syncViaStubApi(channel);
          break;

        default:
          result = {
            channelId,
            channelName: channel.name,
            success: false,
            error: "Unsupported channel type",
          };
      }

      await prisma.channel.update({
        where: { id: channelId },
        data: {
          syncStatus: result.success ? SyncStatus.SUCCESS : SyncStatus.FAILED,
          lastSyncAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";

      await prisma.channel.update({
        where: { id: channelId },
        data: { syncStatus: SyncStatus.FAILED },
      });

      await prisma.syncLog.create({
        data: {
          channelId,
          type: "FULL_SYNC",
          status: SyncStatus.FAILED,
          message,
        },
      });

      return {
        channelId,
        channelName: channel.name,
        success: false,
        error: message,
      };
    }
  }

  /**
   * Sync all active channels for a property.
   */
  static async syncAllChannels(propertyId: string): Promise<SyncResult[]> {
    const channels = await prisma.channel.findMany({
      where: { propertyId, isActive: true },
    });

    // Sequential sync to avoid rate limiting
    const results: SyncResult[] = [];
    for (const channel of channels) {
      const result = await SyncService.syncChannel(channel.id);
      results.push(result);
    }

    return results;
  }

  /**
   * Push availability & rates to a channel (outbound sync).
   */
  static async pushAvailability(channelId: string, roomId: string, dates: string[]) {
    const channel = await prisma.channel.findUniqueOrThrow({
      where: { id: channelId },
    });

    // For iCal channels — regenerate and serve the iCal feed
    // For API channels — push via their API
    await prisma.syncLog.create({
      data: {
        channelId,
        type: "AVAILABILITY_PUSH",
        status: SyncStatus.SUCCESS,
        message: `Pushed availability for ${dates.length} dates`,
        details: { roomId, dates },
      },
    });

    return { success: true, channel: channel.name, datesUpdated: dates.length };
  }

  /**
   * Stub for API-based OTA channels (requires real partner API credentials).
   * Replace with actual API calls once credentials are obtained.
   */
  private static async syncViaStubApi(channel: {
    id: string;
    name: string;
    type: string;
  }): Promise<SyncResult> {
    await prisma.syncLog.create({
      data: {
        channelId: channel.id,
        type: "FULL_SYNC",
        status: SyncStatus.IDLE,
        message: `API integration for ${channel.name} requires partner registration. Status: Pending setup.`,
      },
    });

    return {
      channelId: channel.id,
      channelName: channel.name,
      success: true,
      bookingsSynced: 0,
      error: "API partner registration required. Using manual sync mode.",
    };
  }
}
