"""
Pytest configuration for the backend test suite.

Loads environment variables from .env before any test module is imported, since
agent modules read API keys (GOOGLE_API_KEY/GEMINI_API_KEY, SERPAPI_API_KEY, etc.)
at import time.
"""
import os

from dotenv import load_dotenv

load_dotenv()

# Keep pytest runs free of MLflow side effects unless explicitly testing tracking.
os.environ.setdefault("MLFLOW_ENABLED", "false")
