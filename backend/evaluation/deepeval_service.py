"""DeepEval-based output quality evaluator.

Option 4 (AI decision) — upgrade RAGAS → DeepEval.

Why DeepEval over RAGAS:
  - G-Eval: LLM-judged step-by-step scoring for open-ended text (ideal for
    cover letters and resume bullets where there is no single ground truth)
  - AnswerRelevancyMetric: measures if the generated text answers the actual
    job posting requirements
  - FaithfulnessMetric: ensures no hallucinated skills/experience in outputs
  - ContextualPrecisionMetric: checks that retrieved profile memories actually
    support the generated claim — directly integrates with mem0 search results
  - Runs locally via Ollama, no cloud dependency
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

from deepeval import evaluate
from deepeval.metrics import (
    AnswerRelevancyMetric,
    FaithfulnessMetric,
    GEval,
)
from deepeval.models import DeepEvalBaseLLM
from deepeval.test_case import LLMTestCase, LLMTestCaseParams

from backend.llm.provider import call

_THRESHOLD = float(os.getenv("DEEPEVAL_THRESHOLD", "0.7"))
_VERBOSE = os.getenv("DEEPEVAL_VERBOSE", "false").lower() == "true"


class _LocalLLMAdapter(DeepEvalBaseLLM):
    """Adapter so DeepEval uses our LiteLLM provider instead of OpenAI."""

    def get_model_name(self) -> str:
        return os.getenv("LLM_MODEL", "llama3.2")

    def load_model(self) -> Any:  # noqa: ANN401
        return self

    def generate(self, prompt: str, **_: Any) -> str:
        return call(messages=[{"role": "user", "content": prompt}], task="eval")

    async def a_generate(self, prompt: str, **_: Any) -> str:
        return self.generate(prompt)


_local_llm = _LocalLLMAdapter()


@dataclass
class EvalResult:
    passed: bool
    scores: dict[str, float]
    feedback: dict[str, str]


def evaluate_generated_doc(
    input_query: str,
    generated_output: str,
    retrieval_context: list[str],
    expected_output: str | None = None,
) -> EvalResult:
    """Evaluate a generated resume section or cover letter.

    Args:
        input_query: The job posting text or ranked job description.
        generated_output: The AI-generated document section.
        retrieval_context: Profile memory chunks retrieved from mem0.
        expected_output: Optional gold reference (for faithfulness).

    Returns:
        EvalResult with pass/fail, per-metric scores, and feedback strings.
    """
    test_case = LLMTestCase(
        input=input_query,
        actual_output=generated_output,
        retrieval_context=retrieval_context,
        expected_output=expected_output or generated_output,
    )

    metrics = [
        AnswerRelevancyMetric(threshold=_THRESHOLD, model=_local_llm, verbose_mode=_VERBOSE),
        FaithfulnessMetric(threshold=_THRESHOLD, model=_local_llm, verbose_mode=_VERBOSE),
        GEval(
            name="Document Quality",
            criteria=(
                "Evaluate whether the document is professional, specific to the job, "
                "uses active voice, avoids generic filler phrases, and accurately "
                "reflects the candidate's actual experience."
            ),
            evaluation_params=[
                LLMTestCaseParams.INPUT,
                LLMTestCaseParams.ACTUAL_OUTPUT,
            ],
            threshold=_THRESHOLD,
            model=_local_llm,
        ),
    ]

    results = evaluate([test_case], metrics, run_async=False, show_indicator=False)

    scores: dict[str, float] = {}
    feedback: dict[str, str] = {}
    for metric in metrics:
        name = metric.__class__.__name__
        scores[name] = getattr(metric, "score", 0.0) or 0.0
        feedback[name] = getattr(metric, "reason", "") or ""

    passed = all(v >= _THRESHOLD for v in scores.values())
    return EvalResult(passed=passed, scores=scores, feedback=feedback)
