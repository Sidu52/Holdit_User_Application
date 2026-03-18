import { api } from "@/lib/api";

// TYPES
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ---- Location ----
interface Location {
  lat: number;
  lng: number;
  address?: string;
}

// ---- Luggage ----
interface Luggage {
  small?: number;
  medium?: number;
  large?: number;
  other?: number;
}

// ---- Timeline Entry ----
interface TimelineEntry {
  status: string;
  note: string;
  timestamp: string;
}

// ---- Booking ----
interface Booking {
  _id: string;
  userId: string;
  status: string;
  pickupLocation: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  luggage: Luggage & { totalBags: number };
  pickup: {
    scheduledAt: string;
  };
  returnLocation?: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  return?: {
    scheduledAt: string;
    requestedAt: string;
    notes: string;
  };
  cancellation?: {
    reason: string;
    cancelledBy: string;
    cancelledAt: string;
  };
  timeline: TimelineEntry[];
  notes: string;
  createdAt: string;
}

// ---- Pagination ----
interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ---- List Response ----
interface BookingListResponse {
  bookings: Booking[];
  pagination: Pagination;
}

// ---- Schedule Pickup ----
interface SchedulePickupPayload {
  pickupLocation: Location;
  pickupScheduledAt: string; // ISO date string
  luggage: Luggage;
  notes?: string;
}

interface SchedulePickupResponse {
  bookingId: string;
  status: string;
  scheduledAt: string;
  totalBags: number;
}

// ---- Cancel Booking ----
interface CancelBookingPayload {
  reason: string;
}

// ---- Request Return ----
interface RequestReturnPayload {
  returnLocation: Location;
  returnScheduledAt: string; // ISO date string
  notes?: string;
}

interface RequestReturnResponse {
  bookingId: string;
  status: string;
  returnScheduledAt: string;
}

// ---- Query Params ----
interface BookingQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  sort_order?: "asc" | "desc";
}

// API FUNCTIONS
export const bookingApi = {
  // SCHEDULE PICKUP
  schedulePickup: async (
    payload: SchedulePickupPayload,
  ): Promise<SchedulePickupResponse> => {
    const res = await api.post<ApiResponse<SchedulePickupResponse>>(
      "/user/bookings/pickup",
      payload,
    );
    return res.data.data;
  },

  // GET MY BOOKINGS (paginated)
  getBookings: async (
    params: BookingQueryParams = {},
  ): Promise<BookingListResponse> => {
    const res = await api.get<ApiResponse<BookingListResponse>>(
      "/user/bookings",
      { params },
    );
    return res.data.data;
  },

  // GET BOOKING BY ID
  getBookingById: async (bookingId: string): Promise<Booking> => {
    const res = await api.get<ApiResponse<Booking>>(
      `/user/bookings/${bookingId}`,
    );
    return res.data.data;
  },

  // CANCEL BOOKING
  cancelBooking: async (
    bookingId: string,
    payload: CancelBookingPayload,
  ): Promise<void> => {
    await api.post<ApiResponse<null>>(
      `/user/bookings/${bookingId}/cancel`,
      payload,
    );
  },

  // REQUEST RETURN OF LUGGAGE
  requestReturn: async (
    bookingId: string,
    payload: RequestReturnPayload,
  ): Promise<RequestReturnResponse> => {
    const res = await api.post<ApiResponse<RequestReturnResponse>>(
      `/user/bookings/${bookingId}/return`,
      payload,
    );
    return res.data.data;
  },
};
