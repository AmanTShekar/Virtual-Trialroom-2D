from celery import Celery
from .config import settings

celery_app = Celery(
    "tryon",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    # NOTE: Do NOT put `include` here — it eagerly imports task modules at app
    # startup (including in the FastAPI process), which crashes the server if
    # any heavy AI dependency (insightface, torch, etc.) fails to import.
    # Tasks are auto-discovered by the Celery worker process instead.
)

celery_app.conf.update(
    task_serializer="json",
    result_expires=3600,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_always_eager=settings.CELERY_TASK_ALWAYS_EAGER,
    task_eager_propagates=settings.CELERY_TASK_EAGER_PROPAGATES,
)
