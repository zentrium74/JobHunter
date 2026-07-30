"""Smoke tests for Architecture v2 components.

Runs with:  cd backend && uv run pytest tests/test_smoke.py -v

These tests mock external services (mem0, LiteLLM, DeepEval) so the suite
passes in CI without Ollama or Neo4j running.
"""

from __future__ import annotations

import types
import sys
from unittest.mock import MagicMock, patch

import pytest


# ─── helpers to mock heavy optional deps before import ───────────────────────

def _mock_module(name: str) -> MagicMock:
    mod = MagicMock()
    sys.modules[name] = mod
    return mod


# Pre-stub heavy deps so import doesn't require installed packages in CI
for _dep in [
    "mem0",
    "litellm",
    "deepeval",
    "deepeval.metrics",
    "deepeval.models",
    "deepeval.test_case",
]:
    if _dep not in sys.modules:
        _mock_module(_dep)

# ─── mem0 smoke tests ────────────────────────────────────────────────────────

class TestProfileMemorySmoke:
    """Verify ProfileMemory can be constructed and called without errors."""

    def test_ingest_resume_returns_list(self) -> None:
        mock_mem = MagicMock()
        mock_mem.add.return_value = [{"id": "abc", "memory": "Python developer"}]

        with patch("mem0.Memory.from_config", return_value=mock_mem):
            from backend.memory.mem0_service import ProfileMemory

            pm = ProfileMemory(profile_id="test-user")
            result = pm.ingest_resume("I am a Python developer with 5 years experience.")

        assert isinstance(result, list)
        assert result[0]["memory"] == "Python developer"

    def test_search_returns_list(self) -> None:
        mock_mem = MagicMock()
        mock_mem.search.return_value = [{"memory": "MLOps", "score": 0.92}]

        with patch("mem0.Memory.from_config", return_value=mock_mem):
            from backend.memory.mem0_service import ProfileMemory

            pm = ProfileMemory(profile_id="test-user")
            result = pm.search("machine learning operations")

        assert isinstance(result, list)
        assert result[0]["score"] == 0.92

    def test_reset_calls_delete_all(self) -> None:
        mock_mem = MagicMock()
        with patch("mem0.Memory.from_config", return_value=mock_mem):
            from backend.memory.mem0_service import ProfileMemory

            pm = ProfileMemory(profile_id="test-user")
            pm.reset()

        mock_mem.delete_all.assert_called_once_with(user_id="test-user")


# ─── LiteLLM token layer smoke tests ─────────────────────────────────────────

class TestLiteLLMProviderSmoke:
    """Verify LLM provider wrapper applies token budgets correctly."""

    def test_call_passes_max_tokens_for_rank(self) -> None:
        fake_response = MagicMock()
        fake_response.choices[0].message.content = "Score: 87"

        with patch("litellm.completion", return_value=fake_response) as mock_comp:
            with patch("litellm.Cache"):
                from backend.llm.provider import call

                result = call(
                    messages=[{"role": "user", "content": "rank this job"}],
                    task="rank",
                )

        assert result == "Score: 87"
        call_kwargs = mock_comp.call_args[1]
        assert call_kwargs["max_tokens"] == 512  # LITELLM_MAX_TOKENS_RANK default

    def test_call_passes_max_tokens_for_gen(self) -> None:
        fake_response = MagicMock()
        fake_response.choices[0].message.content = "Dear Hiring Manager..."

        with patch("litellm.completion", return_value=fake_response) as mock_comp:
            with patch("litellm.Cache"):
                from backend.llm.provider import call

                result = call(
                    messages=[{"role": "user", "content": "write cover letter"}],
                    task="gen",
                    caching=False,
                )

        assert "Hiring Manager" in result
        call_kwargs = mock_comp.call_args[1]
        assert call_kwargs["max_tokens"] == 1024  # LITELLM_MAX_TOKENS_GEN default


# ─── DeepEval smoke tests ─────────────────────────────────────────────────────

class TestDeepEvalServiceSmoke:
    """Verify DeepEval evaluator returns EvalResult with correct shape."""

    def test_evaluate_returns_evalresult(self) -> None:
        mock_metric_cls = MagicMock()
        mock_metric = MagicMock()
        mock_metric.score = 0.85
        mock_metric.reason = "Well-tailored cover letter."
        mock_metric_cls.return_value = mock_metric
        mock_metric_cls.__name__ = "AnswerRelevancyMetric"

        with patch("deepeval.evaluate", return_value=MagicMock()), \
             patch("deepeval.metrics.AnswerRelevancyMetric", mock_metric_cls), \
             patch("deepeval.metrics.FaithfulnessMetric", mock_metric_cls), \
             patch("deepeval.metrics.GEval", mock_metric_cls), \
             patch("deepeval.test_case.LLMTestCase", MagicMock()), \
             patch("deepeval.test_case.LLMTestCaseParams", MagicMock()), \
             patch("backend.llm.provider.call", return_value="ok"):

            from backend.evaluation.deepeval_service import evaluate_generated_doc

            result = evaluate_generated_doc(
                input_query="Senior AI Engineer at Acme Corp",
                generated_output="I am excited to apply...",
                retrieval_context=["5 years Python", "MLOps experience"],
            )

        assert hasattr(result, "passed")
        assert hasattr(result, "scores")
        assert hasattr(result, "feedback")
        assert isinstance(result.scores, dict)
        assert isinstance(result.feedback, dict)
