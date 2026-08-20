import React from 'react';

export default function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'indigo',
  badgeText,
  trendText
}) {
  const colorMap = {
    indigo: {
      border: 'border-indigo-200 dark:border-indigo-500/20 hover:border-indigo-400 dark:hover:border-indigo-500/50',
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30',
      badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
    },
    blue: {
      border: 'border-blue-200 dark:border-blue-500/20 hover:border-blue-400 dark:hover:border-blue-500/50',
      iconBg: 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30',
      badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
    },
    emerald: {
      border: 'border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500/50',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30',
      badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
    },
    amber: {
      border: 'border-amber-200 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/50',
      iconBg: 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30',
      badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
    },
    rose: {
      border: 'border-rose-200 dark:border-rose-500/20 hover:border-rose-400 dark:hover:border-rose-500/50',
      iconBg: 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30',
      badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
    },
    coral: {
      border: 'border-rose-200 dark:border-rose-500/20 hover:border-rose-400 dark:hover:border-rose-500/50',
      iconBg: 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30',
      badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
    },
    cyan: {
      border: 'border-cyan-200 dark:border-cyan-500/20 hover:border-cyan-400 dark:hover:border-cyan-500/50',
      iconBg: 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30',
      badge: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60'
    },
    purple: {
      border: 'border-purple-200 dark:border-purple-500/20 hover:border-purple-400 dark:hover:border-purple-500/50',
      iconBg: 'bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30',
      badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
    },
    violet: {
      border: 'border-violet-200 dark:border-violet-500/20 hover:border-violet-400 dark:hover:border-violet-500/50',
      iconBg: 'bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30',
      badge: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60'
    }
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className={`glass-card glass-card-hover rounded-2xl p-5 border ${scheme.border} transition-all relative overflow-hidden flex flex-col justify-between group`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8A94A6] dark:text-[#77839A] block">
            {title}
          </span>
          <div className="mt-2 text-2xl lg:text-3xl font-display font-black tracking-tight text-[#172033] dark:text-[#F5F7FB] group-hover:scale-[1.02] transition-transform">
            {value}
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${scheme.iconBg} shadow-sm shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-[#5D677A] dark:text-[#AEB8CB] border-t border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] pt-2.5">
        <span className="truncate text-[11px]">{subtext}</span>
        {badgeText && (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border shrink-0 ml-2 ${scheme.badge}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
