import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Overview from './pages/Overview';
import Upload from './pages/Upload';
import ProductIntelligence from './pages/ProductIntelligence';
import AIEnrichment from './pages/AIEnrichment';
import DataQuality from './pages/DataQuality';
import Conflicts from './pages/Conflicts';
import Duplicates from './pages/Duplicates';
import Validation from './pages/Validation';
import Sources from './pages/Sources';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import ExportModal from './components/ExportModal';
import AskAIAssistantModal from './components/AskAIAssistantModal';
import {
  fetchDashboard,
  fetchAIStatus
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fresh session: start with NO ACTIVE DATASET on reload
  const [activeJobId, setActiveJobId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  
  const [aiStatus, setAiStatus] = useState({
    status: 'ready',
    model: 'ASSR AI • Industrial Core',
    is_connected: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [pendingDemoTrigger, setPendingDemoTrigger] = useState(null);
  
  // Theme Mode: 'system' | 'dark' | 'light'
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const stored = localStorage.getItem('productiq_theme_mode');
      if (['system', 'dark', 'light'].includes(stored)) return stored;
    } catch (e) {}
    return 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState('dark');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const computeEffective = () => {
      if (themeMode === 'system') {
        return mediaQuery.matches ? 'dark' : 'light';
      }
      return themeMode;
    };

    const applyTheme = () => {
      const resolved = computeEffective();
      setEffectiveTheme(resolved);
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    };

    applyTheme();

    try {
      localStorage.setItem('productiq_theme_mode', themeMode);
    } catch (e) {}

    const listener = () => {
      if (themeMode === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [themeMode]);

  // Check ASSR AI backend engine connectivity on mount (without auto-binding stale datasets)
  useEffect(() => {
    fetchAIStatus()
      .then((res) => {
        if (res) setAiStatus(res);
      })
      .catch(() => {
        setAiStatus({ status: 'ready', model: 'ASSR AI • Industrial Core', is_connected: true });
      });
  }, []);

  const handleRefresh = async () => {
    if (!activeJobId) return;
    try {
      setIsLoading(true);
      const [aiRes, dashRes] = await Promise.all([
        fetchAIStatus().catch(() => null),
        fetchDashboard(activeJobId).catch(() => null)
      ]);
      if (aiRes) setAiStatus(aiRes);
      if (dashRes && dashRes.has_data) setDashboardData(dashRes);
    } catch (err) {
      console.error('Refresh error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDemoCatalog = () => {
    setActiveTab('upload');
    setPendingDemoTrigger(Date.now());
  };

  const handlePipelineComplete = async (jobId) => {
    setActiveJobId(jobId);
    try {
      const dash = await fetchDashboard(jobId);
      if (dash && dash.has_data) setDashboardData(dash);
    } catch (e) {
      console.error('Failed to fetch dashboard after completion', e);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#F7F9FC] dark:bg-[#0B1020] text-[#172033] dark:text-[#F5F7FB] font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* Mobile Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        aiStatus={aiStatus}
        jobSummary={dashboardData?.job}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        effectiveTheme={effectiveTheme}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <Topbar
          activeJob={dashboardData?.job}
          onRefresh={handleRefresh}
          onLoadDemo={handleLoadDemoCatalog}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
          isLoading={isLoading}
          aiStatus={aiStatus}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          effectiveTheme={effectiveTheme}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar bg-[#F7F9FC] dark:bg-[#0B1020]">
          {activeTab === 'overview' && (
            <Overview
              dashboardData={dashboardData}
              onNavigate={setActiveTab}
              onLoadDemo={handleLoadDemoCatalog}
              isLoading={isLoading}
              effectiveTheme={effectiveTheme}
            />
          )}

          {activeTab === 'upload' && (
            <Upload
              onProcessingComplete={handlePipelineComplete}
              onNavigate={setActiveTab}
              pendingDemoTrigger={pendingDemoTrigger}
              activeJobId={activeJobId}
              effectiveTheme={effectiveTheme}
            />
          )}

          {activeTab === 'products' && (
            <ProductIntelligence
              jobId={activeJobId}
              onNavigate={setActiveTab}
              effectiveTheme={effectiveTheme}
            />
          )}

          {activeTab === 'enrichment' && (
            <AIEnrichment
              jobId={activeJobId}
              onNavigate={setActiveTab}
              effectiveTheme={effectiveTheme}
            />
          )}

          {activeTab === 'quality' && (
            <DataQuality
              jobId={activeJobId}
              onNavigate={setActiveTab}
              effectiveTheme={effectiveTheme}
            />
          )}

          {activeTab === 'conflicts' && (
            <Conflicts
              jobId={activeJobId}
              onNavigate={setActiveTab}
              effectiveTheme={effectiveTheme}
            />
          )}

          {activeTab === 'duplicates' && (
            <Duplicates
              jobId={activeJobId}
              onNavigate={setActiveTab}
              effectiveTheme={effectiveTheme}
            />
          )}

          {activeTab === 'validation' && (
            <Validation
              jobId={activeJobId}
              onNavigate={setActiveTab}
              effectiveTheme={effectiveTheme}
            />
          )}

          {activeTab === 'sources' && (
            <Sources
              jobId={activeJobId}
              onNavigate={setActiveTab}
              effectiveTheme={effectiveTheme}
            />
          )}

          {activeTab === 'analytics' && (
            <Analytics
              jobId={activeJobId}
              onNavigate={setActiveTab}
              effectiveTheme={effectiveTheme}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              aiStatus={aiStatus}
              onLoadDemo={handleLoadDemoCatalog}
              isLoading={isLoading}
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              effectiveTheme={effectiveTheme}
            />
          )}
        </main>
      </div>

      {/* Ask ASSR AI Modal */}
      <AskAIAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        jobId={activeJobId}
      />

      {/* Export Modal */}
      {isExportOpen && (
        <ExportModal
          jobId={activeJobId}
          onClose={() => setIsExportOpen(false)}
          effectiveTheme={effectiveTheme}
        />
      )}
    </div>
  );
}
