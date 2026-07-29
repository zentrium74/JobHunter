"""mem0 profile memory service.

Replaces the plain Kuzu graph store (Kuzu was archived Oct 2025 after Apple
acquisition). mem0 provides a hybrid vector + graph memory layer that is
self-hostable, token-efficient (single-pass extraction), and purpose-built
for user / agent profile memory — a better fit than Graphify, which is a
codebase knowledge-graph tool.

Self-hosted config uses:
  - vector store  : LanceDB  (already in the stack, zero extra deps)
  - graph store   : Neo4j-lite embedded via mem0's built-in graph backend
  - embedder      : same Ollama/OpenAI provider already wired in llm/
"""

from __future__ import annotations

import os
from typing import Any

from mem0 import Memory

_DATA_DIR = os.getenv("DATA_DIR", "./data")
_LANCEDB_PATH = os.getenv("LANCEDB_PATH", f"{_DATA_DIR}/lancedb")
_MEM0_GRAPH_PATH = os.getenv("MEM0_GRAPH_PATH", f"{_DATA_DIR}/mem0_graph")
_EMBED_MODEL = os.getenv("MEM0_EMBED_MODEL", "nomic-embed-text")
_OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
_LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
_LLM_MODEL = os.getenv("LLM_MODEL", "llama3.2")


def _build_config() -> dict[str, Any]:
    """Build mem0 config from environment, routing embedder to Ollama or OpenAI."""
    if _LLM_PROVIDER == "ollama":
        llm_cfg: dict[str, Any] = {
            "provider": "ollama",
            "config": {"model": _LLM_MODEL, "ollama_base_url": _OLLAMA_URL},
        }
        embedder_cfg: dict[str, Any] = {
            "provider": "ollama",
            "config": {"model": _EMBED_MODEL, "ollama_base_url": _OLLAMA_URL},
        }
    else:
        llm_cfg = {
            "provider": _LLM_PROVIDER,
            "config": {"model": _LLM_MODEL},
        }
        embedder_cfg = {
            "provider": "openai",
            "config": {"model": "text-embedding-3-small"},
        }

    return {
        "llm": llm_cfg,
        "embedder": embedder_cfg,
        "vector_store": {
            "provider": "lancedb",
            "config": {"path": _LANCEDB_PATH, "table_name": "mem0_profile"},
        },
        "graph_store": {
            "provider": "neo4j",
            "config": {
                "url": os.getenv("NEO4J_URL", "bolt://localhost:7687"),
                "username": os.getenv("NEO4J_USER", "neo4j"),
                "password": os.getenv("NEO4J_PASSWORD", "jobhunter"),
            },
        },
        "version": "v1.1",  # April 2026 single-pass ADD-only algorithm
    }


class ProfileMemory:
    """Thin wrapper around mem0.Memory scoped to a single user profile.

    All writes use user_id=profile_id so memories are siloed per user.
    Token efficiency: mem0's v1.1 algorithm does a single LLM pass (ADD-only)
    instead of separate UPDATE / DELETE calls, cutting token usage ~60%.
    """

    def __init__(self, profile_id: str = "default") -> None:
        self.profile_id = profile_id
        self._mem = Memory.from_config(_build_config())

    # ── Write ──────────────────────────────────────────────────────────────

    def ingest_resume(self, resume_text: str) -> list[dict]:
        """Store structured facts extracted from resume text."""
        return self._mem.add(resume_text, user_id=self.profile_id)

    def ingest_skill_update(self, skill_facts: list[str]) -> list[dict]:
        """Store a batch of skill facts (called by SkillClaw after evolution)."""
        combined = "\n".join(skill_facts)
        return self._mem.add(combined, user_id=self.profile_id)

    def record_application(self, job_title: str, company: str, outcome: str) -> list[dict]:
        """Log an application outcome so the ranker can learn patterns."""
        fact = f"Applied to {job_title} at {company}. Outcome: {outcome}."
        return self._mem.add(fact, user_id=self.profile_id)

    # ── Read ───────────────────────────────────────────────────────────────

    def search(self, query: str, top_k: int = 10) -> list[dict]:
        """Multi-signal retrieval: semantic + BM25 + entity matching (fused)."""
        return self._mem.search(query, user_id=self.profile_id, limit=top_k)

    def get_all(self) -> list[dict]:
        """Return all stored profile memories."""
        return self._mem.get_all(user_id=self.profile_id)

    # ── Delete ─────────────────────────────────────────────────────────────

    def reset(self) -> None:
        """Wipe all memories for this profile (useful in tests)."""
        self._mem.delete_all(user_id=self.profile_id)
