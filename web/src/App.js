import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Moon, Sun, Trash2, List, Menu
} from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import WelcomeScreen from './components/WelcomeScreen';
import LoginScreen from './components/LoginScreen';
import ProgressDashboard from './components/ProgressDashboard';
import TaskItem from './components/TaskItem';
import AddTaskModal from './components/AddTaskModal';
import Sidebar from './components/Sidebar';

export default function App() {
  // Persistence
  const [tasks, setTasks] = useState([]);
  const systemPrefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', systemPrefersDark);
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('loggedIn', false);

  const [showWelcome, setShowWelcome] = useState(!isLoggedIn);
  const [activeTab, setActiveTab] = useState('tasks');

  // App State
  const [searchQuery, setSearchQuery] = useState('');
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

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  }, [setIsLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        return;
      }

      fetch('http://192.168.68.227:5000/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Unauthorized');
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setTasks(data);
          } else {
            setTasks([]);
          }
        })
        .catch(err => {
          console.error('Failed to load tasks', err);
          logout();
        });
    }
  }, [isLoggedIn, logout]);

  // Derived State
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || task.category === selectedCategory;
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
  }, [tasks, searchQuery, selectedCategory, sortBy]);

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.completed).length;
    return { completed, total: tasks.length };
  }, [tasks]);

  const addTask = async (task) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://192.168.68.227:5000/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(task)
      });
      if (!res.ok) throw new Error('Failed to create task');
      const newTask = await res.json();
      setTasks([...tasks, newTask]);
      showToast('Task created successfully ✨');
    } catch (e) {
      console.error(e);
      showToast('Error creating task ❌');
    }
  };
  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updatedTask = { ...task, completed: !task.completed };
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://192.168.68.227:5000/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedTask)
      });
      if (!res.ok) throw new Error('Failed to update task');
      setTasks(tasks.map(t => t.id === id ? updatedTask : t));
      showToast(updatedTask.completed ? 'Task completed 🎉' : 'Task unmarked ⏪');
    } catch (e) {
      console.error(e);
    }
  };
  const deleteTask = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://192.168.68.227:5000/api/tasks/${id}`, { 
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
      const res = await fetch(`http://192.168.68.227:5000/api/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedTask)
      });
      if (!res.ok) throw new Error('Failed to update task');
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      showToast('Task updated successfully 📝');
    } catch (e) {
      console.error(e);
    }
  };
  const clearCompleted = async () => {
    const completedTasks = tasks.filter(t => t.completed);
    try {
      const token = localStorage.getItem('token');
      await Promise.all(completedTasks.map(t => fetch(`http://192.168.68.227:5000/api/tasks/${t.id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })));
      setTasks(tasks.filter(t => !t.completed));
      showToast('Completed tasks cleared 🧹');
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
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 min-h-screen transition-all">
          <div className="max-w-5xl mx-auto px-6 py-8 pb-32">

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
                      <div className="relative z-10">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7c3aed]" size={20} />
                        <input type="text" placeholder="Search your tasks" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-14 pl-12 pr-6 bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-[1.25rem] focus:border-[#7c3aed]/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm dark:shadow-xl dark:shadow-black/20" />
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
                          {filteredTasks.map(task => <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onEdit={setEditingTask} />)}
                          {filteredTasks.length === 0 && <div className="text-center py-20 text-slate-300"><List size={48} className="mx-auto mb-4 opacity-10" /><p className="font-bold text-lg">No tasks here!</p></div>}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Floating Action Button */}
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAddModal(true)} className="fixed bottom-8 right-8 lg:bottom-12 lg:right-12 w-16 h-16 bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] text-white rounded-[1.5rem] flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.5)] z-40"><Plus size={32} /></motion.button>

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
              <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-[#0c0c11] z-50 lg:hidden p-0"><Sidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={logout} stats={stats} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} /></motion.div>
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
