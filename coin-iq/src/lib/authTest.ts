/**
 * Authentication Test Utilities
 * This file provides utility functions to test the authentication system
 */

import { UserInput } from './userService';
import { createUser, findUserByEmail, verifyPassword } from './userService';
import { createToken } from './session';

// Test user data for development and testing purposes
export const testUserData: UserInput = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'SecurePass123!'
};

// Function to create a test user in the database
export const createTestUser = async (): Promise<any> => {
  try {
    console.log('Creating test user...');
    
    // Check if test user already exists
    const existingUser = await findUserByEmail(testUserData.email);
    if (existingUser) {
      console.log('Test user already exists');
      return existingUser;
    }
    
    // Create new test user
    const newUser = await createUser(testUserData);
    console.log('Test user created successfully:', newUser.email);
    
    // Create a JWT token for the test user
    const token = createToken(newUser);
    console.log('Generated token for test user');
    
    return {
      ...newUser,
      token
    };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};

// Function to validate the authentication flow
export const validateAuthFlow = async (): Promise<boolean> => {
  try {
    console.log('Validating authentication flow...');
    
    // Create test user
    const user = await createTestUser();
    
    // Verify user can be found by email
    const foundUser = await findUserByEmail(user.email);
    if (!foundUser) {
      throw new Error('Could not find user by email');
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(testUserData.password, foundUser.password_hash);
    if (!isPasswordValid) {
      throw new Error('Password verification failed');
    }
    
    // Verify token creation works
    const token = createToken(foundUser);
    if (!token) {
      throw new Error('Token creation failed');
    }
    
    console.log('Authentication flow validation passed!');
    return true;
  } catch (error) {
    console.error('Authentication flow validation failed:', error);
    return false;
  }
};

// Function to cleanup test data (should be used in development only)
export const cleanupTestUser = async (): Promise<void> => {
  // Note: In a real application, you would add code to delete the test user
  // For security reasons, this is omitted in this implementation
  console.log('Test user cleanup would happen here in a real implementation');
};