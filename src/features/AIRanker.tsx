import React, { useEffect, useState } from 'react';
import { JobListing, CandidateProfile, RankResult } from '../types';
import { rankJob } from '../api/client';
import { Cpu, CheckCircle2, AlertCircle, Sparkles, FileText, ArrowRight, ShieldCheck, DollarSign, MapPin } from 'lucide-react';

interface AIRankerProps {
  jobs: JobListing[];
  selectedJobId: string;
  setSelectedJobId: (id: string) => void;
  profile: CandidateProfile;
  setActiveTab: (tab: string) => void;
}

export const AIRanker: React.FC<AIRankerProps> = ({
  jobs,
  selectedJobId,
  setSelectedJobId,
  profile,
  setActiveTab
}) => {
  const [rankResult, setRankResult] = useState<RankResult | null>(null);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  useEffect(() => {
    if (selectedJob) {
      rankJob(selectedJob.id, selectedJob, profile).then((res) => {
        setRankResult(res);
      });
    }
  }, [selectedJobId, profile]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Job Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-400" /> AI Transparent Fit Ranker
          </h1>
          <p className="text-xs text-slate-400">Explainable skill overlap, experience matching & vector similarity score</p>
        </div>

        {/* Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 font-semibold">Target Job:</label>
          <select
            value={selectedJob?.id}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.company})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedJob && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Job Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                {selectedJob.company}
              </span>
              <h2 className="text-xl font-bold text-white">{selectedJob.title}</h2>
              <p className="text-xs text-slate-400 flex items-center gap-2 pt-1">
                <MapPin className="w-3.5 h-3.5" /> {selectedJob.location}
              </p>
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> {selectedJob.salary_range}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Job Description Overview</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{selectedJob.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Key Tech Stack Required</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedJob.skills_required.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 text-xs font-medium border border-slate-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('generator')}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-4"
            >
              <FileText className="w-4 h-4" /> Tailor Resume & Cover Letter
            </button>
          </div>

          {/* Right Column: AI Analysis Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs text-slate-400 font-semibold">Overall Transparent Match Score</div>
                <div className="text-4xl font-extrabold text-white flex items-baseline gap-2">
                  <span>{rankResult?.match_score || 92}%</span>
                  <span className="text-xs font-bold text-emerald-400">High Suitability Candidate</span>
                </div>
              </div>

              <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-slate-950 shadow-inner">
                <span className="text-xl font-black text-emerald-400">{rankResult?.match_score}%</span>
              </div>
            </div>

            {/* Breakdown Cards Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Skill Match Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Matching Skills (Candidate vs Job)
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {rankResult?.matching_skills.map((skill) => (
                    <span key={skill} className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" /> Missing / Optional Keywords
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {rankResult?.missing_skills.length ? (
                    rankResult.missing_skills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                        ! {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold">100% Skill Coverage Achieved!</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Strategic Recommendation */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> AI Strategic Recommendation
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {rankResult?.ai_recommendation}
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" /> LiteLLM Explainable Scoring
                </span>
                <button
                  onClick={() => setActiveTab('generator')}
                  className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  Generate Application <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
