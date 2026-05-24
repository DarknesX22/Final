import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { findUserByProviderId, createSocialUser, linkSocialAccount, SocialUser } from '@/lib/oauthService';
import { createToken, getAuthCookieValue } from '@/lib/session';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/oauth/google/callback`
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?oauth_error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?oauth_error=missing_code`);
  }

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info from Google
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?oauth_error=invalid_token`);
    }

    const socialUser: SocialUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      avatar: payload.picture,
    };

    // Check if user already exists via Google provider
    let user = await findUserByProviderId('google', socialUser.id);

    if (!user) {
      // Check if user exists with the same email from another source
      const existingUser = await findUserByProviderId('google', socialUser.id);
      
      if (existingUser) {
        // Link this Google account to the existing user
        await linkSocialAccount(existingUser.user.id, 'google', socialUser.id, socialUser.email);
        user = await findUserByProviderId('google', socialUser.id);
      } else {
        // Create a new user
        const newUser = await createSocialUser(socialUser);
        await linkSocialAccount(newUser.id, 'google', socialUser.id, socialUser.email);
        user = await findUserByProviderId('google', socialUser.id);
      }
    }

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?oauth_error=account_creation_failed`);
    }

    // Create JWT token for the user
    const token = createToken(user.user);
    const cookieValue = getAuthCookieValue(token);

    // Redirect to dashboard with success message
    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?oauth_success=google`);
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict',
    });

    return response;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?oauth_error=server_error`);
  }
}