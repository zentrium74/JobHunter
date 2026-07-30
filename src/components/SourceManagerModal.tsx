import { useState } from 'react';
import { JobSource } from '../types';
import { updateSources } from '../api/client';
import { Globe, Plus, Trash2, Check, X, Layers } from 'lucide-react';

interface SourceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: JobSource[];
  onSave: (updated: JobSource[]) => void;
  onTriggerScrape: () => void;
}

export const SourceManagerModal: React.FC<SourceManagerModalProps> = ({
  isOpen,
  onClose,
  sources,
  onSave,
  onTriggerScrape
}) => {
  const [sourceList, setSourceList] = useState<JobSource[]>(sources);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<JobSource['type']>('api');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleAddSource = () => {
    if (newName.trim() && newUrl.trim()) {
      const item: JobSource = {
        id: `custom-${Date.now()}`,
        name: newName.trim(),
        type: newType,
        url: newUrl.trim(),
        enabled: true
      };
      setSourceList([...sourceList, item]);
      setNewName('');
      setNewUrl('');
    }
  };

  const handleToggleSource = (id: string) => {
    setSourceList(
      sourceList.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleDeleteSource = (id: string) => {
    setSourceList(sourceList.filter((s) => s.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await updateSources(sourceList);
    onSave(updated);
    setIsSaved(true);
    onTriggerScrape();
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Custom Job Sourcing Channels</h2>
              <p className="text-xs text-slate-400">Add custom URLs, Greenhouse/Lever handles, or RSS feeds</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Source Form */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-400" /> Add New Job Channel / Feed
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Channel Name (e.g. Stripe Careers)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Feed URL or Handle"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 sm:col-span-2"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400 font-semibold">Type:</span>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as JobSource['type'])}
                className="bg-slate-900 text-xs text-slate-300 border border-slate-800 rounded-lg px-2 py-1"
              >
                <option value="api">Public Job API</option>
                <option value="greenhouse">Greenhouse ATS</option>
                <option value="lever">Lever ATS</option>
                <option value="rss">RSS / Atom Feed</option>
                <option value="json">Custom JSON</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleAddSource}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Channel
            </button>
          </div>
        </div>

        {/* Existing Source List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-300">Active Job Channels ({sourceList.length})</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin pr-1">
            {sourceList.map((source) => (
              <div
                key={source.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleSource(source.id)}
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      source.enabled
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {source.enabled && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {source.name}
                      <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono bg-slate-900 text-slate-400 border border-slate-800">
                        {source.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate max-w-xs">{source.url}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteSource(source.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            {isSaved ? 'Channels Saved!' : 'Save Channels & Scrape'}
          </button>
        </div>
      </div>
    </div>
  );
};
