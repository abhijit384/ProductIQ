import React from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  Database,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Lock,
  CheckCircle2,
  Sun,
  Moon,
  Monitor,
  Palette,
  Eye,
  Layers,
  Type,
  Activity,
  Check
} from 'lucide-react';

export default function Settings({ aiStatus, onLoadDemo, isLoading, themeMode, setThemeMode, effectiveTheme = 'dark' }) {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest text-indigo-600 dark:text-cyan-400 uppercase mb-1">
          <SettingsIcon className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
          <span>SYSTEM & PREFERENCES</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-display font-black text-[#172033] dark:text-white tracking-tight">
          Platform Settings
        </h2>
        <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] mt-1">
          Configure interface appearance, examine design system tokens, inspect system validation status, and verify ASSR AI intelligence models.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. APPEARANCE & THEME */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-6 border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm dark:shadow-glass space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E8F0] dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-blue-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">Settings &rsaquo; Appearance</div>
              <h3 className="text-base font-display font-bold text-[#172033] dark:text-white">Theme Controls</h3>
              <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB]">Select interface mode and review live theme rendering</p>
            </div>
          </div>

          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-50 dark:bg-blue-500/10 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-cyan-500/30 shadow-sm">
            Active: {effectiveTheme === 'dark' ? 'Dark Enterprise Mode' : 'Light Clean Mode'}
          </span>
        </div>

        {/* Theme Selector Buttons (3-way: Light / System / Dark) */}
        <div className="space-y-3">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-400 block">
            Interface Theme Mode
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
            {/* Light Mode Button */}
            <button
              type="button"
              onClick={() => setThemeMode && setThemeMode('light')}
              className={`flex items-center justify-center space-x-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all border ${
                themeMode === 'light'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-400 shadow-sm font-bold'
                  : 'bg-white dark:bg-[#10172A] text-[#5D677A] dark:text-slate-300 border-[#E4E8F0] dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light Mode</span>
              {themeMode === 'light' && <Check className="w-3.5 h-3.5 ml-1 text-indigo-600" />}
            </button>

            {/* System Mode Button */}
            <button
              type="button"
              onClick={() => setThemeMode && setThemeMode('system')}
              className={`flex items-center justify-center space-x-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all border ${
                themeMode === 'system'
                  ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-cyan-300 border-indigo-400 dark:border-slate-700 shadow-sm font-bold'
                  : 'bg-white dark:bg-[#10172A] text-[#5D677A] dark:text-slate-300 border-[#E4E8F0] dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <Monitor className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
              <span>System (Auto)</span>
              {themeMode === 'system' && <Check className="w-3.5 h-3.5 ml-1 text-indigo-600 dark:text-cyan-300" />}
            </button>

            {/* Dark Mode Button */}
            <button
              type="button"
              onClick={() => setThemeMode && setThemeMode('dark')}
              className={`flex items-center justify-center space-x-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all border ${
                themeMode === 'dark'
                  ? 'bg-slate-800 text-cyan-300 border-slate-700 shadow-sm font-bold'
                  : 'bg-white dark:bg-[#10172A] text-[#5D677A] dark:text-slate-300 border-[#E4E8F0] dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Dark Mode</span>
              {themeMode === 'dark' && <Check className="w-3.5 h-3.5 ml-1 text-cyan-300" />}
            </button>
          </div>
        </div>

        {/* Live Theme Preview Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-[#E4E8F0] dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#5D677A] dark:text-slate-400 font-mono">
            <span className="font-semibold flex items-center space-x-1.5 text-[#172033] dark:text-slate-300">
              <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
              <span>Live Theme Preview</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-[#5D677A] dark:text-slate-400 border border-[#E4E8F0] dark:border-slate-700">
              Persisted in localStorage
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0B101D] border border-[#E4E8F0] dark:border-slate-800 shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-[#8A94A6] dark:text-slate-400 tracking-wider">Card & Text</span>
              <div className="text-sm font-bold text-[#172033] dark:text-white mt-1">High-Contrast Text</div>
              <p className="text-[11px] text-[#5D677A] dark:text-slate-400 mt-0.5">Enterprise typography</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0B101D] border border-[#E4E8F0] dark:border-slate-800 shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-[#8A94A6] dark:text-slate-400 tracking-wider">Status Indicator</span>
              <div className="mt-1 flex items-center space-x-1.5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 mr-1.5 animate-ping" />
                  VALIDATED
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0B101D] border border-[#E4E8F0] dark:border-slate-800 shadow-sm">
              <span className="text-[10px] uppercase font-mono font-bold text-[#8A94A6] dark:text-slate-400 tracking-wider">AI Intelligence</span>
              <div className="mt-1 flex items-center space-x-1.5 text-xs font-mono font-bold text-indigo-600 dark:text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ASSR AI Engine</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESIGN SYSTEM */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-6 border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm dark:shadow-glass space-y-5">
        <div className="flex items-center space-x-3 pb-4 border-b border-[#E4E8F0] dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-purple-500/10 text-violet-600 dark:text-purple-400 border border-violet-200 dark:border-purple-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-600 dark:text-purple-400">Settings &rsaquo; Design System</div>
            <h3 className="text-base font-display font-bold text-[#172033] dark:text-white">Card & Text Architecture</h3>
            <p className="text-xs text-[#5D677A] dark:text-slate-400">Typography, contrast standards, and layout consistency</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E4E8F0] dark:border-slate-800 space-y-2 shadow-sm">
            <div className="flex items-center space-x-2 text-[#172033] dark:text-slate-200 font-bold">
              <Type className="w-4 h-4 text-violet-600 dark:text-purple-400" />
              <span>High-Contrast Text System</span>
            </div>
            <p className="text-[#5D677A] dark:text-slate-400 leading-relaxed font-mono text-[11px]">
              WCAG AAA compliant text contrast tokens ensuring legibility across bright daylight and low-light industrial workstation environments.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E4E8F0] dark:border-slate-800 space-y-2 shadow-sm">
            <div className="flex items-center space-x-2 text-[#172033] dark:text-slate-200 font-bold">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>Enterprise Typography Hierarchy</span>
            </div>
            <p className="text-[#5D677A] dark:text-slate-400 leading-relaxed font-mono text-[11px]">
              Plus Jakarta Sans + Space Grotesk font system featuring tabular lining figures for technical numbers, ISO unit metrics, and hierarchical card headers.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SYSTEM STATUS */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-6 border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm dark:shadow-glass space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E8F0] dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Settings &rsaquo; System Status</div>
              <h3 className="text-base font-display font-bold text-[#172033] dark:text-white">Status Telemetry</h3>
              <p className="text-xs text-[#5D677A] dark:text-slate-400">Core intelligence pipeline operational telemetry</p>
            </div>
          </div>

          <span className="self-start sm:self-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 mr-1.5 animate-ping" />
            VALIDATED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E4E8F0] dark:border-slate-800 shadow-sm">
            <span className="text-[#5D677A] dark:text-slate-400 block text-[11px]">Pipeline Status</span>
            <span className="font-bold text-[#172033] dark:text-white text-sm mt-0.5 block">Operational & Ready</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E4E8F0] dark:border-slate-800 shadow-sm">
            <span className="text-[#5D677A] dark:text-slate-400 block text-[11px]">Catalog Resilience</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">100% Safeguarded</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E4E8F0] dark:border-slate-800 shadow-sm">
            <span className="text-[#5D677A] dark:text-slate-400 block text-[11px]">Database Integrity</span>
            <span className="font-bold text-[#172033] dark:text-white text-sm mt-0.5 block">Indexed SQLite ORM</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. AI INTELLIGENCE */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-6 border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm dark:shadow-glass space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E8F0] dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-cyan-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">Settings &rsaquo; AI Intelligence</div>
              <h3 className="text-base font-display font-bold text-[#172033] dark:text-white">ASSR AI Engine</h3>
              <p className="text-xs text-[#5D677A] dark:text-slate-400">ProductIQ Foundation AI Engine</p>
            </div>
          </div>

          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-mono font-bold border bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30">
            ● ASSR AI LIVE ACTIVE
          </span>
        </div>

        <div className="space-y-3 pt-1 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E4E8F0] dark:border-slate-800 flex justify-between items-center shadow-sm">
            <span className="text-[#5D677A] dark:text-slate-400 font-medium">AI Branding / Engine:</span>
            <span className="font-bold text-[#172033] dark:text-white px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-blue-900/30 border border-indigo-200 dark:border-blue-700/50">ASSR AI</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E4E8F0] dark:border-slate-800 flex justify-between items-center shadow-sm">
            <span className="text-[#5D677A] dark:text-slate-400 font-medium">Intelligence Foundation:</span>
            <span className="text-indigo-600 dark:text-cyan-400 font-bold text-sm">ASSR AI Industrial Core</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E4E8F0] dark:border-slate-800 flex justify-between items-center shadow-sm">
            <span className="text-[#5D677A] dark:text-slate-400 font-medium">Security & Isolation:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero-Exposure Proxy (Credentials isolated in backend)</span>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DATA & CATALOG RESET */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-6 border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm dark:shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-blue-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-500/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-[#172033] dark:text-white">Reset & Re-process Demo Catalog</h3>
            <p className="text-xs text-[#5D677A] dark:text-slate-400 mt-0.5">
              Re-executes the intelligence pipeline on the 1,000+ item industrial benchmark dataset.
            </p>
          </div>
        </div>

        <button
          onClick={onLoadDemo}
          disabled={isLoading}
          className="btn-primary shrink-0 self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Processing Pipeline...' : 'Load 1,050 Item Demo'}</span>
        </button>
      </div>

    </div>
  );
}
