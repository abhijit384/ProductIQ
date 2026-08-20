import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ label = 'Back to Product Intelligence', onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#5D677A] dark:text-[#AEB8CB] hover:text-[#172033] dark:hover:text-white bg-white dark:bg-[#151D32] hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm active:scale-95 transition-all group ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
      <span>{label}</span>
    </button>
  );
}
