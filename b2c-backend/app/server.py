from __future__ import annotations

import os
from pathlib import Path

from fastapi.staticfiles import StaticFiles

from .main import app
from .media import MEDIA_ROOT, router as media_router

Path(MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
app.include_router(media_router)
app.mount("/media", StaticFiles(directory=str(MEDIA_ROOT)), name="media")
