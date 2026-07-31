"""ATS Discovery Scanner Engine for JobHunter (Career Ops Integration).

Reverses the search direction: Walks public company directories per ATS (Greenhouse, Lever, Ashby, Workday)
and fetches fresh postings directly via free public API endpoints without LLM costs.
"""

from __future__ import annotations

import os
import json
import time
import re
import asyncio
import urllib.request
import urllib.parse
from typing import List, Dict, Any, Optional, Callable
from pathlib import Path

CACHE_DIR = Path("./data/cache/ats-companies")
CACHE_TTL_HOURS = 24

DATASET_BASE = "https://raw.githubusercontent.com/Feashliaa/job-board-aggregator/main/data"

DEFAULT_TOP_SLUGS = {
    "greenhouse": [
        "stripe", "figma", "coinbase", "discord", "datadog", "brex", "notion", 
        "airtable", "retool", "scaleai", "ramp", "doordash", "pinterest", "cloudflare"
    ],
    "lever": [
        "netflix", "spotify", "palantir", "figma", "twitch", "datadog", "lyft", "box"
    ],
    "ashby": [
        "openai", "anthropic", "vercel", "linear", "resend", "supabase", "posthog", "sentry"
    ],
    "workday": [
        "nvidia|myworkdayjobs|NVIDIA_Careers", "adobe|myworkdayjobs|external"
    ]
}

KNOWN_SKILLS = [
    "Python", "TypeScript", "JavaScript", "React", "Next.js", "Vue", "Node.js",
    "FastAPI", "Django", "Flask", "PyTorch", "TensorFlow", "LLMs", "LangChain",
    "LiteLLM", "Docker", "Kubernetes", "PostgreSQL", "MongoDB", "Redis",
    "TailwindCSS", "AWS", "GCP", "Azure", "GraphQL", "Vector Search", "LanceDB", "RAG",
    "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin"
]

def _extract_skills(text: str) -> List[str]:
    found = []
    text_lower = text.lower()
    for skill in KNOWN_SKILLS:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return found

