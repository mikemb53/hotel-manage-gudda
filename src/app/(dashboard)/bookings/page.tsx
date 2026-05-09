"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { BookingStatusBadge, BookingSourceBadge } from "@/components/bookings/BookingStatusBadge";
import { PageLoader } from "@/components/ui/Spinner";
import { useBookings } from "@/hooks/useBookings";
import { useProperties } from "@/hooks/useChannels";
import { formatDate, formatCurrency } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CHECKED_IN", label: "Checked In" },
  { value: "PENDING", label: "Pending" },
  { value: "CHECKED_OUT", label: "Checked Out" },
  { value: "CANCELLED", label: "Cancelled" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "All Sources" },
  { value: "DIRECT", label: "Direct" },
  { value: "AIRBNB", label: "Airbnb" },
  { value: "BOOKING_COM", label: "Booking.com" },
  { value: "GOIBIBO", label: "Goibibo" },
  { value: "MAKEMYTRIP", label: "MakeMyTrip" },
  { value: "ICAL", label: "iCal" },
];

export default function BookingsPage() {
  const { data: properties } = useProperties();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const props = properties as { id: string }[] | null;
    if (props && props.length > 0 && !propertyId) setPropertyId(props[0].id);
  }, [properties, propertyId]);

  const { bookings, total, totalPages, isLoading, cancelBooking, updateBookingStatus } =
    useBookings(propertyId, { status, source, page, search });

  const [selectedBooking, setSelectedBooking] = useState<unknown>(null);

  type Booking = {
    id: string;
    bookingRef: string;
    status: string;
    source: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    totalAmount: number;
    room: { name: string; roomNumber: string };
    guest?: { firstName: string; lastName: string; email?: string; phone?: string };
    channel?: { name: string };
  };

  const columns = [
    { key: "bookingRef", header: "Booking Ref", render: (r: Booking) => (
      <span className="font-mono text-xs font-semibold text-blue-600">{r.bookingRef}</span>
    )},
    { key: "guest", header: "Guest", render: (r: Booking) => (
      <div>
        <p className="font-medium text-gray-900">
          {r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : "—"}
        </p>
        <p className="text-xs text-gray-400">{r.guest?.email ?? ""}</p>
      </div>
    )},
    { key: "room", header: "Room", render: (r: Booking) => (
      <span>{r.room?.name ?? "—"}</span>
    )},
    { key: "dates", header: "Dates", render: (r: Booking) => (
      <div className="text-xs">
        <p>{formatDate(r.checkIn)} → {formatDate(r.checkOut)}</p>
        <p className="text-gray-400">{r.nights} night{r.nights !== 1 ? "s" : ""}</p>
      </div>
    )},
    { key: "source", header: "Source", render: (r: Booking) => (
      <BookingSourceBadge source={r.source} />
    )},
    { key: "status", header: "Status", render: (r: Booking) => (
      <BookingStatusBadge status={r.status} />
    )},
    { key: "totalAmount", header: "Amount", render: (r: Booking) => (
      <span className="font-semibold text-gray-900">{formatCurrency(r.totalAmount)}</span>
    )},
    { key: "actions", header: "", render: (r: Booking) => (
      <div className="flex items-center gap-2">
        {r.status === "CONFIRMED" && (
          <Button size="sm" variant="success" onClick={() => updateBookingStatus(r.id, "CHECKED_IN")}>
            Check In
          </Button>
        )}
        {r.status === "CHECKED_IN" && (
          <Button size="sm" variant="secondary" onClick={() => updateBookingStatus(r.id, "CHECKED_OUT")}>
            Check Out
          </Button>
        )}
        {["CONFIRMED", "PENDING"].includes(r.status) && (
          <Button size="sm" variant="danger" onClick={() => cancelBooking(r.id)}>
            Cancel
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bookings</h2>
          <p className="text-sm text-gray-500">{total} total bookings</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-1 items-center gap-2 min-w-[200px]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
            placeholder="Search ref, guest name, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700"
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700"
        >
          {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={bookings as Booking[]}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No bookings found"
        onRowClick={(row) => setSelectedBooking(row)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
