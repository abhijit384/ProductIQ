import time
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional

class JobState:
    def __init__(self, job_id: str, filename: str, total: int = 0):
        self.job_id = job_id
        self.filename = filename
        self.status = "queued"  # queued, processing, completed, failed
        self.progress = 0
        self.stage = "init"
        self.stage_progress = 0
        self.processed = 0
        self.total = total
        self.speed = 0.0
        self.eta_seconds = 0.0
        self.message = "Initializing job..."
        self.error = None
        self.start_time = time.time()
        self.stage_start_time = time.time()
        self.last_update_time = time.time()
        self.stats = {
            "ai_enriched": 0,
            "duplicates": 0,
            "conflicts": 0,
            "missing_attributes": 0,
            "ai_requests": 0,
            "cache_hits": 0,
            "failures": 0,
            "current_batch": 0,
            "total_batches": 0
        }
        self.logs: List[Dict[str, str]] = []
        self.add_log(f"Job initialized for {filename}")

    def add_log(self, message: str, level: str = "info"):
        now_str = datetime.now().strftime("%H:%M:%S")
        self.logs.append({
            "time": now_str,
            "message": message,
            "level": level
        })
        # Keep recent 100 log lines
        if len(self.logs) > 100:
            self.logs = self.logs[-100:]

    def update(
        self,
        status: Optional[str] = None,
        progress: Optional[float] = None,
        stage: Optional[str] = None,
        stage_progress: Optional[float] = None,
        processed: Optional[int] = None,
        total: Optional[int] = None,
        message: Optional[str] = None,
        stats_update: Optional[Dict[str, Any]] = None,
        log_msg: Optional[str] = None,
        error: Optional[str] = None
    ):
        now = time.time()
        self.last_update_time = now

        if status is not None:
            self.status = status
        if stage is not None and stage != self.stage:
            self.stage = stage
            self.stage_start_time = now
            self.stage_progress = 0
        if stage_progress is not None:
            self.stage_progress = int(stage_progress)
        if total is not None and total > 0:
            self.total = total
        if processed is not None:
            self.processed = processed

        if progress is not None:
            self.progress = int(round(progress))
        elif self.total > 0 and self.processed > 0:
            # Stage weighted progress fallback
            pass

        if message is not None:
            self.message = message

        if stats_update:
            self.stats.update(stats_update)

        if error is not None:
            self.error = error
            self.status = "failed"
            self.add_log(f"Error: {error}", level="error")

        if log_msg:
            self.add_log(log_msg)

        # Calculate speed & ETA
        elapsed = max(0.05, now - self.start_time)
        if self.processed > 0:
            self.speed = round(self.processed / elapsed, 1)
            if self.total > self.processed and self.speed > 0:
                remaining = self.total - self.processed
                self.eta_seconds = round(remaining / self.speed, 1)
            else:
                self.eta_seconds = 0.0
        else:
            self.speed = 0.0
            self.eta_seconds = 0.0

    def to_dict(self) -> Dict[str, Any]:
        res = {
            "job_id": self.job_id,
            "filename": self.filename,
            "status": self.status,
            "progress": self.progress,
            "progress_percentage": self.progress,
            "stage": self.stage,
            "current_stage": self.stage,
            "stage_progress": self.stage_progress,
            "processed": self.processed,
            "processed_rows": self.processed,
            "total": self.total,
            "total_rows": self.total,
            "speed": self.speed,
            "eta_seconds": self.eta_seconds,
            "message": self.message,
            "stats": self.stats,
            "logs": self.logs,
            "updated_at": datetime.utcnow().isoformat()
        }
        if self.error:
            res["error"] = self.error
        return res


class JobManager:
    def __init__(self):
        self.jobs: Dict[str, JobState] = {}
        self.event_queues: Dict[str, List[asyncio.Queue]] = {}

    def create_job(self, job_id: str, filename: str, total: int = 0) -> JobState:
        state = JobState(job_id=job_id, filename=filename, total=total)
        self.jobs[job_id] = state
        return state

    def get_job(self, job_id: str) -> Optional[JobState]:
        return self.jobs.get(job_id)

    def subscribe(self, job_id: str) -> asyncio.Queue:
        q = asyncio.Queue()
        if job_id not in self.event_queues:
            self.event_queues[job_id] = []
        self.event_queues[job_id].append(q)
        return q

    def unsubscribe(self, job_id: str, q: asyncio.Queue):
        if job_id in self.event_queues and q in self.event_queues[job_id]:
            self.event_queues[job_id].remove(q)

    def publish_event(self, job_id: str, event_type: str, data: Dict[str, Any]):
        if job_id in self.event_queues:
            payload = {
                "event": event_type,
                "data": data,
                "timestamp": datetime.utcnow().isoformat()
            }
            for q in self.event_queues[job_id]:
                try:
                    q.put_nowait(payload)
                except Exception:
                    pass

    def update_and_publish(
        self,
        job_id: str,
        event_type: str = "progress_update",
        **kwargs
    ):
        job = self.get_job(job_id)
        if not job:
            return
        job.update(**kwargs)
        job_data = job.to_dict()
        self.publish_event(job_id, event_type, job_data)


# Global Singleton JobManager
job_manager = JobManager()
