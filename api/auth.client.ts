import { api } from "@/lib/api";

export const authApi = {
  // auth user
  authUser: (phone: string) => api.post("/auth/login", { phone }),

  // resent-otp
  resendOtp: (phone: string) => api.post("/auth/resend-otp", { phone }),

  // verify-otp
  verifyOtp: async (phone: string, code: string) => {
    const res = await api.post("/auth/verify-otp", { phone, otp: code });
    return res.data.data;
  },

  // Signup User pass a accessToken
  signupUser: async (data: any) => {
    await api.post("/auth/update-user-details", data);
  },
};
