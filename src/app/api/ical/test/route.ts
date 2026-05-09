import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ICalService } from "@/services/channel/ical.service";
import { getErrorMessage } from "@/lib/utils";

/**
 * POST /api/ical/test
 * Parses an iCal feed URL and returns the events as JSON.
 * Dry-run only — nothing is written to the database.
 * Used by the iCal Tester UI to validate a URL before saving a channel.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { icalUrl } = body as { icalUrl?: string };

    if (!icalUrl || typeof icalUrl !== "string") {
      return NextResponse.json({ error: "icalUrl is required" }, { status: 400 });
    }

    // Basic URL validation — prevent SSRF to internal addresses
    let parsed: URL;
    try {
      parsed = new URL(icalUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json(
        { error: "Only http/https URLs are allowed" },
        { status: 400 }
      );
    }

    // Block private/loopback ranges (SSRF protection)
    const hostname = parsed.hostname.toLowerCase();
    const blockedHostnames = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
    const isPrivateIp =
      blockedHostnames.includes(hostname) ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      /^169\.254\./.test(hostname);

    if (isPrivateIp) {
      return NextResponse.json(
        { error: "Private/internal URLs are not allowed" },
        { status: 400 }
      );
    }

    const events = await ICalService.parseICalFeed(icalUrl);

    // Sort events by start date ascending
    events.sort((a, b) => a.start.getTime() - b.start.getTime());

    return NextResponse.json({
      success: true,
      data: {
        url: icalUrl,
        count: events.length,
        events: events.map((e) => ({
          uid: e.uid,
          summary: e.summary,
          start: e.start.toISOString(),
          end: e.end.toISOString(),
          description: e.description ?? null,
          nights: Math.ceil(
            (e.end.getTime() - e.start.getTime()) / (1000 * 60 * 60 * 24)
          ),
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
