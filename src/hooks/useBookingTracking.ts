import { useState, useEffect, useCallback } from "react";
import { useSocket } from "@/app/SocketProvider";

export interface DriverLocation {
  bookingId: string;
  lat: number;
  lng: number;
  heading: number;
  lastUpdatedAt: string;
}

export const useBookingTracking = (bookingId: string | undefined) => {
  const { emit, on, off, isConnected } = useSocket();
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || !isConnected) return;

    console.log(`Subscribing to booking tracking: ${bookingId}`);
    
    // Subscribe to booking tracking
    emit("user:booking:subscribe", { bookingId });

    // Handle incoming driver location updates
    const handleLocationUpdate = (data: DriverLocation) => {
      console.log("Socket Event: driver:location:update", data);
      if (data.bookingId === bookingId) {
        setDriverLocation(data);
      }
    };

    // Handle generic errors related to this booking's tracking
    const handleError = (data: { message: string }) => {
      console.warn("Socket Event: tracking_error", data);
      setError(data.message);
    };

    on("driver:location:update", handleLocationUpdate);
    on("error", handleError);

    return () => {
      console.log(`Unsubscribing from booking tracking: ${bookingId}`);
      emit("user:booking:unsubscribe", { bookingId });
      off("driver:location:update", handleLocationUpdate);
      off("error", handleError);
    };
  }, [bookingId, isConnected, emit, on, off]);

  const fetchLatestLocation = useCallback(() => {
    if (!bookingId || !isConnected) return;
    
    emit("driver:location:get", { bookingId });
  }, [bookingId, isConnected, emit]);

  return {
    driverLocation,
    error,
    fetchLatestLocation,
    isConnected,
  };
};
