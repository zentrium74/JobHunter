import { useState } from 'react';
import { JobListing, JobSource } from '../types';
import { Search, MapPin, Building, DollarSign, Filter, RefreshCw, Globe, Plus } from 'lucide-react';

interface JobBoardProps {
  jobs: JobListing[];
  onScrape: (query: string, location: string) => Promise<void>;
  onSelectJob: (id: string) => void;
  onUpdateStatus: (id: string, status: JobListing['status']) => void;
  setActiveTab: (tab: string) => void;
  onOpenSourceManager: () => void;
  sources: JobSource[];
}

export const JobBoard: React.FC<JobBoardProps> = ({
  jobs,
  onScrape,
  onSelectJob,
  onUpdateStatus,
  setActiveTab,
  onOpenSourceManager,
  sources
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['Remote']);
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [isScraping, setIsScraping] = useState(false);

  const [locationOptions, setLocationOptions] = useState<string[]>([
    'Remote', 'San Francisco', 'New York', 'London', 'Worldwide'
  ]);
  const [customLocationInput, setCustomLocationInput] = useState('');
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  const toggleLocationFilter = (loc: string) => {
    if (selectedLocations.includes(loc)) {
      if (selectedLocations.length > 1) {
        setSelectedLocations(selectedLocations.filter((l) => l !== loc));
      }
    } else {
      setSelectedLocations([...selectedLocations, loc]);
    }
  };

  const handleAddCustomLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLoc = customLocationInput.trim();
    if (cleanLoc) {
      if (!locationOptions.includes(cleanLoc)) {
        setLocationOptions([...locationOptions, cleanLoc]);
      }
      if (!selectedLocations.includes(cleanLoc)) {
        setSelectedLocations([...selectedLocations, cleanLoc]);
      }
      setCustomLocationInput('');
      setIsAddingLocation(false);
    }
  };

  const activeSourcesCount = sources.filter((s) => s.enabled).length;

  const handleScrapeClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScraping(true);
    await onScrape(searchQuery || 'AI Engineer', selectedLocations.join(', '));
    setIsScraping(false);
  };

  const allSkills = Array.from(new Set(jobs.flatMap((j) => j.skills_required)));

  const filteredJobs = jobs.filter((job) => {
    const matchesQuery =
      searchQuery === '' ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSkill = selectedSkill === 'All' || job.skills_required.includes(selectedSkill);

    const matchesLocation =
      selectedLocations.length === 0 ||
      selectedLocations.some((loc) =>
        loc.toLowerCase() === 'remote'
          ? job.remote || job.location.toLowerCase().includes('remote')
          : job.location.toLowerCase().includes(loc.toLowerCase())
      );

    return matchesQuery && matchesSkill && matchesLocation;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Live Scraping Control */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Search className="w-6 h-6 text-emerald-400" /> Active Job Feed & Web Scraper
            </h1>
            <p className="text-xs text-slate-400">
              Scraping active openings across <strong className="text-emerald-400">{activeSourcesCount} active channels</strong> (Remotive, Jobicy, Greenhouse, Custom RSS/JSON)
            </p>
          </div>

          <button
            onClick={onOpenSourceManager}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow-sm self-start md:self-auto"
          >
            <Globe className="w-4 h-4" /> Manage Custom Job Channels ({activeSourcesCount})
          </button>
        </div>

        {/* Scraper Input Form */}
        <form onSubmit={handleScrapeClick} className="grid sm:grid-cols-3 gap-3 pt-2">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search Role or Skill (e.g. AI Engineer, React, Python)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isScraping}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
            {isScraping ? 'Scraping Live Channels...' : 'Scrape Active Roles'}
          </button>
        </form>

        {/* Multi-Select Location Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Location Filter:
          </span>
          {locationOptions.map((loc) => {
            const active = selectedLocations.includes(loc);
            return (
              <button
                key={loc}
                type="button"
                onClick={() => toggleLocationFilter(loc)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {active ? '✓ ' : '+ '} {loc}
              </button>
            );
          })}

          {/* Add Custom Location Button/Input */}
          {isAddingLocation ? (
            <form onSubmit={handleAddCustomLocation} className="inline-flex items-center gap-1">
              <input
                type="text"
                autoFocus
                placeholder="City/Region (e.g. Toronto)"
                value={customLocationInput}
                onChange={(e) => setCustomLocationInput(e.target.value)}
                className="bg-slate-950 border border-emerald-500/60 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingLocation(false)}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingLocation(true)}
              className="px-3 py-1 rounded-xl text-xs font-bold border border-dashed border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 transition-all inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Location
            </button>
          )}
        </div>
      </div>

      {/* Skill Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        <button
          onClick={() => setSelectedSkill('All')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            selectedSkill === 'All'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          All Skills ({jobs.length})
        </button>

        {allSkills.map((skill) => (
          <button
            key={skill}
            onClick={() => setSelectedSkill(skill)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedSkill === skill
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {skill}
          </button>
        ))}
      </div>

      {/* Jobs Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all space-y-4 shadow-sm group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {job.title}
                  </h2>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 font-semibold mt-1">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Building className="w-3.5 h-3.5 text-slate-400" /> {job.company}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                    </span>
                  </div>
                </div>

                {job.match_score && (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 font-extrabold text-xs border border-emerald-500/20">
                    {job.match_score}% Match
                  </span>
                )}
              </div>

              {/* Source badge */}
              {job.source_name && (
                <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Globe className="w-3 h-3 text-emerald-400" /> Source: {job.source_name}
                </div>
              )}

              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{job.description}</p>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {job.skills_required.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[11px] font-medium border border-slate-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> {job.salary_range}
              </span>

              <div className="flex items-center space-x-2">
                <select
                  value={job.status}
                  onChange={(e) => onUpdateStatus(job.id, e.target.value as JobListing['status'])}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 font-medium focus:outline-none"
                >
                  <option value="Discovered">Discovered</option>
                  <option value="Saved">Saved</option>
                  <option value="Applied">Applied</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offered">Offered</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <button
                  onClick={() => {
                    onSelectJob(job.id);
                    setActiveTab('ranker');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
                >
                  Analyze Match
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
