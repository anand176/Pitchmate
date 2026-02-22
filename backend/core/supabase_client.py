"""Supabase client singleton — uses the service-role key for server-side operations."""

import os
from supabase import create_client, Client

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """Return (and lazily initialise) the Supabase client singleton."""
    global _supabase_client
    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_KEY", "")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set."
            )
        _supabase_client = create_client(url, key)
    return _supabase_client
