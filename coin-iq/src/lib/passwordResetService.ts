import db from './db';
import { hashPassword } from './userService';
import crypto from 'crypto';

/**
 * Generates a secure password reset token
 */
export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Creates a password reset token in the database
 */
export const createPasswordResetToken = async (userId: number): Promise<string> => {
  const token = generatePasswordResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Token expires in 1 hour

  await db.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );

  return token;
};

/**
 * Finds a valid password reset token
 */
export const findValidResetToken = async (token: string) => {
  const result = await db.query(
    'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() AND used = FALSE',
    [token]
  );

  return result.rows[0];
};

/**
 * Validates if a reset token is valid
 */
export const isValidResetToken = async (token: string): Promise<boolean> => {
  const result = await db.query(
    'SELECT id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() AND used = FALSE',
    [token]
  );

  return result.rows.length > 0;
};

/**
 * Validates a reset token and returns token record if valid
 */
export const validateResetToken = async (token: string) => {
  const result = await db.query(
    `SELECT prt.id, prt.user_id, u.email 
     FROM password_reset_tokens prt
     JOIN users u ON prt.user_id = u.id
     WHERE prt.token = $1 AND prt.expires_at > NOW() AND prt.used = FALSE`,
    [token]
  );

  return result.rows[0] || null;
};

/**
 * Marks a password reset token as used
 */
export const markTokenAsUsed = async (tokenId: number) => {
  await db.query(
    'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
    [tokenId]
  );
};

/**
 * Resets user password
 */
export const resetUserPassword = async (userId: number, newPassword: string) => {
  const hashedPassword = await hashPassword(newPassword);

  await db.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [hashedPassword, userId]
  );
};

/**
 * Cleans up expired password reset tokens
 */
export const cleanupExpiredTokens = async () => {
  const result = await db.query(
    'DELETE FROM password_reset_tokens WHERE expires_at < NOW()'
  );
  
  const count = result.rowCount || 0;
  if (count > 0) {
    console.log(`Cleaned up ${count} expired password reset tokens`);
  }
  
  return count;
};

/**
 * Schedule periodic cleanup of expired tokens
 * Note: This should be called in your application initialization code
 */
export const scheduleTokenCleanup = () => {
  // Clean up expired tokens every hour
  return setInterval(async () => {
    try {
      await cleanupExpiredTokens();
    } catch (error) {
      console.error('Error during scheduled token cleanup:', error);
    }
  }, 60 * 60 * 1000); // Every hour
};