import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  Boxes,
  ArrowUpDown,
  Tag,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Loader2,
  RotateCw
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ProductDetailView from '../components/ProductDetailView';
import { fetchProducts, fetchProductDetail, downloadExportOutput } from '../services/api';

export default function ProductIntelligence({ jobId, onNavigate, effectiveTheme = 'dark' }) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Export State
  const [exportState, setExportState] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [exportErrorMessage, setExportErrorMessage] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const [filterOptions, setFilterOptions] = useState({ categories: [], brands: [] });

  // Product Detail Selection & Loading State
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const hasOutput = Boolean(jobId && total > 0);

  const loadData = async () => {
    if (!jobId) {
      setProducts([]);
      setTotal(0);
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetchProducts({
        job_id: jobId,
        search: searchTerm,
        category: selectedCategory,
        brand: selectedBrand,
        validation_status: selectedStatus,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: page,
        page_size: pageSize
      });
      setProducts(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
      if (res.filter_options) {
        setFilterOptions(res.filter_options);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [jobId, page, pageSize, selectedCategory, selectedBrand, selectedStatus, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleExport = async () => {
    if (exportState === 'loading') return;
    try {
      setExportState('loading');
      setExportErrorMessage(null);
      await downloadExportOutput(jobId, 'csv');
      setExportState('success');
      setTimeout(() => {
        setExportState('idle');
      }, 3000);
    } catch (err) {
      console.error('Export error:', err);
      setExportState('error');
      setExportErrorMessage(err.message || 'Failed to export complete dataset. Please try again.');
      setTimeout(() => {
        setExportState('idle');
      }, 5000);
    }
  };

  const handleRowClick = async (productId) => {
    try {
      setIsDetailLoading(true);
      const detail = await fetchProductDetail(productId);
      setSelectedProductDetail(detail);
    } catch (err) {
      console.error('Failed to load product detail', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // If viewing a selected product detail, render ProductDetailView (preserves table state underneath)
  if (selectedProductDetail) {
    return (
      <ProductDetailView
        product={selectedProductDetail}
        onBack={() => setSelectedProductDetail(null)}
        effectiveTheme={effectiveTheme}
      />
    );
  }

  // Loading skeleton when clicking product
  if (isDetailLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4" />
        <div className="glass-card rounded-3xl p-8 border border-[#E4E8F0] dark:border-slate-800 space-y-4">
          <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Empty State if no active dataset
  if (!jobId) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20 animate-fade-in">
        <div className="glass-card rounded-3xl p-8 lg:p-12 border border-[#E4E8F0] dark:border-slate-800 shadow-sm max-w-md mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-cyan-400 mx-auto shadow-sm">
            <Boxes className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-display font-black text-[#172033] dark:text-white">
              No Active Dataset
            </h3>
            <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] leading-relaxed">
              Upload an industrial catalog or load the demo benchmark dataset to view Product Intelligence master data.
            </p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('upload')}
            className="btn-primary w-full py-3 text-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Go to Catalog Ingestion</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest text-indigo-600 dark:text-cyan-400 uppercase mb-1">
            <Boxes className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
            <span>STRUCTURED CATALOG GRID</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-display font-black text-[#172033] dark:text-white tracking-tight">
            Product Intelligence Master Data
          </h2>
          <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] mt-1 font-mono">
            Showing <strong className="text-indigo-600 dark:text-cyan-300 font-bold">{total.toLocaleString()}</strong> normalized, validated, and ASSR AI-enriched records.
          </p>
        </div>

        {/* ASSR AI Status & Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* ASSR AI Status Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-cyan-300 text-xs font-mono shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-cyan-400 animate-pulse" />
            <span className="font-bold text-[11px]">ASSR AI Ready</span>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-60 md:w-68">
            <Search className="w-4 h-4 text-[#8A94A6] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Name, Model, Brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700/80 focus:border-indigo-500 dark:focus:border-cyan-500 focus:outline-none text-xs text-[#172033] dark:text-white placeholder-[#8A94A6] dark:placeholder-slate-500 transition-colors shadow-sm"
            />
          </form>

          {/* Refresh Button */}
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white dark:bg-[#10172A] hover:bg-slate-50 dark:hover:bg-slate-800 border border-[#E4E8F0] dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh Table Data"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600 dark:text-cyan-400' : ''}`} />
          </button>

          {/* Prominent, Professional "Export Output" Button (Revealed only when dataset output exists) */}
          {hasOutput && (
            <button
              id="export-output-button"
              onClick={handleExport}
              disabled={exportState === 'loading'}
              className={`animate-fade-in flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 shadow-md group relative overflow-hidden cursor-pointer ${
                exportState === 'loading'
                  ? 'bg-indigo-600 text-white cursor-wait opacity-90 shadow-indigo-500/20'
                  : exportState === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                  : exportState === 'error'
                  ? 'bg-rose-600 text-white shadow-rose-500/30 ring-2 ring-rose-400/50'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-500 hover:to-blue-500 dark:from-cyan-500 dark:via-blue-600 dark:to-indigo-600 dark:hover:from-cyan-400 dark:hover:to-blue-500 text-white shadow-indigo-500/25 dark:shadow-cyan-500/25 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
              }`}
              title="Export complete processed dataset in delivery CSV format"
            >
              {exportState === 'loading' && (
                <>
                  <RotateCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Preparing export...</span>
                </>
              )}
              {exportState === 'success' && (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
                  <span>Export Complete!</span>
                </>
              )}
              {exportState === 'error' && (
                <>
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-200" />
                  <span>Export Failed</span>
                </>
              )}
              {exportState === 'idle' && (
                <>
                  <Download className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:scale-110" />
                  <span className="font-display font-bold">Export Output</span>
                  <span className="hidden 2xl:inline text-[10px] uppercase font-mono opacity-80 pl-0.5">.CSV</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 animate-fade-in">
        <div className="p-4 rounded-2xl glass-card border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-400 block">Total Products</span>
          <div className="text-xl lg:text-2xl font-display font-black text-[#172033] dark:text-white mt-0.5">{total.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">100% Ingested</span>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-400 block">Output Columns</span>
          <div className="text-xl lg:text-2xl font-display font-black text-[#172033] dark:text-white mt-0.5">24 Standard</div>
          <span className="text-[11px] text-indigo-600 dark:text-cyan-400 font-mono mt-0.5 block">Standard Delivery</span>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-400 block">AI-Enriched Products</span>
          <div className="text-xl lg:text-2xl font-display font-black text-[#172033] dark:text-white mt-0.5">{total.toLocaleString()}</div>
          <span className="text-[11px] text-violet-600 dark:text-violet-400 font-mono mt-0.5 block">ASSR AI Enriched</span>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-400 block">Processing Status</span>
          <div className="text-xl lg:text-2xl font-display font-black text-emerald-600 dark:text-emerald-400 mt-0.5">COMPLETED</div>
          <span className="text-[11px] text-[#5D677A] dark:text-slate-400 font-mono mt-0.5 block">Validated & Normalized</span>
        </div>
      </div>

      {/* Clear Transformation Visual */}
      <div className="p-4 rounded-2xl glass-card border border-indigo-200/50 dark:border-indigo-500/20 bg-gradient-to-r from-indigo-50/50 via-white to-blue-50/50 dark:from-slate-900/90 dark:via-[#131b2e] dark:to-slate-900/90 shadow-sm animate-fade-in">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold uppercase text-[11px]">
              SPARSE INPUT
            </span>
            <span className="text-indigo-600 dark:text-cyan-400 font-bold text-base">&darr;</span>
            <span className="px-3 py-1 rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-cyan-300 border border-indigo-500/40 font-black tracking-wider flex items-center space-x-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400 animate-pulse" />
              <span>PRODUCTIQ</span>
            </span>
            <span className="text-indigo-600 dark:text-cyan-400 font-bold text-base">&darr;</span>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold uppercase text-[11px]">
              ENRICHED PRODUCT INTELLIGENCE
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-[#5D677A] dark:text-slate-400 font-mono">
            <span>24 Delivery Columns</span>
            <span>•</span>
            <span>100% Normalized</span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-cyan-400 font-bold">ASSR AI Verified</span>
          </div>
        </div>
      </div>

      {/* Export Failure Error Banner */}
      {exportErrorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-mono">{exportErrorMessage}</span>
          </div>
          <button
            onClick={() => setExportErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400 font-bold px-2 py-0.5 rounded text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-card border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] flex flex-wrap items-center gap-3 text-xs shadow-sm">
        <div className="flex items-center space-x-1.5 text-[#5D677A] dark:text-slate-400 font-mono font-bold uppercase tracking-wider mr-2">
          <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
          <span>Filters:</span>
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700 text-[#172033] dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500 shadow-sm"
        >
          <option value="All">All Categories</option>
          {filterOptions.categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Brand Filter */}
        <select
          value={selectedBrand}
          onChange={(e) => { setSelectedBrand(e.target.value); setPage(1); }}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700 text-[#172033] dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500 shadow-sm"
        >
          <option value="All">All Brands</option>
          {filterOptions.brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Validation Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700 text-[#172033] dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500 shadow-sm"
        >
          <option value="All">All Statuses</option>
          <option value="valid">Valid Only</option>
          <option value="warning">Warnings Only</option>
          <option value="invalid">Invalid Only</option>
        </select>

        {/* Sort Field */}
        <div className="ml-auto flex items-center space-x-2 font-mono">
          <span className="text-[#5D677A] dark:text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700 text-[#172033] dark:text-slate-200 focus:outline-none shadow-sm"
          >
            <option value="id">Original Order</option>
            <option value="quality_score">Quality Score</option>
            <option value="price">Price</option>
            <option value="product_name">Product Name</option>
            <option value="ai_confidence">ASSR AI Confidence</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-[#E4E8F0] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#172033] dark:hover:text-white shadow-sm"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Table with Sticky Header */}
      <div className="glass-card rounded-2xl border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] overflow-hidden shadow-sm dark:shadow-glass">
        <div className="overflow-x-auto max-h-[640px] custom-scrollbar">
          <table className="w-full text-left enterprise-table">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr>
                <th>Part Number / Ref</th>
                <th>Product Description</th>
                <th>Detected Brand</th>
                <th>Manufacturer</th>
                <th>Product Type / Cat</th>
                <th>Completeness</th>
                <th>ASSR AI Confidence</th>
                <th>Quality</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E8F0] dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="text-center py-20 text-[#5D677A] dark:text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-indigo-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span className="font-mono">Loading product intelligence records...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-20 text-[#5D677A] dark:text-slate-400 font-mono">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleRowClick(p.id)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1E2945] transition-colors group"
                  >
                    <td>
                      <div className="font-mono text-xs text-indigo-600 dark:text-cyan-400 font-bold">
                        {p.model_number || p.product_id}
                      </div>
                      <span className="text-[10px] text-[#8A94A6] dark:text-slate-500 font-mono">
                        {p.product_id}
                      </span>
                    </td>

                    <td className="max-w-xs">
                      <div className="font-semibold text-[#172033] dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors" title={p.product_name}>
                        {p.product_name}
                      </div>
                      <div className="text-[11px] text-[#5D677A] dark:text-slate-400 font-mono truncate max-w-[220px]">
                        {p.power || p.voltage || 'Standard Specs'}
                      </div>
                    </td>

                    <td>
                      <span className="font-semibold text-[#172033] dark:text-slate-200">{p.brand || '—'}</span>
                    </td>

                    <td>
                      <span className="text-xs text-[#5D677A] dark:text-slate-300 font-mono">{p.manufacturer || p.brand || 'OEM'}</span>
                    </td>

                    <td>
                      <div className="text-xs text-[#172033] dark:text-slate-200">{p.category}</div>
                      <div className="text-[10px] text-[#5D677A] dark:text-slate-400 truncate max-w-[140px] font-mono">{p.subcategory}</div>
                    </td>

                    <td>
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${p.completeness_score}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-[#5D677A] dark:text-slate-300">{p.completeness_score}%</span>
                      </div>
                    </td>

                    <td>
                      <div className="flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-cyan-400" />
                        <span className="text-xs font-mono font-bold text-violet-700 dark:text-cyan-300">
                          {p.ai_confidence}%
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`font-mono text-xs font-bold ${
                        p.quality_score >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                        p.quality_score >= 65 ? 'text-indigo-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {p.quality_score}%
                      </span>
                    </td>

                    <td>
                      <StatusBadge status={p.validation_status} />
                    </td>

                    <td className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(p.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-cyan-500/20 text-[#5D677A] dark:text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-300 border border-[#E4E8F0] dark:border-slate-700 transition-colors shadow-sm"
                        title="Open Intelligence Lens"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] bg-slate-50 dark:bg-[#0B1020] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5D677A] dark:text-slate-400 font-mono">
          <div>
            Showing <strong className="text-[#172033] dark:text-white">{products.length ? (page - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong className="text-[#172033] dark:text-white">{Math.min(page * pageSize, total)}</strong> of{' '}
            <strong className="text-[#172033] dark:text-white">{total}</strong> records
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700 rounded px-2 py-1 text-[#172033] dark:text-slate-200 shadow-sm"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
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
        </div>

      </div>

    </div>
  );
}
