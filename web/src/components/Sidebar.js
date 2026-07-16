import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ClipboardList, Inbox, Settings as SettingsIcon, Sun, Moon, LogOut } from 'lucide-react';
import { clsx } from 'clsx';

export default function Sidebar({
  activeTab,
  setActiveTab,
  stats,
  selectedCategory,
  setSelectedCategory,
  pendingCount = 0,
  className = "",
  isDarkMode,
  setIsDarkMode,
  onLogout,
  currentUser,
  avatarUrl,
  isSidebarExpanded,
  setIsSidebarExpanded
}) {
  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'requests', label: 'Requests', icon: Inbox },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  return (
    <div 
      onMouseEnter={() => setIsSidebarExpanded?.(true)}
      onMouseLeave={() => setIsSidebarExpanded?.(false)}
      className={clsx("flex flex-col bg-white dark:bg-[#13131a] border-slate-200 dark:border-white/10 shadow-2xl z-30 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden", className || "hidden lg:flex fixed left-4 top-4 bottom-4 rounded-[2rem] border", isSidebarExpanded ? "lg:w-[260px]" : "lg:w-[88px]")}
    >
      <div className={clsx("flex flex-col h-full w-full p-5 transition-all duration-300", isSidebarExpanded ? "lg:w-[260px]" : "lg:w-[88px]")}>
      
      {/* Profile Button */}
      <button 
        onClick={() => setActiveTab('settings')}
        className={clsx("w-full flex items-center mb-8 rounded-2xl transition-all text-left group", isSidebarExpanded ? "gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-[#7c3aed]/50 dark:hover:border-[#7c3aed]/50" : "gap-0 p-0 bg-transparent border-transparent justify-center")}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] shadow-md flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'U'
          )}
        </div>
        <div className={clsx("flex-1 min-w-0 transition-opacity duration-300", !isSidebarExpanded && "lg:opacity-0 lg:w-0 lg:overflow-hidden")}>
          <p className="font-bold text-sm text-slate-800 dark:text-white truncate hover:text-[#7c3aed] transition-colors">
            {currentUser?.username || 'My Profile'}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {currentUser?.email || 'Manage account'}
          </p>
        </div>
      </button>

      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
        <p className={clsx("text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2 transition-opacity duration-300", !isSidebarExpanded && "lg:opacity-0")}>Navigation</p>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <div key={tab.id} className="space-y-1">
              <button
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-[#2a2a35] text-[#a78bfa]"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Icon size={20} opacity={activeTab === tab.id ? 1 : 0.5} className="shrink-0" />
                      {tab.id === 'requests' && pendingCount > 0 && !isSidebarExpanded && (
                        <span className="hidden lg:block absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-[#181820] rounded-full animate-pulse" />
                      )}
                    </div>
                    <span className={clsx("transition-opacity duration-300 whitespace-nowrap", !isSidebarExpanded && "lg:opacity-0 lg:w-0 lg:overflow-hidden")}>
                      {tab.label}
                    </span>
                  </div>
                  {tab.id === 'requests' && pendingCount > 0 && (
                    <span className={clsx("w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shrink-0 transition-opacity duration-300", !isSidebarExpanded && "lg:hidden")}>
                      {pendingCount}
                    </span>
                  )}
                </div>
              </button>
              
              {tab.id === 'tasks' && activeTab === 'tasks' && (
                <div className={clsx("pl-9 pr-0 py-2 space-y-1 animate-in slide-in-from-top-2 duration-300", !isSidebarExpanded && "lg:hidden")}>
                  {['ALL', 'WORK', 'PERSONAL', 'SHOPPING', 'OTHER'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={clsx(
                        "w-full text-left px-4 py-2 rounded-xl text-[11px] font-bold transition-all duration-300",
                        selectedCategory === cat
                          ? "bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                          : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200"
                      )}
                    >
                      {cat === 'ALL' ? 'All Tasks' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-6 space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
        {/* Compact Stats for Sidebar */}
        <div className={clsx("bg-slate-50 dark:bg-black/20 rounded-2xl p-4 border border-slate-100 dark:border-white/5 dark:backdrop-blur-md transition-all duration-300", !isSidebarExpanded && "lg:hidden")}>
           <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Tasks Done</p>
           <div className="flex items-end justify-between mb-1">
              <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.completed}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">/ {stats.total}</span>
           </div>
           <div className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stats.completed / Math.max(1, stats.total)) * 100}%` }}
                className="h-full bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] shadow-[0_0_10px_rgba(124,58,237,0.5)]"
              />
           </div>
        </div>

        {/* Action Buttons */}
        <div className={clsx("flex gap-2", !isSidebarExpanded ? "lg:flex-col lg:items-center" : "")}>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex-1 flex items-center justify-center gap-2 p-3 lg:p-2 bg-slate-50 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#7c3aed] dark:hover:text-[#a78bfa] transition-colors"
          >
            {isDarkMode ? <Sun size={18} strokeWidth={3} className="shrink-0" /> : <Moon size={18} strokeWidth={3} className="shrink-0" />}
            <span className={clsx("text-[10px] font-bold uppercase tracking-wider whitespace-nowrap", !isSidebarExpanded && "lg:hidden")}>{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 p-3 lg:p-2 bg-red-50 dark:bg-red-500/10 backdrop-blur-md border border-red-100 dark:border-red-500/20 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={18} strokeWidth={3} className="shrink-0" />
            <span className={clsx("text-[10px] font-bold uppercase tracking-wider whitespace-nowrap", !isSidebarExpanded && "lg:hidden")}>Logout</span>
          </button>
        </div>

        {/* App Logo moved to bottom */}
        <div className={clsx("flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/5 opacity-50 overflow-hidden", !isSidebarExpanded && "lg:justify-center")}>
          <CheckCircle2 size={18} className="text-[#7c3aed] shrink-0" />
          <h1 className={clsx("text-xs font-black text-slate-800 dark:text-white tracking-tight transition-opacity duration-300 whitespace-nowrap", !isSidebarExpanded && "lg:opacity-0 lg:hidden")}>ToDoList</h1>
        </div>
      </div>
      </div>
    </div>
  );
}
