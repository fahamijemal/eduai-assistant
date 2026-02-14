import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { documentsAPI, historyAPI } from '../services/api';
import {
  HiOutlineDocumentText,
  HiOutlineQuestionMarkCircle,
  HiOutlineClipboardList,
  HiOutlineAcademicCap,
  HiOutlineUpload,
  HiOutlineClock,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePlus,
  HiOutlineDotsVertical,
} from 'react-icons/hi';

/* ── helpers ─────────────────────────────────────────── */
function computeWeeklyActivity(interactions) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const counts = [0, 0, 0, 0, 0, 0, 0];
  interactions.forEach((item) => {
    const d = new Date(item.createdAt);
    if (d >= weekStart) {
      const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      counts[idx]++;
    }
  });
  return days.map((day, i) => ({ day, count: counts[i] }));
}

/* ── Progress Ring SVG ───────────────────────────────── */
function ProgressRing({ pct, size = 130, strokeWidth = 9 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} className="progress-ring-track" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="progress-ring-fill"
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 - 6}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-[#1c1917] dark:fill-white text-[22px] font-bold"
        style={{ fontFamily: 'Raleway, sans-serif' }}
      >
        {pct}%
      </text>
      <text
        x={size / 2}
        y={size / 2 + 14}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-[#a8a29e] dark:fill-[#78716c] text-[10px]"
        style={{ fontFamily: 'Raleway, sans-serif' }}
      >
        Progress
      </text>
    </svg>
  );
}

