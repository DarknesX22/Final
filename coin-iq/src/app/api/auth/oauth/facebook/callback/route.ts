import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { findUserByProviderId, createSocialUser, linkSocialAccount, SocialUser } from '@/lib/oauthService';
import { createToken, getAuthCookieValue } from '@/lib/session';

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FacebookUserResponse {
  id: string;
  name: string;
  email: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

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
    // Exchange the authorization code for an access token
    const tokenResponse = await axios.get<FacebookTokenResponse>('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/facebook/callback`,
        code: code,
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // Get user info from Facebook
    const userResponse = await axios.get<FacebookUserResponse>('https://graph.facebook.com/me', {
      params: {
        access_token: accessToken,
        fields: 'id,name,email,picture'
      }
    });

    const fbUser = userResponse.data;
    
    if (!fbUser.id || !fbUser.email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?oauth_error=invalid_token`);
    }

    const socialUser: SocialUser = {
      id: fbUser.id,
      email: fbUser.email,
      name: fbUser.name,
      avatar: fbUser.picture?.data?.url,
    };

    // Check if user already exists via Facebook provider
    let user = await findUserByProviderId('facebook', socialUser.id);

    if (!user) {
      // Check if user exists with the same email from another source
      const existingUser = await findUserByProviderId('facebook', socialUser.id);
      
      if (existingUser) {
        // Link this Facebook account to the existing user
        await linkSocialAccount(existingUser.user.id, 'facebook', socialUser.id, socialUser.email);
        user = await findUserByProviderId('facebook', socialUser.id);
      } else {
        // Create a new user
        const newUser = await createSocialUser(socialUser);
        await linkSocialAccount(newUser.id, 'facebook', socialUser.id, socialUser.email);
        user = await findUserByProviderId('facebook', socialUser.id);
      }
    }

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?oauth_error=account_creation_failed`);
    }

    // Create JWT token for the user
    const token = createToken(user.user);
    const cookieValue = getAuthCookieValue(token);

    // Redirect to dashboard with success message
    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?oauth_success=facebook`);
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict',
    });

    return response;
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?oauth_error=server_error`);
  }
}