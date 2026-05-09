import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays, parseISO } from "date-fns";

// ─── Tailwind class merging ───────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function formatDate(date: Date | string, fmt = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatCurrency(
  amount: number | string,
  currency = "INR"
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export function calculateNights(checkIn: string, checkOut: string): number {
  return differenceInDays(parseISO(checkOut), parseISO(checkIn));
}

// ─── Booking reference generator ─────────────────────────────────────────────
export function generateBookingRef(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `HCM-${year}-${random}`;
}

// ─── Date range generator (inclusive of both start and end) ─────────────────
export function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = parseISO(start);
  const endDate = parseISO(end);
  while (current <= endDate) {
    dates.push(format(current, "yyyy-MM-dd"));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ─── Occupancy rate ───────────────────────────────────────────────────────────
export function calculateOccupancyRate(
  occupied: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((occupied / total) * 100);
}

// ─── API error handler ────────────────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}
