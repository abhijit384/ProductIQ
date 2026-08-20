import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { fetchValidationIssues } from '../services/api';

export default function Validation({ jobId, onSelectProduct, effectiveTheme = 'dark' }) {
  const [issues, setIssues] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedField, setSelectedField] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetchValidationIssues({
        job_id: jobId,
        severity: selectedSeverity,
        field: selectedField,
        page: page,
        page_size: pageSize
      });
      setIssues(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Failed to load validation issues', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) {
      setIssues([]);
      setTotal(0);
      return;
    }
    loadData();
  }, [jobId, page, selectedSeverity, selectedField]);

  if (!jobId) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20 animate-fade-in">
        <div className="glass-card rounded-3xl p-8 lg:p-12 border border-[#E4E8F0] dark:border-slate-800 shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display font-black text-[#172033] dark:text-white">
              No Active Dataset
            </h3>
            <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] leading-relaxed">
              Upload an industrial catalog or load the demo dataset to view automated validation rules and diagnostic logs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest text-amber-600 dark:text-amber-400 uppercase mb-1">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>RULE ENGINE CONSTRAINTS</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-display font-black text-[#172033] dark:text-white tracking-tight">
            Validation Rules & Diagnostic Log
          </h2>
          <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] mt-1 max-w-2xl leading-relaxed font-mono">
            Automated compliance check against schema constraints, unit standards, range limits, and IP ratings. Total issues: <strong className="text-[#172033] dark:text-white">{total}</strong>.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-card border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] flex items-center space-x-4 text-xs shadow-sm font-mono">
        <div className="flex items-center space-x-1.5 text-[#5D677A] dark:text-slate-400 font-bold uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
          <span>Filter:</span>
        </div>

        <select
          value={selectedSeverity}
          onChange={(e) => { setSelectedSeverity(e.target.value); setPage(1); }}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700 text-[#172033] dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500 shadow-sm"
        >
          <option value="All">All Severities</option>
          <option value="high">High Severity Only</option>
          <option value="medium">Medium Severity Only</option>
          <option value="low">Low Severity Only</option>
        </select>

        <select
          value={selectedField}
          onChange={(e) => { setSelectedField(e.target.value); setPage(1); }}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700 text-[#172033] dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500 shadow-sm"
        >
          <option value="All">All Fields</option>
          <option value="power">Power</option>
          <option value="voltage">Voltage</option>
          <option value="price">Price</option>
          <option value="ip_rating">IP Rating</option>
          <option value="product_url">Product URL</option>
          <option value="description">Description</option>
          <option value="brand">Brand</option>
        </select>
      </div>

      {/* Validation Issues Table with Sticky Header */}
      <div className="glass-card rounded-2xl border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] overflow-hidden shadow-sm dark:shadow-glass">
        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-left enterprise-table">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr>
                <th>Product Ref</th>
                <th>Target Field</th>
                <th>Violation Type</th>
                <th>Severity</th>
                <th>Diagnostic Rule Message</th>
                <th>Raw Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E8F0] dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-20 text-[#5D677A] dark:text-slate-400 font-mono">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading validation issues...</span>
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-20 text-[#5D677A] dark:text-slate-400 font-mono">
                    No validation issues match your current filters.
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50 dark:hover:bg-[#1E2945] transition-colors">
                    <td>
                      <span className="font-mono text-xs text-indigo-600 dark:text-cyan-400 font-bold">
                        {issue.product_external_id || `ID #${issue.product_id}`}
                      </span>
                    </td>

                    <td>
                      <span className="font-semibold text-[#172033] dark:text-slate-200 capitalize font-mono text-xs">
                        {issue.field}
                      </span>
                    </td>

                    <td>
                      <span className="text-xs text-[#5D677A] dark:text-slate-400 font-mono">
                        {issue.issue_type.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td>
                      <StatusBadge status={issue.severity} type="severity" />
                    </td>

                    <td className="text-xs text-[#172033] dark:text-slate-300 max-w-md leading-relaxed">
                      {issue.message}
                    </td>

                    <td className="text-xs font-mono text-[#5D677A] dark:text-slate-400 max-w-xs truncate">
                      {issue.raw_value ? `"${issue.raw_value}"` : <span className="text-[#8A94A6] dark:text-slate-600 italic">null</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] bg-slate-50 dark:bg-[#0B1020] flex items-center justify-between text-xs text-[#5D677A] dark:text-slate-400 font-mono">
          <div>
            Showing <strong className="text-[#172033] dark:text-white">{issues.length ? (page - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong className="text-[#172033] dark:text-white">{Math.min(page * pageSize, total)}</strong> of{' '}
            <strong className="text-[#172033] dark:text-white">{total}</strong> issues
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

      </div>

    </div>
  );
}
