import { api } from '../client';

export const bookingEndpoints = {
  getBookings: () => api.get('/user/booking'),
  getBookingHistory: () => api.get('/user/booking/history'),
  getActiveBooking: () => api.get('/user/booking/active'),
  getBooking: (id: string) => api.get(`/user/booking/${id}`),
  createBooking: (data: any) => api.post('/user/booking', data),
  cancelBooking: (id: string, data?: { reason: string }) => api.put(`/user/booking/${id}/cancel`, data),
  assignStore: (id: string) => api.get(`/user/booking/${id}/assign-store`),
  assignDriver: (id: string) => api.get(`/user/booking/${id}/assign-driver`),
};
