import React, { useState, useEffect } from 'react';
import {
  Copy,
  CheckCircle2,
  GitMerge,
  Filter,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { fetchDuplicates, resolveDuplicateGroup } from '../services/api';

export default function Duplicates({ jobId, effectiveTheme = 'dark' }) {
  const [groups, setGroups] = useState([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [pendingGroups, setPendingGroups] = useState(0);
  const [mergedGroups, setMergedGroups] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetchDuplicates(jobId, selectedStatus);
      setGroups(res.groups || []);
      setTotalGroups(res.total_groups || 0);
      setPendingGroups(res.pending_groups || 0);
      setMergedGroups(res.merged_groups || 0);
    } catch (err) {
      console.error('Failed to load duplicate groups', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) {
      setGroups([]);
      setTotalGroups(0);
      setPendingGroups(0);
      setMergedGroups(0);
      return;
    }
    loadData();
  }, [jobId, selectedStatus]);

  if (!jobId) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20 animate-fade-in">
        <div className="glass-card rounded-3xl p-8 lg:p-12 border border-[#E4E8F0] dark:border-slate-800 shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-purple-500/10 border border-violet-200 dark:border-purple-500/30 flex items-center justify-center text-violet-600 dark:text-purple-400 mx-auto shadow-sm">
            <Copy className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display font-black text-[#172033] dark:text-white">
              No Active Dataset
            </h3>
            <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] leading-relaxed">
              Upload an industrial catalog or load the demo dataset to view fuzzy-matched duplicate clusters and merge variants.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleResolveGroup = async (groupId, action) => {
    try {
      setActionLoadingId(groupId);
      await resolveDuplicateGroup(groupId, action);
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, status: action } : g))
      );
      if (action === 'merged') {
        setMergedGroups((prev) => prev + 1);
        setPendingGroups((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to resolve duplicate group', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest text-violet-600 dark:text-purple-400 uppercase mb-1">
            <Copy className="w-4 h-4" />
            <span>FUZZY CLUSTERING & DEDUPLICATION</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-display font-black text-[#172033] dark:text-white tracking-tight">
            Duplicate Clusters & SKU Merging
          </h2>
          <p className="text-xs text-[#5D677A] dark:text-[#AEB8CB] mt-1 max-w-2xl leading-relaxed">
            RapidFuzz and n-gram token clustering identified <strong className="text-[#172033] dark:text-white font-mono">{totalGroups}</strong> duplicate clusters with heterogeneous OEM part numbers.
          </p>
        </div>

        {/* Counts summary pill */}
        <div className="flex items-center space-x-3 bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] p-2 rounded-2xl text-xs font-mono shadow-sm">
          <span className="text-violet-700 dark:text-purple-300 font-bold px-3 py-1.5 bg-violet-50 dark:bg-purple-500/10 rounded-xl border border-violet-200 dark:border-purple-500/30">
            {pendingGroups} Pending
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
            {mergedGroups} Merged
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-card border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] flex items-center space-x-4 text-xs shadow-sm">
        <div className="flex items-center space-x-1.5 text-[#5D677A] dark:text-slate-400 font-mono font-bold uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
          <span>Status Filter:</span>
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#10172A] border border-[#E4E8F0] dark:border-slate-700 text-[#172033] dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500 shadow-sm"
        >
          <option value="All">All Clusters</option>
          <option value="pending">Pending Merge / Review</option>
          <option value="merged">Merged Clusters</option>
          <option value="ignored">Ignored / Distinct</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>

      {/* Duplicate Groups List */}
      {isLoading ? (
        <div className="text-center py-20 text-[#5D677A] dark:text-slate-400">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-mono">Scanning duplicate clusters...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center border border-[#E4E8F0] dark:border-slate-800 shadow-sm max-w-xl mx-auto space-y-3">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 dark:text-emerald-400 mx-auto" />
          <h3 className="text-lg font-display font-bold text-[#172033] dark:text-white">No Duplicate Clusters Found</h3>
          <p className="text-xs text-[#5D677A] dark:text-slate-400">All products in the current catalog have unique identifiers and distinct attributes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isMerged = group.status === 'merged';
            const isActing = actionLoadingId === group.id;

            return (
              <div
                key={group.id}
                className="glass-card rounded-2xl p-6 border border-[#E4E8F0] dark:border-[rgba(255,255,255,0.08)] shadow-sm dark:shadow-glass space-y-4"
              >
                {/* Group Code & Canonical Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4E8F0] dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 rounded-xl bg-violet-50 dark:bg-purple-500/15 text-violet-700 dark:text-purple-300 font-mono text-xs font-bold border border-violet-200 dark:border-purple-500/30">
                      {group.group_code}
                    </span>
                    <span className="text-base font-display font-bold text-[#172033] dark:text-white">
                      {group.canonical_name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                      {group.similarity_score}% Match
                    </span>
                    <StatusBadge status={group.status} />
                  </div>
                </div>

                {/* Member Comparison List */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#5D677A] dark:text-slate-400">
                    Matched Products in Cluster ({group.members.length}):
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {group.members.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-[#E4E8F0] dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm"
                      >
                        <div className="space-y-1 max-w-xl">
                          <div className="font-semibold text-[#172033] dark:text-white flex items-center space-x-2">
                            <span>{m.product_name}</span>
                            {idx === 0 && (
                              <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-blue-500/20 text-indigo-700 dark:text-cyan-300 text-[10px] uppercase font-mono font-bold border border-indigo-200 dark:border-cyan-500/30">
                                Canonical
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#5D677A] dark:text-slate-400 font-mono flex items-center space-x-2">
                            <span>ID: {m.product_external_id}</span>
                            <span>•</span>
                            <span>Model: {m.model_number || 'N/A'}</span>
                            <span>•</span>
                            <span>Brand: {m.brand}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-[#172033] dark:text-slate-300 text-xs font-mono">
                          {m.price && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {m.currency} {m.price}
                            </span>
                          )}
                          <span className="text-[#5D677A] dark:text-slate-400">
                            {m.power || m.voltage || 'Standard'}
                          </span>
                          <span className="px-2.5 py-1 rounded bg-white dark:bg-[#0B101D] text-[11px] text-[#172033] dark:text-slate-300 border border-[#E4E8F0] dark:border-slate-800 font-bold shadow-sm">
                            {m.similarity_score}% Sim
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-[#E4E8F0] dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#5D677A] dark:text-slate-400">
                    Resolution Actions:
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleResolveGroup(group.id, 'merged')}
                      disabled={isActing}
                      className={`btn-primary text-xs px-4 py-2 ${
                        isMerged ? 'bg-emerald-600' : ''
                      }`}
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>{isMerged ? 'Merged into Canonical' : 'Merge Cluster'}</span>
                    </button>

                    <button
                      onClick={() => handleResolveGroup(group.id, 'ignored')}
                      disabled={isActing}
                      className="btn-secondary"
                    >
                      Ignore / Keep Distinct
                    </button>

                    <button
                      onClick={() => handleResolveGroup(group.id, 'reviewed')}
                      disabled={isActing}
                      className="btn-ghost text-xs"
                    >
                      Mark Reviewed
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
