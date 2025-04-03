import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client with the service role key
 * For server-side admin operations only
 * Performance optimized - created with minimal overheads
 */
export const createAdminClient = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};
