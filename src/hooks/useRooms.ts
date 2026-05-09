"use client";

import { useFetch, useMutation } from "@/hooks/useFetch";
import { useCallback } from "react";

export function useRooms(propertyId: string | null) {
  const { data, isLoading, error, refetch } = useFetch<unknown[]>(
    propertyId ? `/api/rooms?propertyId=${propertyId}` : null
  );

  const createRoom = useMutation("/api/rooms", "POST");
  const deleteRoom = useCallback(
    async (id: string) => {
      await fetch(`/api/rooms/${id}`, { method: "DELETE" });
      refetch();
    },
    [refetch]
  );

  return {
    rooms: data ?? [],
    isLoading,
    error,
    refetch,
    createRoom: createRoom.mutate,
    deleteRoom,
    isCreating: createRoom.isLoading,
  };
}

export function useRoomTypes() {
  return useFetch<unknown[]>("/api/room-types");
}

export function useAvailabilityGrid(
  propertyId: string | null,
  from: string,
  to: string
) {
  return useFetch<unknown[]>(
    propertyId
      ? `/api/availability?propertyId=${propertyId}&from=${from}&to=${to}`
      : null
  );
}
