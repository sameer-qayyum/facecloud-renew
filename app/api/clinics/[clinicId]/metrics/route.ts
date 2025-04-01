import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { clinicId: string } }
) {
  try {
    // Await params to fix the error with dynamic route parameters
    const { clinicId } = await Promise.resolve(params);
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || 'month';

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

    // Get the user's profile to determine company_id
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

    // Verify the clinic belongs to the user's company
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('id, company_id')
      .eq('id', clinicId)
      .eq('company_id', userProfile.company_id)
      .single();
    
    if (clinicError || !clinic) {
      return NextResponse.json(
        { error: 'Clinic not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate date ranges based on timeframe
    const now = new Date();
    let startDate, endDate, prevStartDate, prevEndDate;

    switch (timeframe) {
      case 'day':
        // Today
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        // Yesterday
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        break;
      case 'week':
        // This week (starting Monday)
        const day = now.getDay();
        const diff = (day === 0 ? 6 : day - 1); // Adjust for Sunday
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        // Previous week
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 7);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(prevEndDate.getDate() - 7);
        break;
      case 'year':
        // This year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        // Previous year
        prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
        prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      case 'month':
      default:
        // This month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        // Previous month
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
    }

    // TODO: In a real implementation, you would query your appointments and revenue tables
    // For now, we'll return simulated data based on the clinic and timeframe
    
    // Deterministic but random-looking number generator based on clinic ID
    const getRandomForClinic = (seed: string, min: number, max: number) => {
      const hash = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return Math.floor(Math.min(min + (hash % (max - min)), max));
    };
    
    const baseRevenue = getRandomForClinic(clinicId, 5000, 20000);
    const baseTxCount = getRandomForClinic(clinicId, 10, 100);
    
    // Adjust for timeframe - month is baseline
    const timeframeMultiplier = {
      day: 0.03,
      week: 0.25,
      month: 1,
      year: 12
    };
    
    const multiplier = timeframeMultiplier[timeframe as keyof typeof timeframeMultiplier];
    
    // Calculate current and previous values
    const currentRevenue = Math.round(baseRevenue * multiplier);
    const previousRevenue = Math.round(baseRevenue * multiplier * (1 - (Math.random() * 0.2 - 0.1)));
    
    const currentBookings = Math.round(baseTxCount * multiplier);
    const previousBookings = Math.round(baseTxCount * multiplier * (1 - (Math.random() * 0.2 - 0.1)));
    
    // Calculate percentage changes
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
      
    const bookingCountChange = previousBookings > 0 
      ? ((currentBookings - previousBookings) / previousBookings) * 100 
      : 0;

    const metrics = {
      revenue: currentRevenue,
      revenueChange: parseFloat(revenueChange.toFixed(1)),
      bookingCount: currentBookings,
      bookingCountChange: parseFloat(bookingCountChange.toFixed(1)),
      period: {
        current: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        previous: {
          start: prevStartDate.toISOString(),
          end: prevEndDate.toISOString()
        }
      }
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching clinic metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
