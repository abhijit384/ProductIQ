import React, { useState } from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Boxes,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Copy,
  CheckCircle2,
  Database,
  BarChart3,
  Settings,
  Cpu,
  X,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';

const NAV_GROUPS = [
  {
    group: 'CORE INTELLIGENCE',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'upload', label: 'Catalog Ingestion', icon: UploadCloud },
      { id: 'products', label: 'Product Intelligence', icon: Boxes },
      { id: 'enrichment', label: 'ASSR AI', icon: Sparkles },
    ]
  },
  {
    group: 'QUALITY & GOVERNANCE',
    items: [
      { id: 'quality', label: 'Data Quality', icon: ShieldCheck },
      { id: 'conflicts', label: 'Spec Conflicts', icon: AlertTriangle },
      { id: 'duplicates', label: 'Duplicate Clusters', icon: Copy },
      { id: 'validation', label: 'Rule Validation', icon: CheckCircle2 },
    ]
  },
  {
    group: 'PLATFORM & INSIGHTS',
    items: [
      { id: 'sources', label: 'Sources & Lineage', icon: Database },
      { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
    ]
  }
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  aiStatus,
  jobSummary,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed = false,
  setIsCollapsed
}) {
  const [hoveredItem, setHoveredItem] = useState(null);

  const toggleCollapsed = () => {
    if (setIsCollapsed) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 bg-white dark:bg-[#10172A] border-r border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)]
          flex flex-col h-screen select-none transition-all duration-200 ease-in-out shrink-0
          lg:static lg:translate-x-0 shadow-sm dark:shadow-xl
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}
        `}
      >
        {/* Brand Header */}
        <div className="shrink-0 p-4 border-b border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] bg-gradient-to-b from-[#F8FAFD] to-transparent dark:from-[#151D32] dark:to-transparent relative">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20 dark:shadow-glow-primary shrink-0 border border-indigo-400/30">
                <BrainCircuit className="w-5 h-5 text-white animate-pulse" />
              </div>

              {!isCollapsed && (
                <div className="overflow-hidden transition-opacity duration-200">
                  <h1 className="font-display font-black text-lg tracking-tight text-[#172033] dark:text-white flex items-center">
                    PRODUCT<span className="text-indigo-600 dark:text-cyan-400">IQ</span>
                  </h1>
                  <span className="text-[9px] text-[#5D677A] dark:text-[#AEB8CB] uppercase tracking-widest font-mono font-bold block truncate">
                    AI PRODUCT INTELLIGENCE
                  </span>
                </div>
              )}
            </div>

            {/* Close button on mobile */}
            <button
              onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Show / Hide Toggle Button (Part 13) */}
          <button
            onClick={toggleCollapsed}
            className={`
              hidden lg:flex items-center justify-center absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
              bg-white dark:bg-[#151D32] border border-[#E4E8F0] dark:border-slate-700 shadow-md
              text-[#5D677A] dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:scale-110 transition-all z-50
            `}
            title={isCollapsed ? "Show Sidebar" : "Hide Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Groups - Independently Scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4 space-y-5 custom-scrollbar min-h-0">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A94A6] dark:text-[#77839A]">
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <div
                    key={item.id}
                    className="relative group"
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                        if (setIsMobileOpen) setIsMobileOpen(false);
                      }}
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-cyan-300 border border-indigo-200 dark:border-cyan-500/40 shadow-sm'
                          : 'text-[#5D677A] dark:text-[#AEB8CB] hover:text-[#172033] dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      {/* Left Pill Accent for Active Item */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-indigo-600 dark:bg-cyan-400" />
                      )}

                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-indigo-600 dark:text-cyan-400'
                          : 'text-[#8A94A6] dark:text-[#77839A] group-hover:text-indigo-600 dark:group-hover:text-slate-300'
                      }`} />

                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}

                      {isActive && !isCollapsed && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-cyan-400 shadow-glow-cyan" />
                      )}
                    </button>

                    {/* Tooltip in Collapsed Mode */}
                    {isCollapsed && (
                      <div className="hidden lg:group-hover:flex absolute left-full ml-2.5 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-mono font-semibold shadow-xl border border-slate-700 whitespace-nowrap pointer-events-none animate-fade-in">
                        {item.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Status & Settings Area */}
        <div className={`shrink-0 ${isCollapsed ? 'p-2' : 'p-3.5'} border-t border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] space-y-2 bg-[#F8FAFD] dark:bg-[#0B1020]`}>
          {!isCollapsed ? (
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#151D32] border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#5D677A] dark:text-[#AEB8CB] font-medium flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                  <span className="font-display font-bold">ASSR AI</span>
                </span>
                <span className="inline-flex items-center text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full mr-1 bg-emerald-500 animate-ping" />
                  Ready
                </span>
              </div>
              <p className="text-[10px] text-[#8A94A6] dark:text-[#77839A] font-mono truncate">
                Industrial Intelligence Engine
              </p>
            </div>
          ) : (
            <div className="flex justify-center p-2" title="ASSR AI Online">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-cyan-400 animate-pulse" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'space-x-2 px-3 py-2'} rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/20 dark:text-cyan-300 border border-indigo-200 dark:border-cyan-500/40'
                  : 'text-[#5D677A] dark:text-[#AEB8CB] hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title={isCollapsed ? "Settings" : undefined}
            >
              <Settings className="w-4 h-4 text-[#8A94A6] dark:text-[#77839A]" />
              {!isCollapsed && <span>Settings & Logs</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
