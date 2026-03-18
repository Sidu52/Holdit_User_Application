// queries/user.queries.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { userApi } from "@/api/user.api";
import { ApiError, UpdateProfilePayload, User } from "@/types/api.types";

// ============================================
// QUERY KEYS
// ============================================
export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  nearestStore: (location: [number, number]) =>
    [...userKeys.all, "nearest-store", location] as const,
};

// ============================================
// 1. GET PROFILE
// ============================================
export const useProfile = () => {
  return useQuery<User, AxiosError<ApiError>>({
    queryKey: userKeys.profile(),
    queryFn: () => userApi.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401 (handled by interceptor)
      if (error.response?.status === 401) return false;
      return failureCount < 2;
    },
  });
};

// ============================================
// 2. UPDATE PROFILE
// ============================================
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<User, AxiosError<ApiError>, UpdateProfilePayload>({
    mutationFn: (data) => userApi.updateProfile(data),

    onSuccess: (updatedUser) => {
      // Update cache directly
      queryClient.setQueryData(userKeys.profile(), updatedUser);
    },
  });
};

// ============================================
// 3. GET NEAREST STORE
// ============================================
export const useNearestStore = (location: [number, number] | null) => {
  return useQuery({
    queryKey: userKeys.nearestStore(location!),
    queryFn: () => userApi.getNearestStore(...location!),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
