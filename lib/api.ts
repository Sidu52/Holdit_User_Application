import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenService } from "@/services/token";

// TYPES
interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

interface ApiError {
  message: string;
  status: number;
  data: unknown;
}

// REFRESH STATE
let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

// Auth failure callback — set by AuthProvider
let onAuthFailure: (() => void) | null = null;

export const setAuthFailureHandler = (handler: () => void) => {
  onAuthFailure = handler;
};

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token as string);
    }
  });
  failedQueue = [];
};

const handleAuthFailure = async () => {
  await tokenService.clear();
  onAuthFailure?.();
};

// AXIOS INSTANCE
const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL is not defined");
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Separate instance for refresh to avoid interceptor loop
const refreshApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  async (config) => {
    const accessToken = await tokenService.getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  // Success
  (response) => response,

  // Error
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Not a 401 — reject normally
    if (error.response?.status !== 401) {
      return Promise.reject(formatError(error));
    }

    // Already retried — give up
    if (originalRequest._retry) {
      await handleAuthFailure();
      return Promise.reject(formatError(error));
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    // Start refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await tokenService.getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Use separate axios instance to avoid interceptor loop
      const response = await refreshApi.post("/user/auth/refresh", {
        refreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        response.data.data;

      // Store new tokens
      await tokenService.setTokens(newAccessToken, newRefreshToken);

      // Process queued requests
      processQueue(null, newAccessToken);

      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed — clear everything
      processQueue(refreshError as AxiosError, null);
      await handleAuthFailure();
      return Promise.reject(formatError(refreshError as AxiosError));
    } finally {
      isRefreshing = false;
    }
  },
);

// Error formatter to ensure consistent error objects
const formatError = (error: AxiosError): ApiError => {
  const responseData = error.response?.data as { message?: string } | undefined;

  return {
    message: responseData?.message || error.message || "Something went wrong",
    status: error.response?.status || 500,
    data: error.response?.data || null,
  };
};
