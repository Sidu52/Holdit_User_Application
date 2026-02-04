import { userApi } from "@/api/user.api";
import { useQuery } from "@tanstack/react-query";

export const useUser = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: userApi.getUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
};


export const useNearestStore = (lat: number, lng: number) => {
  return useQuery({
    queryKey: ["nearest-store", lat, lng],
    queryFn: () => userApi.getNearestStore(lat, lng),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
};
