import { NextRequest, NextResponse } from 'next/server';
import { getClearAuthCookieValue } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear the auth cookie
    response.headers.set('Set-Cookie', getClearAuthCookieValue());

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}