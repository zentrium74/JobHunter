import { useState } from 'react';
import { JobListing } from '../types';
import { Columns, ArrowRight, DollarSign, MapPin, Building, Search, GripVertical } from 'lucide-react';

interface CRMPipelineProps {
  jobs: JobListing[];
  onUpdateStatus: (jobId: string, status: JobListing['status']) => void;
  setActiveTab: (tab: string) => void;
  setSelectedJobId: (jobId: string) => void;
}

const COLUMNS: Array<{ id: JobListing['status']; label: string; color: string }> = [
  { id: 'Discovered', label: 'Discovered', color: 'border-slate-800 bg-slate-900/40' },
  { id: 'Saved', label: 'Saved', color: 'border-indigo-500/30 bg-indigo-950/20' },
  { id: 'Applied', label: 'Applied', color: 'border-amber-500/30 bg-amber-950/20' },
  { id: 'Interviewing', label: 'Interviewing', color: 'border-purple-500/30 bg-purple-950/20' },
  { id: 'Offered', label: 'Offered', color: 'border-emerald-500/30 bg-emerald-950/20' }
];

export const CRMPipeline: React.FC<CRMPipelineProps> = ({
  jobs,
  onUpdateStatus,
  setActiveTab,
  setSelectedJobId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    setDraggedJobId(jobId);
    e.dataTransfer.setData('text/plain', jobId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: JobListing['status']) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData('text/plain') || draggedJobId;
    if (jobId) {
      onUpdateStatus(jobId, targetStatus);
      setDraggedJobId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Columns className="w-6 h-6 text-emerald-400" /> Interactive Kanban CRM Pipeline
          </h1>
          <p className="text-xs text-slate-400">Drag & drop job applications across columns to update their status live</p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter pipeline roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colJobs = filteredJobs.filter((j) => j.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-2xl border p-4 flex flex-col space-y-3 min-h-[520px] transition-all ${col.color}`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white tracking-wide uppercase">{col.label}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-950 text-slate-300 border border-slate-800">
                  {colJobs.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {colJobs.map((job) => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, job.id)}
                    className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 space-y-3 shadow-md hover:border-emerald-500/50 transition-all cursor-grab active:cursor-grabbing group relative"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
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
                  <div className="text-center py-12 text-xs text-slate-500 font-medium border border-dashed border-slate-800/60 rounded-xl">
                    Drop roles here
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
