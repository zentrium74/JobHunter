import { useState, useEffect } from 'react';
import { JobListing, CandidateProfile, SystemStats, LLMSettings } from './types';
import { fetchJobs, fetchStats, fetchSettings, INITIAL_PROFILE, triggerScrape } from './api/client';
import { Navigation } from './components/Navigation';
import { SettingsModal } from './components/SettingsModal';
import { Dashboard } from './features/Dashboard';
import { JobBoard } from './features/JobBoard';
import { AIRanker } from './features/AIRanker';
import { DocGenerator } from './features/DocGenerator';
import { CRMPipeline } from './features/CRMPipeline';
import { ProfileManager } from './features/ProfileManager';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [profile, setProfile] = useState<CandidateProfile>(INITIAL_PROFILE);
  const [selectedJobId, setSelectedJobId] = useState<string>('job-1');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<LLMSettings>({
    provider: 'ollama',
    model: 'qwen2.5-coder:7b',
    api_key: ''
  });
  const [stats, setStats] = useState<SystemStats>({
    total_jobs_scraped: 4,
    saved: 1,
    applied: 1,
    interviewing: 1,
    offered: 0,
    avg_match_score: 90,
    interview_rate_pct: 100
  });

  useEffect(() => {
    fetchJobs().then((data) => {
      setJobs(data);
      fetchStats(data).then(setStats);
    });
    fetchSettings().then(setSettings);
  }, []);

  const handleScrape = async (query: string, location: string) => {
    const newJob = await triggerScrape(query, location);
    const updatedJobs = [newJob, ...jobs];
    setJobs(updatedJobs);
    setSelectedJobId(newJob.id);
    const updatedStats = await fetchStats(updatedJobs);
    setStats(updatedStats);
  };

  const handleUpdateStatus = (jobId: string, newStatus: JobListing['status']) => {
    const updated = jobs.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j));
    setJobs(updated);
    fetchStats(updated).then(setStats);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        jobCount={jobs.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
      />

      {/* Main Content View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            jobs={jobs}
            setActiveTab={setActiveTab}
            setSelectedJobId={setSelectedJobId}
            onOpenSettings={() => setIsSettingsOpen(true)}
            settings={settings}
          />
        )}

        {activeTab === 'jobs' && (
          <JobBoard
            jobs={jobs}
            onScrape={handleScrape}
            onSelectJob={setSelectedJobId}
            onUpdateStatus={handleUpdateStatus}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'ranker' && (
          <AIRanker
            jobs={jobs}
            selectedJobId={selectedJobId}
            setSelectedJobId={setSelectedJobId}
            profile={profile}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'generator' && (
          <DocGenerator
            jobs={jobs}
            selectedJobId={selectedJobId}
            setSelectedJobId={setSelectedJobId}
            profile={profile}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'crm' && (
          <CRMPipeline
            jobs={jobs}
            onUpdateStatus={handleUpdateStatus}
            setActiveTab={setActiveTab}
            setSelectedJobId={setSelectedJobId}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileManager
            profile={profile}
            onUpdateProfile={setProfile}
          />
        )}
      </main>

      {/* Bring Your Own Key Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={settings}
        onSave={setSettings}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>JobHunter 🎯 — Local-First AI Job Intelligence Workbench</span>
          <span>Active LLM: {settings.provider.toUpperCase()} ({settings.model})</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
