// Application-wide constants

export const APP_NAME = "HotelSync";
export const APP_VERSION = "1.0.0";

// ─── Pagination defaults ──────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── Booking statuses ─────────────────────────────────────────────────────────
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  CHECKED_OUT: "Checked Out",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  CHECKED_IN: "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-orange-100 text-orange-800",
};

// ─── Room statuses ────────────────────────────────────────────────────────────
export const ROOM_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Maintenance",
  BLOCKED: "Blocked",
};

export const ROOM_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  OCCUPIED: "bg-blue-100 text-blue-800",
  MAINTENANCE: "bg-yellow-100 text-yellow-800",
  BLOCKED: "bg-red-100 text-red-800",
};

// ─── Sync status colors ───────────────────────────────────────────────────────
export const SYNC_STATUS_COLORS: Record<string, string> = {
  IDLE: "bg-gray-100 text-gray-600",
  SYNCING: "bg-blue-100 text-blue-600",
  SUCCESS: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

// ─── Days of week ─────────────────────────────────────────────────────────────
export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// ─── Common countries ─────────────────────────────────────────────────────────
export const POPULAR_COUNTRIES = [
  "India", "United States", "United Kingdom", "Australia",
  "Canada", "Germany", "France", "Japan", "Singapore", "UAE",
];

// ─── Currencies ───────────────────────────────────────────────────────────────
export const CURRENCIES = [
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "AED", label: "UAE Dirham (AED)" },
];

// ─── Timezones ────────────────────────────────────────────────────────────────
export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];
