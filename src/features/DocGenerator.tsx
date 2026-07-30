import { useState } from 'react';
import { JobListing, CandidateProfile, DocumentResult } from '../types';
import { generateDocument } from '../api/client';
import { FileText, Sparkles, Copy, Check, Download, Award, Loader2, ArrowRight } from 'lucide-react';

interface DocGeneratorProps {
  jobs: JobListing[];
  selectedJobId: string;
  setSelectedJobId: (id: string) => void;
  profile: CandidateProfile;
  setActiveTab: (tab: string) => void;
}

export const DocGenerator: React.FC<DocGeneratorProps> = ({
  jobs,
  selectedJobId,
  setSelectedJobId,
  profile,
  setActiveTab
}) => {
  const [docType, setDocType] = useState<'cover_letter' | 'resume_bullets'>('cover_letter');
  const [documentResult, setDocumentResult] = useState<DocumentResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  const handleGenerate = async () => {
    if (!selectedJob) return;
    setIsGenerating(true);
    const res = await generateDocument(selectedJob.id, docType, selectedJob, profile);
    setDocumentResult(res);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    if (documentResult) {
      navigator.clipboard.writeText(documentResult.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (documentResult) {
      const element = document.createElement('a');
      const file = new Blob([documentResult.content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${selectedJob.company}_${docType}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-400" /> AI Document Tailoring Generator
            </h1>
            <p className="text-xs text-slate-400">Generate cover letters & resume bullets verified by DeepEval quality checks</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Job Selector */}
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

            {/* Doc Type Selector */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
              <button
                onClick={() => setDocType('cover_letter')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  docType === 'cover_letter'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cover Letter
              </button>
              <button
                onClick={() => setDocType('resume_bullets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  docType === 'resume_bullets'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Resume Bullets
              </button>
            </div>

            {/* Generate Action */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'Tailoring...' : 'Generate Material'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Job Context */}
        {selectedJob && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Target Role Summary</h3>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="text-base font-bold text-white">{selectedJob.title}</div>
              <div className="text-xs font-semibold text-emerald-400">{selectedJob.company} • {selectedJob.location}</div>
              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{selectedJob.description}</p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">Candidate Profile Linked:</span>
              <div className="text-xs text-slate-400 font-semibold">{profile.name} ({profile.experience_years} Years Experience)</div>
              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 5).map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('crm')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 mt-4"
            >
              View Application Pipeline <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right Column: Generated Output & DeepEval Badge */}
        <div className="lg:col-span-2 space-y-4">
          {documentResult ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              {/* Quality Banner */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center space-x-3">
                  <Award className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      DeepEval Quality Verified • Pass ({(documentResult.evaluation.overall_score * 100).toFixed(0)}%)
                    </div>
                    <div className="text-xs text-slate-300">
                      Answer Relevancy: {(documentResult.evaluation.metrics.AnswerRelevancyMetric * 100).toFixed(0)}% | Faithfulness: {(documentResult.evaluation.metrics.FaithfulnessMetric * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>

              {/* Document Text Box */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-6 whitespace-pre-wrap font-sans text-slate-200 text-xs leading-relaxed max-h-[500px] overflow-y-auto scrollbar-thin">
                {documentResult.content}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <Sparkles className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Ready to Generate Application Material</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click "Generate Material" above to create a tailored cover letter or bullet points for {selectedJob?.company}.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Generate Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
