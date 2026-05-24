'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/providers';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParams, useRouter } from 'next/navigation';
import { validateResetToken } from '@/lib/passwordResetService';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        if (response.ok && data.valid) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          setErrorMessage(data.error || 'Invalid or expired reset token');
        }
      } catch {
        setIsValidToken(false);
        setErrorMessage('Invalid or expired reset token');
      }
    };
    if (token) validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(data.message);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setErrorMessage(data.error || 'Failed to reset password');
      }
    } catch {
      setErrorMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-black">
        <Navbar />
        <div className="h-16"></div>
        <div className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
              <h1 className="text-3xl font-bold mb-4">Invalid Reset Link</h1>
              <p className="text-gray-600">The password reset link is invalid or has expired. Please request a new one.</p>
            </motion.div>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-8 text-center">
                  <a href="/forgot-password" className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                    Request New Reset Link
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-black">
      <Navbar />
      <div className="h-16"></div>
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">Reset Your Password</h1>
            <p className="text-gray-600">Enter your new password below.</p>
          </motion.div>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-0">
              <div className="p-8">
                {successMessage ? (
                  <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
                    {successMessage}
                    <p className="mt-2">Redirecting to login...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password" required disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black" />
                      <p className="mt-2 text-sm text-gray-500">Password must be at least 8 characters.</p>
                    </div>
                    <div className="mb-6">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password" required disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black" />
                    </div>
                    {errorMessage && (
                      <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">{errorMessage}</div>
                    )}
                    <Button type="submit" disabled={loading}
                      className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50">
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </form>
                )}
                <div className="mt-6 text-center">
                  <a href="/login" className="text-sm text-black hover:underline">Back to Login</a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
