import { signOutAction } from '@/app/actions';
import { NextResponse } from 'next/server';

// Special route for ultra-fast sign out without any page rendering
export async function GET() {
  // Use the existing signOutAction which handles auth and redirection
  return signOutAction();
}
