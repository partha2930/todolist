import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Check, Calendar, Edit2 } from 'lucide-react';
import { clsx } from 'clsx';

const priorityColors = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-green-500'
};

export default function TaskItem({ task, onToggle, onDelete, onEdit, currentUser }) {
  let localDueDate = null;
  let formattedDate = '';
  if (task.dueDate) {
    // Parse YYYY-MM-DD in local time to avoid timezone offset bugs
    const parts = task.dueDate.split('-');
    if (parts.length === 3) {
      localDueDate = new Date(parts[0], parts[1] - 1, parts[2]);
      formattedDate = localDueDate.toLocaleDateString();
    } else {
      localDueDate = new Date(task.dueDate);
      formattedDate = localDueDate.toLocaleDateString();
    }
  }

  // Set time of "now" to 00:00:00 for accurate overdue calculation
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isOverdue = localDueDate && localDueDate < now && !task.completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: task.completed ? 0.7 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white dark:bg-zinc-900 rounded-3xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all mb-3 overflow-hidden border border-slate-100 dark:border-zinc-800"
    >
      {/* Priority Indicator */}
      <div className={clsx("absolute left-0 top-0 bottom-0 w-2", priorityColors[task.priority])}></div>

      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={clsx(
          "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all",
          task.completed
            ? "bg-[#7c3aed] border-[#7c3aed] text-white"
            : "border-slate-300 dark:border-zinc-700 text-transparent hover:border-[#7c3aed]"
        )}
      >
        <Check size={14} strokeWidth={4} />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className={clsx(
          "font-semibold text-slate-800 dark:text-zinc-100 truncate transition-all",
          task.completed && "line-through text-slate-400 dark:text-zinc-600"
        )}>
          {task.title}
        </h4>
        {task.description && (
          <p className={clsx(
            "text-sm text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1",
            task.completed && "text-slate-300 dark:text-zinc-600"
          )}>
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {/* Category Chip */}
          <span className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-400 rounded-lg uppercase tracking-wider">
            {task.category}
          </span>

          {/* Collaborator Initials Chip */}
          {(task.collaboratorEmails || task.collaborators) && (task.collaboratorEmails || task.collaborators).length > 0 && (
            <div className="flex items-center -space-x-1" title={(task.collaboratorEmails || task.collaborators).join(', ')}>
              {(task.collaboratorEmails || task.collaborators).slice(0, 3).map((email, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-[#7c3aed] text-white flex items-center justify-center text-[10px] font-bold border border-white dark:border-zinc-900 shadow-sm z-10" style={{ zIndex: 10 - i }}>
                  {String(email).charAt(0).toUpperCase()}
                </div>
              ))}
              {(task.collaboratorEmails || task.collaborators).length > 3 && (
                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center text-[8px] font-bold border border-white dark:border-zinc-900 shadow-sm z-0">
                  +{(task.collaboratorEmails || task.collaborators).length - 3}
                </div>
              )}
            </div>
          )}

          {/* Date Chip */}
          {task.dueDate && (
            <div className={clsx(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium",
              isOverdue ? "bg-red-50 text-red-500" : "bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500"
            )}>
              <Calendar size={10} />
              {formattedDate}
            </div>
          )}

          {/* Old Collab Chip replaced */}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button
          onClick={() => onEdit(task)}
          className="p-2 text-slate-300 hover:text-primary transition-colors"
        >
          <Edit2 size={18} />
        </button>
        {(!task.user_id || !currentUser?.id || task.user_id === currentUser.id) && (
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
