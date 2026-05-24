import pool from './db';
import { User, createUser, findUserByEmail } from './userService';
import bcrypt from 'bcrypt';

export interface SocialUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface OAuthProvider {
  id: string;
  provider: 'google' | 'facebook';
  provider_user_id: string;
  user_id: number;
  email: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Creates a mapping between a social provider and a user account
 */
export const createOAuthProvider = async (providerData: {
  provider: 'google' | 'facebook';
  provider_user_id: string;
  user_id: number;
  email: string;
}): Promise<OAuthProvider> => {
  const { provider, provider_user_id, user_id, email } = providerData;

  const query = `
    INSERT INTO oauth_providers (provider, provider_user_id, user_id, email)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const result = await pool.query(query, [provider, provider_user_id, user_id, email]);
  
  if (result.rows.length === 0) {
    throw new Error('OAuth provider creation failed');
  }

  return result.rows[0];
};

/**
 * Finds an existing user by their OAuth provider ID
 */
export const findUserByProviderId = async (
  provider: 'google' | 'facebook',
  provider_user_id: string
): Promise<{ user: User, oauth_provider: OAuthProvider } | null> => {
  const query = `
    SELECT u.*, op.*
    FROM users u
    JOIN oauth_providers op ON u.id = op.user_id
    WHERE op.provider = $1 AND op.provider_user_id = $2
  `;

  const result = await pool.query(query, [provider, provider_user_id]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  const user: User = {
    id: row.id,
    name: row.name,
    email: row.email,
    password_hash: row.password_hash,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  const oauthProvider: OAuthProvider = {
    id: row.op_id,
    provider: row.provider,
    provider_user_id: row.provider_user_id,
    user_id: row.user_id,
    email: row.email,
    created_at: row.op_created_at,
    updated_at: row.op_updated_at,
  };

  return { user, oauth_provider: oauthProvider };
};

/**
 * Links a social account to an existing user account
 */
export const linkSocialAccount = async (
  userId: number,
  provider: 'google' | 'facebook',
  provider_user_id: string,
  email: string
): Promise<OAuthProvider> => {
  // Check if this provider ID is already linked to another account
  const existingLink = await findUserByProviderId(provider, provider_user_id);
  if (existingLink) {
    throw new Error('This social account is already linked to another user');
  }

  return await createOAuthProvider({
    provider,
    provider_user_id,
    user_id: userId,
    email
  });
};

/**
 * Creates a new user account from social data
 */
export const createSocialUser = async (socialUser: SocialUser): Promise<User> => {
  // Check if a user with this email already exists
  const existingUser = await findUserByEmail(socialUser.email);
  if (existingUser) {
    throw new Error('A user with this email already exists. Please log in with your existing credentials or use a different email.');
  }

  // Create a random password for social accounts since they won't use it
  const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const password_hash = await bcrypt.hash(randomPassword, 10);

  // Create the user
  const newUser = await createUser({
    name: socialUser.name,
    email: socialUser.email,
    password: randomPassword, // Will be hashed in createUser
  });

  return newUser;
};