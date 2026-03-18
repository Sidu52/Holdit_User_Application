import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { storeApi } from "@/api/stores.api";

interface ApiError {
  message: string;
  status: number;
  data: unknown;
}

export const storeKeys = {
  all: ["stores"] as const,
  // Nearby stores
  nearby: () => [...storeKeys.all, "nearby"] as const,
  nearbyWithParams: (params: Record<string, unknown>) =>
    [...storeKeys.nearby(), params] as const,

  // Search
  search: () => [...storeKeys.all, "search"] as const,
  searchWithParams: (params: Record<string, unknown>) =>
    [...storeKeys.search(), params] as const,

  // Single store detail
  details: () => [...storeKeys.all, "detail"] as const,
  detail: (id: string) => [...storeKeys.details(), id] as const,

  // Nearest (home screen)
  nearest: (lat?: number, lng?: number) =>
    [...storeKeys.all, "nearest", lat, lng] as const,
};

export const useNearestStore = (
  lat?: number,
  lng?: number,
  options?: { enabled?: boolean },
) => {
  return useQuery<
    {
      id: string;
      name: string;
      address: string;
      distance: string;
      isOpen: boolean;
    } | null,
    AxiosError<ApiError>
  >({
    queryKey: storeKeys.nearest(lat, lng),
    queryFn: async () => {
      if (lat === undefined || lng === undefined) {
        throw new Error("Coordinates required");
      }

      const data = await storeApi.getNearbyStores({
        lat,
        lng,
        radius: 5000,
        limit: 1,
        page: 1,
      });

      const store = data.stores[0] ?? null;
      if (!store) return null;

      return {
        id: store._id,
        name: store.store_name,
        address: store.store_address,
        distance: "",
        isOpen: store.is_online,
      };
    },
    enabled:
      lat !== undefined && lng !== undefined && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const useNearbyStores = (params: {
  lat?: number;
  lng?: number;
  radius?: number;
  openNow?: boolean;
  limit?: number;
  page?: number;
}) => {
  const { lat, lng, radius = 5000, openNow, limit = 20, page = 1 } = params;

  return useQuery({
    queryKey: storeKeys.nearbyWithParams({
      lat,
      lng,
      radius,
      openNow,
      limit,
      page,
    }),
    queryFn: () => {
      if (lat === undefined || lng === undefined) {
        throw new Error("Coordinates required");
      }

      return storeApi.getNearbyStores({
        lat,
        lng,
        radius,
        open_now: openNow,
        limit,
        page,
      });
    },
    enabled: lat !== undefined && lng !== undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
};

// ─── HOOK: NEARBY STORES (INFINITE SCROLL) ────────────────────────────────────
export const useNearbyStoresInfinite = (params: {
  lat?: number;
  lng?: number;
  radius?: number;
  openNow?: boolean;
  limit?: number;
}) => {
  const { lat, lng, radius = 5000, openNow, limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: storeKeys.nearbyWithParams({
      lat,
      lng,
      radius,
      openNow,
      limit,
      type: "infinite",
    }),
    queryFn: ({ pageParam = 1 }) => {
      if (lat === undefined || lng === undefined) {
        throw new Error("Coordinates required");
      }

      return storeApi.getNearbyStores({
        lat,
        lng,
        radius,
        open_now: openNow,
        limit,
        page: pageParam,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNextPage) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: lat !== undefined && lng !== undefined,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useSearchStores = (params: {
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  sort?: "distance" | "rating" | "newest";
  openNow?: boolean;
  limit?: number;
  page?: number;
}) => {
  const {
    query,
    lat,
    lng,
    radius = 5000,
    sort = "distance",
    openNow,
    limit = 20,
    page = 1,
  } = params;

  const hasQuery = query !== undefined && query.trim().length >= 2;
  const hasCoords = lat !== undefined && lng !== undefined;

  return useQuery({
    queryKey: storeKeys.searchWithParams({
      query,
      lat,
      lng,
      radius,
      sort,
      openNow,
      limit,
      page,
    }),
    queryFn: () =>
      storeApi.searchStores({
        q: query,
        lat,
        lng,
        radius,
        sort,
        open_now: openNow,
        limit,
        page,
      }),
    enabled: hasQuery || hasCoords,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useSearchStoresInfinite = (params: {
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  sort?: "distance" | "rating" | "newest";
  openNow?: boolean;
  limit?: number;
}) => {
  const {
    query,
    lat,
    lng,
    radius = 5000,
    sort = "distance",
    openNow,
    limit = 20,
  } = params;

  const hasQuery = query !== undefined && query.trim().length >= 2;
  const hasCoords = lat !== undefined && lng !== undefined;

  return useInfiniteQuery({
    queryKey: storeKeys.searchWithParams({
      query,
      lat,
      lng,
      radius,
      sort,
      openNow,
      limit,
      type: "infinite",
    }),
    queryFn: ({ pageParam = 1 }) =>
      storeApi.searchStores({
        q: query,
        lat,
        lng,
        radius,
        sort,
        open_now: openNow,
        limit,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNextPage) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: hasQuery || hasCoords,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useStoreDetail = (storeId?: string) => {
  return useQuery({
    queryKey: storeKeys.detail(storeId ?? ""),
    queryFn: () => {
      if (!storeId) throw new Error("Store ID required");
      return storeApi.getStoreById(storeId);
    },
    enabled: !!storeId && /^[0-9a-fA-F]{24}$/.test(storeId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const usePrefetchStoreDetail = () => {
  const queryClient = useQueryClient();

  return (storeId: string) => {
    if (!storeId || !/^[0-9a-fA-F]{24}$/.test(storeId)) return;

    queryClient.prefetchQuery({
      queryKey: storeKeys.detail(storeId),
      queryFn: () => storeApi.getStoreById(storeId),
      staleTime: 5 * 60 * 1000,
    });
  };
};

export const useInvalidateStores = () => {
  const queryClient = useQueryClient();

  return {
    /** Invalidate all store queries */
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
    },

    /** Invalidate only nearby queries */
    invalidateNearby: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.nearby() });
    },

    /** Invalidate a specific store's detail */
    invalidateDetail: (storeId: string) => {
      queryClient.invalidateQueries({
        queryKey: storeKeys.detail(storeId),
      });
    },

    /** Invalidate search results */
    invalidateSearch: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.search() });
    },
  };
};
