// src/services/location.ts
import * as Location from "expo-location";

export async function getUserLocation() {
  console.log("ENTER TO LOCATION");
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission denied");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  console.log("get USER LOCATION", location);
  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
  };
}
