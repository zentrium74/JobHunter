import { SystemStats, JobListing, LLMSettings } from '../types';
import { Search, Send, Video, Award, TrendingUp, Sparkles, ArrowRight, ShieldCheck, Key, Cpu } from 'lucide-react';

interface DashboardProps {
  stats: SystemStats;
  jobs: JobListing[];
  setActiveTab: (tab: string) => void;
  setSelectedJobId: (id: string) => void;
  onOpenSettings: () => void;
  settings: LLMSettings;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  jobs,
  setActiveTab,
  setSelectedJobId,
  onOpenSettings,
  settings
}) => {
  const topMatches = [...jobs].sort((a, b) => (b.match_score || 0) - (a.match_score || 0)).slice(0, 3);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Job Intelligence Workbench</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Target Top Roles. Apply Faster. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Get Hired With 100% Transparency.
            </span>
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            JobHunter runs locally to scrape postings, score transparent skill fit, tailor custom resumes & cover letters, and track your pipeline toward job offers.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setActiveTab('jobs')}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Scrape & Explore Jobs
            </button>
            <button
              onClick={onOpenSettings}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all flex items-center gap-2"
            >
              <Key className="w-4 h-4 text-emerald-400" /> Bring Your API Key
            </button>
          </div>
        </div>
      </div>

      {/* Bring Your Own Key Active Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">Active LLM Engine:</h3>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs capitalize">
                {settings.provider} ({settings.model})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {settings.provider === 'ollama' 
                ? 'Running keyless local AI inference via Ollama' 
                : `Connected to ${settings.provider.toUpperCase()} with custom API Key`}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 self-start md:self-auto"
        >
          <Key className="w-4 h-4" /> Change Provider or API Key
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Jobs Discovered</span>
            <Search className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.total_jobs_scraped}</div>
          <p className="text-xs text-emerald-400 font-medium">Scraped & Indexing</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Applications Sent</span>
            <Send className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.applied}</div>
          <p className="text-xs text-indigo-400 font-medium">{stats.saved} Saved in Pipeline</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Interview Rate</span>
            <Video className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.interview_rate_pct}%</div>
          <p className="text-xs text-teal-400 font-medium">{stats.interviewing} Active Interviews</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Avg Match Score</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.avg_match_score}%</div>
          <p className="text-xs text-amber-400 font-medium">High Match Potential</p>
        </div>
      </div>

      {/* Top AI Matched Positions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Top AI-Matched Opportunities
            </h2>
            <p className="text-xs text-slate-400">Ranked using transparent skill overlap & profile memory</p>
          </div>
          <button
            onClick={() => setActiveTab('jobs')}
            className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            View All ({jobs.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {topMatches.map((job) => (
            <div
              key={job.id}
              className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                    {job.title}
                  </h3>
                  <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-extrabold text-xs border border-emerald-500/20">
                    {job.match_score}% Match
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-400">{job.company} • {job.location}</p>
                <p className="text-xs text-slate-300 line-clamp-2">{job.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400">{job.salary_range}</span>
                <button
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setActiveTab('ranker');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-semibold text-slate-200 transition-all"
                >
                  Analyze Match
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Security & Local First Guarantee */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Local-First Guarantee:</strong> Your resume, graph memory (mem0), and application logs remain safely on your computer.
          </span>
        </div>
        <span className="hidden sm:inline font-mono text-[11px] text-emerald-500">Status: Active Engine ({settings.provider})</span>
      </div>
    </div>
  );
};
