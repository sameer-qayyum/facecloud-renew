import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TimeFrame = 'day' | 'week' | 'month' | 'year';

export interface ClinicLocation {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
}

export interface ClinicMetrics {
  revenue: number;
  revenueChange: number;
  bookingCount: number;
  bookingCountChange: number;
  lastUpdated: string;
  // Add clinic data from API
  clinic?: {
    id: string;
    name: string;
    location?: ClinicLocation | null;
  };
}

interface ClinicStore {
  // Selected timeframe for metrics
  timeframe: TimeFrame;
  setTimeframe: (timeframe: TimeFrame) => void;
  
  // Metrics data cache
  metricsCache: Record<string, Partial<Record<TimeFrame, ClinicMetrics | null>>>;
  setClinicMetrics: (clinicId: string, timeframe: TimeFrame, metrics: ClinicMetrics) => void;
  getClinicMetrics: (clinicId: string, timeframe: TimeFrame) => ClinicMetrics | null;
  invalidateMetrics: (clinicId?: string) => void;
  
  // Loading states
  loadingStates: Record<string, boolean>;
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key: string) => boolean;
}

export const useClinicStore = create<ClinicStore>()(
  persist(
    (set, get) => ({
      // Default timeframe is month
      timeframe: 'month',
      setTimeframe: (timeframe) => set({ timeframe }),
      
      // Cache for metrics data
      metricsCache: {},
      setClinicMetrics: (clinicId, timeframe, metrics) => set((state) => ({
        metricsCache: {
          ...state.metricsCache,
          [clinicId]: {
            ...(state.metricsCache[clinicId] || {}),
            [timeframe]: {
              ...metrics,
              lastUpdated: new Date().toISOString()
            }
          }
        }
      })),
      getClinicMetrics: (clinicId, timeframe) => {
        const cache = get().metricsCache[clinicId];
        if (!cache) return null;
        return cache[timeframe] || null;
      },
      invalidateMetrics: (clinicId) => set((state) => {
        if (clinicId) {
          // Invalidate specific clinic metrics
          const { [clinicId]: _, ...restCache } = state.metricsCache;
          return { metricsCache: restCache };
        } else {
          // Invalidate all metrics
          return { metricsCache: {} };
        }
      }),
      
      // Loading states management
      loadingStates: {},
      setLoading: (key, isLoading) => set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          [key]: isLoading
        }
      })),
      isLoading: (key) => !!get().loadingStates[key]
    }),
    {
      name: 'clinic-store',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist certain parts of the store
      partialize: (state) => ({
        timeframe: state.timeframe,
        metricsCache: state.metricsCache
      })
    }
  )
);
