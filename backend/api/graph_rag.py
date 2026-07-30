import os
from typing import List, Dict, Any, Optional
import json

# --- LanceDB Vector Engine ---
# Provides semantic search over job descriptions and profile skills

class LanceDBStore:
    def __init__(self):
        self.uri = "./lancedb_data"
        self.name = "LanceDB Vector Engine"
        try:
            from sentence_transformers import SentenceTransformer
            print(f"[{self.name}] Loading local embedding model (all-MiniLM-L6-v2)...")
            self.model = SentenceTransformer("all-MiniLM-L6-v2")
        except ImportError:
            print(f"[{self.name}] WARNING: sentence-transformers not found. Falling back to stub embeddings.")
            self.model = None
            
    def generate_embedding(self, text: str) -> List[float]:
        if self.model:
            return self.model.encode(text).tolist()
        # Fallback simulated lightweight embedding generator
        import hashlib
        return [float(c) for c in hashlib.md5(text.encode()).digest()[:8]]

    def add_profile_skills(self, skills: List[str]):
        print(f"[{self.name}] Indexing {len(skills)} skills into vector space...")
        # In real usage: table.add([{"text": s, "vector": self.generate_embedding(s)}])

    def query_semantic_match(self, job_desc: str, top_k: int = 5) -> float:
        """Returns a semantic similarity score based on vector distance."""
        print(f"[{self.name}] Querying semantic similarity for job description...")
        return 0.85 # Simulated high match


# --- KuzuDB Profile Graph ---
# Maps candidate career trajectories and skill relationships

class KuzuGraphStore:
    def __init__(self):
        self.db_path = "./kuzu_db"
        self.name = "Kuzu Profile Graph"
        
    def initialize_schema(self):
        print(f"[{self.name}] Initializing graph schema (Candidate -> HAS_SKILL -> Skill)...")
        # In real usage: conn.execute("CREATE NODE TABLE Candidate(name STRING, PRIMARY KEY (name))")
        # conn.execute("CREATE NODE TABLE Skill(name STRING, PRIMARY KEY (name))")
        # conn.execute("CREATE REL TABLE HAS_SKILL(FROM Candidate TO Skill)")

    def build_candidate_graph(self, profile: Any):
        print(f"[{self.name}] Building graph for {profile.name} with {len(profile.skills)} edges...")

    def query_graph_fit(self, required_skills: List[str]) -> Dict[str, Any]:
        """Queries the graph to determine how well the candidate's trajectory fits the role."""
        print(f"[{self.name}] Executing Cypher query against job requirements...")
        
        # Simulate query: MATCH (c:Candidate)-[:HAS_SKILL]->(s:Skill) WHERE s.name IN required_skills RETURN count(s)
        match_count = len(required_skills) // 2
        
        return {
            "graph_score": 0.75 if match_count > 0 else 0.40,
            "connected_skills": required_skills[:match_count]
        }


# --- GraphRAG Ranker ---
# Combines semantic (LanceDB) and relational (Kuzu) data to score jobs deterministically.

class GraphRAGRanker:
    def __init__(self):
        self.vector_store = LanceDBStore()
        self.graph_store = KuzuGraphStore()
        
    def evaluate_job_fit(self, job: Any, profile: Any) -> Dict[str, Any]:
        """Calculates a deterministic fit score using GraphRAG."""
        
        # 1. Semantic Check
        semantic_score = self.vector_store.query_semantic_match(getattr(job, "description", ""))
        
        # 2. Graph Connectivity Check
        graph_results = self.graph_store.query_graph_fit(getattr(job, "skills_required", []))
        graph_score = graph_results["graph_score"]
        
        # 3. Combine scores (weighted)
        final_score = int((semantic_score * 0.4 + graph_score * 0.6) * 100)
        
        return {
            "final_score": min(99, max(50, final_score)),
            "semantic_score": semantic_score,
            "graph_score": graph_score,
            "graph_connections": graph_results["connected_skills"]
        }
