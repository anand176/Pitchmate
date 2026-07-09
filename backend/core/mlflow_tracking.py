"""
MLflow observability for Pitchmate agents and LLM workflows.

Tracks:
  - Chat orchestrator / sub-agent runs (LangGraph via callbacks + request-level runs)
  - Dashboard tab structured LLM completions
  - Knowledge-base uploads and vector searches

Enable with MLFLOW_ENABLED=true and optionally MLFLOW_TRACKING_URI
(defaults to file:./mlruns). Set MLFLOW_LOG_INPUTS=true to log truncated
prompts/responses (off by default for privacy).
"""

from __future__ import annotations

import json
import logging
import os
import time
from contextlib import asynccontextmanager
from typing import Any

from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.messages import BaseMessage
from langchain_core.outputs import LLMResult

logger = logging.getLogger("mlflow_tracking")

_initialized = False
_active = False

# Per-request callback stats (keyed by MLflow run id when available).
_run_stats: dict[str, dict[str, Any]] = {}


def is_mlflow_enabled() -> bool:
    """Return True when MLflow tracking should run."""
    flag = os.environ.get("MLFLOW_ENABLED", "").strip().lower()
    if flag in ("0", "false", "no", "off"):
        return False
    if flag in ("1", "true", "yes", "on"):
        return True
    # Auto-enable when a tracking URI is explicitly configured.
    return bool(os.environ.get("MLFLOW_TRACKING_URI", "").strip())


def _log_inputs_enabled() -> bool:
    return os.environ.get("MLFLOW_LOG_INPUTS", "").strip().lower() in ("1", "true", "yes", "on")


def _truncate(text: str, limit: int = 500) -> str:
    text = (text or "").strip()
    if len(text) <= limit:
        return text
    return text[: limit - 3] + "..."


def init_mlflow() -> None:
    """Configure MLflow experiment and optional LangChain autolog (call once at startup)."""
    global _initialized, _active
    if _initialized:
        return
    _initialized = True

    if not is_mlflow_enabled():
        logger.info("MLflow tracking disabled (set MLFLOW_ENABLED=true to enable)")
        return

    try:
        import mlflow

        tracking_uri = os.environ.get("MLFLOW_TRACKING_URI", "file:./mlruns")
        experiment = os.environ.get("MLFLOW_EXPERIMENT_NAME", "pitchmate-agents")

        mlflow.set_tracking_uri(tracking_uri)
        mlflow.set_experiment(experiment)

        try:
            from mlflow.langchain import autolog

            autolog(log_models=False, silent=True)
        except Exception as exc:  # noqa: BLE001
            logger.warning("MLflow LangChain autolog unavailable: %s", exc)

        _active = True
        logger.info("MLflow tracking enabled (uri=%s, experiment=%s)", tracking_uri, experiment)
    except Exception as exc:  # noqa: BLE001
        logger.warning("MLflow init failed — tracking disabled: %s", exc)
        _active = False


def mlflow_is_active() -> bool:
    """True when init_mlflow() succeeded and tracking is on."""
    return _active


@asynccontextmanager
async def track_run(
    run_name: str,
    *,
    run_type: str,
    params: dict[str, Any] | None = None,
    tags: dict[str, str] | None = None,
):
    """
    Async context manager wrapping one logical request (agent chat, dashboard tab, KB upload).
    Logs latency, status, and optional params/tags to the active MLflow run.
    """
    if not _active:
        yield None
        return

    import mlflow

    merged_tags = {"run_type": run_type, **(tags or {})}
    safe_params = {k: _truncate(str(v), 250) for k, v in (params or {}).items()}

    start = time.perf_counter()
    status = "success"
    error_msg: str | None = None

    with mlflow.start_run(run_name=run_name) as run:
        mlflow.set_tags(merged_tags)
        if safe_params:
            mlflow.log_params(safe_params)

        run_id = run.info.run_id
        _run_stats[run_id] = {"llm_calls": 0, "tool_calls": 0, "tools": []}

        try:
            yield run
        except Exception as exc:
            status = "failed"
            error_msg = _truncate(str(exc), 500)
            raise
        finally:
            elapsed_ms = (time.perf_counter() - start) * 1000
            mlflow.log_metric("latency_ms", elapsed_ms)
            mlflow.set_tag("status", status)
            if error_msg:
                mlflow.set_tag("error", error_msg)

            stats = _run_stats.pop(run_id, {})
            if stats.get("llm_calls"):
                mlflow.log_metric("llm_calls", stats["llm_calls"])
            if stats.get("tool_calls"):
                mlflow.log_metric("tool_calls", stats["tool_calls"])
            if stats.get("tools"):
                mlflow.log_dict({"tools": stats["tools"]}, "tool_calls.json")


def log_metric(name: str, value: float) -> None:
    if not _active:
        return
    import mlflow

    mlflow.log_metric(name, value)


