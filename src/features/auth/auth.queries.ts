import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { authApi } from "@/api/auth.client";
import { tokenService } from "@/utils/tokenManager";

// Import from SAME source as authApi
import type {
  ApiError,
  LoginResponse,
  ResendOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
  CompleteProfilePayload,
  CompleteProfileResponse,
} from "@/features/auth/authTypes";

export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
};

// SEND OTP
export const useSendOtp = () => {
  return useMutation<LoginResponse, AxiosError<ApiError>, string>({
    mutationFn: (phone) => authApi.login(phone),
  });
};

// RESEND OTP
export const useResendOtp = () => {
  return useMutation<ResendOtpResponse, AxiosError<ApiError>, string>({
    mutationFn: (phone) => authApi.resendOtp(phone),
  });
};

// VERIFY OTP
export const useVerifyOtp = () => {
  const queryClient = useQueryClient();

  return useMutation<VerifyOtpResponse, AxiosError<ApiError>, VerifyOtpPayload>(
    {
      mutationFn: ({ phone, otp }) => authApi.verifyOtp(phone, otp),

      onSuccess: async (data) => {
        if (data.accessToken && data.refreshToken) {
          await tokenService.setTokens(data.accessToken, data.refreshToken);
        }

        queryClient.invalidateQueries({
          queryKey: authKeys.profile(),
        });
      },
    },
  );
};

// COMPLETE PROFILE
export const useCompleteProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CompleteProfileResponse,
    AxiosError<ApiError>,
    CompleteProfilePayload
  >({
    mutationFn: (data) => authApi.completeProfile(data),

    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.profile(), data.user);
      queryClient.invalidateQueries({
        queryKey: authKeys.profile(),
      });
    },
  });
};

// LOGOUT
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, void>({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        // Ignore
      }
    },

    onSettled: async () => {
      await tokenService.clear();
      queryClient.clear();
    },
  });
};
