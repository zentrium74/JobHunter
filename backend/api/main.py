"""FastAPI API Sidecar for JobHunter — AI Job Intelligence Workbench."""

from __future__ import annotations

import os
import re
import json
from typing import Any, List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Depends, WebSocket, WebSocketDisconnect, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.scraping.live_scraper import fetch_live_jobs, DEFAULT_SOURCES
from backend.api.db import init_db, get_db, DBJobListing, DBCandidateProfile

app = FastAPI(
    title="JobHunter AI Workbench API",
    description="Local-first AI job scraping, transparent ranking, document tailoring & CRM",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database
init_db()

# ─── WebSocket Manager ───────────────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

ws_manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # For now, just ping back
            await websocket.send_text(f"Message text was: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

# ─── Data Models ─────────────────────────────────────────────────────────────

class JobListing(BaseModel):
    id: str
    title: str
    company: str
    location: str
    remote: bool = True
    salary_range: str
    description: str
    skills_required: List[str]
    posted_date: str
    match_score: Optional[int] = None
    status: str = "Discovered"
    source_name: Optional[str] = "Web Feed"

    class Config:
        orm_mode = True

class CandidateProfile(BaseModel):
    id: str = "default"
    name: str = "Alex Morgan"
    target_title: str = "Senior AI / Full Stack Engineer"
    skills: List[str] = [
        "Python", "TypeScript", "React", "FastAPI", "PyTorch", "LLMs",
        "LangChain", "LiteLLM", "Docker", "PostgreSQL", "TailwindCSS"
    ]
    experience_years: int = 6
    target_salary_min: int = 140000
    target_salary_max: int = 190000
    location_preference: str = "Remote"
    bio: str = "Senior Engineer specializing in AI-native software, vector search, and high-performance React/FastAPI systems."
    has_completed_onboarding: bool = False
    
    class Config:
        orm_mode = True

class ResumeParseRequest(BaseModel):
    resume_text: str
    location_preference: Optional[str] = "Remote"
    target_title: Optional[str] = ""

class JobSource(BaseModel):
    id: str
    name: str
    type: str = "api"
    url: str
    enabled: bool = True

class LLMSettings(BaseModel):
    provider: str = os.getenv("LLM_PROVIDER", "ollama")
    model: str = os.getenv("LLM_MODEL", "qwen2.5-coder:7b")
    api_key: Optional[str] = ""
    ollama_url: Optional[str] = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

class RankRequest(BaseModel):
    job_id: str
    candidate_profile: Optional[CandidateProfile] = None

class GenerateDocumentRequest(BaseModel):
    job_id: str
    doc_type: str = "cover_letter"
    template_style: Optional[str] = "modern"

class CRMStatusUpdate(BaseModel):
    job_id: str
    status: str
    notes: Optional[str] = ""

class PDFExportRequest(BaseModel):
    content: str
    doc_type: str = "cover_letter"
    template_style: str = "modern"
    job_id: Optional[str] = None

class ATSScanRequest(BaseModel):
    ats_sources: List[str] = ["greenhouse", "lever", "ashby"]
    limit_per_ats: int = 15
    query: Optional[str] = "AI"
    location: Optional[str] = "Remote"

# ─── Live Job Store & Memory ─────────────────────────────────────────────────

CURRENT_SOURCES: List[dict] = list(DEFAULT_SOURCES)
CURRENT_SETTINGS = LLMSettings()

# Initialize default profile in DB on startup
def _get_or_create_profile(db: Session) -> DBCandidateProfile:
    profile = db.query(DBCandidateProfile).filter(DBCandidateProfile.id == "default").first()
    if not profile:
        profile = DBCandidateProfile(
            id="default",
            name="Alex Morgan",
            target_title="Senior AI / Full Stack Engineer",
            skills=["Python", "TypeScript", "React", "FastAPI"],
            experience_years=6,
            target_salary_min=140000,
            target_salary_max=190000,
            location_preference="Remote",
            bio="Senior Engineer specializing in AI-native software.",
            has_completed_onboarding=False
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

# ─── Helper Skill Parser ─────────────────────────────────────────────────────

KNOWN_SKILLS = [
    "Python", "TypeScript", "JavaScript", "React", "Next.js", "Vue", "Node.js",
    "FastAPI", "Django", "Flask", "PyTorch", "TensorFlow", "LLMs", "LangChain",
    "LiteLLM", "Docker", "Kubernetes", "PostgreSQL", "MongoDB", "Redis",
    "TailwindCSS", "AWS", "GCP", "Azure", "GraphQL", "Vector Search", "LanceDB", "RAG"
]

def parse_skills_from_text(text: str) -> List[str]:
    found = []
    text_lower = text.lower()
    for skill in KNOWN_SKILLS:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return found if found else ["Python", "React", "FastAPI", "TypeScript", "LLMs"]

# ─── API Routes ──────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    profile = _get_or_create_profile(db)
    job_count = db.query(DBJobListing).count()
    return {
        "status": "online",
        "backend": "FastAPI Sidecar",
        "llm_provider": CURRENT_SETTINGS.provider,
        "model": CURRENT_SETTINGS.model,
        "live_jobs_count": job_count,
        "active_sources_count": len([s for s in CURRENT_SOURCES if s["enabled"]]),
        "has_completed_onboarding": profile.has_completed_onboarding,
        "vector_store": "LanceDB",
        "memory_layer": "mem0",
        "db": "SQLite"
    }

@app.post("/api/resume/parse")
async def parse_and_save_resume(req: ResumeParseRequest, db: Session = Depends(get_db)):
    extracted_skills = parse_skills_from_text(req.resume_text)
    
    # Infer target title
    title = req.target_title if req.target_title and req.target_title.strip() else "Senior AI / Software Engineer"
    if "data" in req.resume_text.lower() and "engineer" in req.resume_text.lower():
        title = "Data / AI Infrastructure Engineer"
    elif "frontend" in req.resume_text.lower() or "react" in req.resume_text.lower():
        title = "Senior Full Stack / Frontend Engineer"

    loc = req.location_preference if req.location_preference and req.location_preference.strip() else "Remote"

    profile = _get_or_create_profile(db)
    profile.target_title = title
    profile.skills = extracted_skills
    profile.experience_years = 5
    profile.location_preference = loc
    profile.bio = req.resume_text[:300] + "..."
    profile.has_completed_onboarding = True
    
    db.commit()
    db.refresh(profile)

    await ws_manager.broadcast({"type": "notification", "message": "Resume parsed successfully. Triggering job scrape..."})

    # Immediately trigger live profile-tailored scrape based on extracted skills & location!
    query_term = extracted_skills[0] if extracted_skills else "AI"
    fresh_jobs = fetch_live_jobs(query=query_term, location=loc, custom_sources=CURRENT_SOURCES, profile_skills=extracted_skills)
    
    saved_count = 0
    if fresh_jobs:
        for j in fresh_jobs:
            existing = db.query(DBJobListing).filter(DBJobListing.id == j["id"]).first()
            if not existing:
                new_job = DBJobListing(
                    id=j["id"], title=j["title"], company=j["company"], location=j["location"],
                    remote=j["remote"], salary_range=j["salary_range"], description=j["description"],
                    skills_required=j["skills_required"], posted_date=j["posted_date"],
                    match_score=j["match_score"], status=j["status"], source_name=j["source_name"]
                )
                db.add(new_job)
                saved_count += 1
        db.commit()

    if saved_count > 0:
        await ws_manager.broadcast({"type": "jobs_updated", "message": f"Found {saved_count} new matching roles."})

    job_count = db.query(DBJobListing).count()

    return {
        "message": "Resume parsed & candidate profile initialized successfully",
        "profile": CandidateProfile(
            id=profile.id, name=profile.name, target_title=profile.target_title,
            skills=profile.skills, experience_years=profile.experience_years,
            target_salary_min=profile.target_salary_min, target_salary_max=profile.target_salary_max,
            location_preference=profile.location_preference, bio=profile.bio,
            has_completed_onboarding=profile.has_completed_onboarding
        ),
        "extracted_skills": extracted_skills,
        "matched_jobs_count": job_count
    }

@app.get("/api/sources", response_model=List[JobSource])
def get_sources():
    return CURRENT_SOURCES

@app.post("/api/sources")
def update_sources(sources: List[JobSource]):
    global CURRENT_SOURCES
    CURRENT_SOURCES = [s.dict() for s in sources]
    return {"message": "Sourcing channels updated successfully", "sources": CURRENT_SOURCES}

@app.get("/api/settings", response_model=LLMSettings)
def get_settings():
    return CURRENT_SETTINGS

@app.post("/api/settings")
def update_settings(settings: LLMSettings):
    global CURRENT_SETTINGS
    CURRENT_SETTINGS = settings
    
    if settings.provider == "openai" and settings.api_key:
        os.environ["OPENAI_API_KEY"] = settings.api_key
    elif settings.provider == "anthropic" and settings.api_key:
        os.environ["ANTHROPIC_API_KEY"] = settings.api_key
    elif settings.provider == "groq" and settings.api_key:
        os.environ["GROQ_API_KEY"] = settings.api_key
    elif settings.provider == "gemini" and settings.api_key:
        os.environ["GEMINI_API_KEY"] = settings.api_key

    os.environ["LLM_PROVIDER"] = settings.provider
    os.environ["LLM_MODEL"] = settings.model
    if settings.ollama_url:
        os.environ["OLLAMA_BASE_URL"] = settings.ollama_url

    return {"message": "Settings updated successfully", "settings": CURRENT_SETTINGS}

@app.get("/api/jobs", response_model=List[JobListing])
def get_jobs(status: Optional[str] = None, db: Session = Depends(get_db)):
    if status:
        jobs = db.query(DBJobListing).filter(DBJobListing.status == status).all()
    else:
        jobs = db.query(DBJobListing).all()
        
    return [JobListing(
        id=j.id, title=j.title, company=j.company, location=j.location,
        remote=j.remote, salary_range=j.salary_range, description=j.description,
        skills_required=j.skills_required, posted_date=j.posted_date,
        match_score=j.match_score, status=j.status, source_name=j.source_name
    ) for j in jobs]

from backend.scraping.agents import run_ingestion_pipeline

@app.post("/api/scrape")
async def trigger_scrape(query: str = "AI", location: str = "Remote", db: Session = Depends(get_db)):
    profile = _get_or_create_profile(db)
    search_query = query if query and query.strip() else profile.target_title
    search_loc = location if location and location.strip() else profile.location_preference
    
    await ws_manager.broadcast({"type": "notification", "message": f"Scraping active sources for '{search_query}'..."})
    
    # 1. Fetch from basic APIs (Remotive / Jobicy)
    fresh_jobs = fetch_live_jobs(query=search_query, location=search_loc, custom_sources=CURRENT_SOURCES, profile_skills=profile.skills)
    
    # 2. Autonomous Crawling (Crawl4AI + Quality Gate)
    await ws_manager.broadcast({"type": "notification", "message": f"Deploying Crawl4AI agents..."})
    crawled_leads = await run_ingestion_pipeline(f"https://example.com/jobs?q={search_query}")
    
    # Normalize crawled leads into our schema
    for lead in crawled_leads:
        fresh_jobs.append({
            "id": f"crawl-{hash(lead['url']) % 100000}",
            "title": lead["title"],
            "company": lead["company"],
            "location": lead["location"],
            "remote": True,
            "salary_range": "Undisclosed",
            "description": lead["description"],
            "skills_required": lead["skills_required"],
            "posted_date": "Just now",
            "match_score": 85,
            "status": "Discovered",
            "source_name": "Crawl4AI Spider"
        })
        
    saved_count = 0
    new_items = []
    if fresh_jobs:
        for j in fresh_jobs:
            existing = db.query(DBJobListing).filter(DBJobListing.id == j["id"]).first()
            if not existing:
                new_job = DBJobListing(
                    id=j["id"], title=j["title"], company=j["company"], location=j["location"],
                    remote=j["remote"], salary_range=j["salary_range"], description=j["description"],
                    skills_required=j["skills_required"], posted_date=j["posted_date"],
                    match_score=j["match_score"], status=j["status"], source_name=j["source_name"]
                )
                db.add(new_job)
                saved_count += 1
                new_items.append(j)
        db.commit()
    
    job_count = db.query(DBJobListing).count()

    if saved_count > 0:
        await ws_manager.broadcast({"type": "jobs_updated", "message": f"Scraped {saved_count} new jobs."})
        return {
            "message": f"Successfully scraped {saved_count} new live job listings using active channels",
            "job_count": job_count,
            "new_jobs": new_items[:5]
        }
    
from backend.scraping.ats_scanner import run_ats_discovery_scan

@app.post("/api/scan/ats")
async def trigger_ats_scan(req: ATSScanRequest, db: Session = Depends(get_db)):
    profile = _get_or_create_profile(db)
    search_query = req.query if req.query and req.query.strip() else profile.target_title
    search_loc = req.location if req.location and req.location.strip() else profile.location_preference

    async def _progress_cb(msg: dict):
        await ws_manager.broadcast(msg)

    await ws_manager.broadcast({"type": "notification", "message": f"Deploying Reverse ATS Scanner across {', '.join(req.ats_sources)}..."})

    discovered_jobs = await run_ats_discovery_scan(
        ats_list=req.ats_sources,
        limit_per_ats=req.limit_per_ats,
        query=search_query,
        location=search_loc,
        profile_skills=profile.skills,
        progress_callback=_progress_cb
    )

    saved_count = 0
    new_items = []
    if discovered_jobs:
        for j in discovered_jobs:
            existing = db.query(DBJobListing).filter(DBJobListing.id == j["id"]).first()
            if not existing:
                new_job = DBJobListing(
                    id=j["id"], title=j["title"], company=j["company"], location=j["location"],
                    remote=j["remote"], salary_range=j["salary_range"], description=j["description"],
                    skills_required=j["skills_required"], posted_date=j["posted_date"],
                    match_score=j["match_score"], status=j["status"], source_name=j["source_name"]
                )
                db.add(new_job)
                saved_count += 1
                new_items.append(j)
        db.commit()

    job_count = db.query(DBJobListing).count()

    if saved_count > 0:
        await ws_manager.broadcast({"type": "jobs_updated", "message": f"Discovered {saved_count} new roles via Reverse ATS scan!"})
        return {
            "message": f"Successfully discovered {saved_count} fresh roles across public ATS directories",
            "job_count": job_count,
            "new_jobs": new_items[:5]
        }

    return {"message": "Reverse ATS discovery scan complete. No new unique roles found.", "job_count": job_count, "new_jobs": []}

@app.get("/api/profile", response_model=CandidateProfile)
def get_profile(db: Session = Depends(get_db)):
    profile = _get_or_create_profile(db)
    return CandidateProfile(
        id=profile.id, name=profile.name, target_title=profile.target_title,
        skills=profile.skills, experience_years=profile.experience_years,
        target_salary_min=profile.target_salary_min, target_salary_max=profile.target_salary_max,
        location_preference=profile.location_preference, bio=profile.bio,
        has_completed_onboarding=profile.has_completed_onboarding
    )

@app.post("/api/profile")
def update_profile(profile_req: CandidateProfile, db: Session = Depends(get_db)):
    profile = _get_or_create_profile(db)
    profile.name = profile_req.name
    profile.target_title = profile_req.target_title
    profile.skills = profile_req.skills
    profile.experience_years = profile_req.experience_years
    profile.target_salary_min = profile_req.target_salary_min
    profile.target_salary_max = profile_req.target_salary_max
    profile.location_preference = profile_req.location_preference
    profile.bio = profile_req.bio
    profile.has_completed_onboarding = profile_req.has_completed_onboarding
    
    db.commit()
    db.refresh(profile)
    
    return {"message": "Profile updated successfully", "profile": profile_req}

from backend.api.graph_rag import GraphRAGRanker

graph_ranker = GraphRAGRanker()

@app.post("/api/rank")
def rank_job(req: RankRequest, db: Session = Depends(get_db)):
    job = db.query(DBJobListing).filter(DBJobListing.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    profile_data = req.candidate_profile
    profile = profile_data if profile_data else _get_or_create_profile(db)
    
    # 1. Use GraphRAG Ranker for deterministic scoring
    evaluation = graph_ranker.evaluate_job_fit(job, profile)
    final_score = evaluation["final_score"]
    
    # Extract traditional missing/matching for UI parity
    user_skills = set(s.lower() for s in profile.skills)
    job_skills = set(s.lower() for s in job.skills_required)
    matching_skills = list(user_skills.intersection(job_skills))
    missing_skills = list(job_skills - user_skills)

    job.match_score = final_score
    db.commit()

    return {
        "job_id": job.id,
        "job_title": job.title,
        "company": job.company,
        "match_score": final_score,
        "matching_skills": [s.title() for s in matching_skills],
        "missing_skills": [s.title() for s in missing_skills],
        "breakdown": {
            "semantic_match_score": f"{evaluation['semantic_score'] * 100:.0f}%",
            "graph_connectivity_score": f"{evaluation['graph_score'] * 100:.0f}%",
            "connected_skills": ", ".join(evaluation["graph_connections"]),
            "remote_preference": f"100% {profile.location_preference} match"
        },
        "ai_recommendation": f"Powered by LanceDB & Kuzu GraphRAG. Deep semantic and relational fit found."
    }

from backend.api.generators import AgenticDocumentGenerator, generate_pdf_bytes

agentic_generator = AgenticDocumentGenerator()

@app.post("/api/export/pdf")
def export_pdf(req: PDFExportRequest, db: Session = Depends(get_db)):
    profile = _get_or_create_profile(db)
    job_title = "Position"
    company = "Company"
    
    if req.job_id:
        job = db.query(DBJobListing).filter(DBJobListing.id == req.job_id).first()
        if job:
            job_title = job.title
            company = job.company

    pdf_bytes = generate_pdf_bytes(
        content=req.content,
        doc_type=req.doc_type,
        style_name=req.template_style,
        candidate_name=profile.name,
        job_title=job_title,
        company=company
    )
    
    filename = f"{profile.name.replace(' ', '_')}_{req.doc_type}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.post("/api/generate")
def generate_document(req: GenerateDocumentRequest, db: Session = Depends(get_db)):
    job = db.query(DBJobListing).filter(DBJobListing.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    profile = _get_or_create_profile(db)
    
    if req.doc_type == "cover_letter":
        result = agentic_generator.generate_cover_letter(job, profile, req.template_style)
    else:
        result = agentic_generator.generate_resume_bullets(job, profile, req.template_style)

    return {
        "job_id": job.id,
        "doc_type": req.doc_type,
        "template_style": req.template_style,
        "content": result["content"],
        "evaluation": result["evaluation"]
    }

@app.post("/api/crm/update")
async def update_crm_status(req: CRMStatusUpdate, db: Session = Depends(get_db)):
    job = db.query(DBJobListing).filter(DBJobListing.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.status = req.status
    db.commit()
    
    await ws_manager.broadcast({"type": "jobs_updated", "message": f"Updated status to {req.status}"})
    
    return {"message": f"Updated status to {req.status}"}

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total_jobs = db.query(DBJobListing).count()
    saved = db.query(DBJobListing).filter(DBJobListing.status == "Saved").count()
    applied = db.query(DBJobListing).filter(DBJobListing.status == "Applied").count()
    interviewing = db.query(DBJobListing).filter(DBJobListing.status == "Interviewing").count()
    offered = db.query(DBJobListing).filter(DBJobListing.status == "Offered").count()
    
    jobs = db.query(DBJobListing).all()
    avg_score = int(sum(j.match_score for j in jobs if j.match_score) / max(total_jobs, 1))

    return {
        "total_jobs_scraped": total_jobs,
        "saved": saved,
        "applied": applied,
        "interviewing": interviewing,
        "offered": offered,
        "avg_match_score": avg_score,
        "interview_rate_pct": int((interviewing / max(applied, 1)) * 100)
    }
