import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { bookingEndpoints } from '../../api/endpoints/booking';
import { setActiveBooking } from './bookingSlice';

export const QUERY_KEYS = {
  bookings: ['bookings'],
  bookingHistory: ['bookings', 'history'],
  activeBooking: ['bookings', 'active'],
  booking: (id: string) => ['bookings', id],
};

export const useBookings = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookings,
    queryFn: async () => {
      const response = await bookingEndpoints.getBookings();
      return response.data?.data?.bookings || response.data?.data || [];
    },
  });
};

export const useBookingHistory = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookingHistory,
    queryFn: async () => {
      const response = await bookingEndpoints.getBookingHistory();
      return response.data?.data?.bookings || response.data?.data || [];
    },
  });
};

export const useActiveBooking = () => {
  const dispatch = useDispatch();
  return useQuery({
    queryKey: QUERY_KEYS.activeBooking,
    queryFn: async () => {
      const response = await bookingEndpoints.getActiveBooking();
      const booking = response.data?.data;
      dispatch(setActiveBooking(booking || null));
      return booking;
    },
  });
};

export const useBooking = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.booking(id),
    queryFn: async () => {
      const response = await bookingEndpoints.getBooking(id);
      return response.data?.data;
    },
    enabled: !!id,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingEndpoints.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeBooking });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => bookingEndpoints.cancelBooking(id, { reason }),
    onSuccess: (_, variables) => {
      dispatch(setActiveBooking(null));
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookingHistory });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeBooking });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.booking(variables.id) });
    },
  });
};

export const useAssignStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingEndpoints.assignStore,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeBooking });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.booking(id as string) });
    },
  });
};

export const useAssignDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingEndpoints.assignDriver,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeBooking });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.booking(id as string) });
    },
  });
};
