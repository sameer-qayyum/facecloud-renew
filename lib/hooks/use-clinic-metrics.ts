'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useClinicStore, type TimeFrame, type ClinicMetrics } from '@/lib/stores/clinic-store';

// Increase cache TTL since we now have server-side caching too
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache TTL

// Global request tracking to prevent duplicate requests
const pendingRequests = new Map<string, Promise<Response>>();

export function useClinicMetrics(clinicId: string) {
  const { 
    timeframe, 
    metricsCache, 
    setClinicMetrics, 
    getClinicMetrics, 
    isLoading, 
    setLoading,
    invalidateMetrics
  } = useClinicStore();
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  
  // Generate a loading key for this specific clinic and timeframe
  const loadingKey = `metrics-${clinicId}-${timeframe}`;
  const cacheKey = `${clinicId}-${timeframe}`;
  
  // Track which fetch call is the latest
  const fetchIdRef = useRef(0);

  // Memoized fetch function for manual refresh
  const refreshMetrics = useCallback(async (force = false) => {
    // Generate a unique ID for this fetch call
    const fetchId = ++fetchIdRef.current;
    
    // Check if we have cached data and whether to use it
    const cachedData = getClinicMetrics(clinicId, timeframe);
    
    // Immediately use cached data if available (for instant UI)
    if (cachedData && !force) {
      const cachedAt = new Date(cachedData.lastUpdated).getTime();
      const now = Date.now();
      
      // If cache is still valid, don't fetch again unless forced
      if (now - cachedAt < CACHE_TTL) {
        return cachedData;
      }
    }
    
    // Set loading state
    setLoading(loadingKey, true);
    setError(null);
    
    try {
      // Reuse in-flight request if one is already pending for this clinic/timeframe
      const requestKey = `${clinicId}-${timeframe}${force ? '-force' : ''}`;
      let promise: Promise<Response>;
      
      // Add force=true parameter to clear server-side cache if requested
      const url = `/api/clinics/${clinicId}/metrics?timeframe=${timeframe}${force ? '&force=true' : ''}`;
      
      if (pendingRequests.has(requestKey) && !force) {
        promise = pendingRequests.get(requestKey)!;
      } else {
        // No existing request, create a new one
        promise = fetch(url, {
          // Add cache busting headers
          headers: {
            'Cache-Control': force ? 'no-cache, no-store, must-revalidate' : 'max-age=300',
            'Pragma': force ? 'no-cache' : 'cache',
          },
          // Use proper cache settings
          cache: force ? 'no-store' : 'default'
        });
        pendingRequests.set(requestKey, promise);
        
        // Cleanup the pending request after it completes
        promise.finally(() => {
          // Only remove if this is still the active request
          if (pendingRequests.get(requestKey) === promise) {
            pendingRequests.delete(requestKey);
          }
        });
      }
      
      const response = await promise;
      
      // Check if this fetch call has been superseded or component unmounted
      if (fetchId !== fetchIdRef.current || !isMounted.current) {
        return;
      }
      
      let data;
      
      try {
        // Handle non-OK responses gracefully
        if (!response.ok) {
          if (response.status === 404) {
            // Handle 404s specially (new clinic might not have metrics yet)
            console.info(`No metrics found for clinic: ${clinicId}`);
            data = {
              revenue: 0,
              revenueChange: 0,
              bookingCount: 0,
              bookingCountChange: 0,
              clinic: { name: "" }
            };
          } else {
            // For other errors, capture status but don't throw
            console.error(`Metrics API error (${response.status}): ${response.statusText}`);
            setError(`Unable to load metrics (${response.status})`);
            setLoading(loadingKey, false);
            return;
          }
        } else {
          // Parse successful responses
          data = await response.json();
        }
      } catch (parseError) {
        // Handle JSON parsing errors
        if (isMounted.current && fetchId === fetchIdRef.current) {
          console.error('Error parsing metrics response:', parseError);
          setError('Invalid data received from server');
          setLoading(loadingKey, false);
          return;
        }
        return;
      }
      
      // Check again if this request is still current and component mounted
      if (fetchId !== fetchIdRef.current || !isMounted.current) {
        return;
      }
      
      const metrics: ClinicMetrics = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      
      // Update the store
      setClinicMetrics(clinicId, timeframe, metrics);
      
      return metrics;
    } catch (err) {
      // Only set error if this is still the current request and component is mounted
      if (fetchId === fetchIdRef.current && isMounted.current) {
        console.error('Error fetching clinic metrics:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      // Only update loading state if this is still the current request
      if (fetchId === fetchIdRef.current && isMounted.current) {
        setLoading(loadingKey, false);
      }
    }
  }, [clinicId, timeframe, getClinicMetrics, setClinicMetrics, setLoading, loadingKey]);

  // Auto fetch on mount or when dependencies change
  useEffect(() => {
    // Setup cleanup
    isMounted.current = true;
    
    // Initial fetch 
    refreshMetrics(false);
    
    return () => {
      // Mark component as unmounted first
      isMounted.current = false;
    };
  }, [clinicId, timeframe, refreshMetrics]);

  return {
    metrics: getClinicMetrics(clinicId, timeframe),
    isLoading: isLoading(loadingKey),
    error,
    refresh: () => refreshMetrics(true),
    invalidate: () => invalidateMetrics(clinicId)
  };
}
