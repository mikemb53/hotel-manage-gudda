import { Badge } from "@/components/ui/Badge";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from "@/config/constants";
import { cn } from "@/lib/utils";

interface BookingStatusBadgeProps {
  status: string;
}

const statusToVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "outline"> = {
  PENDING: "warning",
  CONFIRMED: "info",
  CHECKED_IN: "success",
  CHECKED_OUT: "outline",
  CANCELLED: "danger",
  NO_SHOW: "warning",
};

const sourceColors: Record<string, string> = {
  DIRECT: "bg-green-100 text-green-700",
  AIRBNB: "bg-rose-100 text-rose-700",
  BOOKING_COM: "bg-blue-100 text-blue-700",
  GOIBIBO: "bg-orange-100 text-orange-700",
  MAKEMYTRIP: "bg-red-100 text-red-700",
  AGODA: "bg-purple-100 text-purple-700",
  EXPEDIA: "bg-yellow-100 text-yellow-700",
  ICAL: "bg-gray-100 text-gray-700",
  OTHER: "bg-gray-100 text-gray-700",
};

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  return (
    <Badge variant={statusToVariant[status] ?? "default"}>
      {BOOKING_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function BookingSourceBadge({ source }: { source: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        sourceColors[source] ?? "bg-gray-100 text-gray-700"
      )}
    >
      {source.replace(/_/g, " ")}
    </span>
  );
}
