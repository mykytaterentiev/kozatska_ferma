"""Core configuration and settings for FermaAgent."""

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(ENV_PATH)


class Settings:
    """Application configuration settings."""

    PROJECT_NAME: str = "FermaAgent Autonomous Commerce API"
    VERSION: str = "1.0.0"

    SUPABASE_URL: str = os.getenv(
        "SUPABASE_URL", "https://gybkptbjpilrvuxedpfb.supabase.co"
    )
    SUPABASE_KEY: str = os.getenv(
        "SUPABASE_KEY", "sb_publishable_Y6hVK2wptyseUKVToFa86Q_OXJa0K2f"
    )

    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

    # Vertex AI configuration
    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    GOOGLE_CLOUD_LOCATION: str = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

    # ML Microservice configuration (e.g. Railway URL)
    ML_SERVICE_URL: str = os.getenv("ML_SERVICE_URL", "http://localhost:8001")


settings = Settings()
