// queries/user.queries.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { userApi } from "@/api/user.api";
import { ApiError, UpdateProfilePayload, User, CompleteProfilePayload, CompleteProfileResponse, UserAddress, CreateAddressPayload, UpdateAddressPayload } from "@/features/auth/authTypes";

// ============================================
// QUERY KEYS
// ============================================
export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  addresses: () => [...userKeys.all, "addresses"] as const,
  address: (id: string) => [...userKeys.all, "address", id] as const,
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
// 2b. COMPLETE PROFILE
// ============================================
export const useCompleteProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<CompleteProfileResponse, AxiosError<ApiError>, CompleteProfilePayload>({
    mutationFn: (data) => userApi.completeProfile(data),

    onSuccess: (res) => {
      // Update profile cache with the user from response
      queryClient.setQueryData(userKeys.profile(), res.user);
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
    enabled: !!location,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// ============================================
// 4. ADDRESSES
// ============================================
export const useAddresses = () => {
  return useQuery<UserAddress[], AxiosError<ApiError>>({
    queryKey: userKeys.addresses(),
    queryFn: () => userApi.getAllAddresses(),
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<UserAddress, AxiosError<ApiError>, CreateAddressPayload>({
    mutationFn: (data) => userApi.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.addresses() });
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<
    UserAddress,
    AxiosError<ApiError>,
    { id: string; data: UpdateAddressPayload }
  >({
    mutationFn: ({ id, data }) => userApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.addresses() });
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<ApiError>, string>({
    mutationFn: (id) => userApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.addresses() });
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
};
