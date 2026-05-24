import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateUserProfile } from '@/lib/userService';

// PUT endpoint to update user profile
export async function PUT(request: NextRequest) {
  try {
    // Get user from auth token
    const token = request.cookies.get('auth_token')?.value;
    const user = getCurrentUser(token ? `auth_token=${token}` : undefined);
    
    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name && !email && !password) {
      return Response.json(
        { error: 'At least one field (name, email, or password) must be provided' },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await updateUserProfile(user.id, { name, email, password });

    return Response.json(
      { 
        message: 'Profile updated successfully', 
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return Response.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user profile
export async function GET(request: NextRequest) {
  try {
    // Get user from auth token
    const token = request.cookies.get('auth_token')?.value;
    const user = getCurrentUser(token ? `auth_token=${token}` : undefined);
    
    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return Response.json(
      { 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}