"""FermaAgent Main FastAPI Application.

Assembles API routers, CORS middleware, and lifecycle configurations.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config import settings
from app.ml.service import ml_app

# Configure global logging for terminal output
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

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
