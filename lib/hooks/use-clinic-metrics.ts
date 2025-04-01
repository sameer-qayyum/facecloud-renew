'use client';

import { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    // Setup cleanup
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    async function fetchMetrics() {
      // Generate a unique ID for this fetch call
      const fetchId = ++fetchIdRef.current;
      
      // Check if we have cached data that's not expired
      const cachedData = getClinicMetrics(clinicId, timeframe);
      
      if (cachedData) {
        const cachedAt = new Date(cachedData.lastUpdated).getTime();
        const now = Date.now();
        
        // If cache is still valid, don't fetch again
        if (now - cachedAt < CACHE_TTL) {
          return;
        }
      }
      
      // Set loading state
      setLoading(loadingKey, true);
      setError(null);
      
      try {
        // Reuse in-flight request if one is already pending for this clinic/timeframe
        const requestKey = `${clinicId}-${timeframe}`;
        let promise: Promise<Response>;
        
        // Add force=true parameter to clear server-side cache
        const url = `/api/clinics/${clinicId}/metrics?timeframe=${timeframe}&force=true`;
        
        if (pendingRequests.has(requestKey)) {
          promise = pendingRequests.get(requestKey)!;
        } else {
          // No existing request, create a new one
          promise = fetch(url, {
            // Add cache busting headers
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            // Add cache busting query param with timestamp
            cache: 'no-store'
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
        
        // If this isn't the latest fetch request, ignore the result
        if (fetchId !== fetchIdRef.current || !isMounted.current) return;
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch metrics');
        }
        
        const data = await response.json();
        
        // If this isn't the latest fetch request, ignore the result
        if (fetchId !== fetchIdRef.current || !isMounted.current) return;
        
        // Store in cache with location data
        setClinicMetrics(clinicId, timeframe, {
          revenue: data.revenue,
          revenueChange: data.revenueChange,
          bookingCount: data.bookingCount,
          bookingCountChange: data.bookingCountChange,
          lastUpdated: new Date().toISOString(),
          clinic: data.clinic
        });
      } catch (err) {
        if (fetchId !== fetchIdRef.current || !isMounted.current) return;
        
        console.error('Error fetching clinic metrics:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        if (fetchId !== fetchIdRef.current || !isMounted.current) return;
        
        setLoading(loadingKey, false);
      }
    }

    // Force a fresh fetch on component mount to bypass cache
    invalidateMetrics(clinicId);
    
    // Trigger fetch when clinicId or timeframe changes
    fetchMetrics();
  }, [clinicId, timeframe, getClinicMetrics, setClinicMetrics, setLoading, loadingKey, invalidateMetrics]);

  return { 
    metrics: getClinicMetrics(clinicId, timeframe),
    isLoading: isLoading(loadingKey),
    error
  };
}
