'use client';

import { useEffect, useState } from 'react';
import { useClinicStore, type TimeFrame, type ClinicMetrics } from '@/lib/stores/clinic-store';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

export function useClinicMetrics(clinicId: string) {
  const { 
    timeframe, 
    metricsCache, 
    setClinicMetrics, 
    getClinicMetrics, 
    isLoading, 
    setLoading 
  } = useClinicStore();
  const [error, setError] = useState<string | null>(null);

  // Generate a loading key for this specific clinic and timeframe
  const loadingKey = `metrics-${clinicId}-${timeframe}`;

  useEffect(() => {
    async function fetchMetrics() {
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
        const response = await fetch(`/api/clinics/${clinicId}/metrics?timeframe=${timeframe}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch metrics');
        }
        
        const data = await response.json();
        
        // Store in cache
        setClinicMetrics(clinicId, timeframe, {
          revenue: data.revenue,
          revenueChange: data.revenueChange,
          bookingCount: data.bookingCount,
          bookingCountChange: data.bookingCountChange,
          lastUpdated: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error fetching clinic metrics:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(loadingKey, false);
      }
    }

    // Trigger fetch when clinicId or timeframe changes
    fetchMetrics();
  }, [clinicId, timeframe, getClinicMetrics, setClinicMetrics, setLoading, loadingKey]);

  return { 
    metrics: getClinicMetrics(clinicId, timeframe),
    isLoading: isLoading(loadingKey),
    error
  };
}