/* ── Main Dashboard ──────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ documents: 0, totalInteractions: 0, askCount: 0, summaryCount: 0, quizCount: 0 });
  const [recentHistory, setRecentHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionTab, setActionTab] = useState('All');

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const [docsRes, statsRes, historyRes] = await Promise.all([
        documentsAPI.getAll(), historyAPI.getStats(), historyAPI.getAll(),
      ]);
      const docs = docsRes.data.documents;
      setDocuments(docs);
      setStats({ documents: docs.length, ...statsRes.data.stats });
      setAllHistory(historyRes.data.interactions);
      setRecentHistory(historyRes.data.interactions.slice(0, 5));
    } catch (err) { console.error('Dashboard load error:', err); }
    finally { setLoading(false); }
  };

  const weeklyData = computeWeeklyActivity(allHistory);
  const maxBar = Math.max(...weeklyData.map((d) => d.count), 1);
  const totalThisWeek = weeklyData.reduce((s, d) => s + d.count, 0);

  const progressPct = stats.documents > 0
    ? Math.min(100, Math.round((stats.totalInteractions / (stats.documents * 3)) * 100))
    : 0;

  const quickActions = [
    { title: 'Upload PDF', desc: 'Add study materials', icon: HiOutlineUpload, path: '/documents', badge: 'PDF', color: '#F18F2E' },
    { title: 'Ask Questions', desc: 'Get AI answers', icon: HiOutlineQuestionMarkCircle, path: '/ask', badge: 'AI', color: '#E74627' },
    { title: 'Generate Quiz', desc: 'Test knowledge', icon: HiOutlineAcademicCap, path: '/quiz', badge: 'Q&A', color: '#7D2817' },
  ];

  const typeLabels = { ask: 'Question', summary: 'Summary', quiz: 'Quiz' };
  const typeColors = {
    ask: { bg: 'bg-[#FFF3E0] dark:bg-[#F18F2E]/10', text: 'text-[#F18F2E]' },
    summary: { bg: 'bg-[#FBE9E7] dark:bg-[#E74627]/10', text: 'text-[#E74627]' },
    quiz: { bg: 'bg-[#EFEBE9] dark:bg-[#7D2817]/15', text: 'text-[#7D2817] dark:text-[#fdba74]' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-[#F18F2E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#a8a29e] dark:text-[#78716c]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex flex-col xl:flex-row gap-6">

        {/* ══════════ LEFT MAIN ══════════ */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ── Activity + Progress row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Activity Card */}
            <div className="lg:col-span-3 card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-[#1c1917] dark:text-white">Activity</h3>
                <span className="text-[11px] font-medium text-[#a8a29e] dark:text-[#78716c] bg-[#f5f4f2] dark:bg-[#1a1918] px-2.5 py-1 rounded-lg">This week</span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mb-5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-[#E8F5E9] dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">+{totalThisWeek} this week</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-[#1c1917] dark:text-white">{stats.totalInteractions}</span>
                  <span className="text-xs text-[#a8a29e] dark:text-[#78716c] ml-1.5">Total interactions</span>
                </div>
              </div>

              {/* Bar chart */}
              <div className="flex items-end gap-3 h-[140px]">
                {weeklyData.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col justify-end h-[110px]">
                      <div
                        className="bar-chart-bar w-full"
                        style={{ height: `${Math.max(6, (d.count / maxBar) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-[#a8a29e] dark:text-[#78716c]">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Card */}
            <div className="lg:col-span-2 card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-[#1c1917] dark:text-white">Progress</h3>
                <span className="text-[11px] font-medium text-[#a8a29e] dark:text-[#78716c] bg-[#f5f4f2] dark:bg-[#1a1918] px-2.5 py-1 rounded-lg">This week</span>
              </div>

              <div className="flex items-center gap-5">
                {/* Ring */}
                <ProgressRing pct={progressPct} />

                {/* Stats list */}
                <div className="flex-1 space-y-3">
                  {[
                    { label: 'Documents', value: stats.documents, color: '#F18F2E', bg: 'bg-[#FFF3E0] dark:bg-[#F18F2E]/10' },
                    { label: 'Questions', value: stats.askCount, color: '#E74627', bg: 'bg-[#FBE9E7] dark:bg-[#E74627]/10' },
                    { label: 'Summaries', value: stats.summaryCount, color: '#fdba74', bg: 'bg-[#FFF8E1] dark:bg-[#fdba74]/10' },
                    { label: 'Quizzes', value: stats.quizCount, color: '#7D2817', bg: 'bg-[#EFEBE9] dark:bg-[#7D2817]/15' },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 ${s.bg} rounded-lg flex items-center justify-center`}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-lg font-bold text-[#1c1917] dark:text-white">{s.value}</span>
                        <span className="text-[11px] text-[#a8a29e] dark:text-[#78716c]">{s.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Quick Actions / "Courses in Progress" ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1c1917] dark:text-white">Quick Actions</h3>
              <Link to="/documents" className="btn-primary text-xs py-1.5 px-3">
                <HiOutlinePlus className="w-3.5 h-3.5" /> Upload New
              </Link>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-4 mb-4">
              {['All', 'Study', 'Review'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActionTab(tab)}
                  className={`text-xs font-semibold pb-1 transition-colors ${
                    actionTab === tab
                      ? 'text-[#1c1917] dark:text-white border-b-2 border-[#1c1917] dark:border-white'
                      : 'text-[#a8a29e] dark:text-[#78716c] hover:text-[#1c1917] dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1">
                <button className="w-7 h-7 rounded-lg border border-[#e8e5e0] dark:border-[#252423] flex items-center justify-center text-[#a8a29e] hover:text-[#1c1917] dark:hover:text-white hover:border-[#a8a29e] dark:hover:border-[#78716c] transition-colors">
                  <HiOutlineChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-lg border border-[#e8e5e0] dark:border-[#252423] flex items-center justify-center text-[#a8a29e] hover:text-[#1c1917] dark:hover:text-white hover:border-[#a8a29e] dark:hover:border-[#78716c] transition-colors">
                  <HiOutlineChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action cards (styled like Zenius course cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.path} to={action.path} className="card-hover p-5 block">
                    {/* Badge */}
                    <div
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-white text-xs font-bold mb-3"
                      style={{ background: action.color }}
                    >
                      {action.badge}
                    </div>
                    <h4 className="text-sm font-bold text-[#1c1917] dark:text-white mb-0.5">{action.title}</h4>
                    <p className="text-[11px] text-[#a8a29e] dark:text-[#78716c] mb-4">{action.desc}</p>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-[11px] text-[#a8a29e] dark:text-[#78716c] mb-3">
                      <span className="flex items-center gap-1">
                        <HiOutlineDocumentText className="w-3 h-3" />
                        {stats.documents}
                      </span>
                      <span className="flex items-center gap-1">
                        <HiOutlineClock className="w-3 h-3" />
                        {stats.totalInteractions}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-[#f0f0f0] dark:bg-[#1a1918] rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, progressPct)}%`, background: action.color }} />
                    </div>
                    <p className="text-[10px] text-[#a8a29e] dark:text-[#78716c]">{progressPct}% Complete</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══════════ RIGHT SIDEBAR ══════════ */}
        <div className="xl:w-[300px] flex-shrink-0 space-y-6">

          {/* Profile Card */}
          <div className="card p-6 text-center">
            <div className="flex justify-end mb-2">
              <button className="text-[#a8a29e] hover:text-[#1c1917] dark:hover:text-white transition-colors">
                <HiOutlineDotsVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="w-20 h-20 bg-[#F18F2E] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl font-bold text-white">{user?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h3 className="text-sm font-bold text-[#1c1917] dark:text-white">{user?.name}</h3>
              <svg className="w-4 h-4 text-[#F18F2E]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <p className="text-[11px] text-[#a8a29e] dark:text-[#78716c]">Student</p>
          </div>

          {/* Study Stats widget (like Zenius calendar) */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#1c1917] dark:text-white">Study Stats</h3>
              <div className="flex items-center gap-1">
                <button className="text-[#a8a29e] hover:text-[#1c1917] dark:hover:text-white"><HiOutlineChevronLeft className="w-4 h-4" /></button>
                <button className="text-[#a8a29e] hover:text-[#1c1917] dark:hover:text-white"><HiOutlineChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Documents', val: stats.documents, icon: HiOutlineDocumentText, color: '#F18F2E' },
                { label: 'Questions', val: stats.askCount, icon: HiOutlineQuestionMarkCircle, color: '#E74627' },
                { label: 'Summaries', val: stats.summaryCount, icon: HiOutlineClipboardList, color: '#fdba74' },
                { label: 'Quizzes', val: stats.quizCount, icon: HiOutlineAcademicCap, color: '#7D2817' },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-[#f5f4f2] dark:bg-[#1a1918] rounded-xl p-3 text-center">
                    <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
                    <p className="text-lg font-bold text-[#1c1917] dark:text-white">{s.val}</p>
                    <p className="text-[10px] text-[#a8a29e] dark:text-[#78716c]">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* To Do List / Recent Activity */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-sm font-bold text-[#1c1917] dark:text-white">Recent Activity</h3>
              <Link to="/history" className="w-6 h-6 rounded-lg bg-[#F18F2E] flex items-center justify-center text-white hover:bg-[#d97c1f] transition-colors">
                <HiOutlineArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 px-5 pb-3">
              <span className="text-[10px] font-semibold bg-[#F18F2E] text-white px-2 py-0.5 rounded-full">All {recentHistory.length}</span>
              <span className="text-[10px] font-medium text-[#a8a29e] dark:text-[#78716c] px-2 py-0.5">Questions</span>
              <span className="text-[10px] font-medium text-[#a8a29e] dark:text-[#78716c] px-2 py-0.5">Quizzes</span>
            </div>

            {/* List items */}
            {recentHistory.length === 0 ? (
              <div className="px-5 pb-5 text-center">
                <HiOutlineClock className="w-8 h-8 text-[#d6d3ce] dark:text-[#333231] mx-auto mb-2" />
                <p className="text-xs text-[#a8a29e] dark:text-[#78716c]">No activity yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#e8e5e0] dark:divide-[#1e1d1c]">
                {recentHistory.map((item) => {
                  const tc = typeColors[item.type] || typeColors.ask;
                  return (
                    <div key={item._id} className="px-5 py-3 flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${tc.bg}`}>
                        <HiOutlineCheckCircle className={`w-3 h-3 ${tc.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1c1917] dark:text-white truncate">{item.question}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-medium ${tc.text}`}>{typeLabels[item.type]}</span>
                          <span className="text-[10px] text-[#a8a29e] dark:text-[#78716c]">
                            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
