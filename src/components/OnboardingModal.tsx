import { useState } from 'react';
import { CandidateProfile } from '../types';
import { parseResume } from '../api/client';
import { FileText, MapPin, Sparkles, Check, ArrowRight, Upload, Cpu, Shield, Loader2 } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: CandidateProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [locationPreference, setLocationPreference] = useState('Remote');
  const [targetTitle, setTargetTitle] = useState('Senior AI / Full Stack Engineer');
  const [resumeText, setResumeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setResumeText(text || `Uploaded File: ${file.name}`);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyzeAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsParsing(true);
    const textToParse = resumeText.trim() || `Experienced ${targetTitle} skilled in Python, TypeScript, React, FastAPI, PyTorch, Docker, PostgreSQL, and LLMs. Located in ${locationPreference}.`;
    const result = await parseResume(textToParse, locationPreference, targetTitle);
    setExtractedSkills(result.extracted_skills);
    setIsParsing(false);
    
    setTimeout(() => {
      onComplete(result.profile);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 relative">
        {/* Top Branding Header */}
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Welcome to JobHunter AI</h1>
            <p className="text-xs text-slate-400">Let's set up your profile & target location to start matching jobs</p>
          </div>
        </div>

        <form onSubmit={handleAnalyzeAndSave} className="space-y-6">
          {step === 1 ? (
            <div className="space-y-5">
              {/* Target Location Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" /> Preferred Location Filter
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Remote', 'San Francisco, CA', 'New York, NY', 'Austin, TX', 'London, UK', 'Worldwide'].map((loc) => (
                    <button
                      type="button"
                      key={loc}
                      onClick={() => setLocationPreference(loc)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                        locationPreference === loc
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span>{loc}</span>
                      {locationPreference === loc && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={locationPreference}
                  onChange={(e) => setLocationPreference(e.target.value)}
                  placeholder="Or enter custom location (e.g. Remote / Chicago)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium mt-2"
                />
              </div>

              {/* Target Role Title */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200">Target Role Title</label>
                <input
                  type="text"
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  placeholder="e.g. Senior AI Systems Engineer or Full Stack Developer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                Next: Upload Resume <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Resume Upload / Paste Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" /> Upload or Paste Your Resume
                  </span>
                  <span className="text-[11px] text-slate-400">PDF, TXT, or Plain Text</span>
                </label>

                {/* File Upload Button */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-800 border-dashed rounded-2xl cursor-pointer bg-slate-950 hover:bg-slate-900/50 hover:border-emerald-500/50 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400">
                      <Upload className="w-6 h-6 mb-2 text-emerald-400" />
                      <p className="text-xs font-semibold">Click to upload resume file (.txt, .md, .pdf)</p>
                      <p className="text-[10px] text-slate-500 mt-1">Or paste your text below</p>
                    </div>
                    <input type="file" accept=".txt,.md,.pdf,.doc" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <textarea
                  rows={4}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume content or career bio here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Extracted Skills Preview if parsed */}
              {extractedSkills.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" /> Extracted Key Tech Stack Skills:
                  </span>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {extractedSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-slate-900 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Local Security Assurance */}
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
                <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Your resume is processed 100% locally and saved into your private LanceDB/mem0 profile memory.</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isParsing}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isParsing ? 'Analyzing Tech Stack...' : 'Save Profile & Match Jobs'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
