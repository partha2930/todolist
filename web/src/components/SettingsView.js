import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, LogOut, Check, X, Moon, Sun, Camera, Shield, Mail, User, Eye, EyeOff, Save, Edit2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function SettingsView({ isDarkMode, setIsDarkMode, onLogout, showToast, onUserUpdated }) {
  const [user, setUser] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('user') || '{}');
    return { username: saved.username || '', email: saved.email || '', profilePic: saved.profilePic || '' };
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://192.168.68.227:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser({ username: data.username, email: data.email, profilePic: data.profilePic || '' });
        const saved = JSON.parse(localStorage.getItem('user') || '{}');
        const newData = { ...saved, ...data };
        localStorage.setItem('user', JSON.stringify(newData));
        if (onUserUpdated) onUserUpdated(newData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({ ...user, profilePic: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setShowConfirm(false);
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const body = { 
        username: user.username, 
        email: user.email,
        theme: isDarkMode ? 'dark' : 'light',
        profilePic: user.profilePic
      };
      if (password) body.password = password;

      const res = await fetch('http://192.168.68.227:5000/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        showToast("Failed to update account details ❌");
        setIsSaving(false);
        return;
      }
      
      const saved = JSON.parse(localStorage.getItem('user') || '{}');
      const newData = { ...saved, username: user.username, email: user.email, profilePic: user.profilePic };
      localStorage.setItem('user', JSON.stringify(newData));
      if (onUserUpdated) onUserUpdated(newData);
      
      setPassword('');
      setIsEditing(false);
      showToast('Account details updated! ✨');
    } catch (e) {
      console.error(e);
      showToast("Network Error updating account details ❌");
    }
    
    setIsSaving(false);
  };

  const handleThemeChange = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await fetch('http://192.168.68.227:5000/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          username: user.username, 
          email: user.email, 
          theme: newTheme ? 'dark' : 'light' 
        })
      });
    } catch (e) {
      console.error("Failed to sync theme", e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl relative z-10"
    >
      <div className="flex flex-col items-center lg:items-start mb-10 text-center lg:text-left">
        <h1 className="text-4xl font-black text-[#7C4DFF] tracking-tight dark:drop-shadow-md mb-2 flex items-center gap-3">
          <SettingsIcon size={36} /> Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl relative">
        
        {/* Account Details Form */}
        <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-md rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-lg relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Account Details</h2>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-sm font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-4 py-2 rounded-xl hover:bg-[#7c3aed]/20 transition-colors"
              >
                <Edit2 size={16} /> Edit Profile
              </button>
            )}
          </div>
          
          <form onSubmit={handleSaveInit} className="space-y-5">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#7c3aed] shadow-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-slate-400" />
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#7c3aed] rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg hover:scale-110 transition-transform">
                    <Camera size={14} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={user.username || ''}
                  onChange={(e) => setUser({ ...user, username: e.target.value })}
                  disabled={!isEditing}
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 rounded-xl focus:border-[#7c3aed]/50 outline-none transition-all text-slate-800 dark:text-white font-medium placeholder:text-slate-400 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  value={user.email || ''}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  disabled={!isEditing}
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 rounded-xl focus:border-[#7c3aed]/50 outline-none transition-all text-slate-800 dark:text-white font-medium placeholder:text-slate-400 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Change Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full h-12 pl-11 pr-12 bg-slate-50 dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 rounded-xl focus:border-[#7c3aed]/50 outline-none transition-all text-slate-800 dark:text-white font-medium placeholder:text-slate-400 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex gap-3 pt-4"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setPassword('');
                      fetchUserData(); // reset changes
                    }}
                    className="flex-1 h-12 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white rounded-xl font-bold text-sm transition-colors hover:bg-slate-200 dark:hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || (!user.username && !user.email && !password)}
                    className="flex-[2] h-12 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Confirmation Overlay */}
          <AnimatePresence>
            {showConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/80 dark:bg-[#181820]/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Confirm Changes</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to save these changes to your account?</p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 h-12 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSave}
                    className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preferences and Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-md rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-lg flex flex-col justify-center h-full gap-8 relative overflow-hidden">
            
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Appearance</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Toggle between light and dark themes.</p>
              
              <button
                onClick={handleThemeChange}
                className="w-full h-14 flex items-center justify-between px-6 bg-slate-50 dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-white hover:border-[#7c3aed]/50 transition-all font-bold"
              >
                <div className="flex items-center gap-3">
                  {isDarkMode ? <Moon size={20} className="text-[#7c3aed]" /> : <Sun size={20} className="text-amber-500" />}
                  {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                </div>
                <div className="w-12 h-6 bg-[#7c3aed]/20 rounded-full relative">
                  <motion.div 
                    initial={false}
                    animate={{ x: isDarkMode ? 24 : 0 }}
                    className="w-6 h-6 bg-[#7c3aed] rounded-full shadow-md"
                  />
                </div>
              </button>
            </div>

            <div className="pt-8 border-t border-slate-200 dark:border-white/10">
              <h2 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Log out of your account on this device.</p>
              
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full h-14 flex items-center justify-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-transparent dark:border-red-500/20 rounded-xl font-bold transition-all"
              >
                <LogOut size={20} /> Log Out
              </button>
            </div>

            {/* Logout Confirmation Overlay */}
            <AnimatePresence>
              {showLogoutConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/80 dark:bg-[#181820]/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center"
                >
                  <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <LogOut size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Confirm Logout</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to log out of your account?</p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 h-12 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onLogout}
                      className="flex-1 h-12 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20"
                    >
                      Log Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </motion.div>
  );
}
