import { redirect } from 'next/navigation';

// Admin login is now handled by the unified /login page.
// Admins are detected automatically — if the email exists in the admins
// table, they are redirected to /admin after login.
export default function AdminLoginPage() {
  redirect('/login');
}
