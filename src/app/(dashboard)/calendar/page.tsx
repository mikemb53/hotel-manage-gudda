"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { useAvailabilityGrid } from "@/hooks/useRooms";
import { useProperties } from "@/hooks/useChannels";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isToday, parseISO } from "date-fns";

const SOURCE_COLORS: Record<string, string> = {
  AIRBNB: "bg-rose-400",
  BOOKING_COM: "bg-blue-500",
  GOIBIBO: "bg-orange-400",
  MAKEMYTRIP: "bg-red-500",
  DIRECT: "bg-green-500",
  ICAL: "bg-gray-400",
  OTHER: "bg-gray-400",
};

const SOURCE_TEXT: Record<string, string> = {
  AIRBNB: "text-rose-700",
  BOOKING_COM: "text-blue-700",
  GOIBIBO: "text-orange-700",
  MAKEMYTRIP: "text-red-700",
  DIRECT: "text-green-700",
  ICAL: "text-gray-600",
};

export default function CalendarPage() {
  const { data: properties } = useProperties();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date());
  const [tooltip, setTooltip] = useState<{
    x: number; y: number;
    booking: { bookingRef: string; guestName: string; checkIn: string; checkOut: string; status: string; source: string };
    roomName: string;
  } | null>(null);

  useEffect(() => {
    const props = properties as { id: string }[] | null;
    if (props && props.length > 0 && !propertyId) setPropertyId(props[0].id);
  }, [properties, propertyId]);

  const from = format(startOfMonth(month), "yyyy-MM-dd");
  const to = format(endOfMonth(month), "yyyy-MM-dd");

  const { data, isLoading } = useAvailabilityGrid(propertyId, from, to);

  type CalDay = {
    date: string;
    isBlocked: boolean;
    booking?: { bookingRef: string; guestName: string; checkIn: string; checkOut: string; status: string; source: string };
  };

  type RoomRow = {
    roomId: string;
    roomName: string;
    roomNumber: string;
    days: CalDay[];
  };

  const rooms = (data as RoomRow[]) ?? [];

  // Generate header dates
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(month.getFullYear(), month.getMonth(), i + 1);
    return { day: i + 1, date: format(d, "yyyy-MM-dd"), weekday: format(d, "EEE"), todayFlag: isToday(d) };
  });

  return (
    <div className="flex flex-col gap-5" onClick={() => setTooltip(null)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Availability Calendar</h2>
          <p className="text-sm text-gray-500">{rooms.length} rooms</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setMonth(subMonths(month, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-base font-semibold text-gray-900">
            {format(month, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {[
          { color: "bg-green-100", label: "Available" },
          { color: "bg-rose-400", label: "Airbnb" },
          { color: "bg-blue-500", label: "Booking.com" },
          { color: "bg-red-500", label: "MakeMyTrip" },
          { color: "bg-green-500", label: "Direct" },
          { color: "bg-gray-300", label: "Blocked" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn("h-3 w-3 rounded-full", color)} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <PageLoader />
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-500">No rooms found for this property.</p>
        </div>
      ) : (
        <div className="relative overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                {/* Room name column */}
                <th className="sticky left-0 z-10 min-w-[160px] bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Room
                </th>
                {dates.map(({ day, weekday, todayFlag, date }) => (
                  <th
                    key={day}
                    className={cn(
                      "min-w-[36px] px-1 py-2 text-center text-xs",
                      todayFlag ? "bg-indigo-50 ring-2 ring-inset ring-indigo-300" :
                      ["Sat", "Sun"].includes(weekday) ? "bg-blue-50" : "bg-gray-50"
                    )}
                  >
                    <div className={cn("font-semibold", todayFlag ? "text-indigo-600" : "text-gray-700")}>{day}</div>
                    <div className={cn("text-[10px]", todayFlag ? "text-indigo-400" : "text-gray-400")}>{weekday}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.roomId} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{room.roomName}</p>
                    <p className="text-xs text-gray-400">#{room.roomNumber}</p>
                  </td>
                  {room.days.map((day) => (
                    <td key={day.date} className="p-0.5">
                      <div
                        className={cn(
                          "h-8 w-full rounded cursor-pointer transition-all hover:brightness-90 hover:scale-105",
                          day.booking
                            ? SOURCE_COLORS[day.booking.source] ?? "bg-gray-400"
                            : day.isBlocked
                            ? "bg-gray-300"
                            : "bg-green-100"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (day.booking) {
                            setTooltip({ x: e.clientX, y: e.clientY, booking: day.booking, roomName: room.roomName });
                          } else {
                            setTooltip(null);
                          }
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Booking tooltip */}
          {tooltip && (
            <div
              className="fixed z-50 min-w-[220px] rounded-xl border border-gray-200 bg-white p-4 shadow-2xl text-sm pointer-events-none"
              style={{ top: tooltip.y + 12, left: Math.min(tooltip.x, window.innerWidth - 240) }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("h-2.5 w-2.5 rounded-full", SOURCE_COLORS[tooltip.booking.source])} />
                <span className={cn("font-semibold text-xs uppercase tracking-wide", SOURCE_TEXT[tooltip.booking.source])}>
                  {tooltip.booking.source.replace("_", " ")}
                </span>
              </div>
              <p className="font-semibold text-gray-900">{tooltip.booking.guestName}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{tooltip.booking.bookingRef}</p>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-600">
                <span className="text-gray-400">Room</span><span className="font-medium">{tooltip.roomName}</span>
                <span className="text-gray-400">Check-in</span><span>{tooltip.booking.checkIn}</span>
                <span className="text-gray-400">Check-out</span><span>{tooltip.booking.checkOut}</span>
                <span className="text-gray-400">Status</span>
                <span className={cn("font-medium", tooltip.booking.status === "CHECKED_IN" ? "text-green-600" : "text-blue-600")}>
                  {tooltip.booking.status.replace("_", " ")}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
