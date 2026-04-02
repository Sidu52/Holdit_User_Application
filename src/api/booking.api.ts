import { api } from "./client";
import {
  ApiResponse,
  Location,
  Luggage,
  TimelineEntry,
  Booking,
  Pagination,
  BookingListResponse,
  SchedulePickupPayload,
  SchedulePickupResponse,
  CancelBookingPayload,
  RequestReturnPayload,
  RequestReturnResponse,
  BookingQueryParams
} from "@/features/auth/authTypes";


// API FUNCTIONS
export const bookingApi = {
  // SCHEDULE PICKUP
  schedulePickup: async (
    payload: SchedulePickupPayload,
  ): Promise<SchedulePickupResponse> => {
    const res = await api.post<ApiResponse<SchedulePickupResponse>>(
      "/user/booking",
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
      `/user/booking/${bookingId}`,
    );
    return res.data.data;
  },

  // GET ACTIVE BOOKING
  getActiveBooking: async (): Promise<{ bookings: Booking[]; total: number } | null> => {
    const res = await api.get<ApiResponse<{ bookings: Booking[]; total: number }>>(
      `/user/booking/active`,
    );
    return res.data.data ? res.data.data : null;
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
      `/user/booking/${bookingId}/return-request`,
      payload,
    );
    return res.data.data;
  },
};
