import { authApi } from "@/api/auth.client";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

export const useSendOtp = () => {
  return useMutation({
    mutationFn: (phone: string) => authApi.authUser(phone),
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: (phone: string) => authApi.resendOtp(phone),
  });
};

type VerifyOtpPayload = {
  phone: string;
  code: string;
};

type VerifyOtpResponse = {
  accessToken: string;
  refreshToken: string;
  user: any;
};

type ApiError = {
  message: string;
  statusCode?: number;
};

export const useVerifyOtp = () => {
  return useMutation<VerifyOtpResponse, AxiosError<ApiError>, VerifyOtpPayload>(
    {
      mutationFn: (data) => authApi.verifyOtp(data.phone, data.code),
    },
  );
};

interface SignupUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
  dob: string;
  address: string;
  lat: number;
  lng: number;
}

export const useSignupUser = () => {
  return useMutation<any, any, SignupUserPayload>({
    mutationFn: (data) => authApi.signupUser(data),
  });
};
