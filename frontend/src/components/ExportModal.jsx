import React from 'react';
import { X, Download, FileSpreadsheet, AlertTriangle, Copy, ShieldAlert } from 'lucide-react';
import { getExportUrl } from '../services/api';

export default function ExportModal({ jobId, onClose, effectiveTheme = 'dark' }) {
  const exportOptions = [
    {
      title: 'Enriched Product Catalog (CSV)',
      desc: 'Standardized industrial specifications, normalized units, ASSR AI enrichment, and quality scores.',
      icon: FileSpreadsheet,
      url: getExportUrl('products', jobId, 'csv'),
      filename: 'ProductIQ_Enriched_Output.csv',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
    },
    {
      title: 'Cleaned Product Catalog (XLSX)',
      desc: 'Formatted multi-column Excel spreadsheet for commercial procurement.',
      icon: FileSpreadsheet,
      url: getExportUrl('products', jobId, 'xlsx'),
      filename: 'productiq_cleaned_catalog.xlsx',
      color: 'text-indigo-600 dark:text-blue-400 bg-indigo-50 dark:bg-blue-500/10 border-indigo-200 dark:border-blue-500/30'
    },
    {
      title: 'Validation & Diagnostic Audit (CSV)',
      desc: 'Complete log of field errors, missing mandatory values, and unit inconsistencies.',
      icon: ShieldAlert,
      url: getExportUrl('validation', jobId),
      filename: 'productiq_validation_audit.csv',
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
    },
    {
      title: 'Multi-Source Conflicts Report (CSV)',
      desc: 'Line-by-line contradictions between OEM, ERP, and supplier catalogues.',
      icon: AlertTriangle,
      url: getExportUrl('conflicts', jobId),
      filename: 'productiq_conflicts_report.csv',
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
    },
    {
      title: 'Duplicate Clusters & Similarity (CSV)',
      desc: 'Grouped duplicate products with fuzzy match similarity scoring.',
      icon: Copy,
      url: getExportUrl('duplicates', jobId),
      filename: 'productiq_duplicates_report.csv',
      color: 'text-violet-600 dark:text-purple-400 bg-violet-50 dark:bg-purple-500/10 border-violet-200 dark:border-purple-500/30'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-xl shadow-2xl border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.1)] overflow-hidden bg-white dark:bg-[#151D32]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] flex items-center justify-between bg-slate-50 dark:bg-[#10172A]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-blue-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[#172033] dark:text-white text-base">Export Intelligence Reports</h3>
              <p className="text-xs text-[#5D677A] dark:text-slate-400 font-mono">Download commerce-ready catalog data and diagnostic audits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#172033] dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar bg-white dark:bg-[#0B1120]">
          {exportOptions.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <a
                key={i}
                href={opt.url}
                download={opt.filename}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-[#E4E8F0] dark:border-slate-800 hover:border-indigo-400 dark:hover:border-cyan-500/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all group shadow-sm"
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`p-2.5 rounded-xl border ${opt.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#172033] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors">
                      {opt.title}
                    </div>
                    <div className="text-xs text-[#5D677A] dark:text-slate-400 mt-0.5 leading-relaxed">
                      {opt.desc}
                    </div>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#0B101D] text-[#5D677A] dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-cyan-300 group-hover:bg-indigo-50 dark:group-hover:bg-blue-600/20 border border-[#E4E8F0] dark:border-slate-700/80 transition-colors shadow-sm">
                  <Download className="w-4 h-4" />
                </div>
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] bg-slate-50 dark:bg-[#10172A] flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
