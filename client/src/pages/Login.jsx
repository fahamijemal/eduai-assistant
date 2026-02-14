import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineAcademicCap, HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try { await login(email, password); toast.success('Welcome back!'); navigate('/'); }
    catch (err) { toast.error(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-[#f0f0f0] dark:bg-[#080807]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#F18F2E] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 rounded-2xl mb-8 border border-white/10">
            <HiOutlineAcademicCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">EduAI Assistant</h2>
          <p className="text-white/70 text-lg max-w-md leading-relaxed">Your AI-powered study companion. Upload documents, ask questions, and ace your exams.</p>
          <div className="mt-10 flex items-center justify-center gap-6 text-white/60 text-sm">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white" />Smart Summaries</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white" />Auto Quizzes</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white" />AI Q&A</div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-white dark:bg-[#0d0d0c]">
        <div className="w-full max-w-[400px] animate-fade-in">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#F18F2E] rounded-2xl mb-3">
              <HiOutlineAcademicCap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-lg font-bold text-[#1c1917] dark:text-white">EduAI Assistant</h1>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1c1917] dark:text-white">Welcome back</h1>
            <p className="text-[#a8a29e] dark:text-[#78716c] mt-1.5 text-sm">Sign in to continue your learning journey</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#78716c] dark:text-[#a8a29e] mb-2">Email address</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e] dark:text-[#78716c]" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-premium !pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#78716c] dark:text-[#a8a29e] mb-2">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e] dark:text-[#78716c]" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="input-premium !pl-10" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>) : 'Sign In'}
            </button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-sm text-[#a8a29e] dark:text-[#78716c]">Don&apos;t have an account?{' '}<Link to="/register" className="font-semibold text-[#F18F2E] hover:text-[#d97c1f] transition-colors">Create one free</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
