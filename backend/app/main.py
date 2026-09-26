"""FermaAgent Main FastAPI Application.

Assembles API routers, CORS middleware, and lifecycle configurations.
"""

import logging
from rich.logging import RichHandler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config import settings
from app.ml.service import ml_app

# Configure rich, colorful logging for terminal output
FORMAT = "%(message)s"
logging.basicConfig(
    level=logging.INFO,
    format=FORMAT,
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True, markup=True, show_path=False)]
)

# Silence noisy third-party HTTP and internal ADK logs to keep terminal clean
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("google_adk.google.adk.models.google_llm").setLevel(logging.WARNING)
logging.getLogger("google_adk.google.adk.runners").setLevel(logging.WARNING)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Agentic Commerce crisis resolution engine powered by Google ADK and ML"
    ),
)

# CORS configuration for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount primary agentic commerce API
app.include_router(api_router)

# Mount ML prediction microservice as a sub-app for unified local development
app.mount("/ml", ml_app)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
