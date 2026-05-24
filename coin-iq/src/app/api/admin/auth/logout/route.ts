import { NextRequest, NextResponse } from 'next/server';
import { destroyAdminSession } from '@/lib/adminSession';

export async function POST(request: NextRequest) {
  try {
    // Destroy the admin session and get the response
    const logoutResponse = await destroyAdminSession();
    
    return logoutResponse;
  } catch (error: any) {
    console.error('Error during admin logout:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during logout' },
      { status: 500 }
    );
  }
}