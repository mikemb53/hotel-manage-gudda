import { NextResponse } from "next/server";
import ical from "ical-generator";

/**
 * GET /api/ical/demo
 * Serves a realistic demo iCal feed with test booking events.
 * Use this URL when you don't have a real OTA iCal URL.
 * Publicly accessible — safe to paste into any iCal tester tool.
 *
 * All dates are relative to March 2026 to match the current dev context.
 */
export async function GET() {
  const cal = ical({
    name: "Grand Pearl Hotel – Room 101 (Demo Feed)",
    timezone: "Asia/Kolkata",
    prodId: {
      company: "HotelSync",
      product: "DemoFeed",
      language: "EN",
    },
  });

  const events: Array<{
    uid: string;
    summary: string;
    start: Date;
    end: Date;
    description: string;
  }> = [
    // ── Past bookings ─────────────────────────────────────────────────────────
    {
      uid: "airbnb-HM9X4K23A",
      summary: "Airbnb – Reservation HM9X4K2",
      start: new Date("2026-02-01"),
      end: new Date("2026-02-06"),
      description:
        "Airbnb Reservation | 5 nights | Check-in: 2 Feb, Check-out: 6 Feb",
    },
    {
      uid: "vrbo-BK4521MN",
      summary: "VRBO – Booking #BK4521",
      start: new Date("2026-02-14"),
      end: new Date("2026-02-18"),
      description:
        "Vrbo Booking | Valentine's Weekend | 4 nights",
    },
    {
      uid: "airbnb-XC8734PQ",
      summary: "Airbnb – Not available",
      start: new Date("2026-03-01"),
      end: new Date("2026-03-04"),
      description: "Blocked via Airbnb | 3 nights",
    },
    {
      uid: "airbnb-TM2241RS",
      summary: "Airbnb – Reservation TM2241R",
      start: new Date("2026-03-10"),
      end: new Date("2026-03-12"),
      description: "Airbnb Reservation | Weekend stay | 2 nights",
    },

    // ── Active NOW (check-in before today, check-out after today) ─────────────
    {
      uid: "airbnb-KR1029SD",
      summary: "Airbnb – Reservation KR1029S",
      start: new Date("2026-03-18"),
      end: new Date("2026-03-23"),
      description:
        "Airbnb Reservation | Currently staying | 5 nights",
    },

    // ── Upcoming bookings ─────────────────────────────────────────────────────
    {
      uid: "direct-INV20260325",
      summary: "Direct Booking – INV20260325",
      start: new Date("2026-03-25"),
      end: new Date("2026-03-28"),
      description: "Direct hotel reservation | 3 nights | Guest: S. Kumar",
    },
    {
      uid: "booking-DOT-83947562",
      summary: "Booking.com – #83947562",
      start: new Date("2026-04-05"),
      end: new Date("2026-04-11"),
      description:
        "Booking.com reservation via iCal sync | 6 nights",
    },
    {
      uid: "airbnb-TL6382WE",
      summary: "Airbnb – Reservation TL6382W",
      start: new Date("2026-04-15"),
      end: new Date("2026-04-19"),
      description: "Airbnb Reservation | 4 nights",
    },
    {
      uid: "airbnb-PW9201QR",
      summary: "Airbnb – Reservation PW9201Q",
      start: new Date("2026-05-01"),
      end: new Date("2026-05-08"),
      description:
        "Airbnb Reservation | Long stay 7 nights | Labour Day week",
    },
    {
      uid: "vrbo-NM5543DE",
      summary: "VRBO – Booking #NM5543",
      start: new Date("2026-05-20"),
      end: new Date("2026-05-25"),
      description: "Vrbo Booking | 5 nights",
    },
    {
      uid: "airbnb-QA3871CV",
      summary: "Airbnb – Reservation QA3871C",
      start: new Date("2026-06-10"),
      end: new Date("2026-06-16"),
      description: "Airbnb Reservation | 6 nights | Summer booking",
    },
  ];

  for (const ev of events) {
    const e = cal.createEvent({
      id: ev.uid,
      start: ev.start,
      end: ev.end,
      summary: ev.summary,
      description: ev.description,
    });
    e.uid(ev.uid);
  }

  return new NextResponse(cal.toString(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="demo-room-101.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
