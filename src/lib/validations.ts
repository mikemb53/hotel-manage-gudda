import { z } from "zod";

// ─── Room schemas ─────────────────────────────────────────────────────────────
export const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  floorNumber: z.number().int().optional(),
  basePrice: z.number().positive("Base price must be positive"),
  roomTypeId: z.string().min(1, "Room type is required"),
  propertyId: z.string().min(1, "Property is required"),
});

export const updateRoomSchema = createRoomSchema.partial().omit({ propertyId: true });

// ─── Booking schemas ──────────────────────────────────────────────────────────
export const createBookingSchema = z.object({
  roomId: z.string().min(1),
  channelId: z.string().optional(),
  channelRef: z.string().optional(),
  source: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  adults: z.number().int().min(1).max(10),
  children: z.number().int().min(0).max(10).optional(),
  totalAmount: z.number().positive(),
  commissionRate: z.number().min(0).max(100).optional(),
  specialRequests: z.string().optional(),
  guest: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    country: z.string().optional(),
  }),
});

// ─── Rate plan schemas ────────────────────────────────────────────────────────
export const createRatePlanSchema = z.object({
  roomId: z.string().min(1),
  name: z.string().min(1, "Rate plan name is required"),
  type: z.enum(["STANDARD", "WEEKEND", "SEASONAL", "PROMOTIONAL", "LONG_STAY"]),
  price: z.number().positive("Price must be positive"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  minStay: z.number().int().min(1).optional(),
});

// ─── Availability schema ──────────────────────────────────────────────────────
export const updateAvailabilitySchema = z.object({
  roomId: z.string().min(1),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  isBlocked: z.boolean(),
  minStay: z.number().int().min(1).optional(),
});

// ─── Channel schema ───────────────────────────────────────────────────────────
export const createChannelSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum([
    "AIRBNB",
    "BOOKING_COM",
    "GOIBIBO",
    "MAKEMYTRIP",
    "AGODA",
    "EXPEDIA",
    "ICAL",
    "DIRECT",
  ]),
  icalUrl: z.string().url().optional().or(z.literal("")),
  credentials: z.record(z.string(), z.string()).optional(),
});

// ─── Auth schemas ─────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
