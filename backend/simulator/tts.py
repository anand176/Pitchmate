"""
ElevenLabs text-to-speech client for the call-practice simulator.

Kept deliberately thin: one function that takes text and returns MP3 bytes.
The API key/voice ID never reach the frontend — the browser only ever calls
our own `/simulator/speak` endpoint, which proxies to ElevenLabs server-side.
"""

from __future__ import annotations

import logging

import httpx

from core.config import config

logger = logging.getLogger("simulator_tts")

_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"


class TTSNotConfigured(RuntimeError):
    """Raised when ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID aren't set."""


async def synthesize_speech(text: str, *, voice_id: str | None = None) -> bytes:
    """
    Convert `text` to MP3 audio bytes via the ElevenLabs REST API.
    Raises `TTSNotConfigured` if no API key is configured, or `RuntimeError`
    on any non-2xx response from ElevenLabs.
    """
    api_key = config.elevenlabs_api_key
    resolved_voice_id = voice_id or config.elevenlabs_voice_id
    if not api_key or not resolved_voice_id:
        raise TTSNotConfigured("ElevenLabs is not configured (missing API key or voice ID).")

    url = _TTS_URL.format(voice_id=resolved_voice_id)
    payload = {
        "text": text,
        "model_id": config.elevenlabs_model_id,
        "voice_settings": {"stability": 0.45, "similarity_boost": 0.75},
    }
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code >= 400:
            logger.error("ElevenLabs TTS failed (%s): %s", resp.status_code, resp.text[:300])
            message = _extract_error_message(resp)
            if resp.status_code == 402:
                raise RuntimeError(
                    "ElevenLabs rejected the request (402 Payment Required): "
                    f"{message} Your ELEVENLABS_VOICE_ID is likely a premium/library voice, which the free "
                    "API tier can't use — open elevenlabs.io -> Voices, pick (or clone) a voice under "
                    "'My Voices' instead of the shared Voice Library, copy its Voice ID, and use that, or "
                    "upgrade your ElevenLabs plan."
                )
            raise RuntimeError(f"ElevenLabs TTS request failed ({resp.status_code}): {message}")
        return resp.content


def _extract_error_message(resp: httpx.Response) -> str:
    """Best-effort pull of ElevenLabs' human-readable error out of its JSON envelope."""
    try:
        data = resp.json()
        detail = data.get("detail")
        if isinstance(detail, dict):
            return detail.get("message") or str(detail)
        return str(detail) if detail else str(data)
    except Exception:
        return resp.text[:300] or f"HTTP {resp.status_code}"
