import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Layers,
  FileText,
  Tag,
  CheckCircle2,
  Info,
  ExternalLink,
  Cpu
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function ProductDetailModal({ product, onClose, effectiveTheme = 'dark' }) {
  const [activeTab, setActiveTab] = useState('specs');

  if (!product) return null;

  const ai = product.ai_intelligence;
  const scores = product.scores || {};
  const issues = product.validation_issues || [];
  const conflicts = product.conflicts || [];

  const specCards = [
    { label: 'Rated Power', val: product.power, source: product.source || 'Catalog', conf: '98%' },
    { label: 'Voltage', val: product.voltage, source: product.source || 'Catalog', conf: '96%' },
    { label: 'Rotational Speed', val: product.rpm, source: 'OEM Spec', conf: '95%' },
    { label: 'Frequency', val: product.frequency, source: 'Catalog', conf: '99%' },
    { label: 'Ingress Protection', val: product.ip_rating, source: 'Engineering Datasheet', conf: '94%' },
    { label: 'Weight / Mass', val: product.weight, source: 'Catalog', conf: '92%' },
    { label: 'Dimensions', val: product.dimensions, source: 'Packaging Spec', conf: '90%' },
    { label: 'Housing Material', val: product.material, source: 'OEM Datasheet', conf: '96%' },
    { label: 'Warranty Period', val: product.warranty, source: 'Commercial Master', conf: '100%' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.1)] overflow-hidden bg-white dark:bg-[#151D32]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] flex items-start justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 dark:from-[#10172A] dark:to-[#151D32]">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 font-mono text-xs border border-indigo-200 dark:border-cyan-500/30 font-bold">
                {product.product_id}
              </span>
              <StatusBadge status={product.validation_status} />
              <span className="text-xs text-[#5D677A] dark:text-slate-400 font-mono">
                Model: <strong className="text-[#172033] dark:text-white font-mono">{product.model_number || 'N/A'}</strong>
              </span>
            </div>
            <h2 className="text-xl font-display font-black text-[#172033] dark:text-white leading-snug">
              {product.product_name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-[#5D677A] dark:text-slate-400 font-mono">
              <span>Brand: <strong className="text-[#172033] dark:text-slate-200">{product.brand}</strong></span>
              <span>Category: <strong className="text-[#172033] dark:text-slate-200">{product.category} &rsaquo; {product.subcategory}</strong></span>
              <span>Supplier: <strong className="text-[#172033] dark:text-slate-200">{product.supplier}</strong></span>
              {product.price && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Price: {product.currency} {product.price.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-[#172033] dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] px-6 bg-slate-50 dark:bg-[#10172A] overflow-x-auto">
          {[
            { id: 'specs', label: 'Technical Specifications', icon: Layers },
            { id: 'ai', label: 'ASSR AI Intelligence', icon: Sparkles },
            { id: 'quality', label: 'Quality & Diagnostics', icon: ShieldCheck },
            { id: 'lineage', label: 'Raw Lineage & Metadata', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3.5 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 dark:border-cyan-400 text-indigo-600 dark:text-cyan-300 bg-indigo-50/60 dark:bg-indigo-500/10'
                    : 'border-transparent text-[#5D677A] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar bg-white dark:bg-[#0B1020]">
          
          {/* TAB 1: SPECS */}
          {activeTab === 'specs' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-300">
                  Normalized Product Attributes
                </h3>
                <span className="text-xs text-[#8A94A6] dark:text-slate-500 font-mono">Standardized across units & syntax</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {specCards.map((spec, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-700 transition-all shadow-sm">
                    <div className="text-[11px] font-mono font-medium text-[#8A94A6] dark:text-slate-400 uppercase tracking-wider">
                      {spec.label}
                    </div>
                    <div className="text-sm font-semibold text-[#172033] dark:text-white mt-1">
                      {spec.val || <span className="text-slate-400 italic font-normal">Unspecified</span>}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#5D677A] dark:text-slate-500 mt-2 pt-2 border-t border-[#E4E8F0] dark:border-slate-800 font-mono">
                      <span>Src: {spec.source}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Conf: {spec.conf}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-slate-800 shadow-sm">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-300 block mb-1">
                  Product Description
                </span>
                <p className="text-xs text-[#172033] dark:text-slate-300 leading-relaxed">
                  {product.description || 'No description provided.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: AI INTELLIGENCE */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              {ai ? (
                <>
                  {/* ASSR AI Overview Banner */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/60 via-violet-50/40 to-cyan-50/40 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 border border-indigo-200 dark:border-cyan-500/30 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
                        <span className="font-display font-bold text-[#172033] dark:text-white text-sm">ASSR AI Intelligence Reasoning</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
                        {ai.confidence_score}% Confidence
                      </span>
                    </div>
                    <p className="text-xs text-[#5D677A] dark:text-slate-300 mt-2 leading-relaxed">
                      {ai.explanation || "Inferred high-duty component classification, standardized units, and commerce tags."}
                    </p>
                  </div>

                  {/* Cleaned Commercial Description */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-300 block mb-1">
                      ASSR AI Enriched Commerce Description
                    </span>
                    <p className="text-xs text-[#172033] dark:text-slate-200 leading-relaxed">
                      {ai.normalized_description}
                    </p>
                  </div>

                  {/* Commerce Keywords */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-300 block mb-2.5">
                      B2B Commerce Keywords & Search Terms
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(ai.commerce_keywords || []).map((kw, idx) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-indigo-50 dark:bg-blue-950/60 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-blue-800/60">
                          <Tag className="w-3 h-3 mr-1 text-indigo-600 dark:text-cyan-400" />
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Attributes */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-300 block mb-2">
                      Identified Missing Technical Attributes
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(ai.missing_attributes || []).map((m, idx) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                          <Info className="w-3 h-3 mr-1 text-amber-500" />
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-[#5D677A] dark:text-slate-400 font-mono">
                  <Sparkles className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                  <p>ASSR AI enrichment data is being processed.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUALITY & DIAGNOSTICS */}
          {activeTab === 'quality' && (
            <div className="space-y-6">
              {/* Quality Dimension Scores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-slate-800 text-center shadow-sm">
                  <span className="text-[11px] text-[#5D677A] dark:text-slate-400 uppercase font-semibold">Overall Quality</span>
                  <div className="text-2xl font-black text-indigo-600 dark:text-cyan-400 mt-1">{scores.overall_quality || 0}%</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-slate-800 text-center shadow-sm">
                  <span className="text-[11px] text-[#5D677A] dark:text-slate-400 uppercase font-semibold">Completeness</span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{scores.completeness || 0}%</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-slate-800 text-center shadow-sm">
                  <span className="text-[11px] text-[#5D677A] dark:text-slate-400 uppercase font-semibold">Validity</span>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{scores.validity || 0}%</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-slate-800 text-center shadow-sm">
                  <span className="text-[11px] text-[#5D677A] dark:text-slate-400 uppercase font-semibold">Consistency</span>
                  <div className="text-2xl font-black text-violet-600 dark:text-purple-400 mt-1">{scores.consistency || 0}%</div>
                </div>
              </div>

              {/* Validation Issues Log */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-300 mb-3">
                  Validation Diagnostics ({issues.length} Issues)
                </h4>
                {issues.length > 0 ? (
                  <div className="space-y-2">
                    {issues.map((iss) => (
                      <div key={iss.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-slate-800 flex items-start justify-between text-xs shadow-sm">
                        <div className="space-y-0.5 font-mono">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-[#172033] dark:text-white capitalize">{iss.field}:</span>
                            <span className="text-[#5D677A] dark:text-slate-300">{iss.message}</span>
                          </div>
                          {iss.raw_value && (
                            <span className="text-[11px] text-[#8A94A6] dark:text-slate-500 block">
                              Raw: "{iss.raw_value}"
                            </span>
                          )}
                        </div>
                        <StatusBadge status={iss.severity} type="severity" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>No rule violations found. All validations passed.</span>
                  </div>
                )}
              </div>

              {/* Active Conflicts */}
              {conflicts.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Active Cross-Source Conflicts ({conflicts.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {conflicts.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs space-y-1 font-mono shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-700 dark:text-rose-300 capitalize">{c.field} Mismatch</span>
                          <StatusBadge status={c.severity} type="severity" />
                        </div>
                        <p className="text-[#5D677A] dark:text-slate-300">{c.ai_explanation}</p>
                        <div className="text-[11px] text-[#8A94A6] dark:text-slate-400">
                          {c.source_a}: <strong className="text-[#172033] dark:text-white">{c.value_a}</strong> vs {c.source_b}: <strong className="text-[#172033] dark:text-white">{c.value_b}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RAW LINEAGE */}
          {activeTab === 'lineage' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-slate-800 space-y-2 text-xs font-mono shadow-sm">
                <div className="flex justify-between py-1 border-b border-[#E4E8F0] dark:border-slate-800">
                  <span className="text-[#5D677A] dark:text-slate-400">Primary Data Source:</span>
                  <span className="font-semibold text-[#172033] dark:text-white">{product.source}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E4E8F0] dark:border-slate-800">
                  <span className="text-[#5D677A] dark:text-slate-400">Country of Origin:</span>
                  <span className="font-semibold text-[#172033] dark:text-white">{product.country || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E4E8F0] dark:border-slate-800">
                  <span className="text-[#5D677A] dark:text-slate-400">Technical Datasheet:</span>
                  <span className="text-indigo-600 dark:text-cyan-400 truncate max-w-md">
                    {product.technical_document || 'None'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#5D677A] dark:text-slate-400">Product Commerce URL:</span>
                  <span className="text-indigo-600 dark:text-cyan-400 truncate max-w-md">
                    {product.product_url || 'None'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-300 block mb-2">
                  Original Raw JSON Payload
                </span>
                <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 dark:bg-[#060A12] border border-[#E4E8F0] dark:border-slate-800 text-[11px] font-mono overflow-x-auto max-h-60 custom-scrollbar shadow-inner">
                  {JSON.stringify(product.raw_data, null, 2)}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] bg-slate-50 dark:bg-[#10172A] flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
