export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salary_range: string;
  description: string;
  skills_required: string[];
  posted_date: string;
  match_score?: number;
  status: 'Discovered' | 'Saved' | 'Applied' | 'Interviewing' | 'Offered' | 'Rejected';
  source_name?: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  target_title: string;
  skills: string[];
  experience_years: number;
  target_salary_min: number;
  target_salary_max: number;
  location_preference: string;
  bio: string;
  has_completed_onboarding?: boolean;
}

export interface JobSource {
  id: string;
  name: string;
  type: 'api' | 'greenhouse' | 'lever' | 'rss' | 'json';
  url: string;
  enabled: boolean;
}

export interface RankResult {
  job_id: string;
  job_title: string;
  company: string;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  breakdown: {
    semantic_match_score?: string;
    graph_connectivity_score?: string;
    connected_skills?: string;
    skill_match_pct?: number;
    experience_fit?: string;
    salary_alignment?: string;
    remote_preference: string;
  };
  exact_match_analysis?: {
    exact_match_score: number;
    edges: Array<{
      node: string;
      status: 'exact_match' | 'missing_gap';
      reasoning: string;
    }>;
    extracted_job_nodes: number;
    extracted_candidate_nodes: number;
  };
  ai_recommendation: string;
}

export interface DocumentResult {
  job_id: string;
  doc_type: 'cover_letter' | 'resume_bullets';
  template_style?: 'modern' | 'executive' | 'classic' | 'minimal';
  content: string;
  evaluation: {
    passed: boolean;
    overall_score: number;
    metrics: {
      AnswerRelevancyMetric: number;
      FaithfulnessMetric: number;
      DocumentQualityGEval: number;
    };
    feedback: string;
  };
}

export interface SystemStats {
  total_jobs_scraped: number;
  saved: number;
  applied: number;
  interviewing: number;
  offered: number;
  avg_match_score: number;
  interview_rate_pct: number;
}

export interface LLMSettings {
  provider: 'ollama' | 'openai' | 'anthropic' | 'groq' | 'gemini';
  model: string;
  api_key?: string;
  ollama_url?: string;
}
