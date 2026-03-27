import { api } from '../client';

export const authEndpoints = {
  login: (phone: string) => api.post('/user/auth/login', { phone }),
  resendOtp: (phone: string) => api.post('/user/auth/resend-otp', { phone }),
  verifyOtp: (data: { phone: string; otp: string }) => api.post('/user/auth/verify-otp', data),
  completeProfile: (data: any) => api.put('/user/auth/complete-profile', data),
  logout: () => api.post('/user/auth/logout'),
};
