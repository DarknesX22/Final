import { Resend } from 'resend';

/**
 * Email service for sending password reset emails
 * Uses Resend to send emails
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a password reset email
 */
export const sendPasswordResetEmail = async (email: string, token: string): Promise<boolean> => {
  try {
    // Verify that Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('Resend API key not configured. Using mock email service for development.');
      console.log(`Password reset link for ${email}: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password/${token}`);
      return true; // Return true in development to allow the flow to continue
    }
    
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password/${token}`;
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: email,
      subject: 'Password Reset Request - Coin-IQ',
      text: generatePasswordResetEmailText(resetLink),
      html: generatePasswordResetEmailHTML(resetLink),
    });
    
    if (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
    
    console.log('Password reset email sent successfully:', data?.id);
    console.log(`Reset link: ${resetLink}`);
    
    return true;
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    
    console.warn('Resend email sending failed. Using mock email service for development.');
    console.log(`Password reset link for ${email}: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password/${token}`);
    console.log('NOTE: In production, ensure your Resend API key is correctly configured in environment variables.\n');
    
    return true; // Return true in development to allow the flow to continue despite email failure
  }
};

/**
 * Generates HTML content for the password reset email
 */
const generatePasswordResetEmailHTML = (resetLink: string): string => {
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; font-size: 0.8em; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Coin-IQ Password Reset</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have requested to reset your password. Click the button below to create a new password:</p>
          <p><a href="${resetLink}" class="button">Reset Password</a></p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>This link will expire in 1 hour for security reasons.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Coin-IQ. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generates plain text content for the password reset email
 */
const generatePasswordResetEmailText = (resetLink: string): string => {
  return `Coin-IQ Password Reset

Hello,

You have requested to reset your password. Click the link below to create a new password:

${resetLink}

If you did not request a password reset, please ignore this email.

This link will expire in 1 hour for security reasons.

Best regards,
The Coin-IQ Team`;
};

/**
 * Generic send email function
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Verify that Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('Resend API key not configured. Using mock email service for development.');
      console.log(`Email would be sent to: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      return true; // Return true in development to allow the flow to continue
    }
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    
    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }
    
    console.log('Email sent successfully:', data?.id);
    
    return true;
  } catch (error: any) {
    console.error('Error sending email:', error);
    
    console.warn('Resend email sending failed. Using mock email service for development.');
    console.log(`Email would be sent to: ${options.to}`);
    return true; // Return true in development to allow the flow to continue despite email failure
  }
};