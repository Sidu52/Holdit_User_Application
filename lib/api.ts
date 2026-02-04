import axios from "axios";
import { tokenService } from "@/services/token";

/* ------------------ REFRESH STATE ------------------ */
let isRefreshing = false;

type FailedRequest = {
  resolve: (token: string) => void;
  reject: (error: any) => void;
};

let failedQueue: FailedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token as string);
  });
  failedQueue = [];
};

/* ------------------ AXIOS INSTANCE ------------------ */
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ------------------ REQUEST INTERCEPTOR ------------------ */
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

/* ------------------ RESPONSE INTERCEPTOR ------------------ */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If refresh token API itself fails → logout
    if (originalRequest?.url?.includes("/auth/refresh")) {
      await tokenService.clear();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenService.getRefreshToken();

        if (!refreshToken) {
          throw new Error("Refresh token missing");
        }

        const refreshResponse = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken },
        );

        const { accessToken, refreshToken: newRefreshToken } =
          refreshResponse.data.data;

        await tokenService.setTokens(accessToken, newRefreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await tokenService.clear();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Normal error
    return Promise.reject({
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  },
);
