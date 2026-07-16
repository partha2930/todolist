import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Save, Moon, Sun, LogOut, Settings as SettingsIcon, Edit2, AlertCircle, Camera, Trash2 } from 'lucide-react';

export default function SettingsView({ isDarkMode, setIsDarkMode, onLogout, showToast, avatarUrl, setAvatarUrl, onUserUpdated }) {
  const [user, setUser] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('user') || '{}');
    return { username: saved.username || '', email: saved.email || '' };
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Str = reader.result;
        setAvatarUrl(base64Str);
        localStorage.setItem('userAvatar', base64Str);
        
        try {
          const token = localStorage.getItem('token');
          const body = { username: user.username, email: user.email, theme: isDarkMode ? 'dark' : 'light', profilePic: base64Str };
          const res = await fetch('http://192.168.68.227:5000/api/auth/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
          });
          
          if (res.ok) {
             const saved = JSON.parse(localStorage.getItem('user') || '{}');
             const newData = { ...saved, ...body };
             localStorage.setItem('user', JSON.stringify(newData));
             if (onUserUpdated) onUserUpdated(newData);
             showToast('Profile picture saved to cloud! ☁️');
          } else {
             showToast('Failed to sync picture to cloud ❌');
          }
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl(null);
    localStorage.removeItem('userAvatar');
    
    try {
      const token = localStorage.getItem('token');
      const body = { username: user.username, email: user.email, theme: isDarkMode ? 'dark' : 'light', profilePic: '' };
      const res = await fetch('http://192.168.68.227:5000/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
         const saved = JSON.parse(localStorage.getItem('user') || '{}');
         const newData = { ...saved, ...body };
         localStorage.setItem('user', JSON.stringify(newData));
         if (onUserUpdated) onUserUpdated(newData);
         showToast('Profile picture removed! 🗑️');
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        setUser({ username: data.username, email: data.email });
      }
    } catch (e) {
      console.error(e);
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
      const token = localStorage.getItem('token');
      const body = { 
        username: user.username, 
        email: user.email,
        theme: isDarkMode ? 'dark' : 'light',
        profilePic: avatarUrl
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
      const newData = { ...saved, username: user.username, email: user.email, profilePic: avatarUrl };
      localStorage.setItem('user', JSON.stringify(newData));

      if (onUserUpdated) {
        onUserUpdated(newData);
      }
      
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
      const token = localStorage.getItem('token');
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl relative">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-md rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-lg relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] rounded-full blur-[60px] opacity-20 pointer-events-none" />
          <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-gradient-to-br from-[#7c3aed] to-blue-500 rounded-full blur-[60px] opacity-10 pointer-events-none" />
          
          <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] shadow-2xl flex items-center justify-center text-white text-5xl font-black mb-6 border-4 border-white dark:border-zinc-800 relative z-10 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.username ? user.username.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2 relative z-10">
            {user.username || 'Awesome User'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 relative z-10">
            {user.email || 'user@example.com'}
          </p>
          
          <div className="w-full h-px bg-slate-200 dark:bg-white/10 mb-6 relative z-10" />
          
          <div className="flex gap-4 w-full relative z-10">
            <div className="flex-[0.8] bg-slate-50 dark:bg-black/20 rounded-2xl p-4 border border-slate-100 dark:border-white/5 transition-transform hover:scale-105 flex flex-col justify-center items-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <p className="font-bold text-green-500 flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Active</p>
            </div>
            <div className="flex-[1.2] flex flex-col gap-2">
              <label className="flex-1 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-xl p-2 transition-transform hover:scale-105 cursor-pointer shadow-lg flex items-center justify-center text-white relative overflow-hidden group min-h-[40px]">
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <Camera size={14} className="mr-1.5 relative z-10" />
                <p className="font-bold text-[11px] relative z-10">{avatarUrl ? 'Change' : 'Upload'}</p>
              </label>
              {avatarUrl && (
                <button 
                  onClick={handleRemoveAvatar}
                  className="flex-1 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl p-2 transition-transform hover:scale-105 cursor-pointer shadow-sm flex items-center justify-center relative overflow-hidden group border border-transparent dark:border-red-500/20 min-h-[40px]"
                >
                  <Trash2 size={14} className="mr-1.5" />
                  <p className="font-bold text-[11px]">Remove</p>
                </button>
              )}
            </div>
          </div>
        </div>
        
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


      </div>
    </motion.div>
  );
}
