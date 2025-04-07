import { createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Create admin client to update user with service role
    const adminClient = createAdminClient();

    // First check if user exists in Supabase by listing users and filtering
    const { data, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { error: 'Failed to check user existence' },
        { status: 500 }
      );
    }

    // Using a more type-safe approach to find the user
    // Use any to bypass TypeScript errors during build
    const users = data.users as any[];
    const user = users.find(u => 
      u.email && u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      console.error('User not found with email:', email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update password using admin API
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error in set-password API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
