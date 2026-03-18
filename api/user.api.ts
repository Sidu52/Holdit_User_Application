import { api } from "@/lib/api";
import { NearestStoreResponse, User } from "@/types/api.types";

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
interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  gender?: string;
  dob?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
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
};
