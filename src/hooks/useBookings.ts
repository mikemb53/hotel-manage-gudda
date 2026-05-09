"use client";

import { useFetch, useMutation } from "@/hooks/useFetch";
import { useCallback } from "react";

export function useBookings(
  propertyId: string | null,
  filters?: {
    status?: string;
    source?: string;
    page?: number;
    search?: string;
  }
) {
  const params = new URLSearchParams();
  if (propertyId) params.set("propertyId", propertyId);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.source) params.set("source", filters.source);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.search) params.set("search", filters.search);

  const { data, isLoading, error, refetch } = useFetch<{
    data: unknown[];
    total: number;
    totalPages: number;
  }>(propertyId ? `/api/bookings?${params}` : null);

  const createBooking = useMutation("/api/bookings", "POST");

  const cancelBooking = useCallback(
    async (id: string) => {
      await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      refetch();
    },
    [refetch]
  );

  const updateBookingStatus = useCallback(
    async (id: string, status: string) => {
      await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      refetch();
    },
    [refetch]
  );

  return {
    bookings: data?.data ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error,
    refetch,
    createBooking: createBooking.mutate,
    cancelBooking,
    updateBookingStatus,
    isCreating: createBooking.isLoading,
  };
}
