"use client";

import { useFetch, useMutation } from "@/hooks/useFetch";
import { useCallback } from "react";

export function useChannels(propertyId: string | null) {
  const { data, isLoading, error, refetch } = useFetch<unknown[]>(
    propertyId ? `/api/channels?propertyId=${propertyId}` : null
  );

  const syncChannel = useCallback(
    async (channelId: string) => {
      await fetch(`/api/channels/${channelId}/sync`, { method: "POST" });
      refetch();
    },
    [refetch]
  );

  const toggleChannel = useCallback(
    async (channelId: string, isActive: boolean) => {
      await fetch(`/api/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      refetch();
    },
    [refetch]
  );

  const deleteChannel = useCallback(
    async (channelId: string) => {
      await fetch(`/api/channels/${channelId}`, { method: "DELETE" });
      refetch();
    },
    [refetch]
  );

  const addChannel = useCallback(
    async (data: unknown) => {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      refetch();
      return json.data;
    },
    [refetch]
  );

  return {
    channels: data ?? [],
    isLoading,
    error,
    refetch,
    syncChannel,
    toggleChannel,
    deleteChannel,
    addChannel,
  };
}

export function useDashboard(propertyId: string | null) {
  return useFetch<{
    stats: unknown;
    revenueChart: unknown[];
    channelDistribution: unknown[];
  }>(propertyId ? `/api/dashboard?propertyId=${propertyId}` : null);
}

export function useProperties() {
  const fetch = useFetch<unknown[]>("/api/properties");
  const { mutate: createMutate } = useMutation<unknown, unknown>("/api/properties", "POST");

  const createProperty = async (data: unknown) => {
    await createMutate(data);
    fetch.refetch();
  };

  return { ...fetch, properties: fetch.data ?? [], createProperty };
}
