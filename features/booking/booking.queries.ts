// queries/booking.queries.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { bookingApi } from "@/api/booking.api";

// ============================================
// TYPES
// ============================================
interface ApiError {
  message: string;
  status: number;
  data: unknown;
}

interface SchedulePickupPayload {
  pickupLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  pickupScheduledAt: string;
  luggage: {
    small?: number;
    medium?: number;
    large?: number;
    other?: number;
  };
  notes?: string;
}

interface CancelBookingPayload {
  bookingId: string;
  reason: string;
}

interface RequestReturnPayload {
  bookingId: string;
  returnLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  returnScheduledAt: string;
  notes?: string;
}

// ============================================
// QUERY KEYS
// ============================================
export const bookingKeys = {
  all: ["bookings"] as const,
  lists: () => [...bookingKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...bookingKeys.lists(), filters] as const,
  detail: (id: string) => [...bookingKeys.all, "detail", id] as const,
};

// ============================================
// 1. GET MY BOOKINGS
// ============================================
export const useMyBookings = (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: bookingKeys.list(params || {}),
    queryFn: () => bookingApi.getBookings(params),
    staleTime: 60 * 1000, // 1 minute
  });
};

// ============================================
// 2. GET BOOKING BY ID
// ============================================
export const useBookingDetail = (bookingId: string) => {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId),
    queryFn: () => bookingApi.getBookingById(bookingId),
    enabled: !!bookingId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// ============================================
// 3. SCHEDULE PICKUP
// ============================================
export const useSchedulePickup = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { bookingId: string; status: string },
    AxiosError<ApiError>,
    SchedulePickupPayload
  >({
    mutationFn: (data) => bookingApi.schedulePickup(data),

    onSuccess: () => {
      // Invalidate booking list
      queryClient.invalidateQueries({
        queryKey: bookingKeys.lists(),
      });
    },
  });
};

// ============================================
// 4. CANCEL BOOKING
// ============================================
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, CancelBookingPayload>({
    mutationFn: ({ bookingId, reason }) =>
      bookingApi.cancelBooking(bookingId, { reason }),

    onSuccess: (_, { bookingId }) => {
      // Invalidate specific booking and list
      queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(bookingId),
      });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.lists(),
      });
    },
  });
};

// ============================================
// 5. REQUEST RETURN
// ============================================
export const useRequestReturn = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { bookingId: string; status: string },
    AxiosError<ApiError>,
    RequestReturnPayload
  >({
    mutationFn: ({ bookingId, ...data }) =>
      bookingApi.requestReturn(bookingId, data),

    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(bookingId),
      });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.lists(),
      });
    },
  });
};