def log_params(params: dict[str, Any]) -> None:
    if not _active:
        return
    import mlflow

    mlflow.log_params({k: _truncate(str(v), 250) for k, v in params.items()})


def log_text_artifact(text: str, filename: str) -> None:
    if not _active or not _log_inputs_enabled():
        return
    import mlflow

    mlflow.log_text(_truncate(text, 4000), filename)


class MLflowCallbackHandler(BaseCallbackHandler):
    """
    LangChain callback that records LLM/tool activity into the active MLflow run.
    Attach at invoke time (see langgraph_runner.run_agent).
    """

    def __init__(self, agent_name: str = "agent"):
        super().__init__()
        self.agent_name = agent_name
        self.llm_calls = 0
        self.tool_calls = 0
        self.tools: list[str] = []
        self._llm_latencies_ms: list[float] = []
        self._llm_start: float | None = None

    def _current_run_id(self) -> str | None:
        if not _active:
            return None
        try:
            import mlflow

            run = mlflow.active_run()
            return run.info.run_id if run else None
        except Exception:  # noqa: BLE001
            return None

    def _bump(self, field: str, tool_name: str | None = None) -> None:
        run_id = self._current_run_id()
        if not run_id:
            return
        bucket = _run_stats.setdefault(run_id, {"llm_calls": 0, "tool_calls": 0, "tools": []})
        if field == "llm_calls":
            bucket["llm_calls"] += 1
        elif field == "tool_calls":
            bucket["tool_calls"] += 1
            if tool_name:
                bucket["tools"].append(tool_name)

    def on_llm_start(
        self,
        serialized: dict[str, Any],
        prompts: list[str],
        **kwargs: Any,
    ) -> None:
        self._llm_start = time.perf_counter()
        if _log_inputs_enabled() and prompts:
            log_text_artifact("\n---\n".join(prompts), f"llm_input_{self.agent_name}_{self.llm_calls}.txt")

    def on_chat_model_start(
        self,
        serialized: dict[str, Any],
        messages: list[list[BaseMessage]],
        **kwargs: Any,
    ) -> None:
        self._llm_start = time.perf_counter()
        if _log_inputs_enabled() and messages:
            flat = []
            for batch in messages:
                for msg in batch:
                    role = getattr(msg, "type", "message")
                    flat.append(f"[{role}] {getattr(msg, 'content', msg)}")
            log_text_artifact("\n".join(flat), f"chat_input_{self.agent_name}_{self.llm_calls}.txt")

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        self.llm_calls += 1
        self._bump("llm_calls")
        if self._llm_start is not None:
            self._llm_latencies_ms.append((time.perf_counter() - self._llm_start) * 1000)
            self._llm_start = None
        if _log_inputs_enabled():
            chunks = []
            for gen_list in response.generations:
                for gen in gen_list:
                    chunks.append(getattr(gen, "text", str(gen)))
            log_text_artifact("\n".join(chunks), f"llm_output_{self.agent_name}_{self.llm_calls}.txt")

    def on_llm_error(self, error: BaseException, **kwargs: Any) -> None:
        if _active:
            import mlflow

            mlflow.set_tag("llm_error", _truncate(str(error), 300))

    def on_tool_start(
        self,
        serialized: dict[str, Any],
        input_str: str,
        **kwargs: Any,
    ) -> None:
        self.tool_calls += 1
        tool_name = serialized.get("name", "unknown")
        self.tools.append(tool_name)
        self._bump("tool_calls", tool_name)
        if _log_inputs_enabled():
            log_text_artifact(input_str, f"tool_input_{tool_name}_{self.tool_calls}.txt")

    def on_tool_end(self, output: str, **kwargs: Any) -> None:
        if _log_inputs_enabled():
            log_text_artifact(str(output), f"tool_output_{self.tool_calls}.txt")

    def on_tool_error(self, error: BaseException, **kwargs: Any) -> None:
        if _active:
            import mlflow

            mlflow.set_tag("tool_error", _truncate(str(error), 300))

    def summary(self) -> dict[str, Any]:
        avg_llm_ms = (
            sum(self._llm_latencies_ms) / len(self._llm_latencies_ms)
            if self._llm_latencies_ms
            else 0.0
        )
        return {
            "llm_calls": self.llm_calls,
            "tool_calls": self.tool_calls,
            "tools": self.tools,
            "avg_llm_latency_ms": avg_llm_ms,
        }

    def flush_summary_metrics(self) -> None:
        """Log per-request callback aggregates onto the active run."""
        if not _active:
            return
        summary = self.summary()
        log_metric("callback_llm_calls", summary["llm_calls"])
        log_metric("callback_tool_calls", summary["tool_calls"])
        if summary["avg_llm_latency_ms"]:
            log_metric("avg_llm_latency_ms", summary["avg_llm_latency_ms"])
        if summary["tools"]:
            import mlflow

            mlflow.log_dict(summary, "agent_callback_summary.json")
