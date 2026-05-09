"use client";

import { useState, useEffect, useCallback } from "react";

interface UseFetchOptions {
  enabled?: boolean;
}

/**
 * Lightweight data-fetching hook.
 * Replace with SWR or React Query for production caching if needed.
 */
export function useFetch<T>(url: string | null, options: UseFetchOptions = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setIsLoading(false);
    }
  }, [url, enabled]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * POST / PATCH / DELETE mutation hook.
 */
export function useMutation<TInput = unknown, TOutput = unknown>(
  url: string,
  method: "POST" | "PATCH" | "DELETE" = "POST"
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (data?: TInput): Promise<TOutput | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: data ? JSON.stringify(data) : undefined,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        return json.data ?? json;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Request failed";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [url, method]
  );

  return { mutate, isLoading, error };
}
