"""
Pitchmate application configuration.
Reads from environment variables with sensible defaults.
"""

import os
from dataclasses import dataclass, field


@dataclass
class AgentsConfig:
    """Model configuration per agent."""

    # Default Gemini model — override per agent via PITCHMATE_MODEL or per-agent env vars.
    # Use Gemini 3.x (e.g. gemini-3.5-flash); requires langchain-google-genai>=3.1 for tool loops.
    _default_model: str = field(
        default_factory=lambda: os.environ.get("PITCHMATE_MODEL", "gemini-3.5-flash")
    )

    def get_model_for_agent(self, agent_name: str) -> str:
        """
        Return the Gemini model to use for *agent_name*.
        Priority: {AGENT_NAME_UPPER}_MODEL env var → PITCHMATE_MODEL → gemini-3.5-flash
        """
        env_key = f"{agent_name.upper()}_MODEL"
        return os.environ.get(env_key, self._default_model)


@dataclass
class Config:
    agents: AgentsConfig = field(default_factory=AgentsConfig)

    @property
    def artifacts_root_dir(self) -> str:
        return os.environ.get("ARTIFACTS_ROOT_DIR", "./artifacts")

    def get_database_url(self) -> str | None:
        """Return the database URL for ADK session persistence, or None for in-memory."""
        return os.environ.get("DATABASE_URL")

    # ── ElevenLabs (sales call Q&A simulator voice) ──────────────────────────
    @property
    def elevenlabs_api_key(self) -> str | None:
        return os.environ.get("ELEVENLABS_API_KEY") or None

    @property
    def elevenlabs_voice_id(self) -> str | None:
        """Default voice for the simulator's persona. Overridable per-request."""
        return os.environ.get("ELEVENLABS_VOICE_ID") or None

    @property
    def elevenlabs_model_id(self) -> str:
        return os.environ.get("ELEVENLABS_MODEL_ID", "eleven_turbo_v2_5")

    @property
    def voice_simulator_enabled(self) -> bool:
        return bool(self.elevenlabs_api_key and self.elevenlabs_voice_id)


# Singleton config instance
config = Config()
