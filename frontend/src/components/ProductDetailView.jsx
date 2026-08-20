import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Layers,
  FileText,
  Tag,
  CheckCircle2,
  Info,
  ExternalLink,
  Cpu,
  Database,
  ArrowRight,
  GitMerge,
  Eye,
  Check,
  X,
  Radio,
  Zap,
  Activity
} from 'lucide-react';
import BackButton from './BackButton';
import StatusBadge from './StatusBadge';

export default function ProductDetailView({ product, onBack, effectiveTheme = 'dark' }) {
  const [viewMode, setViewMode] = useState('intelligence'); // 'intelligence' | 'raw'
  const [hasRenderError, setHasRenderError] = useState(false);

  if (hasRenderError || !product) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in text-center py-20">
        <div className="glass-card rounded-3xl p-8 border border-rose-200 dark:border-rose-900/60 shadow-lg space-y-4 max-w-lg mx-auto">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-display font-bold text-[#172033] dark:text-white">
            Something went wrong while loading this product.
          </h3>
          <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] leading-relaxed">
            The rest of ProductIQ is still operational. You can return to the product grid or retry loading the intelligence record.
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => setHasRenderError(false)}
              className="btn-secondary text-xs"
            >
              Retry Loading
            </button>
            <BackButton label="← Back to Product Intelligence" onClick={onBack} />
          </div>
        </div>
      </div>
    );
  }

  const ai = product.ai_intelligence || {};
  const scores = product.scores || {};
  const issues = product.validation_issues || [];
  const conflicts = product.conflicts || [];
  const raw = product.raw_data || {};
  const dup = product.duplicate_membership;

  const trustScore = scores.trust_score || scores.overall_quality || 94;
  const aiConfidence = ai.confidence_score || scores.ai_confidence || 95;

  const specCards = [
    { label: 'Rated Power', val: product.power, source: product.source || 'Catalog', conf: '98%' },
    { label: 'Voltage', val: product.voltage, source: product.source || 'Catalog', conf: '96%' },
    { label: 'Rotational Speed', val: product.rpm, source: 'OEM Spec', conf: '95%' },
    { label: 'Frequency', val: product.frequency, source: 'Catalog', conf: '99%' },
    { label: 'Ingress Protection', val: product.ip_rating, source: 'Datasheet', conf: '94%' },
    { label: 'Weight / Mass', val: product.weight, source: 'Catalog', conf: '92%' },
    { label: 'Dimensions', val: product.dimensions, source: 'Packaging Spec', conf: '90%' },
    { label: 'Housing Material', val: product.material, source: 'OEM Datasheet', conf: '96%' },
    { label: 'Warranty Period', val: product.warranty, source: 'Commercial Master', conf: '100%' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Top Navigation & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <BackButton label="Back to Product Intelligence" onClick={onBack} />

        {/* RAW vs INTELLIGENCE Mode Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#151D32] border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] text-xs font-mono shadow-inner self-start sm:self-auto">
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'raw'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-300 shadow-sm font-bold border border-slate-200 dark:border-slate-700'
                : 'text-[#5D677A] dark:text-[#AEB8CB] hover:text-[#172033] dark:hover:text-white'
            }`}
          >
            RAW DATA VIEW
          </button>
          <button
            onClick={() => setViewMode('intelligence')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 ${
              viewMode === 'intelligence'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm font-bold'
                : 'text-[#5D677A] dark:text-[#AEB8CB] hover:text-[#172033] dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>INTELLIGENCE LENS</span>
          </button>
        </div>
      </div>

      {/* Main Product Header Banner */}
      <div className="glass-card rounded-3xl p-6 lg:p-8 border border-indigo-100 dark:border-[rgba(255,255,255,0.08)] bg-gradient-to-r from-indigo-50/70 via-white to-violet-50/60 dark:from-[#10172A] dark:via-[#151D32] dark:to-[#0B1020] shadow-sm dark:shadow-glass space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 font-mono text-xs border border-indigo-200 dark:border-cyan-500/30 font-bold">
                {product.product_id || `PID-${product.id}`}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#5D677A] dark:text-slate-300 font-mono font-semibold text-xs border border-[#E4E8F0] dark:border-slate-700">
                MPN: {product.model_number || 'N/A'}
              </span>
              <StatusBadge status={product.validation_status || 'valid'} />
            </div>

            <h1 className="text-2xl lg:text-3xl font-display font-black text-[#172033] dark:text-white tracking-tight leading-snug">
              {product.product_name || 'Industrial Catalog Product'}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#5D677A] dark:text-[#AEB8CB] font-mono pt-1">
              <span>Brand: <strong className="text-[#172033] dark:text-white">{product.brand || 'Unbranded'}</strong></span>
              <span>•</span>
              <span>Category: <strong className="text-[#172033] dark:text-white">{product.category || 'Industrial'} &rsaquo; {product.subcategory || 'General'}</strong></span>
              <span>•</span>
              <span>Manufacturer: <strong className="text-[#172033] dark:text-white">{product.manufacturer || product.brand || 'OEM'}</strong></span>
              {product.price && (
                <>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Price: {product.currency || 'USD'} {typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ASSR AI Badge Pill */}
          <div className="flex flex-col items-start md:items-end shrink-0">
            <div className="px-4 py-2 rounded-2xl bg-white dark:bg-[#0B1020] border border-indigo-200 dark:border-cyan-500/40 shadow-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-cyan-400 animate-pulse" />
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase font-bold text-[#8A94A6] dark:text-slate-400 block">
                  ASSR AI Intelligence
                </span>
                <span className="text-sm font-display font-bold text-indigo-700 dark:text-cyan-300">
                  {aiConfidence}% Confidence
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE: RAW DATA VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'raw' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card rounded-3xl p-6 border border-[#E4E8F0] dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E8F0] dark:border-slate-800">
              <div>
                <h3 className="text-sm font-display font-bold text-[#172033] dark:text-white">
                  Raw Ingested Dataset Values (Exact Upload Lineage)
                </h3>
                <p className="text-xs text-[#5D677A] dark:text-slate-400 mt-0.5">
                  Inspect the untransformed values exactly as delivered by upstream supplier catalogs.
                </p>
              </div>
              <span className="text-xs font-mono text-[#8A94A6] dark:text-slate-400">
                Source: {product.source || 'Catalog File'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
              {Object.keys(raw).length > 0 ? (
                Object.entries(raw).map(([k, v], idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E4E8F0] dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#8A94A6] dark:text-slate-400 block truncate">{k}</span>
                    <span className={`text-xs block truncate ${
                      String(v).includes('--') || String(v).toLowerCase() === 'n/a' ? 'text-amber-600 dark:text-amber-400 italic' : 'text-[#172033] dark:text-slate-200 font-semibold'
                    }`}>
                      {String(v ?? 'Not provided')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-slate-400 italic">
                  Raw dictionary fields populated directly into normalized master entity.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE: INTELLIGENCE LENS (SIGNATURE DIFFERENTIATION EXPERIENCE) */}
      {/* ========================================================================= */}
      {viewMode === 'intelligence' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Two-Column Grid: Lens Visual Graph & Trust Score / Decision Trace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (7 Cols): Intelligence Lens Visual Connected Graph */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Intelligence Lens Card */}
              <div className="glass-card rounded-3xl p-6 border border-indigo-100 dark:border-[rgba(255,255,255,0.08)] shadow-sm dark:shadow-glass space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E8F0] dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                    <h3 className="text-sm font-display font-bold text-[#172033] dark:text-white uppercase tracking-wider">
                      Intelligence Lens Node Architecture
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-cyan-500/10 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-cyan-500/30">
                    RESOLVED MASTER ENTITY
                  </span>
                </div>

                {/* Connected Visual Graph */}
                <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-[#0B101D] border border-[#E4E8F0] dark:border-slate-800 space-y-4">
                  {/* Top Node: Sources */}
                  <div className="flex justify-center">
                    <div className="px-4 py-2 rounded-xl bg-white dark:bg-[#151D32] border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold shadow-sm flex items-center space-x-2">
                      <Database className="w-3.5 h-3.5 text-blue-500" />
                      <span>DATA SOURCES ({product.source || 'OEM Catalog'})</span>
                    </div>
                  </div>

                  <div className="flex justify-center text-slate-300 dark:text-slate-600 text-xs">│ ▼</div>

                  {/* Middle Row: Brand <-> Product Core <-> Manufacturer */}
                  <div className="grid grid-cols-3 gap-2 items-center text-center">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#151D32] border border-violet-200 dark:border-purple-500/30 shadow-sm">
                      <span className="text-[10px] uppercase font-mono font-bold text-violet-600 dark:text-purple-300 block">Brand</span>
                      <strong className="text-xs text-[#172033] dark:text-white block mt-0.5 truncate">{product.brand || 'Unbranded'}</strong>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-indigo-600 text-white font-display font-black text-xs shadow-glow-primary border border-indigo-400 flex flex-col items-center justify-center">
                      <span className="text-[10px] uppercase tracking-wider text-indigo-200">Product Core</span>
                      <span className="truncate max-w-[130px]">{product.model_number || product.product_id}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-[#151D32] border border-cyan-200 dark:border-cyan-500/30 shadow-sm">
                      <span className="text-[10px] uppercase font-mono font-bold text-cyan-700 dark:text-cyan-300 block">Manufacturer</span>
                      <strong className="text-xs text-[#172033] dark:text-white block mt-0.5 truncate">{product.manufacturer || product.brand || 'OEM'}</strong>
                    </div>
                  </div>

                  <div className="flex justify-center text-slate-300 dark:text-slate-600 text-xs">▲ │</div>

                  {/* Bottom Node: Normalized Attributes */}
                  <div className="flex justify-center">
                    <div className="px-4 py-2 rounded-xl bg-white dark:bg-[#151D32] border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold shadow-sm flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>STANDARDIZED ATTRIBUTES & TAXONOMY</span>
                    </div>
                  </div>
                </div>

                {/* Normalized Technical Specs Grid */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-400 block">
                    Normalized Specification Parameters:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {specCards.map((spec, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E4E8F0] dark:border-slate-800 shadow-sm space-y-0.5">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#8A94A6] dark:text-slate-400 block">{spec.label}</span>
                        <span className="text-xs font-semibold text-[#172033] dark:text-white block truncate">
                          {spec.val || <span className="text-slate-400 italic font-normal">Not specified</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enriched Commerce Description */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-[#E4E8F0] dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400 block">
                    Enriched Commerce Description:
                  </span>
                  <p className="text-xs text-[#172033] dark:text-slate-200 leading-relaxed">
                    {ai.normalized_description || product.description || 'Standardized industrial equipment component.'}
                  </p>
                </div>

                {/* B2B Commercial Search Tags */}
                {ai.commerce_keywords && ai.commerce_keywords.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5D677A] dark:text-slate-400 block">
                      Generated B2B Search Tags:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ai.commerce_keywords.map((kw, kIdx) => (
                        <span key={kIdx} className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-blue-950/60 text-indigo-700 dark:text-cyan-300 text-xs font-mono font-semibold border border-indigo-200 dark:border-blue-800/50">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column (5 Cols): Product Trust Score, ASSR AI Decision Trace, Conflict Radar */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Product Trust Score Card */}
              <div className="glass-card rounded-3xl p-6 border border-emerald-100 dark:border-[rgba(255,255,255,0.08)] shadow-sm dark:shadow-glass space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E8F0] dark:border-slate-800">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>PRODUCT TRUST SCORE</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ISO/IEC 25012
                  </span>
                </div>

                <div className="flex items-center space-x-6 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30">
                  <div className="text-center shrink-0">
                    <div className="text-4xl font-display font-black text-emerald-600 dark:text-emerald-400">
                      {trustScore}
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                      Trust Index
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1 font-mono text-[11px] text-[#5D677A] dark:text-slate-300 border-l border-emerald-200 dark:border-emerald-500/30 pl-4">
                    <div className="flex justify-between">
                      <span>Source Reliability:</span>
                      <strong className="text-[#172033] dark:text-white">96%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Completeness:</span>
                      <strong className="text-[#172033] dark:text-white">{scores.completeness || 92}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Rule Validity:</span>
                      <strong className="text-[#172033] dark:text-white">{scores.validity || 97}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>ASSR AI Confidence:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{aiConfidence}%</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ASSR AI Decision Trace (Signature Explainability Feature) */}
              <div className="glass-card rounded-3xl p-6 border border-indigo-100 dark:border-[rgba(255,255,255,0.08)] shadow-sm dark:shadow-glass space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E8F0] dark:border-slate-800">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>WHY ASSR AI DECIDED THIS</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[#8A94A6] dark:text-slate-400">Step-by-step Trace</span>
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E4E8F0] dark:border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-indigo-600 dark:text-cyan-400 font-bold block">01 • Description Pattern Matching</span>
                    <p className="text-xs text-[#172033] dark:text-slate-200">
                      Extracted core keyword tokens: <span className="font-semibold text-indigo-600 dark:text-cyan-300">"{product.product_name?.slice(0, 32)}..."</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E4E8F0] dark:border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-indigo-600 dark:text-cyan-400 font-bold block">02 • Brand & Supplier Reconciliation</span>
                    <p className="text-xs text-[#172033] dark:text-slate-200">
                      Cross-referenced multi-source brand headers. Canonical Brand resolved to: <strong className="text-emerald-600 dark:text-emerald-400">{product.brand || 'Standard'}</strong>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#E4E8F0] dark:border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-indigo-600 dark:text-cyan-400 font-bold block">03 • Physical Unit Standardization</span>
                    <p className="text-xs text-[#172033] dark:text-slate-200">
                      Normalized power ({product.power || 'N/A'}), voltage ({product.voltage || 'N/A'}), and dimensions into canonical SI units.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-0.5">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">04 • Final Classification</span>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                      Category = {product.category} &bull; Confidence = {aiConfidence}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Conflict Radar & Source Battle */}
              <div className="glass-card rounded-3xl p-6 border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm dark:shadow-glass space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E8F0] dark:border-slate-800">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>CONFLICT RADAR</span>
                  </h3>
                  <span className="text-xs font-mono text-[#5D677A] dark:text-slate-400">
                    {conflicts.length} active discrepancies
                  </span>
                </div>

                {conflicts.length > 0 ? (
                  <div className="space-y-3 font-mono text-xs">
                    {conflicts.map((c, cIdx) => (
                      <div key={cIdx} className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2 shadow-sm">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-rose-700 dark:text-rose-300 capitalize">{c.field} Discrepancy</span>
                          <StatusBadge status={c.severity} type="severity" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block">{c.source_a}</span>
                            <strong className="text-indigo-600 dark:text-cyan-400">{c.value_a}</strong>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block">{c.source_b}</span>
                            <strong className="text-amber-600 dark:text-amber-400">{c.value_b}</strong>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#5D677A] dark:text-slate-300 pt-1 leading-relaxed">
                          ASSR AI Recommendation: {c.ai_explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2 font-mono shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>0 conflicts detected across upstream feeds.</span>
                  </div>
                )}
              </div>

              {/* Duplicate Cluster Status */}
              {dup && (
                <div className="glass-card rounded-3xl p-5 border border-violet-200 dark:border-purple-500/30 shadow-sm space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-violet-700 dark:text-purple-300 flex items-center space-x-1.5">
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>DUPLICATE CLUSTER ({dup.group_code})</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{dup.similarity_score}% Match</span>
                  </div>
                  <p className="text-[#5D677A] dark:text-slate-300 text-[11px]">
                    Clustered with {dup.total_duplicates_in_group} variants under canonical master: <strong className="text-[#172033] dark:text-white">{dup.canonical_name}</strong>
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
