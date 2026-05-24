import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCourse } from '@/lib/lmsData';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const res = await pool.query(`
      SELECT c.certificate_id, c.issued_at, c.course_slug,
             u.name as user_name
      FROM lms_certificates c
      JOIN users u ON c.user_id = u.id
      WHERE c.certificate_id = $1
    `, [id]);

    if (res.rows.length === 0)
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });

    const row = res.rows[0];
    const course = getCourse(row.course_slug);

    return NextResponse.json({
      certificateId: row.certificate_id,
      userName:      row.user_name,
      courseTitle:   course?.title ?? row.course_slug,
      courseLevel:   course?.level ?? 'Beginner',
      issuedAt:      row.issued_at,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
