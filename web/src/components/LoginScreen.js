import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Check, Eye, EyeOff, ChevronLeft } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const endpoint = isLogin ? 'http://192.168.68.227:5000/api/auth/login' : 'http://192.168.68.227:5000/api/auth/register';
      const body = isLogin 
        ? { email, password } 
        : { username, email, password };
        
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || 'Authentication failed');
        return;
      }
      
      // Save token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      onLoginSuccess();
    } catch (err) {
      console.error(err);
      alert('Network error connecting to the backend.');
    }
  };

  const isFormValid = isLogin 
    ? email.trim().length > 0 && password.trim().length > 0 
    : email.trim().length > 0 && username.trim().length > 0 && password.trim().length > 0 && password === confirmPassword;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden bg-[#0c0c11]">
      
      {/* Dark Purple Glow */}
      <div className="absolute top-1/2 left-0 w-[1000px] h-[1000px] bg-purple-600/15 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      
      {/* Back Button */}
      <button onClick={onBack} className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors hidden md:flex">
        <ChevronLeft size={24} />
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-[420px] flex flex-col items-center"
      >
        
        {/* Logo Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center shadow-sm">
              <Check size={20} className="text-white" strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-[28px] font-bold text-white mb-2">TodoList</h1>
          <p className="text-sm text-slate-400">Your personal task manager — stay on top of everything.</p>
        </div>

        {/* Card */}
        <div className="w-full bg-[#181820] rounded-[2rem] p-6 sm:p-8 border border-white/[0.02] shadow-2xl">
          
          {/* Segmented Control */}
          <div className="flex bg-[#111116] rounded-xl p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 h-10 rounded-lg font-semibold text-sm transition-all duration-200 ${isLogin ? 'bg-[#7c3aed] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 h-10 rounded-lg font-semibold text-sm transition-all duration-200 ${!isLogin ? 'bg-[#7c3aed] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode='popLayout'>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pb-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        placeholder="Choose a username"
                        value={username}
                        autoComplete="off"
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-[#20202a] border border-white/5 rounded-xl focus:border-[#7c3aed]/50 outline-none transition-all text-white font-medium placeholder:text-slate-500/70 text-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#e0e7ff] text-indigo-600 rounded-md p-1">
                  <Mail size={12} strokeWidth={3} />
                </div>
                <input
                  type="text"
                  placeholder="Enter your email"
                  value={email}
                  autoComplete="off"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-[#20202a] border border-white/5 rounded-xl focus:border-[#7c3aed]/50 outline-none transition-all text-white font-medium placeholder:text-slate-500/70 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#fef3c7] text-amber-600 rounded-md p-1">
                  <Lock size={12} strokeWidth={3} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-12 pr-12 bg-[#20202a] border border-white/5 rounded-xl focus:border-[#7c3aed]/50 outline-none transition-all text-white font-medium placeholder:text-slate-500/70 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <AnimatePresence mode='popLayout'>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#fef3c7] text-amber-600 rounded-md p-1">
                        <Lock size={12} strokeWidth={3} />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        autoComplete="new-password"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-12 pl-12 pr-12 bg-[#20202a] border border-white/5 rounded-xl focus:border-[#7c3aed]/50 outline-none transition-all text-white font-medium placeholder:text-slate-500/70 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full h-12 mt-4 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          
        </div>
      </motion.div>
    </div>
  );
}
