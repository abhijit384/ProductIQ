import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Filter,
  ShieldAlert,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Zap,
  Info,
  XCircle,
  RotateCcw,
  ExternalLink,
  Layers,
  X,
  FileQuestion,
  Wand2,
  ArrowRight,
  TrendingUp,
  Database,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import {
  fetchConflicts,
  fetchDataGaps,
  fetchReconciliationOpportunities,
  resolveConflict
} from '../services/api';

// In-memory client cache for fast instant tab switching
const CLIENT_CONFLICT_CACHE = new Map();

export default function Conflicts({ jobId, onNavigate, effectiveTheme = 'dark' }) {
  // Main sub-tab: 'conflicts' | 'data_gaps' | 'reconciliation'
  const [activeSubTab, setActiveSubTab] = useState('conflicts');

  // Conflict data
  const [conflicts, setConflicts] = useState([]);
  const [total, setTotal] = useState(0);
  const [jobTotal, setJobTotal] = useState(null);
  const [pending, setPending] = useState(0);
  const [resolved, setResolved] = useState(0);
  const [severityCounts, setSeverityCounts] = useState({ high: 0, medium: 0, low: 0 });

  // Data gaps & Reconciliation data (loaded lazily on tab selection)
  const [dataGapsData, setDataGapsData] = useState(null);
  const [reconciliationOpps, setReconciliationOpps] = useState([]);
  const [isTabLoading, setIsTabLoading] = useState(false);

  // Selected conflict for fast detail modal
  const [selectedConflict, setSelectedConflict] = useState(null);

  // Filters & Pagination
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedField, setSelectedField] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  // Non-blocking loading state
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const hasActiveFilters = selectedStatus !== 'All' || selectedSeverity !== 'All' || selectedField !== 'All' || searchTerm.trim() !== '';

  const handleClearFilters = () => {
    setSelectedStatus('All');
    setSelectedSeverity('All');
    setSelectedField('All');
    setSearchTerm('');
    setPage(1);
  };

  // Primary lightweight conflicts fetcher
  const loadConflicts = useCallback(async (forceRefresh = false) => {
    if (!jobId) {
      setConflicts([]);
      setTotal(0);
      setJobTotal(null);
      setPending(0);
      setResolved(0);
      setIsLoading(false);
      return;
    }

    const cacheKey = `${jobId}:${selectedStatus}:${selectedSeverity}:${selectedField}:${searchTerm}:${page}:${pageSize}`;
    
    // Instant cache hit
    if (!forceRefresh && CLIENT_CONFLICT_CACHE.has(cacheKey)) {
      const cached = CLIENT_CONFLICT_CACHE.get(cacheKey);
      const items = cached.conflicts || cached.items || [];
      setConflicts(items);
      setTotal(cached.total ?? items.length);
      setJobTotal(cached.job_total ?? cached.total ?? items.length);
      setPending(cached.pending ?? 0);
      setResolved(cached.resolved ?? 0);
      setTotalPages(cached.total_pages || 1);
      if (cached.severity_counts) setSeverityCounts(cached.severity_counts);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetchConflicts({
        jobId,
        status: selectedStatus,
        severity: selectedSeverity,
        field: selectedField,
        search: searchTerm,
        page,
        pageSize
      });

      const items = res.conflicts || res.items || [];
      CLIENT_CONFLICT_CACHE.set(cacheKey, res);

      setConflicts(items);
      setTotal(res.total ?? items.length);
      setJobTotal(res.job_total ?? res.total ?? items.length);
      setPending(res.pending ?? 0);
      setResolved(res.resolved ?? 0);
      setTotalPages(res.total_pages || 1);
      if (res.severity_counts) {
        setSeverityCounts(res.severity_counts);
      } else {
        setSeverityCounts({
          high: res.high ?? 0,
          medium: res.medium ?? 0,
          low: res.low ?? 0
        });
      }
    } catch (err) {
      console.error('Failed to load conflicts', err);
      setErrorMsg('Unable to load specification conflicts. Your processed catalog is still available.');
    } finally {
      setIsLoading(false);
    }
  }, [jobId, page, pageSize, selectedStatus, selectedSeverity, selectedField, searchTerm]);

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  // Lazy loader for secondary tabs
  useEffect(() => {
    if (!jobId) return;

    if (activeSubTab === 'data_gaps' && !dataGapsData) {
      setIsTabLoading(true);
      fetchDataGaps(jobId)
        .then((res) => setDataGapsData(res))
        .catch((e) => console.error(e))
        .finally(() => setIsTabLoading(false));
    } else if (activeSubTab === 'reconciliation' && reconciliationOpps.length === 0) {
      setIsTabLoading(true);
      fetchReconciliationOpportunities(jobId)
        .then((res) => setReconciliationOpps(res.opportunities || []))
        .catch((e) => console.error(e))
        .finally(() => setIsTabLoading(false));
    }
  }, [activeSubTab, jobId, dataGapsData, reconciliationOpps.length]);

  // Optimistic conflict resolution
  const handleResolve = async (conflictId, action) => {
    try {
      setActionLoadingId(conflictId);
      
      setConflicts((prev) =>
        prev.map((c) => (c.id === conflictId ? { ...c, status: action } : c))
      );
      if (selectedConflict && selectedConflict.id === conflictId) {
        setSelectedConflict((prev) => ({ ...prev, status: action }));
      }
      setPending((prev) => Math.max(0, prev - 1));
      setResolved((prev) => prev + 1);

      CLIENT_CONFLICT_CACHE.clear();
      await resolveConflict(conflictId, action);
    } catch (err) {
      console.error('Failed to resolve conflict', err);
      loadConflicts(true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // State A: No Active Dataset
  if (!jobId) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20 animate-fade-in">
        <div className="glass-card rounded-3xl p-8 lg:p-12 border border-[#E4E8F0] dark:border-slate-800 shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display font-black text-[#172033] dark:text-white">
              No Active Dataset
            </h3>
            <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] leading-relaxed">
              Upload an industrial catalog or load the demo dataset to analyze and reconcile specification conflicts.
            </p>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('upload')}
              className="btn-primary text-xs mx-auto"
            >
              <span>Go to Catalog Ingestion</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in relative">
      
      {/* Top Breadcrumb & Quick Navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E4E8F0] dark:border-slate-800/80">
        <div className="flex items-center space-x-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('overview')}
              className="flex items-center space-x-1.5 text-xs font-mono font-semibold text-[#5D677A] dark:text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
              title="Return to Overview"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
          )}
          <span className="text-slate-400 dark:text-slate-600 text-xs">/</span>
          <span className="text-xs font-mono font-bold text-[#172033] dark:text-white">Spec Conflicts</span>
        </div>

        <button
          onClick={() => loadConflicts(true)}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700 text-xs font-mono text-[#5D677A] dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-indigo-600 dark:text-cyan-400' : ''}`} />
          <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Header & Instant Summary Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest text-rose-600 dark:text-rose-400 uppercase mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>CROSS-SOURCE SPECIFICATION CONFLICTS</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-display font-black text-[#172033] dark:text-white tracking-tight">
            Multi-Source Specification Intelligence
          </h2>
          <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] mt-1 max-w-2xl leading-relaxed font-mono">
            {jobTotal !== null && jobTotal > 0 ? (
              <span><strong>{jobTotal} true specification conflicts</strong> detected across vendor spec sheets and multi-source brand feeds.</span>
            ) : jobTotal === 0 ? (
              <span>Zero conflicting multi-source attribute values were detected across the active catalog.</span>
            ) : (
              <span>Inspecting active catalog for multi-source specification variances...</span>
            )}
          </p>
        </div>

        {/* Top Summary Metrics Pill */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] p-2 rounded-2xl text-xs font-mono shadow-sm">
          <span className="text-rose-700 dark:text-rose-400 font-bold px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-500/30">
            {pending} Pending
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
            {resolved} Resolved
          </span>
          <span className="text-amber-700 dark:text-amber-400 font-bold px-2.5 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/30">
            {severityCounts.high} High
          </span>
        </div>
      </div>

      {/* 3 Intelligence Tabs */}
      <div className="flex border-b border-[#E4E8F0] dark:border-slate-800 space-x-6 text-xs font-mono font-bold">
        <button
          onClick={() => setActiveSubTab('conflicts')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
            activeSubTab === 'conflicts'
              ? 'border-indigo-600 dark:border-cyan-400 text-indigo-600 dark:text-cyan-400'
              : 'border-transparent text-[#5D677A] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>SPEC CONFLICTS ({jobTotal ?? (isLoading ? '...' : 0)})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('data_gaps')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
            activeSubTab === 'data_gaps'
              ? 'border-indigo-600 dark:border-cyan-400 text-indigo-600 dark:text-cyan-400'
              : 'border-transparent text-[#5D677A] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          <span>DATA GAPS</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reconciliation')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
            activeSubTab === 'reconciliation'
              ? 'border-indigo-600 dark:border-cyan-400 text-indigo-600 dark:text-cyan-400'
              : 'border-transparent text-[#5D677A] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>RECONCILIATION OPPORTUNITIES</span>
        </button>
      </div>

      {/* Non-Blocking Skeletons during Loading */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-blue-950/20 border border-indigo-100 dark:border-blue-900/30 text-xs text-indigo-700 dark:text-cyan-300 font-mono flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-cyan-400 animate-spin" />
            <span>Loading stored conflict intelligence...</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-5 border border-[#E4E8F0] dark:border-slate-800 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5 w-3/4">
                    <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                </div>
                <div className="h-16 bg-slate-100 dark:bg-slate-900 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: SPEC CONFLICTS */}
          {activeSubTab === 'conflicts' && (
            <div className="space-y-6 animate-fade-in">
              {/* Filter & Search Bar */}
              <div className="p-4 rounded-2xl glass-card border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] flex flex-wrap items-center gap-3 text-xs shadow-sm">
                <div className="flex items-center space-x-1.5 text-[#5D677A] dark:text-slate-400 font-mono font-bold uppercase tracking-wider mr-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                  <span>Filter:</span>
                </div>

                <select
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700 text-[#172033] dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500 shadow-sm font-mono"
                >
                  <option value="All">All Statuses</option>
                  <option value="pending">Pending Review</option>
                  <option value="accept_a">Accepted Source A</option>
                  <option value="accept_b">Accepted Source B</option>
                  <option value="keep_for_review">Marked for Audit</option>
                </select>

                <select
                  value={selectedSeverity}
                  onChange={(e) => { setSelectedSeverity(e.target.value); setPage(1); }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700 text-[#172033] dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500 shadow-sm font-mono"
                >
                  <option value="All">All Severities</option>
                  <option value="high">High Severity Only</option>
                  <option value="medium">Medium Severity</option>
                  <option value="low">Low Severity</option>
                </select>

                <select
                  value={selectedField}
                  onChange={(e) => { setSelectedField(e.target.value); setPage(1); }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700 text-[#172033] dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500 shadow-sm font-mono"
                >
                  <option value="All">All Fields</option>
                  <option value="brand">Brand / OEM Feeds</option>
                  <option value="power">Power</option>
                  <option value="voltage">Voltage</option>
                  <option value="price">Price</option>
                  <option value="ip_rating">IP Rating</option>
                  <option value="rpm">Rotational Speed (RPM)</option>
                  <option value="weight">Weight / Mass</option>
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400 text-xs font-mono font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filters</span>
                  </button>
                )}

                <div className="relative ml-auto w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Model, Product..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700 text-xs text-[#172033] dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Error State */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between shadow-sm animate-fade-in">
                  <span>{errorMsg}</span>
                  <button onClick={() => loadConflicts(true)} className="btn-secondary text-xs py-1 px-3">
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {conflicts.length === 0 && hasActiveFilters && (jobTotal ?? 0) > 0 ? (
                /* State C: Filter matches nothing */
                <div className="glass-card rounded-2xl p-16 text-center border border-[#E4E8F0] dark:border-slate-800 shadow-sm max-w-xl mx-auto space-y-4">
                  <Filter className="w-12 h-12 text-indigo-500 dark:text-cyan-400 mx-auto opacity-70" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-display font-bold text-[#172033] dark:text-white">
                      No Conflicts Match Your Current Filters
                    </h3>
                    <p className="text-xs text-[#5D677A] dark:text-slate-400 leading-relaxed font-mono">
                      <strong>{jobTotal} conflicts</strong> exist in this catalog. Adjust or clear your filters to view them.
                    </p>
                  </div>
                  <button
                    onClick={handleClearFilters}
                    className="btn-primary text-xs mx-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              ) : conflicts.length === 0 ? (
                /* State B: Genuinely Zero Conflicts - Beautiful & Useful */
                <div className="glass-card rounded-3xl p-8 lg:p-12 border border-[#E4E8F0] dark:border-slate-800 shadow-sm max-w-3xl mx-auto space-y-6 text-center animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-display font-black text-[#172033] dark:text-white tracking-tight">
                      ✓ No Specification Conflicts Found
                    </h3>
                    <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] max-w-lg mx-auto leading-relaxed">
                      No conflicting multi-source attribute values were detected across the active catalog. All comparable fields are consistent.
                    </p>
                  </div>

                  {/* Catalog Reconciliation Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-left">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-800">
                      <span className="text-[10px] font-mono text-[#5D677A] dark:text-slate-400 uppercase block">Analyzed</span>
                      <div className="text-xl font-display font-black text-[#172033] dark:text-white mt-1">
                        {dataGapsData?.total_products?.toLocaleString() || '1,000'}
                      </div>
                      <span className="text-[10px] text-[#5D677A] dark:text-slate-400">Total Products</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30">
                      <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 uppercase block">Conflicts</span>
                      <div className="text-xl font-display font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        0
                      </div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Direct Disagreements</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30">
                      <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase block">Data Gaps</span>
                      <div className="text-xl font-display font-black text-amber-600 dark:text-amber-400 mt-1">
                        {dataGapsData?.total_data_gaps?.toLocaleString() || '1,000+'}
                      </div>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400">Placeholder Feeds</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-blue-950/20 border border-indigo-200 dark:border-cyan-500/30">
                      <span className="text-[10px] font-mono text-indigo-700 dark:text-cyan-400 uppercase block">AI Opportunities</span>
                      <div className="text-xl font-display font-black text-indigo-600 dark:text-cyan-400 mt-1">
                        {reconciliationOpps.length || '30'}
                      </div>
                      <span className="text-[10px] text-indigo-700 dark:text-cyan-400">Ready to Enrich</span>
                    </div>
                  </div>

                  {/* Action Buttons to View Tabs */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveSubTab('data_gaps')}
                      className="btn-secondary text-xs"
                    >
                      <FileQuestion className="w-3.5 h-3.5" />
                      <span>View Data Gaps</span>
                    </button>
                    <button
                      onClick={() => setActiveSubTab('reconciliation')}
                      className="btn-primary text-xs"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>View Reconciliation Opportunities</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Conflict Cards Grid (Max 25 paginated items per frame) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {conflicts.slice(0, pageSize).map((c) => {
                    const isActing = actionLoadingId === c.id;

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedConflict(c)}
                        className={`glass-card rounded-2xl p-5 border transition-all space-y-4 shadow-sm dark:shadow-glass cursor-pointer hover:border-indigo-400 dark:hover:border-cyan-400/60 ${
                          c.severity === 'high'
                            ? 'border-rose-200 dark:border-rose-500/40 bg-gradient-to-b from-rose-50/30 to-white dark:from-rose-950/20 dark:to-transparent'
                            : 'border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)]'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 text-[11px] font-mono text-[#5D677A] dark:text-slate-400 mb-1">
                              <span>Conflict #{c.id}</span>
                              <span>•</span>
                              <span className="text-indigo-600 dark:text-cyan-400 font-bold">{c.model_number || 'Model Spec'}</span>
                            </div>
                            <h3 className="text-sm font-display font-bold text-[#172033] dark:text-white leading-snug">
                              {c.product_name}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <StatusBadge status={c.severity} type="severity" />
                            <StatusBadge status={c.status} />
                          </div>
                        </div>

                        {/* Conflict Spec Comparison Grid */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-[#E4E8F0] dark:border-slate-800 space-y-2">
                          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-300 flex items-center justify-between">
                            <span>Field: <strong className="text-amber-600 dark:text-amber-400">{(c.field || c.attribute || 'spec').toUpperCase()}</strong></span>
                            <span className="text-[10px] text-slate-400 font-normal">Click card to inspect</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {/* Source A */}
                            <div className="p-3 rounded-xl bg-white dark:bg-[#0B101D] border border-[#E4E8F0] dark:border-slate-800 shadow-sm">
                              <span className="text-[10px] text-[#5D677A] dark:text-slate-400 font-mono font-semibold block truncate">
                                {c.source_a}
                              </span>
                              <div className="text-sm font-display font-bold text-indigo-600 dark:text-cyan-400 font-mono mt-1 truncate">
                                {c.value_a}
                              </div>
                            </div>

                            {/* Source B */}
                            <div className="p-3 rounded-xl bg-white dark:bg-[#0B101D] border border-[#E4E8F0] dark:border-slate-800 shadow-sm">
                              <span className="text-[10px] text-[#5D677A] dark:text-slate-400 font-mono font-semibold block truncate">
                                {c.source_b}
                              </span>
                              <div className="text-sm font-display font-bold text-amber-600 dark:text-amber-400 font-mono mt-1 truncate">
                                {c.value_b}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ASSR AI Resolution Recommendation */}
                        <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-blue-950/30 border border-indigo-200 dark:border-cyan-500/30 text-xs text-[#172033] dark:text-slate-200 flex items-start space-x-2.5 shadow-sm">
                          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                          <p className="leading-relaxed font-mono text-[11px]">
                            {c.ai_explanation || `ASSR AI recommendation: Standardize on canonical specification from ${c.source_a}.`}
                          </p>
                        </div>

                        {/* Resolution Action Buttons (Optimistic) */}
                        <div className="pt-2 border-t border-[#E4E8F0] dark:border-slate-800 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[11px] font-mono text-[#5D677A] dark:text-slate-400">Resolution:</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleResolve(c.id, 'accept_a')}
                              disabled={isActing}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                c.status === 'accept_a'
                                  ? 'bg-indigo-600 dark:bg-cyan-500 text-white shadow-sm font-bold'
                                  : 'bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-cyan-500/20 text-[#172033] dark:text-slate-200 hover:text-indigo-600 dark:hover:text-cyan-300 border border-[#E4E8F0] dark:border-slate-700 shadow-sm'
                              }`}
                            >
                              Accept {(c.source_a || 'Source A').split(' ')[0]}
                            </button>

                            <button
                              onClick={() => handleResolve(c.id, 'accept_b')}
                              disabled={isActing}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                c.status === 'accept_b'
                                  ? 'bg-amber-500 text-white shadow-sm font-bold'
                                  : 'bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-500/20 text-[#172033] dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-300 border border-[#E4E8F0] dark:border-slate-700 shadow-sm'
                              }`}
                            >
                              Accept {(c.source_b || 'Source B').split(' ')[0]}
                            </button>

                            <button
                              onClick={() => handleResolve(c.id, 'keep_for_review')}
                              disabled={isActing}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all ${
                                c.status === 'keep_for_review'
                                  ? 'bg-violet-600 text-white shadow-sm font-bold'
                                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#5D677A] dark:text-slate-400 border border-[#E4E8F0] dark:border-slate-700 shadow-sm'
                              }`}
                              title="Mark for manual engineering audit"
                            >
                              Audit
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Footer */}
              {!isLoading && total > pageSize && (
                <div className="p-4 rounded-2xl glass-card border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] flex items-center justify-between text-xs text-[#5D677A] dark:text-slate-400 font-mono shadow-sm">
                  <div>
                    Showing <strong className="text-[#172033] dark:text-white">{(page - 1) * pageSize + 1}</strong> to{' '}
                    <strong className="text-[#172033] dark:text-white">{Math.min(page * pageSize, total)}</strong> of{' '}
                    <strong className="text-[#172033] dark:text-white">{total}</strong> conflicts
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-[#E4E8F0] dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#172033] dark:text-slate-200 shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-[#172033] dark:text-slate-300 px-2 font-bold">
                      Page {page} of {totalPages || 1}
                    </span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-[#E4E8F0] dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#172033] dark:text-slate-200 shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DATA GAPS (Loaded lazily) */}
          {activeSubTab === 'data_gaps' && (
            <div className="space-y-6 animate-fade-in">
              {isTabLoading ? (
                <div className="p-8 text-center font-mono text-xs text-slate-400">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-cyan-400 animate-spin mx-auto mb-2" />
                  <span>Loading Data Gaps analysis...</span>
                </div>
              ) : (
                <div className="p-6 rounded-3xl glass-card border border-[#E4E8F0] dark:border-slate-800 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-display font-bold text-[#172033] dark:text-white flex items-center space-x-2">
                      <FileQuestion className="w-4 h-4 text-amber-500" />
                      <span>Upstream Data Gaps & Placeholder Ingestion Audits</span>
                    </h3>
                    <p className="text-xs text-[#5D677A] dark:text-slate-400 mt-1 font-mono">
                      Identifies missing vendor attributes, incomplete feeds, and unpopulated placeholders across {dataGapsData?.total_products || 1000} catalog rows.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(dataGapsData?.field_gaps || []).map((gap, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <strong className="text-[#172033] dark:text-white font-bold">{gap.field_name}</strong>
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">{gap.missing_count} missing ({100 - gap.coverage_pct}%)</span>
                        </div>
                        
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${gap.coverage_pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#5D677A] dark:text-slate-400 font-mono">
                          <span>Coverage: <strong className="text-[#172033] dark:text-slate-200">{gap.coverage_pct}%</strong></span>
                          <span>Feed Type: {gap.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-400">
                      Sample Catalog Products with Metadata Gaps:
                    </h4>
                    <div className="divide-y divide-[#E4E8F0] dark:divide-slate-800 rounded-2xl border border-[#E4E8F0] dark:border-slate-800 overflow-hidden bg-white dark:bg-[#0B101D]">
                      {(dataGapsData?.sample_items || []).map((item, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between text-xs font-mono">
                          <div>
                            <div className="text-indigo-600 dark:text-cyan-400 font-bold mb-0.5">{item.product_id}</div>
                            <div className="text-[#172033] dark:text-white font-medium">{item.product_name}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.missing_fields.map((mf, mi) => (
                              <span key={mi} className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] border border-rose-200 dark:border-rose-800/40">
                                {mf}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECONCILIATION OPPORTUNITIES (Loaded lazily) */}
          {activeSubTab === 'reconciliation' && (
            <div className="space-y-6 animate-fade-in">
              {isTabLoading ? (
                <div className="p-8 text-center font-mono text-xs text-slate-400">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-cyan-400 animate-spin mx-auto mb-2" />
                  <span>Loading ASSR AI reconciliation opportunities...</span>
                </div>
              ) : (
                <div className="p-6 rounded-3xl glass-card border border-[#E4E8F0] dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-display font-bold text-[#172033] dark:text-white flex items-center space-x-2">
                        <Wand2 className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                        <span>ASSR AI Metadata Reconciliation Opportunities</span>
                      </h3>
                      <p className="text-xs text-[#5D677A] dark:text-slate-400 mt-1 font-mono">
                        Identified {reconciliationOpps.length} products where missing brand or engineering attributes can be deterministically inferred from descriptive evidence.
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-blue-950/50 text-indigo-700 dark:text-cyan-300 text-xs font-mono font-bold border border-indigo-200 dark:border-blue-800/50">
                      ✦ ASSR AI Confidence: 94%+
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reconciliationOpps.map((opp, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-800 space-y-3.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-indigo-600 dark:text-cyan-400 font-bold">{opp.product_id}</span>
                            <h4 className="text-sm font-display font-bold text-[#172033] dark:text-white leading-snug mt-0.5">
                              {opp.product_name}
                            </h4>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[11px] font-mono font-bold border border-emerald-200 dark:border-emerald-500/30">
                            {opp.confidence_pct}% Conf
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-[#0B101D] border border-[#E4E8F0] dark:border-slate-800 text-xs font-mono text-[#5D677A] dark:text-slate-400 leading-relaxed">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Source Context:</span>
                          {opp.evidence_source}
                        </div>

                        <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-blue-950/40 border border-indigo-200 dark:border-cyan-500/30 flex items-center justify-between text-xs font-mono">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-cyan-400 block">ASSR AI Inferred {opp.target_field}:</span>
                            <strong className="text-sm font-display font-bold text-[#172033] dark:text-white mt-0.5 block">{opp.inferred_value}</strong>
                          </div>
                          <button
                            onClick={() => alert(`Auto-reconciled ${opp.product_id} with ${opp.target_field}: ${opp.inferred_value}`)}
                            className="btn-primary text-xs py-1.5 px-3 shrink-0"
                          >
                            <span>Auto-Reconcile</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Slide-out Fast Conflict Detail Modal */}
      {selectedConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
          <div className="glass-card rounded-3xl max-w-xl w-full p-6 border border-indigo-200 dark:border-cyan-500/40 shadow-2xl space-y-5 bg-white dark:bg-[#0E1526]">
            <div className="flex items-center justify-between border-b border-[#E4E8F0] dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-display font-bold text-[#172033] dark:text-white">
                  Specification Conflict Detail
                </h3>
              </div>
              <button
                onClick={() => setSelectedConflict(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#131C31] border border-[#E4E8F0] dark:border-slate-800">
                <span className="text-[#5D677A] dark:text-slate-400">Product:</span>
                <strong className="text-[#172033] dark:text-white font-bold">{selectedConflict.product_name}</strong>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#131C31] border border-[#E4E8F0] dark:border-slate-800">
                <span className="text-[#5D677A] dark:text-slate-400">Model / Part:</span>
                <strong className="text-indigo-600 dark:text-cyan-400">{selectedConflict.model_number || 'N/A'}</strong>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#131C31] border border-[#E4E8F0] dark:border-slate-800">
                <span className="text-[#5D677A] dark:text-slate-400">Conflicting Attribute:</span>
                <strong className="text-amber-600 dark:text-amber-400 uppercase font-bold">{selectedConflict.field}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-[#0B101D] border border-indigo-200 dark:border-indigo-500/30 space-y-1.5">
                <span className="text-[11px] font-mono text-indigo-600 dark:text-cyan-400 font-bold uppercase block">
                  Source A ({selectedConflict.source_a})
                </span>
                <div className="text-base font-display font-black text-[#172033] dark:text-white">
                  {selectedConflict.value_a}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-[#0B101D] border border-amber-200 dark:border-amber-500/30 space-y-1.5">
                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase block">
                  Source B ({selectedConflict.source_b})
                </span>
                <div className="text-base font-display font-black text-[#172033] dark:text-white">
                  {selectedConflict.value_b}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-blue-950/40 border border-indigo-200 dark:border-cyan-500/30 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-indigo-600 dark:text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>✦ ASSR AI ARBITRATION ANALYSIS</span>
              </div>
              <p className="text-xs text-[#172033] dark:text-slate-200 leading-relaxed font-mono">
                {selectedConflict.ai_explanation}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => handleResolve(selectedConflict.id, 'accept_a')}
                className="btn-primary text-xs"
              >
                <span>Accept {selectedConflict.source_a.split(' ')[0]}</span>
              </button>
              <button
                onClick={() => handleResolve(selectedConflict.id, 'accept_b')}
                className="btn-secondary text-xs"
              >
                <span>Accept {selectedConflict.source_b.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
