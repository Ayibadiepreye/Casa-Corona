import { useState, useCallback, useEffect, useRef } from "react";

/**
 * useApi — fetches data with a debounce-free, request-cancellation-aware approach.
 *
 * - The fetcher is captured via ref so callers don't need to memoize inline closures.
 * - `deps` triggers a refetch when changed (same pattern as before).
 * - Concurrent fetches are deduped: only the latest request resolves state.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reqIdRef = useRef(0);

  const refetch = useCallback(async () => {
    const myReqId = ++reqIdRef.current;
    try {
      setLoading(true);
      const result = await fetcherRef.current();
      if (reqIdRef.current === myReqId) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (reqIdRef.current === myReqId) {
        setError(e as Error);
        setData(null);
      }
    } finally {
      if (reqIdRef.current === myReqId) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
