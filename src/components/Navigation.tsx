import { Target, Search, Cpu, FileText, Columns, User, Sparkles, Key } from 'lucide-react';
import { LLMSettings } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  jobCount: number;
  onOpenSettings: () => void;
  settings: LLMSettings;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  jobCount,
  onOpenSettings,
  settings
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Target },
    { id: 'jobs', label: 'Jobs & Scraper', icon: Search, badge: jobCount },
    { id: 'ranker', label: 'AI Match Ranker', icon: Cpu },
    { id: 'generator', label: 'Tailor & Generate', icon: FileText },
    { id: 'crm', label: 'Pipeline CRM', icon: Columns },
    { id: 'profile', label: 'Profile Store', icon: User },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">JobHunter</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> AI 3.6
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Local-First Job Intelligence</p>
            </div>
          </div>

          {/* Right Navigation & LLM Settings Button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <nav className="flex items-center space-x-1 sm:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                      isActive
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="hidden md:inline">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* BYOK Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm"
              title="Bring Your Own API Key & Model Settings"
            >
              <Key className="w-4 h-4" />
              <span className="hidden lg:inline capitalize">{settings.provider}: {settings.model.split(':')[0]}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
