import { NextRequest } from 'next/server';
import { getCurrentAdminFromCookie, getCurrentAdminFromCookieAsync } from '@/lib/adminSession';

export async function GET(request: NextRequest) {
  try {
    // Get the admin token from the cookie
    const cookieHeader = request.headers.get('cookie') || undefined;
    const adminToken = await getCurrentAdminFromCookieAsync(cookieHeader);
    
    if (!adminToken || !adminToken.isAdmin) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // For this endpoint, we'll return the admin token data
    const admin = adminToken;

    if (!admin) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return the admin information
    return Response.json(
      { 
        admin: { 
          id: admin.id, 
          name: admin.name, 
          email: admin.email,
          role: admin.role,
          isAdmin: admin.isAdmin
        } 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get admin error:', error);
    return Response.json(
      { error: error.message || 'An error occurred while fetching admin data' },
      { status: 500 }
    );
  }
}