def _load_company_slugs(ats_name: str) -> List[str]:
    """Fetch company slugs from GitHub dataset or return cached/fallback list."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / f"{ats_name}.json"
    
    # Check cache TTL
    if cache_file.exists():
        age_hours = (time.time() - cache_file.stat().st_mtime) / 3600.0
        if age_hours < CACHE_TTL_HOURS:
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list) and data:
                        return [str(item) for item in data]
            except Exception:
                pass

    # Try downloading dataset
    dataset_url = f"{DATASET_BASE}/{ats_name}_companies.json"
    try:
        req = urllib.request.Request(dataset_url, headers={'User-Agent': 'JobHunter-ATSScanner/1.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if isinstance(data, list) and data:
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(data, f)
                return [str(item) for item in data]
    except Exception as e:
        print(f"[ATS Scanner] Warning: Could not fetch {ats_name} dataset ({e}). Using cached/fallback slugs.")

    # Stale cache fallback
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return [str(item) for item in data]
        except Exception:
            pass

    # Fallback to curated top company slugs
    return DEFAULT_TOP_SLUGS.get(ats_name.lower(), [])

# --- Async HTTP Fetch Helper ---

async def _fetch_json_async(url: str, timeout: float = 8.0) -> Optional[Any]:
    def _sync_fetch():
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except Exception:
            return None
            
    return await asyncio.to_thread(_sync_fetch)

# --- Provider Fetchers ---

async def fetch_greenhouse_board(slug: str) -> List[Dict[str, Any]]:
    url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true"
    data = await _fetch_json_async(url)
    if not data or not isinstance(data, dict):
        return []
    
    jobs = data.get("jobs", [])
    results = []
    company = slug.replace("-", " ").replace("_", " ").title()
    
    for idx, j in enumerate(jobs):
        title = j.get("title", "Software Engineer")
        job_desc = j.get("content", "") or j.get("absolute_url", "")
        clean_desc = re.sub(r'<[^>]+>', ' ', job_desc)[:350] + "..."
        extracted_skills = _extract_skills(job_desc)
        loc = j.get("location", {}).get("name", "Remote")
        
        results.append({
            "id": f"gh-{slug}-{j.get('id', idx)}",
            "title": title,
            "company": company,
            "location": loc,
            "remote": "remote" in loc.lower(),
            "salary_range": "Competitive",
            "description": clean_desc,
            "skills_required": extracted_skills[:8] if extracted_skills else ["Python", "Engineering"],
            "posted_date": j.get("updated_at", "Recently")[:10],
            "match_score": 88,
            "status": "Discovered",
            "source_name": f"Greenhouse ({company})",
            "url": j.get("absolute_url", f"https://job-boards.greenhouse.io/{slug}")
        })
    return results

async def fetch_lever_board(slug: str) -> List[Dict[str, Any]]:
    url = f"https://api.lever.co/v0/postings/{slug}"
    data = await _fetch_json_async(url)
    if not data or not isinstance(data, list):
        return []
    
    results = []
    company = slug.replace("-", " ").replace("_", " ").title()
    
    for idx, j in enumerate(data):
        title = j.get("text", "Software Engineer")
        job_desc = j.get("descriptionPlain", "") or j.get("description", "")
        clean_desc = job_desc[:350] + "..."
        extracted_skills = _extract_skills(job_desc)
        loc = j.get("categories", {}).get("location", "Remote")
        
        results.append({
            "id": f"lev-{slug}-{j.get('id', idx)}",
            "title": title,
            "company": company,
            "location": loc,
            "remote": "remote" in loc.lower() or j.get("workplaceType") == "remote",
            "salary_range": "Competitive",
            "description": clean_desc,
            "skills_required": extracted_skills[:8] if extracted_skills else ["Python", "Engineering"],
            "posted_date": "Active Posting",
            "match_score": 89,
            "status": "Discovered",
            "source_name": f"Lever ({company})",
            "url": j.get("hostedUrl", f"https://jobs.lever.co/{slug}")
        })
    return results

async def fetch_ashby_board(slug: str) -> List[Dict[str, Any]]:
    url = f"https://api.ashbyhq.com/posting-api/job-board/{slug}"
    data = await _fetch_json_async(url)
    if not data or not isinstance(data, dict):
        return []
    
    jobs = data.get("jobs", [])
    results = []
    company = slug.replace("-", " ").replace("_", " ").title()
    
    for idx, j in enumerate(jobs):
        title = j.get("title", "Software Engineer")
        job_desc = j.get("descriptionHtml", "") or j.get("descriptionPlain", "")
        clean_desc = re.sub(r'<[^>]+>', ' ', job_desc)[:350] + "..."
        extracted_skills = _extract_skills(job_desc)
        loc = j.get("locationName", "Remote")
        
        results.append({
            "id": f"ashby-{slug}-{j.get('id', idx)}",
            "title": title,
            "company": company,
            "location": loc,
            "remote": j.get("isRemote", True),
            "salary_range": "Competitive",
            "description": clean_desc,
            "skills_required": extracted_skills[:8] if extracted_skills else ["Python", "Engineering"],
            "posted_date": j.get("publishedAt", "Recently")[:10] if j.get("publishedAt") else "Active Posting",
            "match_score": 90,
            "status": "Discovered",
            "source_name": f"Ashby ({company})",
            "url": j.get("jobUrl", f"https://jobs.ashbyhq.com/{slug}")
        })
    return results

async def fetch_workday_board(entry: str) -> List[Dict[str, Any]]:
    # Entry format: tenant|instance|site
    parts = entry.split("|")
    if len(parts) < 3:
        return []
    tenant, instance, site = parts[0], parts[1], parts[2]
    url = f"https://{tenant}.{instance}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs"
    
    def _post_workday():
        try:
            payload = json.dumps({"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": ""}).encode('utf-8')
            req = urllib.request.Request(url, data=payload, headers={'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=8) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except Exception:
            return None

    data = await asyncio.to_thread(_post_workday)
    if not data or not isinstance(data, dict):
        return []
        
    postings = data.get("jobPostings", [])
    results = []
    company = tenant.replace("-", " ").replace("_", " ").title()
    
    for idx, j in enumerate(postings):
        title = j.get("title", "Software Engineer")
        loc = j.get("locationsText", "Remote")
        req_id = j.get("bulletFields", [""])[0] if j.get("bulletFields") else f"{idx}"
        
        results.append({
            "id": f"wday-{tenant}-{req_id}",
            "title": title,
            "company": company,
            "location": loc,
            "remote": "remote" in loc.lower(),
            "salary_range": "Competitive",
            "description": f"Workday posting for {title} at {company}. Location: {loc}",
            "skills_required": ["Python", "Enterprise Systems"],
            "posted_date": j.get("postedOn", "Active"),
            "match_score": 86,
            "status": "Discovered",
            "source_name": f"Workday ({company})",
            "url": f"https://{tenant}.{instance}.myworkdayjobs.com/en-US/{site}" + j.get("externalPath", "")
        })
    return results

# --- Main ATS Discovery Scanner Function ---

async def run_ats_discovery_scan(
    ats_list: Optional[List[str]] = None,
    limit_per_ats: int = 15,
    query: str = "",
    location: str = "Remote",
    profile_skills: Optional[List[str]] = None,
    progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None
) -> List[Dict[str, Any]]:
    """Runs parallel reverse discovery scan across public ATS directories."""
    
    target_ats = [a.lower() for a in ats_list] if ats_list else ["greenhouse", "lever", "ashby"]
    all_jobs: List[Dict[str, Any]] = []
    sem = asyncio.Semaphore(10) # 10 concurrent requests
    
    total_scanned = 0

    async def _worker(ats_name: str, slug: str):
        nonlocal total_scanned
        async with sem:
            jobs = []
            if ats_name == "greenhouse":
                jobs = await fetch_greenhouse_board(slug)
            elif ats_name == "lever":
                jobs = await fetch_lever_board(slug)
            elif ats_name == "ashby":
                jobs = await fetch_ashby_board(slug)
            elif ats_name == "workday":
                jobs = await fetch_workday_board(slug)
                
            total_scanned += 1
            if progress_callback and total_scanned % 5 == 0:
                await progress_callback({
                    "type": "scan_progress",
                    "scanned_boards": total_scanned,
                    "jobs_found": len(all_jobs) + len(jobs)
                })
            return jobs

    tasks = []
    for ats_name in target_ats:
        slugs = _load_company_slugs(ats_name)[:limit_per_ats]
        for slug in slugs:
            tasks.append(_worker(ats_name, slug))

    if progress_callback:
        await progress_callback({
            "type": "notification",
            "message": f"Starting reverse ATS discovery scan across {len(tasks)} target company boards..."
        })

    results = await asyncio.gather(*tasks)
    
    for job_list in results:
        all_jobs.extend(job_list)

    # Filter & rank by user profile / query
    filtered = []
    q_lower = query.lower() if query else ""
    loc_lower = location.lower() if location else ""
    user_skills = set(s.lower() for s in (profile_skills or []))

    for job in all_jobs:
        # Match query if present
        if q_lower:
            match_title = q_lower in job["title"].lower()
            match_desc = q_lower in job["description"].lower()
            match_skills = any(q_lower in s.lower() for s in job["skills_required"])
            if not (match_title or match_desc or match_skills):
                continue
                
        # Match location if present (and not Remote wildcard)
        if loc_lower and loc_lower != "remote":
            if loc_lower not in job["location"].lower() and not job["remote"]:
                continue
                
        # Score based on profile skills
        if user_skills:
            job_skills = set(s.lower() for s in job["skills_required"])
            overlap = len(job_skills.intersection(user_skills))
            ratio = overlap / max(len(job_skills), 1)
            job["match_score"] = min(99, max(60, int(65 + ratio * 32)))

        filtered.append(job)

    # Sort highest match score first
    filtered.sort(key=lambda x: x["match_score"], reverse=True)
    return filtered
