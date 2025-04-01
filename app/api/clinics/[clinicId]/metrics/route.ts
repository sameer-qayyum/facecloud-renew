import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Performance optimization: Use force-dynamic to prevent unnecessary static regeneration
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Simple server-side cache with 5-minute TTL to avoid recalculating on every request
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const metricsCache = new Map();

// Define types for date ranges
interface DateRange {
  start: Date;
  end: Date;
}

interface DateRanges {
  current: DateRange;
  previous: DateRange;
}

// Define types for location data
interface ClinicLocation {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
}

// Define the metrics response type
interface MetricsResponse {
  revenue: number;
  revenueChange: number;
  bookingCount: number;
  bookingCountChange: number;
  period: {
    current: {
      start: string;
      end: string;
    };
    previous: {
      start: string;
      end: string;
    };
  };
  clinic?: {
    id: string;
    name: string;
    location?: ClinicLocation | null;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { clinicId: string } }
) {
  try {
    // Await params to fix the error with dynamic route parameters
    const { clinicId } = await Promise.resolve(params);
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || 'month';
    
    // Clear cache on force refresh (for debugging)
    const forceRefresh = searchParams.get('force') === 'true';
    if (forceRefresh) {
      metricsCache.clear();
    }
    
    // Create cache key from clinicId and timeframe
    const cacheKey = `${clinicId}-${timeframe}`;
    
    // Check if we have a valid cached value
    if (metricsCache.has(cacheKey) && !forceRefresh) {
      const { data, timestamp } = metricsCache.get(cacheKey);
      if (Date.now() - timestamp < CACHE_TTL) {
        return NextResponse.json(data);
      }
    }

    // Create server-side Supabase client with auth context
    const supabase = await createClient();

    // Verify the user has access to this clinic
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Get the user's profile to determine company_id - simplify query for faster response
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();
    
    if (!userProfile?.company_id) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // First get clinic info
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('id, name')
      .eq('id', clinicId)
      .eq('company_id', userProfile.company_id)
      .single();
    
    if (clinicError || !clinic) {
      return NextResponse.json(
        { error: 'Clinic not found or access denied' },
        { status: 404 }
      );
    }

    // Then explicitly fetch location in a separate query to avoid any issues
    console.log('Looking for locations with clinic_id:', clinicId);
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('id, name, address, phone, email')
      .eq('clinic_id', clinicId)
      .limit(1);
      
    console.log('Locations for clinic:', JSON.stringify(locations, null, 2));
    console.log('Location error:', locationsError);
    
    // Get first location if it exists
    const location = locations && locations.length > 0 ? locations[0] : null;
    console.log('Used location:', location);

    // Calculate date ranges based on timeframe - optimize calculation for quicker responses
    const now = new Date();
    
    // Moved date logic to a faster implementation 
    const getDateRanges = (timeframe: string, baseDate: Date): DateRanges => {
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const date = baseDate.getDate();
      
      switch(timeframe) {
        case 'day':
          return {
            current: {
              start: new Date(year, month, date),
              end: new Date(year, month, date, 23, 59, 59, 999)
            },
            previous: {
              start: new Date(year, month, date - 1),
              end: new Date(year, month, date - 1, 23, 59, 59, 999)
            }
          };
        case 'week':
          const dayOfWeek = baseDate.getDay();
          const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const firstDay = new Date(year, month, date - diff);
          return {
            current: {
              start: firstDay,
              end: new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + 6, 23, 59, 59, 999)
            },
            previous: {
              start: new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() - 7),
              end: new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() - 1, 23, 59, 59, 999)
            }
          };
        case 'year':
          return {
            current: {
              start: new Date(year, 0, 1),
              end: new Date(year, 11, 31, 23, 59, 59, 999)
            },
            previous: {
              start: new Date(year - 1, 0, 1),
              end: new Date(year - 1, 11, 31, 23, 59, 59, 999)
            }
          };
        case 'month':
        default:
          return {
            current: {
              start: new Date(year, month, 1),
              end: new Date(year, month + 1, 0, 23, 59, 59, 999)
            },
            previous: {
              start: new Date(year, month - 1, 1),
              end: new Date(year, month, 0, 23, 59, 59, 999)
            }
          };
      }
    };

    const dateRanges = getDateRanges(timeframe, now);
    const startDate = dateRanges.current.start;
    const endDate = dateRanges.current.end;
    const prevStartDate = dateRanges.previous.start;
    const prevEndDate = dateRanges.previous.end;

    // REPLACE_MOCK_DATA: The following code generates random metrics data and should be replaced
    // with real data from your database in production.
    // 
    // To implement real metrics:
    // 1. Create tables for appointments, transactions, or bookings with proper indexes
    // 2. Query aggregated data for the given clinic and date ranges
    // 3. Consider using materialized views or pre-aggregated tables for ultra-fast performance
    // 4. Make sure to maintain the same response format for compatibility
    
    // Deterministic but fast random-like number generator based on clinic ID
    const getRandomForClinic = (seed: string, min: number, max: number) => {
      let hash = 0;
      for (let i = 0; i < Math.min(seed.length, 8); i++) { // Only use first 8 chars for speed
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      }
      return Math.floor(min + (Math.abs(hash) % (max - min)));
    };
    
    const baseRevenue = getRandomForClinic(clinicId, 5000, 20000);
    const baseTxCount = getRandomForClinic(clinicId, 10, 100);
    
    // Optimized multiplier lookup
    const multipliers = { day: 0.03, week: 0.25, month: 1, year: 12 };
    const multiplier = multipliers[timeframe as keyof typeof multipliers] || 1;
    
    // Fast value calculations
    const currentRevenue = Math.round(baseRevenue * multiplier);
    // Use a deterministic approach for previous values to ensure consistency
    const previousFactor = (getRandomForClinic(clinicId + 'prev', 80, 120) / 100);
    const previousRevenue = Math.round(currentRevenue * previousFactor);
    
    const currentBookings = Math.round(baseTxCount * multiplier);
    const previousBookings = Math.round(currentBookings * previousFactor);
    
    // Simplified percentage calculation
    const revenueChange = previousRevenue > 0 
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 1000) / 10 
      : 0;
      
    const bookingCountChange = previousBookings > 0 
      ? Math.round(((currentBookings - previousBookings) / previousBookings) * 1000) / 10 
      : 0;
    
    // END_REPLACE_MOCK_DATA: Once you have implemented real data fetching, delete all the mock
    // data generation code above and replace with your actual data aggregation queries

    // Final metrics response object - maintain this structure when implementing real data
    const metrics: MetricsResponse = {
      revenue: currentRevenue,
      revenueChange: revenueChange,
      bookingCount: currentBookings,
      bookingCountChange: bookingCountChange,
      period: {
        current: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        previous: {
          start: prevStartDate.toISOString(),
          end: prevEndDate.toISOString()
        }
      },
      clinic: {
        id: clinic.id,
        name: clinic.name,
        location: location
      }
    };
    
    console.log('Final metrics object:', JSON.stringify(metrics, null, 2));
    
    // Server-side caching - keep this for performance even when implementing real data
    metricsCache.set(cacheKey, {
      data: metrics,
      timestamp: Date.now()
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching clinic metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
