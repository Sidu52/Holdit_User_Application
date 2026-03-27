import { useQuery } from "@tanstack/react-query";
import { getUserLocation } from "@/hooks/useLocation";

export function useUserLocation() {
  return useQuery({
    queryKey: ["user-location"],
    queryFn: getUserLocation,
    enabled: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
