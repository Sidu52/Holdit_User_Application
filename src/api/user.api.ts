import { api } from "./client";
import { NearestStoreResponse, User, ApiResponse, UpdateProfilePayload, CompleteProfilePayload, CompleteProfileResponse, UserAddress, CreateAddressPayload, UpdateAddressPayload } from "@/features/auth/authTypes";

// TYPES
interface Location {
  type: string;
  coordinates: [number, number];
}

interface Store {
  _id: string;
  store_name: string;
  store_address: string;
  store_open_time: string;
  store_close_time: string;
  location: Location;
  distance?: number;
}

// API FUNCTIONS
export const userApi = {
  // PROFILE

  getProfile: async (): Promise<User> => {
    const res = await api.get<ApiResponse<User>>("/user/profile");
    return res.data.data;
  },

  updateProfile: async (data: UpdateProfilePayload): Promise<User> => {
    const res = await api.put<ApiResponse<User>>("/user/profile", data);
    return res.data.data;
  },

  completeProfile: async (
    data: CompleteProfilePayload,
  ): Promise<CompleteProfileResponse> => {
    const res = await api.put<ApiResponse<CompleteProfileResponse>>(
      "/user/auth/complete-profile",
      data,
    );
    return res.data.data;
  },

  getNearestStore: async (
    lat: number,
    lng: number,
    maxDistance: number = 5000,
  ): Promise<NearestStoreResponse> => {
    const res = await api.get<ApiResponse<NearestStoreResponse>>(
      "/user/stores/nearest",
      {
        params: { lat, lng, max_distance: maxDistance },
      },
    );
    return res.data.data;
  },

  // Get store details by ID
  getStoreById: async (storeId: string): Promise<Store> => {
    const res = await api.get<ApiResponse<Store>>(`/user/stores/${storeId}`);
    return res.data.data;
  },

  // ADDRESS
  getAllAddresses: async (): Promise<UserAddress[]> => {
    const res = await api.get<ApiResponse<{ addresses: UserAddress[] }>>(
      "/user/addresses",
    );
    return res.data.data.addresses;
  },

  getAddressById: async (id: string): Promise<UserAddress> => {
    const res = await api.get<ApiResponse<UserAddress>>(`/user/address/${id}`);
    return res.data.data;
  },

  createAddress: async (data: CreateAddressPayload): Promise<UserAddress> => {
    const res = await api.post<ApiResponse<UserAddress>>(
      "/user/addresses",
      data,
    );
    return res.data.data;
  },

  updateAddress: async (
    id: string,
    data: UpdateAddressPayload,
  ): Promise<UserAddress> => {
    const res = await api.put<ApiResponse<UserAddress>>(
      `/user/address/${id}`,
      data,
    );
    return res.data.data;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/user/address/${id}`);
  },
};
