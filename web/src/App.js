import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Moon, Sun, Trash2, List, Menu
} from 'lucide-react';
import { clsx } from 'clsx';
import { useLocalStorage } from './hooks/useLocalStorage';
import WelcomeScreen from './components/WelcomeScreen';
import LoginScreen from './components/LoginScreen';
import ProgressDashboard from './components/ProgressDashboard';
import TaskItem from './components/TaskItem';
import AddTaskModal from './components/AddTaskModal';
import Sidebar from './components/Sidebar';
import RequestsView from './components/RequestsView';
import SettingsView from './components/SettingsView';
import { supabase } from './supabaseClient';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('userAvatar'));
  const systemPrefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', systemPrefersDark);
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('loggedIn', false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const [showWelcome, setShowWelcome] = useState(!isLoggedIn);
  const [activeTab, setActiveTab] = useState('tasks');

  // App State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('CREATED_AT');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast({ message, id: Date.now() });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setSession(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userAvatar');
    window.location.reload();
  }, [setIsLoggedIn]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setIsLoggedIn(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setIsLoggedIn(true);
      else setIsLoggedIn(false);
    });

    return () => subscription.unsubscribe();
  }, [setIsLoggedIn]);

  useEffect(() => {
    let intervalId;
    if (isLoggedIn && session) {
      const token = session.access_token;


      const syncUser = () => {
        fetch('https://todolist-6xt3.onrender.com/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => {
            if (!res.ok) {
               if (res.status === 401) logout();
               throw new Error('Unauthorized');
            }
            return res.json();
          })
          .then(data => {
            if (data && data.username) {
              if (data.theme) setIsDarkMode(data.theme === 'dark');
              setCurrentUser(data);
              localStorage.setItem('user', JSON.stringify(data));
            }
          })
          .catch(err => console.error('Failed to sync user data', err));
      };

      syncUser();
      intervalId = setInterval(syncUser, 10000); // Poll every 10s to sync across devices

      fetchTasksAndRequests(token);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoggedIn, logout]);

  const fetchTasksAndRequests = (token) => {
    fetch('https://todolist-6xt3.onrender.com/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTasks(data);
        else setTasks([]);
      })
      .catch(err => {
        console.error('Failed to load tasks', err);
        logout();
      });

    fetch('https://todolist-6xt3.onrender.com/api/requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRequests(data);
        else setRequests([]);
      })
      .catch(err => console.error('Failed to load requests', err));
  };

  useEffect(() => {
    if (isLoggedIn && activeTab === 'requests') {
      const token = localStorage.getItem('token');
      if (token) fetchTasksAndRequests(token);
    }
  }, [activeTab, isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived State
  const filteredTasks = useMemo(() => {
    let source = searchResults !== null ? searchResults : tasks;
    let result = source.filter(task => {
      const matchesCategory = selectedCategory === 'ALL' || task.category === selectedCategory;
      
      // If backend search results exist, we only apply category filtering
      if (searchResults !== null) {
        return matchesCategory;
      }

      // Otherwise fallback to local instant filtering
      const searchLower = searchQuery.toLowerCase();
      const titleMatches = (task.title || '').toLowerCase().includes(searchLower);
      const descMatches = (task.description || '').toLowerCase().includes(searchLower);
      const matchesSearch = titleMatches || descMatches;
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'CREATED_AT') {
      result.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'DUE_DATE') {
      result.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else if (sortBy === 'PRIORITY') {
      const pMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      result.sort((a, b) => pMap[b.priority] - pMap[a.priority]);
    }
    return result;
  }, [tasks, searchQuery, selectedCategory, sortBy, searchResults]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.completed).length;
    return { completed, total: tasks.length };
  }, [tasks]);

  const addTask = async (task) => {
    try {
      const token = localStorage.getItem('token');

      const payload = { ...task };
      if (payload.collaborators && payload.collaborators.length > 0) {
        payload.collaboratorEmails = payload.collaborators;
      }
      delete payload.collaborators;

      const res = await fetch('https://todolist-6xt3.onrender.com/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create task');
      const newTask = await res.json();

      if (payload.collaboratorEmails && payload.collaboratorEmails.length > 0) {
        await Promise.all(payload.collaboratorEmails.map(email => 
          fetch(`https://todolist-6xt3.onrender.com/api/tasks/${newTask.id}/invite`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email })
          })
        ));
      }

      setTasks([...tasks, newTask]);
      if (payload.collaboratorEmails && payload.collaboratorEmails.length > 0) {
        showToast(`Task created & invite sent to ${payload.collaboratorEmails.join(', ')} 📩`);
      } else {
        showToast('Task created successfully ✨');
      }
    } catch (e) {
      console.error(e);
      showToast('Error creating task ❌');
    }
  };
  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updatedTask = { ...task, completed: !task.completed };
    
    // Optimistic UI Update
    setTasks(tasks.map(t => t.id === id ? updatedTask : t));
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://todolist-6xt3.onrender.com/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedTask)
      });
      if (!res.ok) throw new Error('Failed to update task');
      showToast(updatedTask.completed ? 'Task completed 🎉' : 'Task unmarked ⏪');
    } catch (e) {
      console.error(e);
      // Revert on failure
      setTasks(tasks.map(t => t.id === id ? task : t));
      showToast('Error: Backend blocked the update ❌');
    }
  };
  const deleteTask = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://todolist-6xt3.onrender.com/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete task');
      setTasks(tasks.filter(t => t.id !== id));
      showToast('Task deleted 🗑️');
    } catch (e) {
      console.error(e);
    }
  };
  const editTask = async (updatedTask) => {
    try {
      const token = localStorage.getItem('token');

      const payload = { ...updatedTask };
      if (payload.collaborators && payload.collaborators.length > 0) {
        payload.collaboratorEmails = payload.collaborators;
      }
      delete payload.collaborators;

      const res = await fetch(`https://todolist-6xt3.onrender.com/api/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update task');

      if (payload.collaboratorEmails && payload.collaboratorEmails.length > 0) {
        await Promise.all(payload.collaboratorEmails.map(email => 
          fetch(`https://todolist-6xt3.onrender.com/api/tasks/${updatedTask.id}/invite`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email })
          })
        ));
      }

      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      if (payload.collaboratorEmails && payload.collaboratorEmails.length > 0) {
        showToast(`Task updated & invite sent to ${payload.collaboratorEmails.join(', ')} 📩`);
      } else {
        showToast('Task updated successfully 📝');
      }
    } catch (e) {
      console.error(e);
    }
  };
  const clearCompleted = async () => {
    const completedTasks = tasks.filter(t => t.completed);
    try {
      const token = localStorage.getItem('token');
      await Promise.all(completedTasks.map(t => fetch(`https://todolist-6xt3.onrender.com/api/tasks/${t.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })));
      setTasks(tasks.filter(t => !t.completed));
      showToast('Completed tasks cleared 🧹');
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequest = async (req, status) => {
    const taskId = req.task_id || req.taskId;
    const creatorName = req.creator_name || 'Someone';

    // Optimistic UI updates
    setRequests(requests.filter(r => (r.task_id || r.taskId) !== taskId));
    if (status === 'ACCEPTED') {
      showToast(`Collaborated with ${creatorName} 🤝`);
    } else {
      showToast('Request declined 🗑️');
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://todolist-6xt3.onrender.com/api/requests/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update request');

      if (status === 'ACCEPTED') {
        const tasksRes = await fetch('https://todolist-6xt3.onrender.com/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (tasksRes.ok) {
          const data = await tasksRes.json();
          if (Array.isArray(data)) setTasks(data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };



  if (showWelcome && !isLoggedIn) return <WelcomeScreen onGetStarted={() => setShowWelcome(false)} />;
  if (!isLoggedIn) return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} onBack={() => setShowWelcome(true)} />;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0c0c11] text-slate-900 dark:text-white transition-colors duration-300 flex overflow-x-hidden font-inter relative">

        {/* Futuristic Ambient Glows - Dark Mode Only */}
        {isDarkMode && (
          <>
            <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
          </>
        )}

        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onLogout={logout}
          stats={stats}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          pendingCount={requests.length}
          user={currentUser}
        />

        {/* Main Content Area */}
        <main className={clsx("flex-1 min-h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]", isSidebarExpanded ? "lg:ml-[300px]" : "lg:ml-[128px]")}>
          <div className="max-w-7xl w-full px-6 lg:px-8 py-8 pb-32">

            {/* Header (Mobile) */}
            <header className="lg:hidden flex items-center justify-between mb-8 relative z-10">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-3 bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm text-slate-500 dark:text-white"><Menu size={24} /></button>
              <div className="flex gap-2">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 text-[#7c3aed] rounded-2xl">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
              </div>
            </header>

            {/* Content Switcher */}
            <AnimatePresence mode='wait'>
              {activeTab === 'tasks' && (
                <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>

                  <div className="flex flex-col items-center lg:items-start mb-10 text-center lg:text-left relative z-10">
                    <h1 className="text-4xl font-black text-[#7C4DFF] tracking-tight dark:drop-shadow-md">My Tasks</h1>
                    {stats.completed > 0 && (
                      <button onClick={clearCompleted} className="absolute right-0 top-0 p-3 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-transparent dark:border-red-500/20 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"><Trash2 size={20} /></button>
                    )}
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 max-w-5xl">
                    <div className="w-full lg:w-[280px] shrink-0 space-y-6">
                      <ProgressDashboard completed={stats.completed} total={stats.total} />
                      <div className="relative z-10 group">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-colors ${isSearching ? 'text-[#3b82f6] animate-pulse' : 'text-[#7c3aed] group-focus-within:text-[#3b82f6]'}`} size={20} />
                        <input 
                          type="text" 
                          placeholder="Search your tasks... (Press Enter)" 
                          value={searchQuery} 
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value.trim() === '') setSearchResults(null);
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const keywords = searchQuery.trim().split(/\s+/).filter(Boolean);
                              if (keywords.length === 0) {
                                setSearchResults(null);
                                return;
                              }
                              
                              setIsSearching(true);
                              try {
                                const token = localStorage.getItem('token');
                                const queryStr = keywords.join('+');
                                const res = await fetch(`https://todolist-6xt3.onrender.com/api/tasks/search?q=${queryStr}`, {
                                  method: 'GET',
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  }
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setSearchResults(data);
                                } else {
                                  showToast('Backend search failed ❌');
                                }
                              } catch (err) {
                                console.error(err);
                                showToast('Network error during search ❌');
                              } finally {
                                setIsSearching(false);
                              }
                            }
                          }}
                          className="w-full h-14 pl-12 pr-6 bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-[1.25rem] focus:border-[#7c3aed]/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm dark:shadow-xl dark:shadow-black/20" 
                        />
                      </div>

                    </div>

                    <div className="flex-1 relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><List size={14} />{filteredTasks.length} {selectedCategory !== 'ALL' ? selectedCategory : ''} Tasks</h2>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white dark:bg-[#181820] text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 outline-none transition-all cursor-pointer">
                          <option value="CREATED_AT">Sort: Created</option>
                          <option value="DUE_DATE">Sort: Due Date</option>
                          <option value="PRIORITY">Sort: Priority</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <AnimatePresence mode='popLayout'>
                          {filteredTasks.map(task => <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onEdit={setEditingTask} currentUser={currentUser} />)}
                          {filteredTasks.length === 0 && <div className="text-center py-20 text-slate-300"><List size={48} className="mx-auto mb-4 opacity-10" /><p className="font-bold text-lg">No tasks here!</p></div>}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'requests' && (
                <RequestsView
                  key="requests"
                  requests={requests}
                  onAccept={(req) => handleRequest(req, 'ACCEPTED')}
                  onDecline={(req) => handleRequest(req, 'DECLINED')}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsView
                  key="settings"
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                  onLogout={logout}
                  showToast={showToast}
                  onUserUpdated={(newUser) => setCurrentUser(newUser)}
                />
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Floating Action Button */}
        <AnimatePresence>
          {activeTab === 'tasks' && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="fixed bottom-8 right-8 lg:bottom-12 lg:right-12 w-16 h-16 bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] text-white rounded-[1.5rem] flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.5)] z-40"
            >
              <Plus size={32} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Modals */}
        <AnimatePresence>
          {(showAddModal || editingTask) && (
            <AddTaskModal
              initialData={editingTask}
              onClose={() => { setShowAddModal(false); setEditingTask(null); }}
              onSubmit={editingTask ? editTask : addTask}
            />
          )}
          {isMobileMenuOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" />
              <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-[#0c0c11] z-50 lg:hidden p-0"><Sidebar className="w-full h-full" activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={logout} stats={stats} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} pendingCount={requests.length} currentUser={currentUser} avatarUrl={avatarUrl} /></motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
              animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
              exit={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
              className="fixed bottom-12 left-1/2 z-[100] px-6 py-3 bg-slate-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm rounded-full shadow-2xl flex items-center gap-3 whitespace-nowrap"
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
