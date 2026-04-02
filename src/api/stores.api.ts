import { api } from "./client";
import {
  NearestStoreResponse,
  Store,
  ApiResponse
} from "@/features/auth/authTypes";


interface NearbyStoresParams {
  lat: number;
  lng: number;
  radius?: number;
  open_now?: boolean;
  limit?: number;
  page?: number;
}

interface SearchStoresParams {
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  sort?: "distance" | "rating" | "newest";
  open_now?: boolean;
  limit?: number;
  page?: number;
}

interface StoreListData {
  stores: Store[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  meta: {
    query: string | null;
    searchType: "text" | "geo" | "text_geo" | "nearby";
    coordinates: { lat: number; lng: number } | null;
    radiusMeters: number | null;
    sort: string;
    filters: {
      openNow: boolean;
    };
  };
}

interface StoreDetailData {
  store: Store & {
    available_capacity: number;
  };
}

const isValidLatitude = (lat: number): boolean => {
  return typeof lat === "number" && !isNaN(lat) && lat >= -90 && lat <= 90;
};
const isValidLongitude = (lng: number): boolean => {
  return typeof lng === "number" && !isNaN(lng) && lng >= -180 && lng <= 180;
};
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
const sanitizeQuery = (query: string): string => {
  return query
    .trim()
    .replace(/[<>{}$]/g, "")
    .slice(0, 100);
};

export const storeApi = {
  getNearbyStores: async (
    params: NearbyStoresParams
  ): Promise<StoreListData> => {
    const { lat, lng, radius = 5000, open_now, limit = 20, page = 1 } = params;
    if (!isValidLatitude(lat)) {
      throw new Error("Invalid latitude. Must be between -90 and 90.");
    }

    if (!isValidLongitude(lng)) {
      throw new Error("Invalid longitude. Must be between -180 and 180.");
    }

    const res = await api.get<ApiResponse<StoreListData>>(
      "/user/stores/nearby",
      {
        params: {
          lat,
          lng,
          radius: Math.min(Math.max(radius, 100), 50000),
          ...(open_now !== undefined && { open_now: String(open_now) }),
          limit: Math.min(Math.max(limit, 1), 50),
          page: Math.max(page, 1),
        },
      }
    );

    return res.data.data;
  },
  
  searchStores: async (
    params: SearchStoresParams
  ): Promise<StoreListData> => {
    const {
      q,
      lat,
      lng,
      radius = 5000,
      sort = "distance",
      open_now,
      limit = 20,
      page = 1,
    } = params;
    const hasQuery = q && q.trim().length >= 2;
    const hasCoords = lat !== undefined && lng !== undefined;

    if (!hasQuery && !hasCoords) {
      throw new Error(
        "Please provide a search query or location coordinates."
      );
    }

    // Validate coordinates if provided
    if (lat !== undefined && !isValidLatitude(lat)) {
      throw new Error("Invalid latitude. Must be between -90 and 90.");
    }

    if (lng !== undefined && !isValidLongitude(lng)) {
      throw new Error("Invalid longitude. Must be between -180 and 180.");
    }

    // Both coordinates must be present if one is provided
    if (
      (lat !== undefined && lng === undefined) ||
      (lat === undefined && lng !== undefined)
    ) {
      throw new Error("Both latitude and longitude are required together.");
    }

    // Build clean params
    const queryParams: Record<string, string | number> = {
      limit: Math.min(Math.max(limit, 1), 50),
      page: Math.max(page, 1),
      sort,
    };

    if (hasQuery) {
      queryParams.q = sanitizeQuery(q!);
    }

    if (hasCoords) {
      queryParams.lat = lat!;
      queryParams.lng = lng!;
      queryParams.radius = Math.min(Math.max(radius, 100), 50000);
    }

    if (open_now !== undefined) {
      queryParams.open_now = String(open_now);
    }

    const res = await api.get<ApiResponse<StoreListData>>(
      "/user/stores/search",
      { params: queryParams }
    );

    return res.data.data;
  },

  getStoreById: async (storeId: string): Promise<StoreDetailData> => {
    if (!storeId || typeof storeId !== "string") {
      throw new Error("Store ID is required.");
    }

    const trimmedId = storeId.trim();

    if (!isValidObjectId(trimmedId)) {
      throw new Error("Invalid store ID format.");
    }

    const res = await api.get<ApiResponse<StoreDetailData>>(
      `/user/stores/${trimmedId}`
    );

    return res.data.data;
  },
};