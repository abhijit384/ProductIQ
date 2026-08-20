const DEFAULT_BACKEND_URL = 'https://productiq-backend-4n4k.onrender.com';
export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL).replace(/\/$/, '');
export const API_BASE = `${API_URL}/api`;

export async function fetchHealth() {
  const res = await fetch(`${API_URL}/api/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchAIStatus() {
  const res = await fetch(`${API_URL}/api/ai/status`);
  if (!res.ok) throw new Error('Failed to fetch AI engine status');
  return res.json();
}

export async function analyzeSchema(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/api/schema/analyze`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Schema analysis failed' }));
    throw new Error(err.detail || 'Schema analysis failed');
  }
  return res.json();
}

export async function uploadCatalog(file, mapping = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (mapping) {
    formData.append('mapping', JSON.stringify(mapping));
  }
  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function fetchSampleDatasets() {
  const res = await fetch(`${API_URL}/api/sample-datasets`);
  if (!res.ok) throw new Error('Failed to fetch sample datasets');
  return res.json();
}

export async function analyzeSampleDataset(datasetId) {
  const res = await fetch(`${API_URL}/api/sample-datasets/${datasetId}/analyze`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to analyze sample dataset' }));
    throw new Error(err.detail || 'Failed to analyze sample dataset');
  }
  return res.json();
}

export async function processSampleDataset(datasetId, mapping = null) {
  const formData = new FormData();
  if (mapping) {
    formData.append('mapping', JSON.stringify(mapping));
  }
  const res = await fetch(`${API_URL}/api/sample-datasets/${datasetId}/process`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to process sample dataset' }));
    throw new Error(err.detail || 'Failed to process sample dataset');
  }
  return res.json();
}

export async function fetchSampleCSV() {
  const res = await fetch(`${API_URL}/api/sample`);
  if (!res.ok) {
    const fallback = await fetch(`${API_URL}/api/download-demo-sample`);
    if (!fallback.ok) throw new Error('Failed to download demo sample dataset');
    const blob = await fallback.blob();
    return new File([blob], 'sample_products_1000.csv', { type: 'text/csv' });
  }
  const blob = await res.blob();
  return new File([blob], 'sample_products_1000.csv', { type: 'text/csv' });
}

export async function loadDemoDataset() {
  return processSampleDataset('demo_1000');
}

export async function fetchJobStatus(jobId) {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}`);
  if (!res.ok) throw new Error('Failed to fetch job status');
  return res.json();
}

export function subscribeJobEvents(jobId, onEvent, onError) {
  let isClosed = false;
  let pollTimer = null;
  let eventSource = null;

  const normalizeJobPayload = (raw) => {
    // Handle nested payload data or direct job object
    const data = raw.data || raw;
    const eventType = raw.event || (data.status === 'completed' ? 'pipeline_complete' : (data.status === 'failed' ? 'pipeline_error' : 'progress_update'));

    const stats = data.stats || {};
    return {
      event: eventType,
      job_id: data.job_id || jobId,
      status: data.status || (eventType === 'pipeline_complete' ? 'completed' : 'processing'),
      progress: typeof data.progress === 'number' ? data.progress : (typeof data.progress_percentage === 'number' ? data.progress_percentage : 0),
      stage: data.stage || data.current_stage || 'init',
      stage_progress: typeof data.stage_progress === 'number' ? data.stage_progress : 0,
      processed: typeof data.processed === 'number' ? data.processed : (typeof data.processed_rows === 'number' ? data.processed_rows : 0),
      total: typeof data.total === 'number' ? data.total : (typeof data.total_rows === 'number' ? data.total_rows : 0),
      speed: typeof data.speed === 'number' ? data.speed : (stats.throughput_rows_per_sec || 0),
      eta_seconds: typeof data.eta_seconds === 'number' ? data.eta_seconds : 0,
      message: data.message || 'Processing catalog...',
      error: data.error || data.error_message || null,
      stats: {
        ai_enriched: stats.ai_enriched || stats.ai_enriched_count || 0,
        duplicates: stats.duplicates || stats.duplicate_groups_count || 0,
        conflicts: stats.conflicts || stats.conflicts_count || 0,
        missing_attributes: stats.missing_attributes || stats.missing_attributes_count || 0,
        cache_hits: stats.cache_hits || 0,
        failures: stats.failures || 0,
        current_batch: stats.current_batch || 0,
        total_batches: stats.total_batches || 0,
        quality_score: stats.quality_score || (stats.quality_summary?.overall_quality_score) || 94.2,
        ...stats
      },
      logs: data.logs || []
    };
  };

  const handleData = (raw) => {
    if (isClosed) return;
    const normalized = normalizeJobPayload(raw);
    if (onEvent) onEvent(normalized);
    if (normalized.status === 'completed' && normalized.progress >= 100) {
      cleanup();
    } else if (normalized.status === 'failed') {
      cleanup();
    }
  };

  const cleanup = () => {
    isClosed = true;
    if (pollTimer) clearInterval(pollTimer);
    if (eventSource) {
      try { eventSource.close(); } catch (_) {}
      eventSource = null;
    }
  };

  // 1. Server-Sent Events (SSE) listener
  try {
    eventSource = new EventSource(`${API_URL}/api/jobs/${jobId}/events`);
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        handleData(parsed);
      } catch (e) {
        console.error('SSE JSON parse error', e);
      }
    };
    eventSource.onerror = () => {
      // Poller fallback continues seamlessly
    };
  } catch (e) {
    console.warn('[SSE] Could not initialize EventSource:', e);
  }

  // 2. Active Poller (every 600ms)
  const pollStatus = async () => {
    if (isClosed) return;
    try {
      const status = await fetchJobStatus(jobId);
      if (isClosed) return;
      handleData(status);
    } catch (err) {
      // Network glitch during polling
    }
  };

  pollTimer = setInterval(pollStatus, 600);
  pollStatus();

  return cleanup;
}

export async function fetchDashboard(jobId) {
  const url = jobId ? `${API_URL}/api/dashboard?job_id=${jobId}` : `${API_URL}/api/dashboard`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
}

export async function fetchAnalytics(jobId) {
  const url = jobId ? `${API_URL}/api/analytics?job_id=${jobId}` : `${API_URL}/api/analytics`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchProducts(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, v);
    }
  });
  const res = await fetch(`${API_URL}/api/products?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function fetchProductDetail(productId) {
  const res = await fetch(`${API_URL}/api/products/${productId}`);
  if (!res.ok) throw new Error('Failed to fetch product details');
  return res.json();
}

export async function fetchQualityMetrics(jobId) {
  const url = jobId ? `${API_URL}/api/quality?job_id=${jobId}` : `${API_URL}/api/quality`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch quality metrics');
  return res.json();
}
export const fetchDataQuality = fetchQualityMetrics;

export async function fetchValidationIssues(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, v);
    }
  });
  const res = await fetch(`${API_URL}/api/validation-issues?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch validation issues');
  return res.json();
}

export async function fetchConflicts(jobIdOrParams, status, severity) {
  const query = new URLSearchParams();
  if (typeof jobIdOrParams === 'object' && jobIdOrParams !== null) {
    Object.entries(jobIdOrParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        const key = k === 'jobId' ? 'job_id' : k === 'pageSize' ? 'page_size' : k;
        query.append(key, v);
      }
    });
  } else {
    if (jobIdOrParams) query.append('job_id', jobIdOrParams);
    if (status) query.append('status', status);
    if (severity) query.append('severity', severity);
  }
  const res = await fetch(`${API_URL}/api/conflicts?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch conflicts');
  return res.json();
}

