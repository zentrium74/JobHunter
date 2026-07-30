"""LiteLLM-backed LLM provider with token budget, caching & cost tracking.

Option 3 — Token Cost Efficiency headroom.

Why LiteLLM:
  - Single unified API for Ollama, OpenAI, Anthropic, Groq, Gemini
  - Built-in prompt caching (exact-match + semantic via Redis optional)
  - Per-call cost logging without extra infra
  - Token budget middleware: hard-stop before blowing per-job call budgets
  - Automatic fallback routing (e.g. Groq when Ollama overloaded)

Token budget defaults (env-overridable):
  LITELLM_MAX_TOKENS_RANK   = 512   # job fit scoring
  LITELLM_MAX_TOKENS_GEN    = 1024  # cover letter / resume sections
  LITELLM_MAX_TOKENS_EVAL   = 256   # DeepEval metric calls
"""

from __future__ import annotations

import os
from typing import Any

import litellm
from litellm import completion

# ── Environment ────────────────────────────────────────────────────────────
_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
_MODEL = os.getenv("LLM_MODEL", "llama3.2")
_OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

_MAX_TOKENS = {
    "rank": int(os.getenv("LITELLM_MAX_TOKENS_RANK", "512")),
    "gen": int(os.getenv("LITELLM_MAX_TOKENS_GEN", "1024")),
    "eval": int(os.getenv("LITELLM_MAX_TOKENS_EVAL", "256")),
}

# Enable LiteLLM's built-in caching (in-memory; swap provider to 'redis' for prod)
litellm.cache = litellm.Cache(type="local")
litellm.success_callback = ["langfuse"] if os.getenv("LANGFUSE_SECRET_KEY") else []


def _model_string() -> str:
    """Return the litellm model string based on provider env var."""
    if _PROVIDER == "ollama":
        return f"ollama/{_MODEL}"
    if _PROVIDER == "anthropic":
        return f"anthropic/{_MODEL}"
    if _PROVIDER == "groq":
        return f"groq/{_MODEL}"
    if _PROVIDER == "gemini":
        return f"gemini/{_MODEL}"
    return _MODEL  # openai passthrough


def _base_kwargs() -> dict[str, Any]:
    kwargs: dict[str, Any] = {"model": _model_string(), "caching": True}
    if _PROVIDER == "ollama":
        kwargs["api_base"] = _OLLAMA_URL
    return kwargs


def call(
    messages: list[dict[str, str]],
    task: str = "gen",
    **overrides: Any,
) -> str:
    """Make a token-budgeted LLM call.

    Args:
        messages: OpenAI-style message list.
        task: One of 'rank' | 'gen' | 'eval' — controls max_tokens budget.
        **overrides: Any litellm.completion kwargs to override defaults.

    Returns:
        The assistant message content string.
    """
    max_tokens = _MAX_TOKENS.get(task, _MAX_TOKENS["gen"])
    kwargs = {**_base_kwargs(), "messages": messages, "max_tokens": max_tokens, **overrides}
    response = litellm.completion(**kwargs)
    return response.choices[0].message.content or ""


def call_with_system(
    system_prompt: str,
    user_prompt: str,
    task: str = "gen",
    **overrides: Any,
) -> str:
    """Convenience wrapper: system + user message → string response."""
    return call(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        task=task,
        **overrides,
    )
