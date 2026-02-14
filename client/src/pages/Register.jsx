import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineAcademicCap, HiOutlineMail, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) { toast.error('Please fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try { await register(name, email, password); toast.success('Account created! Welcome aboard!'); navigate('/'); }
    catch (err) { toast.error(err.response?.data?.error || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-[#f0f0f0] dark:bg-[#080807]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#E74627] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/4 -translate-x-1/4" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/4 translate-x-1/4" />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 rounded-2xl mb-8 border border-white/10">
            <HiOutlineAcademicCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Join EduAI</h2>
          <p className="text-white/70 text-lg max-w-md leading-relaxed">Start your AI-powered learning journey today.</p>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
            <div className="bg-white/10 rounded-xl p-4 border border-white/10"><p className="text-2xl font-bold text-white">AI</p><p className="text-[10px] text-white/50 mt-1">Powered</p></div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10"><p className="text-2xl font-bold text-white">PDF</p><p className="text-[10px] text-white/50 mt-1">Analysis</p></div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10"><p className="text-2xl font-bold text-white">Quiz</p><p className="text-[10px] text-white/50 mt-1">Generator</p></div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-white dark:bg-[#0d0d0c]">
        <div className="w-full max-w-[400px] animate-fade-in">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#E74627] rounded-2xl mb-3">
              <HiOutlineAcademicCap className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1c1917] dark:text-white">Create your account</h1>
            <p className="text-[#a8a29e] dark:text-[#78716c] mt-1.5 text-sm">Free forever. No credit card needed.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#78716c] dark:text-[#a8a29e] mb-2">Full Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e] dark:text-[#78716c]" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="input-premium !pl-10" required />
              </div>
            </div>
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
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="input-premium !pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#78716c] dark:text-[#a8a29e] mb-2">Confirm Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e] dark:text-[#78716c]" />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your password" className="input-premium !pl-10" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>) : 'Create Account'}
            </button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-sm text-[#a8a29e] dark:text-[#78716c]">Already have an account?{' '}<Link to="/login" className="font-semibold text-[#F18F2E] hover:text-[#d97c1f] transition-colors">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
