'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, BookOpen, Award, Settings, LogOut,
  Search, ChevronLeft, ChevronRight, Copy, Check, RefreshCw,
  Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, GraduationCap,
  FileText, HelpCircle, TrendingUp, Shield,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  totalUsers: number; totalAdmins: number;
  coursesCompleted: number; certificatesIssued: number;
  newUsersThisWeek: number; totalCourses: number;
  totalEnrolled: number; quizPassRate: number; quizAttempted: number;
  dailySignups: { date: string; count: string | number }[];
  topCourses: { course_slug: string; enrolled: string; completed: string; avg_score: string | null }[];
  userGrowth: { month: string; count: string | number }[];
  recentRegistrations: { id: number; name: string; email: string; created_at: string }[];
}
interface AdminUser {
  id: number; name: string; email: string; role: string;
  created_at: string; courses_completed?: number;
}
interface LogEntry {
  id: string; actor_name: string; actor_email: string;
  action: string; type: string; created_at: string;
}
interface DBCourse {
  id: number; slug: string; title: string; description: string;
  level: string; duration_minutes: number; icon: string;
  lesson_count: number; quiz_count: number;
  lessonCount?: number; quizQuestions?: number;
  lessons?: { title: string; duration: number }[];
  enrolled: number; completed: number; passed: number; avgScore: number;
}
interface DBLesson {
  id: number; course_slug: string; lesson_index: number;
  title: string; content: string; duration_minutes: number;
}
interface DBQuestion {
  id: number; course_slug: string; question_order: number;
  question: string; options: string[]; correct_index: number; explanation: string;
}
interface ProgressEntry {
  id: number; user_name: string; user_email: string; course_slug: string;
  lessons_done: number; total_lessons: number; quiz_score: number | null;
  passed: boolean; completed: boolean; started_at: string;
}
interface Certificate {
  id: string; user_name: string; user_email: string;
  course_slug: string; issued_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function Skel({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}
function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}
      className="ml-1 text-gray-400 hover:text-gray-700 transition-colors">
      {ok ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: 'gray' | 'black' | 'green' | 'red' | 'yellow' }) {
  const cls = {
    gray:   'bg-gray-100 text-gray-600',
    black:  'bg-gray-900 text-white',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-700',
  }[variant];
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{children}</span>;
}
function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        {cols.map(c => (
          <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{c}</th>
        ))}
      </tr>
    </thead>
  );
}
function EmptyRow({ cols, msg }: { cols: number; msg: string }) {
  return (
    <tr><td colSpan={cols} className="px-4 py-12 text-center text-gray-400 text-sm">{msg}</td></tr>
  );
}
function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between mt-4">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
        <ChevronLeft size={14} /> Prev
      </button>
      <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all";
const textareaCls = `${inputCls} resize-none`;

