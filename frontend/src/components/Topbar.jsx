import React from 'react';
import {
  RotateCcw,
  Download,
  Play,
  CheckCircle2,
  FileSpreadsheet,
  Sun,
  Moon,
  Monitor,
  Menu,
  Sparkles,
  Database
} from 'lucide-react';

export default function Topbar({
  activeJob,
  onRefresh,
  onLoadDemo,
  onOpenExport,
  isLoading,
  aiStatus,
  themeMode,
  setThemeMode,
  effectiveTheme,
  onToggleMobileSidebar
}) {
  return (
    <header className="h-16 bg-white/90 dark:bg-[#10172A]/90 backdrop-blur-xl border-b border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 transition-colors duration-200">
      {/* Left Info: Mobile Toggle + Active Catalog */}
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#E4E8F0] dark:border-slate-700"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2 text-sm text-[#172033] dark:text-slate-200">
          <Database className="w-4 h-4 text-indigo-600 dark:text-cyan-400 shrink-0" />
          <span className="hidden sm:inline text-[#8A94A6] dark:text-[#77839A] text-xs uppercase tracking-wider font-mono font-semibold">
            Dataset:
          </span>
          <span className="font-semibold text-[#172033] dark:text-white px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] font-mono text-xs max-w-[160px] sm:max-w-[240px] truncate shadow-sm">
            {activeJob?.filename || 'sample_products_1000.csv'}
          </span>
        </div>

        {activeJob && (
          <div className="hidden md:flex items-center space-x-2 text-xs">
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="font-mono text-[#5D677A] dark:text-[#AEB8CB] font-bold">{activeJob.total_rows || 1050} items</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Intelligence Active</span>
            </span>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* ASSR AI Status Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-[#151D32] border border-indigo-200 dark:border-cyan-500/30 text-indigo-700 dark:text-cyan-300 text-xs font-mono shadow-sm">
          <Sparkles className="w-3 h-3 text-indigo-600 dark:text-cyan-400 animate-pulse" />
          <span className="font-bold text-[11px]">ASSR AI</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Ready</span>
        </div>

        {/* 3-State Theme Switcher (Light / System / Dark) */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] text-xs shadow-inner">
          <button
            onClick={() => setThemeMode('light')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
              themeMode === 'light'
                ? 'bg-white text-indigo-600 shadow-sm font-bold border border-slate-200/80'
                : 'text-[#5D677A] dark:text-[#AEB8CB] hover:text-[#172033] dark:hover:text-white'
            }`}
            title="Light Theme"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden lg:inline text-[11px]">Light</span>
          </button>

          <button
            onClick={() => setThemeMode('system')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
              themeMode === 'system'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-300 shadow-sm font-bold border border-slate-200/80 dark:border-slate-700'
                : 'text-[#5D677A] dark:text-[#AEB8CB] hover:text-[#172033] dark:hover:text-white'
            }`}
            title="System Preference Theme"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">System</span>
          </button>

          <button
            onClick={() => setThemeMode('dark')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
              themeMode === 'dark'
                ? 'bg-slate-800 text-cyan-300 shadow-sm font-bold border border-slate-700'
                : 'text-[#5D677A] dark:text-[#AEB8CB] hover:text-[#172033] dark:hover:text-white'
            }`}
            title="Dark Enterprise Theme"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline text-[11px]">Dark</span>
          </button>
        </div>

        {/* Quick Demo Trigger */}
        <button
          onClick={onLoadDemo}
          disabled={isLoading}
          className="btn-primary"
          title="Reload 1,000 product industrial dataset"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Load 1,000 Demo</span>
          <span className="sm:hidden">Demo</span>
        </button>

        {/* Export Catalog (Only shown when active output exists) */}
        {Boolean(activeJob && (activeJob.total_rows > 0 || activeJob.processed_rows > 0)) && (
          <button
            onClick={onOpenExport}
            className="btn-secondary animate-fade-in"
            title="Export catalog and intelligence reports"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-xl bg-white dark:bg-[#151D32] hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 shadow-sm"
          title="Refresh Data"
        >
          <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600 dark:text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
}