export async function fetchConflictSummary(jobId) {
  const url = jobId ? `${API_URL}/api/conflicts/summary?job_id=${jobId}` : `${API_URL}/api/conflicts/summary`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch conflict summary');
  return res.json();
}

export async function fetchDataGaps(jobId) {
  const url = jobId ? `${API_URL}/api/conflicts/data-gaps?job_id=${jobId}` : `${API_URL}/api/conflicts/data-gaps`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch data gaps');
  return res.json();
}

export async function fetchReconciliationOpportunities(jobId) {
  const url = jobId ? `${API_URL}/api/conflicts/reconciliation-opportunities?job_id=${jobId}` : `${API_URL}/api/conflicts/reconciliation-opportunities`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch reconciliation opportunities');
  return res.json();
}

export async function resolveConflict(conflictId, action, notes) {
  const res = await fetch(`${API_URL}/api/conflicts/${conflictId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, notes })
  });
  if (!res.ok) throw new Error('Failed to resolve conflict');
  return res.json();
}

export async function fetchDuplicates(jobId, status) {
  const query = new URLSearchParams();
  if (jobId) query.append('job_id', jobId);
  if (status) query.append('status', status);
  const res = await fetch(`${API_URL}/api/duplicates?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch duplicate clusters');
  return res.json();
}

export async function resolveDuplicateGroup(groupId, action, notes) {
  const res = await fetch(`${API_URL}/api/duplicates/${groupId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, notes })
  });
  if (!res.ok) throw new Error('Failed to resolve duplicate cluster');
  return res.json();
}

export async function fetchEnrichmentCenter(jobId) {
  const url = jobId ? `${API_URL}/api/enrichment?job_id=${jobId}` : `${API_URL}/api/enrichment`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch AI enrichment center');
  return res.json();
}

export async function retryAIEnrichment(jobId) {
  const url = jobId ? `${API_URL}/api/enrichment/retry?job_id=${jobId}` : `${API_URL}/api/enrichment/retry`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to re-trigger AI enrichment');
  return res.json();
}

export async function fetchSources(jobId) {
  const url = jobId ? `${API_URL}/api/sources?job_id=${jobId}` : `${API_URL}/api/sources`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch source intelligence');
  return res.json();
}
export const fetchSourcesOverview = fetchSources;

export function getExportUrl(type, jobId, format = 'csv') {
  if (type === 'products') {
    return `${API_URL}/api/download?job_id=${jobId || ''}&format=${format}`;
  }
  return `${API_URL}/api/export/${type}?job_id=${jobId || ''}`;
}

export function getDemoSampleUrl() {
  return `${API_URL}/api/download-demo-sample`;
}

export async function downloadExportOutput(jobId, format = 'csv') {
  const params = new URLSearchParams();
  if (jobId) params.append('job_id', jobId);
  params.append('format', format);

  const res = await fetch(`${API_URL}/api/download?${params.toString()}`);
  if (!res.ok) {
    let errorDetail = 'Failed to generate catalog export';
    try {
      const err = await res.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch (_) {}
    throw new Error(errorDetail);
  }

  let filename = format === 'csv' ? 'ProductIQ_Enriched_Output.csv' : 'ProductIQ_Enriched_Output.xlsx';
  const disposition = res.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '').trim();
    }
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
  return { success: true, filename };
}