// ─── Signups Area Chart ───────────────────────────────────────────────────────
function SignupsChart({ data }: { data: { date: string; count: string | number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!data?.length) return (
    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>
  );

  const counts  = data.map(d => Number(d.count));
  const max     = Math.max(...counts, 1);
  const W       = 600;
  const H       = 160;
  const padL    = 28;
  const padR    = 12;
  const padT    = 12;
  const padB    = 28;
  const chartW  = W - padL - padR;
  const chartH  = H - padT - padB;
  const n       = data.length;

  const xPos = (i: number) => padL + (i / (n - 1)) * chartW;
  const yPos = (v: number) => padT + chartH - (v / max) * chartH;

  // Build smooth polyline points
  const points = data.map((d, i) => `${xPos(i)},${yPos(Number(d.count))}`).join(' ');

  // Area path (closed polygon for gradient fill)
  const areaPath = [
    `M ${xPos(0)},${yPos(Number(data[0].count))}`,
    ...data.slice(1).map((d, i) => `L ${xPos(i + 1)},${yPos(Number(d.count))}`),
    `L ${xPos(n - 1)},${padT + chartH}`,
    `L ${xPos(0)},${padT + chartH}`,
    'Z',
  ].join(' ');

  // Y-axis grid lines (4 levels)
  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  // Show every Nth label to avoid crowding
  const labelEvery = Math.ceil(n / 8);

  return (
    <div className="relative w-full" style={{ paddingBottom: '28%' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#111827" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLevels.map((lvl, i) => {
          const y = padT + chartH - lvl * chartH;
          const val = Math.round(lvl * max);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y}
                stroke="#f3f4f6" strokeWidth="1" />
              <text x={padL - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#9ca3af">
                {val > 0 ? val : ''}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#signupGrad)" />

        {/* Line */}
        <polyline points={points} fill="none" stroke="#111827" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points + hover zones */}
        {data.map((d, i) => {
          const x = xPos(i);
          const y = yPos(Number(d.count));
          const isHov = hovered === i;
          return (
            <g key={i}>
              {/* Invisible wide hit area */}
              <rect
                x={x - (chartW / n) / 2} y={padT} width={chartW / n} height={chartH}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
              />
              {/* Hover vertical line */}
              {isHov && (
                <line x1={x} y1={padT} x2={x} y2={padT + chartH}
                  stroke="#111827" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
              )}
              {/* Dot */}
              <circle cx={x} cy={y} r={isHov ? 4 : 2.5}
                fill={isHov ? '#111827' : '#374151'}
                stroke="white" strokeWidth="1.5" />
              {/* Tooltip */}
              {isHov && (
                <g>
                  <rect x={Math.min(x - 28, W - padR - 60)} y={y - 30} width={56} height={20}
                    rx={4} fill="#111827" />
                  <text x={Math.min(x, W - padR - 32)} y={y - 16}
                    textAnchor="middle" fontSize="9" fill="white" fontWeight="600">
                    {String(d.date).slice(5)} · {d.count}
                  </text>
                </g>
              )}
              {/* X-axis date labels */}
              {i % labelEvery === 0 && (
                <text x={x} y={H - 6} textAnchor="middle" fontSize="8" fill="#9ca3af">
                  {String(d.date).slice(5)}
                </text>
              )}
            </g>
          );
        })}

        {/* Bottom axis line */}
        <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH}
          stroke="#e5e7eb" strokeWidth="1" />
      </svg>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
type Section = 'overview' | 'users' | 'lms' | 'certificates' | 'settings';
const NAV: { id: Section; label: string; icon: any }[] = [
  { id: 'overview',     label: 'Overview',     icon: LayoutDashboard },
  { id: 'users',        label: 'Users',         icon: Users },
  { id: 'lms',          label: 'LMS',           icon: GraduationCap },
  { id: 'certificates', label: 'Certificates',  icon: Award },
  { id: 'settings',     label: 'Settings',      icon: Settings },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [section, setSection] = useState<Section>('overview');
  const [stats, setStats]     = useState<Stats | null>(null);
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal]         = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersPage, setUsersPage]           = useState(1);
  const [userSearch, setUserSearch]         = useState('');
  const [logs, setLogs]       = useState<LogEntry[]>([]);
  const [courses, setCourses] = useState<DBCourse[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [certs, setCerts]     = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [a, u, l, c, p, ce] = await Promise.all([
        fetch('/api/admin/data/analytics',    { credentials: 'include' }),
        fetch('/api/admin/data/users?limit=20&page=1', { credentials: 'include' }),
        fetch('/api/admin/data/logs?limit=20&page=1',  { credentials: 'include' }),
        fetch('/api/admin/lms/courses',       { credentials: 'include' }),
        fetch('/api/admin/lms/progress',      { credentials: 'include' }),
        fetch('/api/admin/lms/certificates',  { credentials: 'include' }),
      ]);
      if (a.ok) { const d = await a.json(); setStats(d.stats); }
      if (u.ok) { const d = await u.json(); setUsers(d.users||[]); setUsersTotal(d.total||0); setUsersTotalPages(d.totalPages||1); }
      if (l.ok) { const d = await l.json(); setLogs(d.logs||[]); }
      if (c.ok) { const d = await c.json(); setCourses(d.courses||[]); }
      if (p.ok) { const d = await p.json(); setProgress(d.progress||[]); }
      if (ce.ok){ const d = await ce.json(); setCerts(d.certificates||[]); }
    } catch { setError('Failed to load data. Please retry.'); }
    finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async (page: number, search: string) => {
    const q = new URLSearchParams({ limit: '20', page: String(page) });
    if (search) q.set('search', search);
    const r = await fetch(`/api/admin/data/users?${q}`, { credentials: 'include' });
    if (r.ok) { const d = await r.json(); setUsers(d.users||[]); setUsersTotal(d.total||0); setUsersTotalPages(d.totalPages||1); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { const t = setTimeout(() => { setUsersPage(1); fetchUsers(1, userSearch); }, 400); return () => clearTimeout(t); }, [userSearch, fetchUsers]);
  useEffect(() => { fetchUsers(usersPage, userSearch); }, [usersPage]); // eslint-disable-line

  const logout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    window.location.href = '/login';
  };

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="fixed top-0 left-0 h-full w-56 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-6 px-2"><div className="w-7 h-7 bg-black rounded-lg" /><span className="font-black text-sm">CoinIQ Admin</span></div>
        {NAV.map(n => <Skel key={n.id} className="h-10 mb-1" />)}
      </aside>
      <main className="ml-56 flex-1 p-8"><Skel className="h-8 w-48 mb-8" /><div className="grid grid-cols-4 gap-4 mb-8">{[0,1,2,3].map(i=><Skel key={i} className="h-28"/>)}</div><Skel className="h-64"/></main>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center"><p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchAll} className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm hover:bg-gray-800"><RefreshCw size={14}/>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-56 bg-white border-r border-gray-200 flex flex-col z-30">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xs">C</span>
          </div>
          <span className="font-black text-sm tracking-tight text-gray-900">CoinIQ Admin</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                section === n.id ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <n.icon size={17} />{n.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <LogOut size={17} />Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {section === 'overview'     && <OverviewSection stats={stats} logs={logs} />}
          {section === 'users'        && <UsersSection users={users} total={usersTotal} totalPages={usersTotalPages} page={usersPage} search={userSearch} onSearch={setUserSearch} onPage={setUsersPage} onRefresh={() => fetchUsers(usersPage, userSearch)} onUsersChange={setUsers} />}
          {section === 'lms'          && <LMSSection courses={courses} progress={progress} onCoursesChange={setCourses} />}
          {section === 'certificates' && <CertificatesSection certs={certs} onCertsChange={setCerts} />}
          {section === 'settings'     && <SettingsSection stats={stats} />}
        </div>
      </main>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function OverviewSection({ stats, logs }: { stats: Stats | null; logs: LogEntry[] }) {
  const s = stats;

  // Monthly user growth bar chart (SVG)
  const growthData = s?.userGrowth ?? [];
  const growthMax  = Math.max(...growthData.map(d => Number(d.count)), 1);

  // Donut ring helper
  const DonutRing = ({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) => {
    const r = size / 2 - 8;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Live platform metrics — refreshes on page load</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-700">Live Data</span>
        </div>
      </div>

      {/* ── Row 1: 4 primary KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',       value: s?.totalUsers ?? 0,         sub: `+${s?.newUsersThisWeek ?? 0} this week`,  icon: Users,        bg: 'bg-gray-900',   ring: '#111827' },
          { label: 'Courses Available', value: s?.totalCourses ?? 0,       sub: `${s?.totalEnrolled ?? 0} enrolled`,       icon: GraduationCap, bg: 'bg-blue-600',  ring: '#2563eb' },
          { label: 'Certificates',      value: s?.certificatesIssued ?? 0, sub: `${s?.coursesCompleted ?? 0} completions`, icon: Award,         bg: 'bg-amber-500', ring: '#f59e0b' },
          { label: 'Quiz Pass Rate',    value: `${s?.quizPassRate ?? 0}%`,  sub: `${s?.quizAttempted ?? 0} attempts`,      icon: TrendingUp,    bg: 'bg-green-600', ring: '#16a34a' },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}>
              <card.icon size={22} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{card.label}</p>
              <p className="text-2xl font-black text-gray-900 leading-tight">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Daily signups area chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-base font-bold text-gray-900">Daily Signups</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 30 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900">{s?.totalUsers ?? 0}</p>
              <p className="text-xs text-gray-400">total users</p>
            </div>
          </div>
          {/* Mini stats row */}
          <div className="flex gap-4 mb-4">
            {(() => {
              const counts = (s?.dailySignups ?? []).map(d => Number(d.count));
              const total30 = counts.reduce((a, b) => a + b, 0);
              const peak    = Math.max(...counts, 0);
              const avg     = counts.length ? (total30 / counts.length).toFixed(1) : '0';
              return [
                { label: 'Last 30d', value: total30 },
                { label: 'Daily avg', value: avg },
                { label: 'Peak day', value: peak },
              ].map(stat => (
                <div key={stat.label} className="bg-gray-50 rounded-xl px-4 py-2 text-center">
                  <p className="text-sm font-black text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              ));
            })()}
          </div>
          <SignupsChart data={s?.dailySignups ?? []} />
        </div>

        {/* LMS donut stats */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between">
          <h2 className="text-base font-bold text-gray-900 mb-5">LMS Health</h2>
          <div className="space-y-5">
            {/* Enrollment rate */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <DonutRing
                  pct={s?.totalUsers ? Math.min(100, Math.round(((s?.totalEnrolled ?? 0) / s.totalUsers) * 100)) : 0}
                  color="#2563eb" size={72}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-gray-900">
                    {s?.totalUsers ? Math.min(100, Math.round(((s?.totalEnrolled ?? 0) / s.totalUsers) * 100)) : 0}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Enrollment Rate</p>
                <p className="text-xs text-gray-400">{s?.totalEnrolled ?? 0} of {s?.totalUsers ?? 0} users enrolled</p>
              </div>
            </div>

            {/* Quiz pass rate */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <DonutRing pct={s?.quizPassRate ?? 0} color="#16a34a" size={72} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-gray-900">{s?.quizPassRate ?? 0}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Quiz Pass Rate</p>
                <p className="text-xs text-gray-400">{s?.quizAttempted ?? 0} attempts total</p>
              </div>
            </div>

            {/* Completion rate */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <DonutRing
                  pct={s?.totalEnrolled ? Math.min(100, Math.round(((s?.coursesCompleted ?? 0) / s.totalEnrolled) * 100)) : 0}
                  color="#f59e0b" size={72}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-gray-900">
                    {s?.totalEnrolled ? Math.min(100, Math.round(((s?.coursesCompleted ?? 0) / s.totalEnrolled) * 100)) : 0}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Completion Rate</p>
                <p className="text-xs text-gray-400">{s?.coursesCompleted ?? 0} courses finished</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Monthly growth + Top courses + Recent users ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Monthly user growth */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-5">Monthly Growth</h2>
          {growthData.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
            : (
              <div className="flex items-end gap-1.5 h-28">
                {growthData.map((d, i) => {
                  const h = Math.max(4, (Number(d.count) / growthMax) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500 font-medium">{Number(d.count)}</span>
                      <div
                        className="w-full bg-gray-900 rounded-t-md transition-all"
                        style={{ height: `${h}%` }}
                        title={`${d.month}: ${d.count}`}
                      />
                      <span className="text-xs text-gray-400 truncate w-full text-center">{d.month}</span>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>

        {/* Top courses */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Top Courses</h2>
          {(s?.topCourses?.length ?? 0) === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No enrollments yet</p>
            : (
              <div className="space-y-3">
                {s!.topCourses.map((c, i) => {
                  const enrolled  = parseInt(c.enrolled);
                  const completed = parseInt(c.completed);
                  const pct = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800 truncate max-w-[60%]">{c.course_slug}</span>
                        <span className="text-xs text-gray-500">{enrolled} enrolled</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 bg-gray-900 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{pct}% completion · avg score: {c.avg_score ?? '—'}%</p>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>

        {/* Recent registrations */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Recent Registrations</h2>
          {(s?.recentRegistrations?.length ?? 0) === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No users yet</p>
            : (
              <div className="space-y-3">
                {s!.recentRegistrations.map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">{u.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{relTime(u.created_at)}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* ── Row 4: Activity feed ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Activity Feed</h2>
        {logs.length === 0
          ? <p className="text-sm text-gray-400">No activity yet.</p>
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {logs.slice(0, 9).map(log => {
                const typeColor: Record<string, string> = {
                  signup:      'bg-blue-50 text-blue-700 border-blue-200',
                  certificate: 'bg-amber-50 text-amber-700 border-amber-200',
                  course:      'bg-green-50 text-green-700 border-green-200',
                };
                const cls = typeColor[log.type] ?? 'bg-gray-50 text-gray-600 border-gray-200';
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-gray-600">{log.actor_name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{log.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium border ${cls}`}>{log.type}</span>
                        <span className="text-xs text-gray-400">{relTime(log.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────
function UsersSection({ users, total, totalPages, page, search, onSearch, onPage, onRefresh, onUsersChange }: {
  users: AdminUser[]; total: number; totalPages: number; page: number;
  search: string; onSearch: (v: string) => void; onPage: (p: number) => void;
  onRefresh: () => void; onUsersChange: (u: AdminUser[]) => void;
}) {
  const promote = async (email: string) => {
    if (!confirm(`Promote ${email} to admin?`)) return;
    const r = await fetch('/api/admin/users/promote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userEmail: email }) });
    r.ok ? (toast.success(`${email} promoted`), onRefresh()) : toast.error('Failed');
  };
  const del = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? Cannot be undone.`)) return;
    const r = await fetch('/api/admin/data/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userId: id }) });
    r.ok ? (toast.success('User deleted'), onUsersChange(users.filter(u => u.id !== id))) : toast.error('Failed');
  };

  return (
    <div>
      <PageTitle title="Users" subtitle={`${total} registered users`} />
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <TableHead cols={['#','Name','Email','Role','Joined','Courses','Actions']} />
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? <EmptyRow cols={7} msg="No users found" /> : users.map((u, i) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{(page-1)*20+i+1}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3"><Badge variant={u.role === 'user' ? 'gray' : 'black'}>{u.role}</Badge></td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(u.created_at)}</td>
                <td className="px-4 py-3 text-gray-600">{u.courses_completed ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {u.role === 'user' && <button onClick={() => promote(u.email)} className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">Promote</button>}
                    <button onClick={() => del(u.id, u.name)} className="px-2.5 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={onPage} />
    </div>
  );
}

// ─── LMS Section ─────────────────────────────────────────────────────────────
function LMSSection({ courses, progress, onCoursesChange }: {
  courses: DBCourse[]; progress: ProgressEntry[];
  onCoursesChange: (c: DBCourse[]) => void;
}) {
  const [tab, setTab] = useState<'courses' | 'progress'>('courses');
  const [courseFilter, setCourseFilter] = useState('');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [editCourse, setEditCourse] = useState<DBCourse | null>(null);
  const [manageCourse, setManageCourse] = useState<DBCourse | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const deleteCourse = async (slug: string, title: string) => {
    if (!confirm(`Delete course "${title}" and all its content? This cannot be undone.`)) return;
    const r = await fetch(`/api/admin/lms/courses/${slug}`, { method: 'DELETE', credentials: 'include' });
    if (r.ok) { toast.success('Course deleted'); onCoursesChange(courses.filter(c => c.slug !== slug)); }
    else toast.error('Failed to delete course');
  };

  const filteredProgress = courseFilter ? progress.filter(p => p.course_slug === courseFilter) : progress;

  return (
    <div>
      <PageTitle title="LMS Management" subtitle="Manage courses, lessons and quiz questions" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['courses','progress'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'courses' ? `Courses (${courses.length})` : `Progress (${progress.length})`}
          </button>
        ))}
      </div>

      {/* ── Courses tab ── */}
      {tab === 'courses' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowAddCourse(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">
              <Plus size={16} /> Add Course
            </button>
          </div>

          <div className="space-y-3">
            {courses.length === 0 && <p className="text-center text-gray-400 py-12 text-sm">No courses yet. Add one above.</p>}
            {courses.map(c => (
              <div key={c.slug} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {/* Course header row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <span className="text-3xl shrink-0">{c.icon || '📚'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{c.title}</h3>
                      <Badge variant={c.level === 'Beginner' ? 'green' : c.level === 'Intermediate' ? 'yellow' : 'red'}>{c.level}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{c.description}</p>
                  </div>
                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 text-center shrink-0">
                    {[
                      { label: 'Lessons',   value: c.lessonCount ?? c.lesson_count },
                      { label: 'Quiz Qs',   value: c.quizQuestions ?? c.quiz_count },
                      { label: 'Enrolled',  value: c.enrolled },
                      { label: 'Completed', value: c.completed },
                    ].map(s => (
                      <div key={s.label}>
                        <p className="text-lg font-black text-gray-900">{s.value}</p>
                        <p className="text-xs text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setManageCourse(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <FileText size={13} /> Content
                    </button>
                    <button onClick={() => setEditCourse(c)}
                      className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteCourse(c.slug, c.title)}
                      className="p-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-500">
                      <Trash2 size={14} />
                    </button>
                    <button onClick={() => setExpandedSlug(expandedSlug === c.slug ? null : c.slug)}
                      className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500">
                      {expandedSlug === c.slug ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded lesson list */}
                {expandedSlug === c.slug && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Lessons</p>
                    {c.lessons && c.lessons.length > 0
                      ? <ol className="list-decimal list-inside space-y-1">{c.lessons.map((l, i) => <li key={i} className="text-sm text-gray-700">{l.title} <span className="text-gray-400">({l.duration}min)</span></li>)}</ol>
                      : <p className="text-sm text-gray-400">No lessons yet.</p>
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Progress tab ── */}
      {tab === 'progress' && (
        <div>
          <div className="mb-4">
            <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option value="">All Courses</option>
              {courses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
            </select>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <TableHead cols={['User','Email','Course','Lessons','Score','Passed','Status','Started']} />
              <tbody className="divide-y divide-gray-100">
                {filteredProgress.length === 0 ? <EmptyRow cols={8} msg="No progress records" /> : filteredProgress.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{p.user_name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.user_email}</td>
                    <td className="px-4 py-3 text-gray-600">{p.course_slug}</td>
                    <td className="px-4 py-3 text-gray-600">{p.lessons_done}/{p.total_lessons}</td>
                    <td className="px-4 py-3 text-gray-600">{p.quiz_score != null ? `${p.quiz_score}%` : '—'}</td>
                    <td className="px-4 py-3"><Badge variant={p.passed ? 'green' : 'red'}>{p.passed ? 'Yes' : 'No'}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={p.completed ? 'black' : 'gray'}>{p.completed ? 'Done' : 'In Progress'}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(p.started_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddCourse && <AddCourseModal onClose={() => setShowAddCourse(false)} onAdded={c => { onCoursesChange([...courses, c]); setShowAddCourse(false); }} />}
      {editCourse   && <EditCourseModal course={editCourse} onClose={() => setEditCourse(null)} onSaved={updated => { onCoursesChange(courses.map(c => c.slug === updated.slug ? { ...c, ...updated } : c)); setEditCourse(null); }} />}
      {manageCourse && <ManageCourseModal course={manageCourse} onClose={() => setManageCourse(null)} onUpdated={updated => { onCoursesChange(courses.map(c => c.slug === updated.slug ? updated : c)); }} />}
    </div>
  );
}

// ─── Add Course Modal (3-step wizard) ────────────────────────────────────────
interface NewLesson { title: string; content: string; duration_minutes: number; }
interface NewQuestion { question: string; options: string[]; correct_index: number; explanation: string; }

function AddCourseModal({ onClose, onAdded }: { onClose: () => void; onAdded: (c: DBCourse) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — course metadata
  const [meta, setMeta] = useState({ slug: '', title: '', description: '', level: 'Beginner', duration_minutes: 30, icon: '📚' });
  const setM = (k: string, v: any) => setMeta(f => ({ ...f, [k]: v }));

  // Step 2 — lessons
  const [lessons, setLessons] = useState<NewLesson[]>([{ title: '', content: '', duration_minutes: 5 }]);
  const addLesson    = () => setLessons(ls => [...ls, { title: '', content: '', duration_minutes: 5 }]);
  const removeLesson = (i: number) => setLessons(ls => ls.filter((_, j) => j !== i));
  const setLesson    = (i: number, k: keyof NewLesson, v: any) => setLessons(ls => ls.map((l, j) => j === i ? { ...l, [k]: v } : l));

  // Step 3 — quiz questions
  const [questions, setQuestions] = useState<NewQuestion[]>([{ question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' }]);
  const addQuestion    = () => setQuestions(qs => [...qs, { question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' }]);
  const removeQuestion = (i: number) => setQuestions(qs => qs.filter((_, j) => j !== i));
  const setQuestion    = (i: number, k: keyof NewQuestion, v: any) => setQuestions(qs => qs.map((q, j) => j === i ? { ...q, [k]: v } : q));
  const setOption      = (qi: number, oi: number, v: string) => setQuestions(qs => qs.map((q, j) => j === qi ? { ...q, options: q.options.map((o, k) => k === oi ? v : o) } : q));

  // Final submit — create course, then add lessons + questions
  const submit = async () => {
    if (!meta.slug || !meta.title) { toast.error('Slug and title are required'); setStep(1); return; }
    setSaving(true);
    try {
      // 1. Create course
      const cr = await fetch('/api/admin/lms/courses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(meta),
      });
      const cd = await cr.json();
      if (!cr.ok) { toast.error(cd.error || 'Failed to create course'); setSaving(false); return; }

      // 2. Add lessons in order
      const validLessons = lessons.filter(l => l.title.trim());
      for (const lesson of validLessons) {
        await fetch('/api/admin/lms/lessons', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ courseSlug: meta.slug, ...lesson }),
        });
      }

      // 3. Add quiz questions in order
      const validQuestions = questions.filter(q => q.question.trim() && q.options.every(o => o.trim()));
      for (const q of validQuestions) {
        await fetch('/api/admin/lms/quiz', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ courseSlug: meta.slug, ...q }),
        });
      }

      toast.success(`Course "${meta.title}" created with ${validLessons.length} lessons and ${validQuestions.length} questions`);
      onAdded({
        ...cd.course,
        enrolled: 0, completed: 0, passed: 0, avgScore: 0,
        lessons: validLessons.map(l => ({ title: l.title, duration: l.duration_minutes })),
        lessonCount: validLessons.length,
        quizQuestions: validQuestions.length,
      });
    } catch { toast.error('Something went wrong'); }
    setSaving(false);
  };

  const STEPS = ['Course Info', 'Lessons', 'Quiz Questions'];

  return (
    <Modal title="Create New Course" onClose={onClose}>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
              step === i + 1 ? 'bg-black text-white' : step > i + 1 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Course Info ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug (URL-safe, unique)">
              <input required value={meta.slug}
                onChange={e => setM('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                placeholder="my-course" className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Used in the URL: /learn/{meta.slug || 'my-course'}</p>
            </Field>
            <Field label="Icon (emoji)">
              <input value={meta.icon} onChange={e => setM('icon', e.target.value)} placeholder="📚" className={inputCls} />
            </Field>
          </div>
          <Field label="Title">
            <input required value={meta.title} onChange={e => setM('title', e.target.value)} placeholder="Blockchain Basics" className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea rows={3} value={meta.description} onChange={e => setM('description', e.target.value)} placeholder="What will students learn in this course?" className={textareaCls} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Level">
              <select value={meta.level} onChange={e => setM('level', e.target.value)} className={inputCls}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </Field>
            <Field label="Duration (minutes)">
              <input type="number" min={1} value={meta.duration_minutes} onChange={e => setM('duration_minutes', parseInt(e.target.value))} className={inputCls} />
            </Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="button" onClick={() => { if (!meta.slug || !meta.title) { toast.error('Slug and title are required'); return; } setStep(2); }}
              className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
              Next: Add Lessons →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Lessons ── */}
      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Add lessons for <span className="font-semibold text-gray-900">{meta.title}</span>. You can skip and add later.</p>
            <button onClick={addLesson} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors">
              <Plus size={13} /> Add Lesson
            </button>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {lessons.map((l, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lesson {i + 1}</span>
                  {lessons.length > 1 && (
                    <button onClick={() => removeLesson(i)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <input value={l.title} onChange={e => setLesson(i, 'title', e.target.value)}
                        placeholder="Lesson title" className={inputCls} />
                    </div>
                    <input type="number" min={1} value={l.duration_minutes} onChange={e => setLesson(i, 'duration_minutes', parseInt(e.target.value))}
                      placeholder="Min" className={inputCls} title="Duration in minutes" />
                  </div>
                  <textarea rows={5} value={l.content} onChange={e => setLesson(i, 'content', e.target.value)}
                    placeholder={'## Lesson Title\n\nWrite your lesson content here...\n\n### Key Points\n- Point 1\n- Point 2'}
                    className={textareaCls} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">← Back</button>
            <button onClick={() => setStep(3)} className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
              Next: Add Quiz →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Quiz Questions ── */}
      {step === 3 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Add quiz questions. Students need 60% to pass and earn a certificate.</p>
            <button onClick={addQuestion} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors">
              <Plus size={13} /> Add Question
            </button>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {questions.map((q, qi) => (
              <div key={qi} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Question {qi + 1}</span>
                  {questions.length > 1 && (
                    <button onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <textarea rows={2} value={q.question} onChange={e => setQuestion(qi, 'question', e.target.value)}
                    placeholder="What is a blockchain?" className={textareaCls} />

                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Options <span className="text-gray-400 font-normal">(select the correct answer)</span></p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input type="radio" name={`correct-${qi}`} checked={q.correct_index === oi}
                            onChange={() => setQuestion(qi, 'correct_index', oi)}
                            className="w-4 h-4 accent-black shrink-0" />
                          <input value={opt} onChange={e => setOption(qi, oi, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            className={`${inputCls} flex-1`} />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">● = correct answer</p>
                  </div>

                  <input value={q.explanation} onChange={e => setQuestion(qi, 'explanation', e.target.value)}
                    placeholder="Explanation shown after quiz (optional)" className={inputCls} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={() => setStep(2)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">← Back</button>
            <button onClick={submit} disabled={saving}
              className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Creating…' : '✓ Create Course'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Edit Course Modal ────────────────────────────────────────────────────────
function EditCourseModal({ course, onClose, onSaved }: { course: DBCourse; onClose: () => void; onSaved: (c: DBCourse) => void }) {
  const [form, setForm] = useState({ title: course.title, description: course.description, level: course.level, duration_minutes: course.duration_minutes, icon: course.icon || '📚' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const r = await fetch(`/api/admin/lms/courses/${course.slug}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) });
    const d = await r.json();
    if (r.ok) { toast.success('Course updated'); onSaved({ ...course, ...form }); }
    else toast.error(d.error || 'Failed');
    setSaving(false);
  };

  return (
    <Modal title={`Edit: ${course.title}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Icon (emoji)">
            <input value={form.icon} onChange={e => set('icon', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Level">
            <select value={form.level} onChange={e => set('level', e.target.value)} className={inputCls}>
              <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
            </select>
          </Field>
        </div>
        <Field label="Title">
          <input required value={form.title} onChange={e => set('title', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Description">
          <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} className={textareaCls} />
        </Field>
        <Field label="Duration (minutes)">
          <input type="number" min={1} value={form.duration_minutes} onChange={e => set('duration_minutes', parseInt(e.target.value))} className={inputCls} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors">{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Manage Course Content Modal ──────────────────────────────────────────────
function ManageCourseModal({ course, onClose, onUpdated }: { course: DBCourse; onClose: () => void; onUpdated: (c: DBCourse) => void }) {
  const [tab, setTab] = useState<'lessons' | 'quiz'>('lessons');
  const [lessons, setLessons] = useState<DBLesson[]>([]);
  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLesson, setEditLesson] = useState<DBLesson | null>(null);
  const [addLesson, setAddLesson] = useState(false);
  const [editQ, setEditQ] = useState<DBQuestion | null>(null);
  const [addQ, setAddQ] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/lms/courses/${course.slug}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setLessons(d.lessons || []); setQuestions(d.quiz || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [course.slug]);

  const delLesson = async (id: number) => {
    if (!confirm('Delete this lesson?')) return;
    const r = await fetch('/api/admin/lms/lessons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id, courseSlug: course.slug }) });
    if (r.ok) { setLessons(ls => ls.filter(l => l.id !== id)); toast.success('Lesson deleted'); }
    else toast.error('Failed');
  };
  const delQ = async (id: number) => {
    if (!confirm('Delete this question?')) return;
    const r = await fetch('/api/admin/lms/quiz', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id, courseSlug: course.slug }) });
    if (r.ok) { setQuestions(qs => qs.filter(q => q.id !== id)); toast.success('Question deleted'); }
    else toast.error('Failed');
  };

  return (
    <Modal title={`Content: ${course.title}`} onClose={onClose}>
      {loading ? <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
        <div>
          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-gray-200">
            {(['lessons','quiz'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors ${tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'}`}>
                {t === 'lessons' ? `Lessons (${lessons.length})` : `Quiz (${questions.length})`}
              </button>
            ))}
          </div>

          {/* Lessons */}
          {tab === 'lessons' && (
            <div>
              <div className="flex justify-end mb-3">
                <button onClick={() => setAddLesson(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"><Plus size={13}/>Add Lesson</button>
              </div>
              <div className="space-y-2">
                {lessons.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No lessons yet.</p>}
                {lessons.map(l => (
                  <div key={l.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">{l.lesson_index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{l.title}</p>
                      <p className="text-xs text-gray-400">{l.duration_minutes} min · {l.content.length} chars</p>
                    </div>
                    <button onClick={() => setEditLesson(l)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"><Pencil size={13}/></button>
                    <button onClick={() => delLesson(l.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz */}
          {tab === 'quiz' && (
            <div>
              <div className="flex justify-end mb-3">
                <button onClick={() => setAddQ(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"><Plus size={13}/>Add Question</button>
              </div>
              <div className="space-y-2">
                {questions.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No questions yet.</p>}
                {questions.map((q, i) => (
                  <div key={q.id} className="p-3 border border-gray-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 mt-0.5">{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{q.question}</p>
                        <div className="mt-1 space-y-0.5">
                          {(Array.isArray(q.options) ? q.options : JSON.parse(q.options as any)).map((opt: string, oi: number) => (
                            <p key={oi} className={`text-xs ${oi === q.correct_index ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                              {oi === q.correct_index ? '✓ ' : '  '}{opt}
                            </p>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => setEditQ(q)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"><Pencil size={13}/></button>
                      <button onClick={() => delQ(q.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nested modals */}
      {addLesson  && <LessonFormModal courseSlug={course.slug} onClose={() => setAddLesson(false)} onSaved={l => { setLessons(ls => [...ls, l]); setAddLesson(false); }} />}
      {editLesson && <LessonFormModal courseSlug={course.slug} lesson={editLesson} onClose={() => setEditLesson(null)} onSaved={l => { setLessons(ls => ls.map(x => x.id === l.id ? l : x)); setEditLesson(null); }} />}
      {addQ  && <QuestionFormModal courseSlug={course.slug} onClose={() => setAddQ(false)} onSaved={q => { setQuestions(qs => [...qs, q]); setAddQ(false); }} />}
      {editQ && <QuestionFormModal courseSlug={course.slug} question={editQ} onClose={() => setEditQ(null)} onSaved={q => { setQuestions(qs => qs.map(x => x.id === q.id ? q : x)); setEditQ(null); }} />}
    </Modal>
  );
}

// ─── Lesson Form Modal ────────────────────────────────────────────────────────
function LessonFormModal({ courseSlug, lesson, onClose, onSaved }: { courseSlug: string; lesson?: DBLesson; onClose: () => void; onSaved: (l: DBLesson) => void }) {
  const [form, setForm] = useState({ title: lesson?.title || '', content: lesson?.content || '', duration_minutes: lesson?.duration_minutes || 5 });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const isEdit = !!lesson;
    const r = await fetch('/api/admin/lms/lessons', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify(isEdit ? { id: lesson!.id, ...form } : { courseSlug, ...form }),
    });
    const d = await r.json();
    if (r.ok) { toast.success(isEdit ? 'Lesson updated' : 'Lesson added'); onSaved(d.lesson); }
    else toast.error(d.error || 'Failed');
    setSaving(false);
  };

  return (
    <Modal title={lesson ? 'Edit Lesson' : 'Add Lesson'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title"><input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="What is Blockchain?" className={inputCls} /></Field>
        <Field label="Duration (minutes)"><input type="number" min={1} value={form.duration_minutes} onChange={e => set('duration_minutes', parseInt(e.target.value))} className={inputCls} /></Field>
        <Field label="Content (markdown supported)">
          <textarea rows={10} required value={form.content} onChange={e => set('content', e.target.value)} placeholder="## Introduction&#10;&#10;Write your lesson content here..." className={textareaCls} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors">{saving ? 'Saving…' : lesson ? 'Save Changes' : 'Add Lesson'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Question Form Modal ──────────────────────────────────────────────────────
function QuestionFormModal({ courseSlug, question, onClose, onSaved }: { courseSlug: string; question?: DBQuestion; onClose: () => void; onSaved: (q: DBQuestion) => void }) {
  const initOpts = question ? (Array.isArray(question.options) ? question.options : JSON.parse(question.options as any)) : ['', '', '', ''];
  const [q, setQ] = useState(question?.question || '');
  const [opts, setOpts] = useState<string[]>(initOpts);
  const [correct, setCorrect] = useState(question?.correct_index ?? 0);
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const isEdit = !!question;
    const body = isEdit
      ? { id: question!.id, question: q, options: opts, correct_index: correct, explanation }
      : { courseSlug, question: q, options: opts, correct_index: correct, explanation };
    const r = await fetch('/api/admin/lms/quiz', { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
    const d = await r.json();
    if (r.ok) { toast.success(isEdit ? 'Question updated' : 'Question added'); onSaved(d.question); }
    else toast.error(d.error || 'Failed');
    setSaving(false);
  };

  return (
    <Modal title={question ? 'Edit Question' : 'Add Question'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Question"><textarea rows={2} required value={q} onChange={e => setQ(e.target.value)} placeholder="What is a blockchain?" className={textareaCls} /></Field>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Options <span className="text-gray-400 font-normal">(select the correct one)</span></label>
          <div className="space-y-2">
            {opts.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} className="w-4 h-4 accent-black" />
                <input value={opt} onChange={e => setOpts(os => os.map((o, j) => j === i ? e.target.value : o))} placeholder={`Option ${String.fromCharCode(65+i)}`} className={`${inputCls} flex-1`} required />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">Radio button = correct answer</p>
        </div>
        <Field label="Explanation (shown after quiz)">
          <textarea rows={2} value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="Why is this the correct answer?" className={textareaCls} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors">{saving ? 'Saving…' : question ? 'Save Changes' : 'Add Question'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Certificates ─────────────────────────────────────────────────────────────
function CertificatesSection({ certs, onCertsChange }: { certs: Certificate[]; onCertsChange: (c: Certificate[]) => void }) {
  const revoke = async (id: string) => {
    if (!confirm('Revoke this certificate? Cannot be undone.')) return;
    const r = await fetch('/api/admin/lms/certificates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ certificateId: id }) });
    if (r.ok) { toast.success('Certificate revoked'); onCertsChange(certs.filter(c => c.id !== id)); }
    else toast.error('Failed');
  };

  return (
    <div>
      <PageTitle title="Certificates" subtitle={`${certs.length} certificates issued`} />
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <TableHead cols={['User','Email','Course','Certificate ID','Issued','Actions']} />
          <tbody className="divide-y divide-gray-100">
            {certs.length === 0 ? <EmptyRow cols={6} msg="No certificates yet" /> : certs.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">{c.user_name}</td>
                <td className="px-4 py-3 text-gray-600">{c.user_email}</td>
                <td className="px-4 py-3 text-gray-600">{c.course_slug}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-600">{c.id.slice(0,16)}…</span>
                  <CopyBtn text={c.id} />
                </td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(c.issued_at)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => revoke(c.id)} className="px-2.5 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors">Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsSection({ stats }: { stats: Stats | null }) {
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteRole, setPromoteRole]   = useState<'admin'|'moderator'|'super_admin'>('admin');
  const [demoteEmail, setDemoteEmail]   = useState('');
  const [promoting, setPromoting]       = useState(false);
  const [demoting, setDemoting]         = useState(false);
  const [flask, setFlask]               = useState<'idle'|'checking'|'online'|'offline'>('idle');
  const [dbCounts, setDbCounts]         = useState<{ courses: number; lessons: number; questions: number } | null>(null);

  useEffect(() => {
    fetch('/api/admin/lms/courses', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const cs = d.courses ?? [];
        setDbCounts({
          courses:   cs.length,
          lessons:   cs.reduce((s: number, c: any) => s + (c.lessonCount ?? c.lesson_count ?? 0), 0),
          questions: cs.reduce((s: number, c: any) => s + (c.quizQuestions ?? c.quiz_count ?? 0), 0),
        });
      }).catch(() => {});
  }, []);

  const promote = async () => {
    if (!promoteEmail.trim()) return toast.error('Enter an email');
    setPromoting(true);
    const r = await fetch('/api/admin/users/promote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userEmail: promoteEmail.trim(), role: promoteRole }) });
    const d = await r.json();
    r.ok ? (toast.success(`${promoteEmail} promoted`), setPromoteEmail('')) : toast.error(d.error || 'Failed');
    setPromoting(false);
  };

  const demote = async () => {
    if (!demoteEmail.trim()) return toast.error('Enter an email');
    setDemoting(true);
    const r = await fetch('/api/admin/users/demote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userEmail: demoteEmail.trim() }) });
    const d = await r.json();
    r.ok ? (toast.success(`${demoteEmail} demoted`), setDemoteEmail('')) : toast.error(d.error || 'Failed');
    setDemoting(false);
  };

  const checkFlask = async () => {
    setFlask('checking');
    try { const r = await fetch('/flask-api/health', { credentials: 'include' }); setFlask(r.ok ? 'online' : 'offline'); }
    catch { setFlask('offline'); }
  };

  return (
    <div>
      <PageTitle title="Settings" subtitle="Admin management and platform configuration" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Admin Management */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={18} className="text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">Admin Management</h2>
          </div>

          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Promote User to Admin</p>
            <div className="space-y-2">
              <input type="email" placeholder="user@example.com" value={promoteEmail} onChange={e => setPromoteEmail(e.target.value)} className={inputCls} />
              <select value={promoteRole} onChange={e => setPromoteRole(e.target.value as any)} className={inputCls}>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button onClick={promote} disabled={promoting} className="w-full py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">{promoting ? 'Promoting…' : 'Promote'}</button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Demote Admin to User</p>
            <div className="space-y-2">
              <input type="email" placeholder="admin@example.com" value={demoteEmail} onChange={e => setDemoteEmail(e.target.value)} className={inputCls} />
              <button onClick={demote} disabled={demoting} className="w-full py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors">{demoting ? 'Demoting…' : 'Demote'}</button>
            </div>
          </div>
        </div>

        {/* Platform Info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Settings size={18} className="text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">Platform Info</h2>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { label: 'Total Users',          value: stats?.totalUsers ?? '—' },
              { label: 'Total Admins',          value: stats?.totalAdmins ?? '—' },
              { label: 'Courses in DB',         value: dbCounts?.courses ?? '—' },
              { label: 'Lessons in DB',         value: dbCounts?.lessons ?? '—' },
              { label: 'Quiz Questions in DB',  value: dbCounts?.questions ?? '—' },
              { label: 'Next.js Version',       value: '16.1.1' },
              { label: 'Database',              value: 'PostgreSQL' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className="text-sm font-bold text-gray-900">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Flask ML API</p>
                <p className={`text-sm font-medium mt-0.5 ${flask === 'online' ? 'text-green-600' : flask === 'offline' ? 'text-red-600' : 'text-gray-400'}`}>
                  {flask === 'online' ? '✓ Online' : flask === 'offline' ? '✗ Offline' : flask === 'checking' ? 'Checking…' : 'Not checked'}
                </p>
              </div>
              <button onClick={checkFlask} disabled={flask === 'checking'} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium">
                <RefreshCw size={13} className={flask === 'checking' ? 'animate-spin' : ''} />Check
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
