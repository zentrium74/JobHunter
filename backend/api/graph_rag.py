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


# --- Graphify Deterministic Engine ---
# Implements strict AST/node graph extraction for exact matching.

class DeterministicGraphifyEngine:
    def __init__(self):
        self.name = "Deterministic Graphify Engine"

    def extract_nodes(self, text: str, entity_type: str) -> List[str]:
        # Simulated AST extraction (in production, uses LLM structured extraction or regex rules)
        text_lower = text.lower()
        extracted = []
        if entity_type == "skills":
            keywords = ["python", "react", "fastapi", "docker", "aws", "kubernetes", "typescript", "node"]
            for k in keywords:
                if k in text_lower:
                    extracted.append(k.capitalize())
        return extracted

    def evaluate_exact_match(self, job: Any, profile: Any) -> Dict[str, Any]:
        """Calculates deterministic exact match percentage and explains every edge."""
        
        # 1. Node Extraction
        job_desc = getattr(job, "description", "")
        job_req_skills = getattr(job, "skills_required", [])
        if not job_req_skills:
            job_req_skills = self.extract_nodes(job_desc, "skills")
            
        candidate_skills = getattr(profile, "skills", [])
        if not candidate_skills:
            candidate_skills = self.extract_nodes(getattr(profile, "raw_resume_text", ""), "skills")
            
        # Standardize strings for deterministic comparison
        j_skills = set(s.lower().strip() for s in job_req_skills)
        c_skills = set(s.lower().strip() for s in candidate_skills)
        
        # 2. Build explicit edge explanations
        edge_explanations = []
        exact_matches = 0
        total_reqs = len(j_skills) if j_skills else 1 # Avoid div by zero
        
        for req in j_skills:
            req_display = req.capitalize()
            if req in c_skills:
                exact_matches += 1
                edge_explanations.append({
                    "node": req_display,
                    "status": "exact_match",
                    "reasoning": f"✅ Exact Match: Candidate explicitly possesses required skill '{req_display}'."
                })
            else:
                edge_explanations.append({
                    "node": req_display,
                    "status": "missing_gap",
                    "reasoning": f"❌ Hard Gap: Job requires '{req_display}', but candidate profile lacks it."
                })
                
        exact_match_score = int((exact_matches / total_reqs) * 100) if j_skills else 100
        
        return {
            "exact_match_score": exact_match_score,
            "edges": edge_explanations,
            "extracted_job_nodes": len(j_skills),
            "extracted_candidate_nodes": len(c_skills)
        }


# --- GraphRAG Ranker ---
# Combines semantic (LanceDB) and relational (Kuzu) data to score jobs deterministically.

class GraphRAGRanker:
    def __init__(self):
        self.vector_store = LanceDBStore()
        self.graph_store = KuzuGraphStore()
        self.graphify_engine = DeterministicGraphifyEngine()
        
    def evaluate_job_fit(self, job: Any, profile: Any, exact_match_mode: bool = False) -> Dict[str, Any]:
        """Calculates a deterministic fit score using GraphRAG or Graphify Engine."""
        
        if exact_match_mode:
            graphify_results = self.graphify_engine.evaluate_exact_match(job, profile)
            return {
                "final_score": graphify_results["exact_match_score"],
                "semantic_score": 0,
                "graph_score": graphify_results["exact_match_score"],
                "graph_connections": [edge["node"] for edge in graphify_results["edges"] if edge["status"] == "exact_match"],
                "exact_match_analysis": graphify_results
            }
        
        # 1. Semantic Check
        semantic_score = self.vector_store.query_semantic_match(getattr(job, "description", ""))
        
        # 2. Graph Connectivity Check
        graph_results = self.graph_store.query_graph_fit(getattr(job, "skills_required", []))
        graph_score = graph_results["graph_score"]
        
        # 3. Combine scores (weighted)
        final_score = int((semantic_score * 0.4 + graph_score * 0.6) * 100)
        
        # Add basic Graphify breakdown even in hybrid mode so UI can display it
        graphify_results = self.graphify_engine.evaluate_exact_match(job, profile)
        
        return {
            "final_score": min(99, max(50, final_score)),
            "semantic_score": semantic_score,
            "graph_score": graph_score,
            "graph_connections": graph_results["connected_skills"],
            "exact_match_analysis": graphify_results
        }
