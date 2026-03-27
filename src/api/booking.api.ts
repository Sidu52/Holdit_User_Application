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
