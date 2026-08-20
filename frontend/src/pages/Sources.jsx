import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  Layers,
  FileText
} from 'lucide-react';
import { fetchSourcesOverview } from '../services/api';

export default function Sources({ jobId, effectiveTheme = 'dark' }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetchSourcesOverview(jobId);
      setData(res);
    } catch (err) {
      console.error('Failed to load sources overview', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) {
      setData(null);
      return;
    }
    loadData();
  }, [jobId]);

  if (!jobId) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20 animate-fade-in">
        <div className="glass-card rounded-3xl p-8 lg:p-12 border border-[#E4E8F0] dark:border-slate-800 shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-blue-500/10 border border-indigo-200 dark:border-blue-500/30 flex items-center justify-center text-indigo-600 dark:text-cyan-400 mx-auto shadow-sm">
            <Database className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display font-black text-[#172033] dark:text-white">
              No Active Dataset
            </h3>
            <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] leading-relaxed">
              Upload an industrial catalog or load the demo dataset to inspect multi-source lineage and reliability scores.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-[#5D677A] dark:text-slate-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-indigo-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading multi-source lineage registry...</span>
      </div>
    );
  }

  const sources = data.sources || [];
  const fields = data.field_coverage || [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest text-indigo-600 dark:text-cyan-400 uppercase mb-1">
          <Database className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
          <span>CATALOG LINEAGE & PROVENANCE</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-display font-black text-[#172033] dark:text-white tracking-tight">
          Multi-Source Data Provenance & Reliability
        </h2>
        <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] mt-1 max-w-2xl leading-relaxed">
          Inventory of upstream data providers, technical datasheets, ERP extracts, and source reliability scoring.
        </p>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sources.map((src, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm dark:shadow-glass space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-blue-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-500/30">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-[#172033] dark:text-white leading-tight">
                    {src.name}
                  </h3>
                  <span className="text-[11px] text-[#5D677A] dark:text-slate-400 font-mono">
                    {src.product_count} items ({src.share_percentage}%)
                  </span>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                src.reliability_tier === 'High'
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
              }`}>
                {src.reliability_tier}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E4E8F0] dark:border-slate-800 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#5D677A] dark:text-slate-400">Quality Score:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{src.quality_score}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D677A] dark:text-slate-400">Completeness:</span>
                <span className="text-[#172033] dark:text-slate-200 font-bold">{src.completeness_score}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D677A] dark:text-slate-400">Rule Validity:</span>
                <span className="text-[#172033] dark:text-slate-200 font-bold">{src.validity_score}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Field Lineage & Coverage Progress */}
      <div className="glass-card rounded-2xl p-6 border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm dark:shadow-glass space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-display font-bold text-[#172033] dark:text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
            <span>Field Provenance & Metadata Lineage Coverage</span>
          </h3>
          <span className="text-xs text-[#8A94A6] dark:text-slate-400 font-mono">Total {data?.total_records || 1050} items</span>
        </div>

        <div className="space-y-3.5">
          {fields.map((f, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#172033] dark:text-slate-300">{f.field}</span>
                <span className="font-mono text-[#5D677A] dark:text-slate-400">
                  <strong className="text-[#172033] dark:text-white">{f.populated}</strong> items ({f.coverage_pct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${f.coverage_pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
