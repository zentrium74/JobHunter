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
}

export interface RankResult {
  job_id: string;
  job_title: string;
  company: string;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  breakdown: {
    skill_match_pct: number;
    experience_fit: string;
    salary_alignment: string;
    remote_preference: string;
  };
  ai_recommendation: string;
}

export interface DocumentResult {
  job_id: string;
  doc_type: 'cover_letter' | 'resume_bullets';
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
