"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "@/lib/api/errors";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  reload: () => void;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Wraps an async API call with loading/error state and automatic initial fetch.
 * Pass `immediate: false` to skip the initial call (useful for mutations).
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  { immediate = true }: { immediate?: boolean } = {},
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcher();
      if (mountedRef.current) setState({ data, loading: false, error: null });
    } catch (e) {
      if (mountedRef.current) {
        setState({
          data: null,
          loading: false,
          error: getApiErrorMessage(e),
        });
      }
    }
  }, [fetcher]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (immediate) {
      t = setTimeout(() => { void run(); }, 0);
    }
    return () => { if (t) clearTimeout(t); };
  }, [immediate, run]);

  const setData: React.Dispatch<React.SetStateAction<T | null>> = useCallback(
    (update) =>
      setState((s) => ({
        ...s,
        data: typeof update === "function" ? (update as (prev: T | null) => T | null)(s.data) : update,
      })),
    [],
  );

  return {
    ...state,
    reload: run,
    setData,
  };
}

/**
 * Run a one-shot mutation (POST/PATCH/DELETE) with loading + error state.
 */
export function useMutation<TArgs extends unknown[], TResult = unknown>(
  mutationFn: (...args: TArgs) => Promise<TResult>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutationFn(...args);
        return result;
      } catch (e) {
        const msg = getApiErrorMessage(e);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn],
  );

  return { execute, loading, error, setError };
}

export function formatDateFR(d: string) {
  try {
    return new Date(d).toLocaleDateString("fr-FR");
  } catch {
    return d;
  }
}
