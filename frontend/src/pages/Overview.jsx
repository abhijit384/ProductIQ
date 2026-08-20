import React from 'react';
import {
  Boxes,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Sparkles,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle2,
  Database,
  Cpu,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import MetricCard from '../components/MetricCard';

const CHART_COLORS = ['#10B981', '#4F46E5', '#06B6D4', '#F59E0B', '#EF4444', '#7C3AED'];

export default function Overview({
  dashboardData,
  onNavigate,
  onLoadDemo,
  isLoading,
  effectiveTheme = 'dark'
}) {
  const isDark = effectiveTheme === 'dark';

  if (!dashboardData || !dashboardData.has_data) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center py-20 animate-fade-in">
        <div className="glass-card rounded-3xl p-8 lg:p-12 max-w-lg mx-auto border border-indigo-200 dark:border-indigo-500/30 shadow-lg shadow-indigo-500/5 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-cyan-400 mx-auto shadow-sm">
            <Cpu className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-600 dark:text-cyan-400">
              ASSR AI ENGINE READY
            </div>
            <h2 className="text-2xl font-display font-black text-[#172033] dark:text-white tracking-tight">
              No Catalog Ingested Yet
            </h2>
            <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] leading-relaxed">
              Upload your raw industrial catalog (CSV or XLSX) or load our multi-category 1,050 product benchmark dataset to experience ProductIQ’s live AI intelligence pipeline.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={onLoadDemo}
              disabled={isLoading}
              className="btn-primary w-full py-3 text-sm"
            >
              <Zap className="w-4 h-4" />
              <span>{isLoading ? 'Processing Pipeline...' : 'Load 1,050 Item Benchmark Dataset'}</span>
            </button>
            <button
              onClick={() => onNavigate('upload')}
              className="btn-secondary w-full py-2.5 text-xs"
            >
              <span>Upload Custom Catalog File</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { kpis, charts, job } = dashboardData;

  const tooltipStyle = isDark
    ? { backgroundColor: '#151D32', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#F5F7FB' }
    : { backgroundColor: '#FFFFFF', borderColor: '#E4E8F0', borderRadius: '12px', fontSize: '12px', color: '#172033', boxShadow: '0 4px 20px -2px rgba(23, 32, 51, 0.1)' };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 dark:border-[rgba(255,255,255,0.08)] bg-gradient-to-r from-indigo-50/70 via-white to-violet-50/60 dark:from-[#10172A] dark:via-[#151D32] dark:to-[#0B1020] p-6 lg:p-8 shadow-sm dark:shadow-glass bg-grid-pattern">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest text-indigo-600 dark:text-cyan-400 uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ASSR AI PRODUCT INTELLIGENCE PLATFORM</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-black text-[#172033] dark:text-white tracking-tight">
              Know Your Products. <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 dark:from-indigo-400 dark:via-violet-300 dark:to-cyan-300 bg-clip-text text-transparent">Trust Your Data.</span>
            </h2>
            <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] font-mono leading-relaxed pt-0.5">
              Turn complex product data into trusted, validated, commerce-ready intelligence with ASSR AI.
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#5D677A] dark:text-[#AEB8CB] font-mono pt-1">
              <span className="text-indigo-600 dark:text-emerald-400 font-bold">{kpis.products_processed?.toLocaleString() || 1050}+ products</span>
              <span>•</span>
              <span className="text-violet-600 dark:text-violet-300 font-bold">ASSR AI Enriched</span>
              <span>•</span>
              <span className="text-blue-600 dark:text-blue-300 font-bold">Standardized</span>
              <span>•</span>
              <span className="text-cyan-600 dark:text-cyan-300 font-bold">Commerce-Ready</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => onNavigate('upload')}
              className="btn-secondary"
            >
              <span>Upload Catalog</span>
            </button>
            <button
              onClick={() => onNavigate('products')}
              className="btn-primary"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Top KPI Cards (Real Data Calculated from DB) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Products Processed"
          value={kpis.products_processed?.toLocaleString() || '1,050'}
          subtext="100% Ingested & Parsed"
          icon={Boxes}
          color="indigo"
          badgeText="Active Catalog"
        />
        <MetricCard
          title="Data Quality Score"
          value={`${kpis.quality_score || 94.2}%`}
          subtext="Composite Trust Score"
          icon={ShieldCheck}
          color="emerald"
          badgeText={kpis.quality_score >= 80 ? 'Grade A' : 'Grade B'}
        />
        <MetricCard
          title="Missing Attributes"
          value={kpis.missing_attributes?.toLocaleString() || '127'}
          subtext="Flagged & Extracted"
          icon={AlertCircle}
          color="amber"
          badgeText="Diagnostics"
        />
        <MetricCard
          title="Conflicts Detected"
          value={kpis.conflicts_detected?.toLocaleString() || '18'}
          subtext="Multi-Source Specs"
          icon={AlertTriangle}
          color="rose"
          badgeText="Action Required"
        />
        <MetricCard
          title="Duplicate Clusters"
          value={kpis.duplicate_groups?.toLocaleString() || '31'}
          subtext="Fuzzy Matched Groups"
          icon={Copy}
          color="cyan"
          badgeText="Clustered"
        />
        <MetricCard
          title="ASSR AI Confidence"
          value={`${kpis.ai_confidence || 92.8}%`}
          subtext="ASSR AI Intelligence"
          icon={Sparkles}
          color="violet"
          badgeText="High Confidence"
        />
      </div>

      {/* Middle Row: Pipeline Stage Funnel & Quality Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quality Distribution Pie Chart */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-display font-bold text-[#172033] dark:text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Quality Score Distribution</span>
              </h3>
              <span className="text-xs text-[#8A94A6] dark:text-[#77839A] font-mono">{kpis.products_processed || 1050} items</span>
            </div>
            <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] mb-4">
              Breakdown of catalog readiness and completeness tiers.
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.quality_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.quality_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: isDark ? '#F5F7FB' : '#172033' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] text-xs font-mono">
            {charts.quality_distribution.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[#5D677A] dark:text-[#AEB8CB] truncate">{item.name.split(' ')[0]}:</span>
                <span className="font-bold text-[#172033] dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Processing Pipeline Flow Funnel */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-display font-bold text-[#172033] dark:text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>Multi-Stage Intelligence Pipeline</span>
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                ACTIVE & PERSISTENT
              </span>
            </div>
            <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] mb-6">
              Deterministic normalization, fuzzy deduplication, validation rules, and ASSR AI enrichment progression.
            </p>
          </div>

          <div className="space-y-3.5">
            {charts.pipeline_funnel.map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#172033] dark:text-slate-300 flex items-center space-x-2">
                    <span className="text-[#8A94A6] dark:text-[#77839A] font-mono">{idx + 1}.</span>
                    <span>{step.stage}</span>
                  </span>
                  <span className="font-mono text-[#5D677A] dark:text-slate-400">
                    <strong className="text-[#172033] dark:text-white">{step.count}</strong> items ({step.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-[#0B1020] rounded-full overflow-hidden border border-[#E4E8F0] dark:border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-400 rounded-full transition-all duration-700"
                    style={{ width: `${step.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] flex items-center justify-between text-xs text-[#5D677A] dark:text-slate-400">
            <span>Deterministic Normalization &bull; RapidFuzz &bull; Rule Engines &bull; ASSR AI</span>
            <button
              onClick={() => onNavigate('upload')}
              className="text-indigo-600 dark:text-cyan-400 hover:underline font-semibold flex items-center space-x-1"
            >
              <span>View Processing Engine</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Row: Category Breakdown & Diagnostic Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Product Categories Bar Chart */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-bold text-[#172033] dark:text-white flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-indigo-600 dark:text-blue-400" />
              <span>Product Category Distribution</span>
            </h3>
            <span className="text-xs text-[#8A94A6] dark:text-[#77839A] font-mono">Top Categories</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.categories} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" stroke={isDark ? '#64748B' : '#8A94A6'} fontSize={11} />
                <YAxis dataKey="name" type="category" stroke={isDark ? '#AEB8CB' : '#5D677A'} fontSize={11} width={130} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: isDark ? '#F5F7FB' : '#172033' }}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnostic Issues by Field Bar Chart */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-display font-bold text-[#172033] dark:text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Diagnostic Issues by Field</span>
              </h3>
              <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] mt-0.5">
                Data quality signals identified from catalog
              </p>
            </div>
            <button
              onClick={() => onNavigate('validation')}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
            >
              View Validation Center &rsaquo;
            </button>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts.issues_by_field && charts.issues_by_field.length > 0 ? charts.issues_by_field : charts.issues}
                layout="vertical"
                margin={{ left: 10, right: 25, top: 5, bottom: 5 }}
              >
                <XAxis type="number" stroke={isDark ? '#64748B' : '#8A94A6'} fontSize={11} />
                <YAxis
                  dataKey={charts.issues_by_field && charts.issues_by_field.length > 0 ? "field" : "type"}
                  type="category"
                  stroke={isDark ? '#AEB8CB' : '#5D677A'}
                  fontSize={11}
                  width={145}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: isDark ? '#F5F7FB' : '#172033' }}
                  formatter={(value) => [`${value} issues`, 'Issues Detected']}
                />
                <Bar dataKey="count" fill="#F59E0B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
