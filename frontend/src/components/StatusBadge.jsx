import React from 'react';

export default function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;
  const s = String(status).toLowerCase();

  let colorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (['valid', 'resolved', 'accepted_a', 'accepted_b', 'merged', 'excellent', 'high'].includes(s) && type !== 'severity') {
    colorClasses = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
  } else if (['warning', 'pending', 'review', 'fair', 'medium'].includes(s) && type !== 'severity') {
    colorClasses = 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
  } else if (['invalid', 'failed', 'poor', 'needs attention'].includes(s) && type !== 'severity') {
    colorClasses = 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
  } else if (type === 'severity') {
    if (s === 'high') colorClasses = 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/40 font-semibold';
    else if (s === 'medium') colorClasses = 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/40';
    else colorClasses = 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/40';
  }

  const label = s.replace(/_/g, ' ').toUpperCase();

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${
        colorClasses.includes('emerald') ? 'bg-emerald-500 dark:bg-emerald-400' :
        colorClasses.includes('rose') ? 'bg-rose-500 dark:bg-rose-400' :
        colorClasses.includes('amber') ? 'bg-amber-500 dark:bg-amber-400' :
        colorClasses.includes('blue') ? 'bg-blue-500 dark:bg-blue-400' : 'bg-slate-400'
      }`} />
      {label}
    </span>
  );
}
