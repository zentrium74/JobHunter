import { JobListing } from '../types';
import { Columns, ArrowRight, DollarSign, MapPin, Building } from 'lucide-react';

interface CRMPipelineProps {
  jobs: JobListing[];
  onUpdateStatus: (jobId: string, status: JobListing['status']) => void;
  setActiveTab: (tab: string) => void;
  setSelectedJobId: (jobId: string) => void;
}

const COLUMNS: Array<{ id: JobListing['status']; label: string; color: string }> = [
  { id: 'Saved', label: 'Saved', color: 'border-slate-700 bg-slate-900/50' },
  { id: 'Applied', label: 'Applied', color: 'border-indigo-500/30 bg-indigo-950/20' },
  { id: 'Interviewing', label: 'Interviewing', color: 'border-amber-500/30 bg-amber-950/20' },
  { id: 'Offered', label: 'Offered', color: 'border-emerald-500/30 bg-emerald-950/20' },
  { id: 'Rejected', label: 'Rejected', color: 'border-rose-500/30 bg-rose-950/20' }
];

export const CRMPipeline: React.FC<CRMPipelineProps> = ({
  jobs,
  onUpdateStatus,
  setActiveTab,
  setSelectedJobId
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Columns className="w-6 h-6 text-emerald-400" /> Application Pipeline CRM
          </h1>
          <p className="text-xs text-slate-400">Track your job applications from saved leads to final offers</p>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col.id);
          return (
            <div
              key={col.id}
              className={`rounded-2xl border p-4 flex flex-col space-y-3 min-h-[500px] ${col.color}`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white tracking-wide uppercase">{col.label}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-950 text-slate-300 border border-slate-800">
                  {colJobs.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {colJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 space-y-3 shadow-md hover:border-emerald-500/40 transition-all group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <Building className="w-3 h-3" /> {job.company}
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-400">
                          {job.match_score || 90}% Match
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {job.title}
                      </h4>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" /> {job.location}
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-slate-300">
                        <DollarSign className="w-3 h-3 text-emerald-400" /> {job.salary_range}
                      </div>
                    </div>

                    {/* Move Controls */}
                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                      <select
                        value={job.status}
                        onChange={(e) => onUpdateStatus(job.id, e.target.value as JobListing['status'])}
                        className="bg-slate-900 text-[10px] text-slate-300 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.id} value={c.id}>
                            Move to {c.label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => {
                          setSelectedJobId(job.id);
                          setActiveTab('generator');
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 transition-all text-xs"
                        title="Tailor Application Docs"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {colJobs.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-500 font-medium">
                    No roles in {col.label}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
