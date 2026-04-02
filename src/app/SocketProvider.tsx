import React, { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { socketService } from "@/api/socket.service";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { QUERY_KEYS } from "@/features/booking/bookingQueries";

interface SocketContextType {
  isConnected: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

// Define status-specific events
const BOOKING_STATUS_EVENTS = [
  "booking:status_updated", // Generic event
  "booking:driver_assigned",
  "booking:driver_arrived",
  "booking:picked_up",
  "booking:arrived_at_store",
  "booking:stored",
  "booking:cancelled",
  "booking:delivered",
  "booking:no_driver_available",
];

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const accessToken = useSelector((state: any) => state.auth.accessToken);
  const queryClient = useQueryClient();
  const isConnectedRef = useRef(false);

  // Centralized logic for status updates
  const handleBookingStatusUpdate = useCallback((data: { bookingId: string; status: string; note: string }) => {
    console.log("Booking Status Socket Event:", data);
    
    // Invalidate relevant queries to ensure UI is fresh
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeBooking });
    if (data.bookingId) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.booking(data.bookingId) });
    }

    // Show informational toast
    if (data.note) {
      showInfo(data.note, "Booking Update");
    } else if (data.status) {
      showInfo(`Booking status updated to ${data.status.replace("_", " ")}`, "Booking Update");
    }
  }, [queryClient]);

  useEffect(() => {
    if (accessToken) {
      console.log("Initializing Socket connection...");
      socketService.connect(accessToken);
      
      // Register all status-related event listeners
      BOOKING_STATUS_EVENTS.forEach(event => {
        socketService.on(event, handleBookingStatusUpdate);
      });

      // Global Notification Listener
      socketService.on("notification", (data: { type: string; message: string; title?: string }) => {
        console.log("Socket Event: notification", data);
        switch (data.type) {
          case "success":
            showSuccess(data.message, data.title || "Notification");
            break;
          case "error":
            showError(data.message, data.title || "Alert");
            break;
          default:
            showInfo(data.message, data.title || "Info");
            break;
        }
      });

      // Global Error Listener
      socketService.on("error", (data: { message: string }) => {
        console.warn("Socket Event: error", data);
        showError(data.message, "Sync Error");
      });

      isConnectedRef.current = true;
    } else {
      if (isConnectedRef.current) {
        console.log("Cleaning up Socket connection (User logged out)");
        socketService.disconnect();
        isConnectedRef.current = false;
      }
    }

    return () => {
      // Clean up all registered listeners
      BOOKING_STATUS_EVENTS.forEach(event => {
        socketService.off(event);
      });
      socketService.off("notification");
      socketService.off("error");
    };
  }, [accessToken, queryClient, handleBookingStatusUpdate]);

  const value = {
    isConnected: socketService.isConnected,
    emit: (event: string, data?: any) => socketService.emit(event, data),
    on: (event: string, callback: (data: any) => void) => socketService.on(event, callback),
    off: (event: string, callback?: (data: any) => void) => socketService.off(event, callback),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
