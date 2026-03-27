import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenService } from "../utils/tokenManager";
import { store } from "../store";
import { clearAuth, setTokens } from "../features/auth/authSlice";

// TYPES
interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

export interface ApiError {
  message: string;
  status: number;
  data: unknown;
}

// REFRESH STATE
let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

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
  store.dispatch(clearAuth());
};

// AXIOS INSTANCE
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.101:5000/api/v1";

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
console.log('REQUEST:', config.method?.toUpperCase(), `${config.baseURL || ''}${config.url || ''}`);
console.log('=== API REQUEST ===');
    console.log('URL:', `${config.baseURL || ''}${config.url || ''}`);
    console.log('Method:', config.method?.toUpperCase());
    console.log('Data:', JSON.stringify(config.data));
    console.log('==================');
    return config;
  },
  (error) => Promise.reject(error),
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
      console.log('=== API ERROR ===');
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('Request made?', !!error.request);
    console.log('Got response?', !!error.response);
    console.log('Response status:', error.response?.status);
    console.log('Response data:', error.response?.data);
    console.log('=================');
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401) {
      return Promise.reject(formatError(error));
    }

    if (originalRequest._retry) {
      await handleAuthFailure();
      return Promise.reject(formatError(error));
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await tokenService.getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await refreshApi.post("/user/auth/refresh", {
        refreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        response.data.data;

      await tokenService.setTokens(newAccessToken, newRefreshToken);
      store.dispatch(setTokens({ access: newAccessToken, refresh: newRefreshToken }));
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      await handleAuthFailure();
      return Promise.reject(formatError(refreshError as AxiosError));
    } finally {
      isRefreshing = false;
    }
  },
);

const formatError = (error: AxiosError): ApiError => {
  const responseData = error.response?.data as { message?: string } | undefined;

  return {
    message: responseData?.message || error.message || "Something went wrong",
    status: error.response?.status || 500,
    data: error.response?.data || null,
  };
};
