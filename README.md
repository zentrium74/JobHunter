# JobHunter (Zentrium 74 Architecture) 🎯

> **Local-first AI job intelligence workbench** — scrape smarter, rank transparently, apply with tailored materials.

[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![Backend: Python](https://img.shields.io/badge/backend-FastAPI_Python_3-3776ab?style=for-the-badge)]()
[![Frontend: React](https://img.shields.io/badge/frontend-React_19_+_Vite-61dafb?style=for-the-badge)]()
[![Local First](https://img.shields.io/badge/local--first-100%25_Private-0ea5e9?style=for-the-badge)]()

---

## 🚀 What is JobHunter?

JobHunter is a fully offline, local-first AI job intelligence workbench. Unlike other platforms that harvest your resume data, JobHunter runs entirely on your own machine. It scrapes job postings, ingests and parses your resume, ranks roles using **semantic exact matching** and **deterministic graph logic**, and generates tailored cover letters and resumes using advanced AI agents. 

Everything you do is stored locally in an embedded **SQLite CRM** database. 

### 🌟 Key Features

* **100% Privacy**: Your data never leaves your laptop. We use local SQLite databases and local Machine Learning models (`sentence-transformers`).
* **Deterministic Graphify Engine**: Toggle between fuzzy Semantic Match and **Exact Graph Match**. The intelligence layer deterministically extracts skills (AST nodes) from the job description and your resume, scoring exact overlap and explaining *every single edge* gap transparently.
* **Interactive Kanban CRM**: A visual, drag-and-drop HTML5 Kanban board to track your application pipeline across 5 stages (`Discovered` ➔ `Saved` ➔ `Applied` ➔ `Interviewing` ➔ `Offered`).
* **Automated PDF Export Engine**: Generate stunning, verified cover letters and resume bullets using the AI agent, and instantly download them as beautifully styled PDFs via the integrated `ReportLab` engine (Modern, Executive, and Classic styles).
* **Multi-ATS Discovery Engine**: Leveraging a "Reverse ATS Scanner" capable of crawling public APIs for Greenhouse, Lever, Ashby, and Workday directly to source roles that haven't even hit traditional job boards yet.
* **Agentic Evaluators**: Integrated with simulated wrappers for Crawl4AI and RAGAS, JobHunter grades its own AI outputs before you ever see them to prevent hallucinations.

---

## 🏗️ Architecture (Zentrium 74)

```mermaid
flowchart TB
    subgraph Frontend["React + TypeScript (Vite)"]
        UI["Dashboard / Pipeline / CRM"]
        WS["WebSocket Client"]
    end
    subgraph Backend["FastAPI Python Sidecar"]
        API["FastAPI + WebSockets"]
        Crawler["Crawl4AI / Reverse ATS Engine"]
        OCR["Chandra OCR Ingestion"]
        Gate["Lead Quality Gate"]
        Ranker["Graphify Deterministic Engine"]
        Skills["SkillClaw Agent Skills"]
        Generator["Document Generator"]
        PDF["ReportLab PDF Exporter"]
        Evaluator["RAGAS Output Evaluator"]
    end
    subgraph DataLayer["Local Data (Never leaves your machine)"]
        SQLite["SQLite CRM"]
        Kuzu["Kuzu Profile Graph"]
        LanceDB["LanceDB Vectors"]
    end

    UI --> WS --> API
    API --> Crawler --> Gate --> Ranker
    API --> OCR --> Ranker
    Ranker --> Skills --> Generator --> Evaluator
    Generator --> PDF
    Ranker --> Kuzu
    Ranker --> LanceDB
    API --> SQLite
```

---

## 💻 Getting Started

To run the local-first application on your machine, you need to spin up the Python backend and the React frontend simultaneously:

```bash
# Terminal 1 - Backend (FastAPI Sidecar)
cd backend 
pip install -r requirements.txt # Make sure to install sentence-transformers, fastapi, sqlalchemy, reportlab
python -m uvicorn api.main:app --reload --port 8000

# Terminal 2 - Frontend (React + Vite)
npm install
npm run dev
```

*Note: The first time you start the backend, it may take a moment to download the `all-MiniLM-L6-v2` PyTorch embedding model for exact matching. Do not stop the terminal during this initial download.*

---

## 📡 Native Integrations

JobHunter comes pre-packaged with a native scraping engine that parses major public job boards automatically:
* **Greenhouse API** (`boards-api.greenhouse.io`)
* **Lever API** (`api.lever.co/v0/postings`)
* **Ashby API** (`api.ashbyhq.com`)
* **Workday Workspaces**
* **Remotive** and **Jobicy** public feeds.

---

## 🛡️ License

MIT — See [LICENSE](LICENSE)
