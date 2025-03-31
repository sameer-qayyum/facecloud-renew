import { cache } from 'react';
import { createClient } from '@/utils/supabase/server';

/**
 * Optimized data fetching utilities for Facecloud
 * These functions use React's cache() to avoid redundant data fetching
 * and improve application performance
 */

/**
 * Cached function to get user profile data
 * This will only execute once per request even if called multiple times
 */
export const getUserProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
});

/**
 * Cached function to get company data
 */
export const getCompanyData = cache(async (companyId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();
    
  if (error) {
    console.error('Error fetching company data:', error);
    return null;
  }
  
  return data;
});

/**
 * Parallel data fetching for dashboard
 * Fetches multiple data sources simultaneously for faster loading
 */
export async function fetchDashboardData(userId: string) {
  const supabase = await createClient();
  
  // Execute all queries in parallel
  const [userProfile, appointments, notifications, stats] = await Promise.all([
    getUserProfile(userId),
    supabase.from('appointments').select('*').eq('user_id', userId).limit(5),
    supabase.from('notifications').select('*').eq('user_id', userId).limit(10),
    supabase.from('statistics').select('*').eq('user_id', userId).single()
  ]);
  
  return {
    userProfile,
    appointments: appointments.data,
    notifications: notifications.data,
    stats: stats.data
  };
}

/**
 * Streaming data fetching for large datasets
 * Returns data as it becomes available instead of waiting for all data
 */
export async function* streamLargeDataset(tableName: string, userId: string, pageSize = 100) {
  const supabase = await createClient();
  let lastId = 0;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId)
      .gt('id', lastId)
      .order('id', { ascending: true })
      .limit(pageSize);
      
    if (error) {
      console.error(`Error streaming ${tableName}:`, error);
      break;
    }
    
    if (data.length === 0) {
      hasMore = false;
    } else {
      yield data;
      lastId = data[data.length - 1].id;
    }
  }
}
