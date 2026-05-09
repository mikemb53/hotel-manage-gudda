// ─── Re-exports from generated Prisma types ───────────────────────────────────
export type {
  User,
  Property,
  Room,
  RoomType,
  Booking,
  Guest,
  Channel,
  Availability,
  RatePlan,
  SyncLog,
} from "@/generated/prisma/client";

export {
  UserRole,
  RoomStatus,
  BookingStatus,
  BookingSource,
  ChannelType,
  SyncStatus,
  SyncLogType,
  RatePlanType,
} from "@/generated/prisma/client";

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  monthlyRevenue: number;
  occupancyRate: number;
  pendingBookings: number;
}

// ─── Calendar Types ───────────────────────────────────────────────────────────

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  isBlocked: boolean;
  booking?: {
    id: string;
    bookingRef: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    status: string;
    source: string;
  };
}

export interface RoomCalendar {
  roomId: string;
  roomName: string;
  roomNumber: string;
  days: CalendarDay[];
}

// ─── Channel Sync Types ───────────────────────────────────────────────────────

export interface ChannelCredentials {
  apiKey?: string;
  apiSecret?: string;
  propertyId?: string;
  hotelId?: string;
  username?: string;
  password?: string;
}

export interface SyncResult {
  channelId: string;
  channelName: string;
  success: boolean;
  bookingsSynced?: number;
  availabilityPushed?: boolean;
  ratesPushed?: boolean;
  error?: string;
}

// ─── Form Input Types ─────────────────────────────────────────────────────────

export interface CreateRoomInput {
  name: string;
  roomNumber: string;
  floorNumber?: number;
  basePrice: number;
  roomTypeId: string;
  propertyId: string;
}

export interface CreateBookingInput {
  roomId: string;
  channelId?: string;
  channelRef?: string;
  source: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  totalAmount: number;
  commissionRate?: number;
  specialRequests?: string;
  guest: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    country?: string;
  };
}

export interface UpdateAvailabilityInput {
  roomId: string;
  dates: string[]; // YYYY-MM-DD
  isBlocked: boolean;
  minStay?: number;
}

export interface CreateRatePlanInput {
  roomId: string;
  name: string;
  type: string;
  price: number;
  startDate?: string;
  endDate?: string;
  daysOfWeek?: number[];
  minStay?: number;
}
