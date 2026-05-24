import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/userService';
import { UserInput } from '@/lib/userService';
import { createToken, getAuthCookieValue } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(body.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Create the user
    const user = await createUser(body);

    // Create JWT token for the new user
    const token = createToken(user);
    
    // Create response with user info (without password hash)
    const { password_hash, ...userWithoutPassword } = user as any;
    
    const response = NextResponse.json(
      { 
        message: 'User created successfully', 
        user: userWithoutPassword 
      },
      { status: 201 }
    );
    
    // Set auth cookie
    response.headers.set('Set-Cookie', getAuthCookieValue(token));
    
    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.message === 'Email already exists') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}