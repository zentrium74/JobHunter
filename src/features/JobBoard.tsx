import { useState } from 'react';
import { JobListing } from '../types';
import { Search, Sparkles, Briefcase, MapPin, DollarSign, Bookmark, ArrowRight, Loader2 } from 'lucide-react';

interface JobBoardProps {
  jobs: JobListing[];
  onScrape: (query: string, location: string) => Promise<void>;
  onSelectJob: (jobId: string) => void;
  onUpdateStatus: (jobId: string, status: JobListing['status']) => void;
  setActiveTab: (tab: string) => void;
}

export const JobBoard: React.FC<JobBoardProps> = ({
  jobs,
  onScrape,
  onSelectJob,
  onUpdateStatus,
  setActiveTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scrapeQuery, setScrapeQuery] = useState('AI Engineer');
  const [scrapeLocation, setScrapeLocation] = useState('Remote');
  const [isScraping, setIsScraping] = useState(false);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string | null>(null);

  const handleScrapeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScraping(true);
    await onScrape(scrapeQuery, scrapeLocation);
    setIsScraping(false);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = selectedSkillFilter
      ? job.skills_required.includes(selectedSkillFilter)
      : true;
    return matchesSearch && matchesSkill;
  });

  const allSkills = Array.from(new Set(jobs.flatMap((j) => j.skills_required)));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Scraper Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-emerald-400" /> Job Postings & AI Scraper
            </h1>
            <p className="text-xs text-slate-400">Discover AI/software positions scraped locally with transparent match analytics</p>
          </div>

          {/* AI Scraper Form */}
          <form onSubmit={handleScrapeSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Title (e.g. AI Engineer)"
              value={scrapeQuery}
              onChange={(e) => setScrapeQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-36 sm:w-44"
            />
            <input
              type="text"
              placeholder="Location"
              value={scrapeLocation}
              onChange={(e) => setScrapeLocation(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-28 sm:w-32"
            />
            <button
              type="submit"
              disabled={isScraping}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isScraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isScraping ? 'Scraping...' : 'Scrape Jobs'}
            </button>
          </form>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by title, company, or tech..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Skill Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-lg scrollbar-thin">
            <button
              onClick={() => setSelectedSkillFilter(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSkillFilter === null
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              All Skills
            </button>
            {allSkills.slice(0, 7).map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkillFilter(skill === selectedSkillFilter ? null : skill)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSkillFilter === skill
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs Feed Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-md group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs font-medium text-slate-400 mt-1">
                    <span className="text-white font-semibold">{job.company}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" /> {job.location}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-extrabold text-xs border border-emerald-500/20">
                    {job.match_score || 88}% Match
                  </span>
                  <span className="text-[11px] text-slate-500">{job.posted_date}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{job.description}</p>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {job.skills_required.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 text-[11px] font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-1 font-bold text-xs text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{job.salary_range}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onUpdateStatus(job.id, job.status === 'Saved' ? 'Discovered' : 'Saved')}
                  className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                    job.status === 'Saved'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title={job.status === 'Saved' ? 'Saved to CRM' : 'Save to CRM'}
                >
                  <Bookmark className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    onSelectJob(job.id);
                    setActiveTab('ranker');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  Analyze & Tailor <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
