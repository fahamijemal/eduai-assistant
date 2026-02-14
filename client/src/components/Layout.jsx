import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineQuestionMarkCircle,
  HiOutlineClipboardList,
  HiOutlineAcademicCap,
  HiOutlineClock,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineBell,
  HiOutlineSearch,
  HiOutlineSparkles,
} from 'react-icons/hi';

const navItems = [
  { path: '/', label: 'Dashboard', icon: HiOutlineHome },
  { path: '/documents', label: 'My Documents', icon: HiOutlineDocumentText },
  { path: '/ask', label: 'Ask Question', icon: HiOutlineQuestionMarkCircle },
  { path: '/summarize', label: 'Summarize', icon: HiOutlineClipboardList },
  { path: '/quiz', label: 'Quiz', icon: HiOutlineAcademicCap },
  { path: '/history', label: 'History', icon: HiOutlineClock },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] dark:bg-[#080807] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] bg-white dark:bg-[#0d0d0c] border-r border-[#e8e5e0] dark:border-[#1a1918] transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 pt-6 pb-4">
          <div className="w-9 h-9 bg-[#F18F2E] rounded-xl flex items-center justify-center">
            <HiOutlineAcademicCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-[#1c1917] dark:text-white">
            EduAI
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1.5 rounded-lg text-[#a8a29e] hover:text-[#1c1917] dark:hover:text-white hover:bg-[#f5f4f2] dark:hover:bg-[#1a1918]"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 mt-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13.5px] transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#F18F2E] text-white font-semibold'
                    : 'text-[#78716c] dark:text-[#78716c] font-medium hover:bg-[#f5f4f2] dark:hover:bg-[#1a1918] hover:text-[#1c1917] dark:hover:text-[#e7e5e4]'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom promo card */}
        <div className="px-4 pb-3">
          <div className="bg-[#FFF3E0] dark:bg-[#1a1508] rounded-2xl p-5 text-center">
            <div className="w-10 h-10 bg-[#F18F2E] rounded-full flex items-center justify-center mx-auto mb-3">
              <HiOutlineSparkles className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-[#1c1917] dark:text-[#e7e5e4] mb-1">AI Study Mode</p>
            <p className="text-[11px] text-[#78716c] dark:text-[#78716c] mb-3 leading-relaxed">
              Upload docs and let AI boost your learning.
            </p>
            <Link
              to="/documents"
              className="block w-full py-2 bg-[#F18F2E] text-white text-xs font-semibold rounded-lg hover:bg-[#d97c1f] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="px-4 py-3 border-t border-[#e8e5e0] dark:border-[#1a1918] space-y-1">
          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#e7e5e4] hover:bg-[#f5f4f2] dark:hover:bg-[#1a1918] transition-colors"
          >
            {darkMode ? (
              <HiOutlineSun className="w-[18px] h-[18px] text-[#F18F2E]" />
            ) : (
              <HiOutlineMoon className="w-[18px] h-[18px]" />
            )}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium text-[#78716c] hover:text-[#E74627] hover:bg-[#fef2f2] dark:hover:bg-[#E74627]/10 transition-colors"
          >
            <HiOutlineLogout className="w-[18px] h-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar */}
        <header className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-4 bg-white dark:bg-[#0d0d0c] border-b border-[#e8e5e0] dark:border-[#1a1918] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#a8a29e] hover:bg-[#f5f4f2] dark:hover:bg-[#1a1918] hover:text-[#1c1917] dark:hover:text-white transition-colors"
            >
              <HiOutlineMenu className="w-5 h-5" />
            </button>
            <div className="lg:hidden mr-2">
              <div className="w-7 h-7 bg-[#F18F2E] rounded-lg flex items-center justify-center">
                <HiOutlineAcademicCap className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#1c1917] dark:text-white">
                Welcome back, {user?.name?.split(' ')[0]} 👋
              </h2>
              <p className="text-xs text-[#a8a29e] dark:text-[#78716c] hidden sm:block">Let&apos;s learn something new today!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-[#f5f4f2] dark:bg-[#141413] border border-[#e8e5e0] dark:border-[#1e1d1c] rounded-xl px-3 py-2">
              <HiOutlineSearch className="w-4 h-4 text-[#a8a29e]" />
              <span className="text-xs text-[#a8a29e]">Search everything</span>
            </div>
            <button className="p-2.5 rounded-xl text-[#a8a29e] hover:text-[#1c1917] dark:hover:text-white hover:bg-[#f5f4f2] dark:hover:bg-[#1a1918] transition-colors relative">
              <HiOutlineBell className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
