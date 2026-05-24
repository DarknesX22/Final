import { NextRequest } from 'next/server';
import { getCurrentAdminFromCookieAsync } from '@/lib/adminSession';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || undefined;
  const admin = await getCurrentAdminFromCookieAsync(cookieHeader);
  if (!admin?.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [
      users, admins, lmsProgress, lmsCerts,
      recentUsers, dailySignups,
      totalCourses, totalEnrolled,
      quizStats, topCourses,
      userGrowth, recentRegistrations,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM users'),
      pool.query('SELECT COUNT(*) as total FROM admins'),
      pool.query('SELECT COUNT(*) as total FROM lms_user_progress WHERE completed = true').catch(() => ({ rows: [{ total: 0 }] })),
      pool.query('SELECT COUNT(*) as total FROM lms_certificates').catch(() => ({ rows: [{ total: 0 }] })),
      pool.query(`SELECT COUNT(*) as total FROM users WHERE created_at > NOW() - INTERVAL '7 days'`),
      // Daily signups last 30 days
      pool.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at) ORDER BY date ASC
      `),
      // Total courses in DB
      pool.query('SELECT COUNT(*) as total FROM lms_courses').catch(() => ({ rows: [{ total: 0 }] })),
      // Total enrolled (unique users who started any course)
      pool.query('SELECT COUNT(DISTINCT user_id) as total FROM lms_user_progress').catch(() => ({ rows: [{ total: 0 }] })),
      // Quiz pass rate
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE quiz_score IS NOT NULL) as attempted,
          COUNT(*) FILTER (WHERE quiz_passed = true) as passed
        FROM lms_user_progress
      `).catch(() => ({ rows: [{ attempted: 0, passed: 0 }] })),
      // Top courses by enrollment
      pool.query(`
        SELECT course_slug,
          COUNT(*) as enrolled,
          COUNT(*) FILTER (WHERE completed = true) as completed,
          ROUND(AVG(quiz_score) FILTER (WHERE quiz_score IS NOT NULL), 1) as avg_score
        FROM lms_user_progress
        GROUP BY course_slug ORDER BY enrolled DESC LIMIT 5
      `).catch(() => ({ rows: [] })),
      // User growth: last 12 months monthly
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
               DATE_TRUNC('month', created_at) as month_date,
               COUNT(*) as count
        FROM users
        WHERE created_at > NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month_date ASC
      `),
      // Last 5 registered users
      pool.query(`
        SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5
      `),
    ]);

    const attempted = parseInt(quizStats.rows[0]?.attempted ?? 0);
    const passed    = parseInt(quizStats.rows[0]?.passed ?? 0);

    return Response.json({
      stats: {
        totalUsers:         parseInt(users.rows[0].total),
        totalAdmins:        parseInt(admins.rows[0].total),
        coursesCompleted:   parseInt(lmsProgress.rows[0].total),
        certificatesIssued: parseInt(lmsCerts.rows[0].total),
        newUsersThisWeek:   parseInt(recentUsers.rows[0].total),
        totalCourses:       parseInt(totalCourses.rows[0].total),
        totalEnrolled:      parseInt(totalEnrolled.rows[0].total),
        quizAttempted:      attempted,
        quizPassRate:       attempted > 0 ? Math.round((passed / attempted) * 100) : 0,
        dailySignups:       dailySignups.rows,
        topCourses:         topCourses.rows,
        userGrowth:         userGrowth.rows,
        recentRegistrations: recentRegistrations.rows,
      }
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
