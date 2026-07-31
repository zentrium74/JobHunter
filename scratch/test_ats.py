import asyncio
import sys
import os

# Ensure backend is in python path
sys.path.insert(0, os.path.abspath('.'))

from backend.scraping.ats_scanner import run_ats_discovery_scan

async def main():
    print("== Testing Resume-Tailored Public ATS Search ==\n")
    
    # Resume Profile 1: AI / Data Engineer
    print("[Profile 1] AI & Data Engineer (Skills: Python, PyTorch, LLMs, Vector Search)")
    jobs_ai = await run_ats_discovery_scan(
        ats_list=["greenhouse", "lever", "ashby"],
        limit_per_ats=10,
        query="AI",
        location="Remote",
        profile_skills=["Python", "PyTorch", "LLMs", "FastAPI"]
    )
    print(f"   Found {len(jobs_ai)} jobs matching AI Engineer resume. Top 3:")
    for j in jobs_ai[:3]:
        print(f"   - [{j['source_name']}] {j['title']} at {j['company']} (Match: {j['match_score']}%)")

    print("\n" + "="*60 + "\n")

    # Resume Profile 2: Frontend / React Engineer
    print("[Profile 2] Frontend Engineer (Skills: React, TypeScript, TailwindCSS)")
    jobs_fe = await run_ats_discovery_scan(
        ats_list=["greenhouse", "lever", "ashby"],
        limit_per_ats=10,
        query="React",
        location="Remote",
        profile_skills=["React", "TypeScript", "TailwindCSS"]
    )
    print(f"   Found {len(jobs_fe)} jobs matching React Engineer resume. Top 3:")
    for j in jobs_fe[:3]:
        print(f"   - [{j['source_name']}] {j['title']} at {j['company']} (Match: {j['match_score']}%)")

if __name__ == "__main__":
    asyncio.run(main())
