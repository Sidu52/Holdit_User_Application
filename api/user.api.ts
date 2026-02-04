import { api } from "@/lib/api";

export const userApi = {
  getUser: async () => {
    const res = await api.get("/profile");
    console.log("res", res.data);
    return res.data.data;
  },

  getNearestStore: async (lat: number, lng: number) => {
    const res = await api.post("/get-nearest-store", { lat, lng });
    return res.data.data;
  },
};
