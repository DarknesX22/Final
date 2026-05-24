/**
 * Admin LMS — All certificates
 * GET    /api/admin/lms/certificates
 * DELETE /api/admin/lms/certificates  { certificateId }
 */
import { NextRequest } from 'next/server';
import { getCurrentAdminFromCookieAsync } from '@/lib/adminSession';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || undefined;
  const admin = await getCurrentAdminFromCookieAsync(cookieHeader);
  if (!admin?.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(`
      SELECT c.id, c.certificate_id, c.course_slug, c.issued_at,
             u.name as user_name, u.email as user_email
      FROM lms_certificates c
      JOIN users u ON u.id = c.user_id
      ORDER BY c.issued_at DESC
    `);
    return Response.json({ certificates: result.rows });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || undefined;
  const admin = await getCurrentAdminFromCookieAsync(cookieHeader);
  if (!admin?.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { certificateId } = await request.json();
  if (!certificateId) return Response.json({ error: 'certificateId required' }, { status: 400 });

  try {
    await pool.query('DELETE FROM lms_certificates WHERE certificate_id = $1', [certificateId]);
    // Also reset the user's quiz progress for that course
    await pool.query(`
      UPDATE lms_user_progress SET quiz_passed = false, completed = false, completed_at = null
      WHERE user_id = (SELECT user_id FROM lms_certificates WHERE certificate_id = $1)
      AND course_slug = (SELECT course_slug FROM lms_certificates WHERE certificate_id = $1)
    `, [certificateId]);
    return Response.json({ message: 'Certificate revoked' });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
