import { useState } from 'react';
import { LLMSettings } from '../types';
import { updateSettings } from '../api/client';
import { Settings, Key, Cpu, Check, X, Shield, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: LLMSettings;
  onSave: (newSettings: LLMSettings) => void;
}

const PRESET_MODELS: Record<string, string[]> = {
  ollama: ['qwen2.5-coder:7b', 'llama3.2', 'gemma4:latest', 'ornith:9b'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o1-preview'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
  groq: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash']
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave
}) => {
  const [settings, setSettings] = useState<LLMSettings>(currentSettings);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleProviderChange = (provider: LLMSettings['provider']) => {
    const defaultModel = PRESET_MODELS[provider]?.[0] || 'qwen2.5-coder:7b';
    setSettings({ ...settings, provider, model: defaultModel });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updated = await updateSettings(settings);
    onSave(updated);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Bring Your Own LLM & Key</h2>
              <p className="text-xs text-slate-400">Configure custom LLM models & API keys directly in the app</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Select LLM Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {(['ollama', 'openai', 'anthropic', 'groq', 'gemini'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                    settings.provider === p
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {p === 'ollama' ? 'Ollama (Local)' : p}
                </button>
              ))}
            </div>
          </div>

          {/* Model Name Input & Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Model Name</span>
              <span className="text-[10px] text-emerald-400 font-mono">Active: {settings.model}</span>
            </label>
            <input
              type="text"
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              placeholder="e.g. qwen2.5-coder:7b or gpt-4o"
              required
            />

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_MODELS[settings.provider]?.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setSettings({ ...settings, model: preset })}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-all ${
                    settings.model === preset
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* API Key Field (if not Ollama) */}
          {settings.provider !== 'ollama' ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <span>{settings.provider.toUpperCase()} API Key</span>
                <span className="text-slate-500 text-[10px]">(Stored locally in browser/backend)</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.api_key || ''}
                  onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                  placeholder={`Enter your ${settings.provider} key (sk-...)`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <Cpu className="w-4 h-4" />
                <span>Ollama Runs Keyless Locally</span>
              </div>
              <p>Make sure Ollama is running at <code>http://localhost:11434</code>.</p>
            </div>
          )}

          {/* Security note */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Keys remain on your machine and are never transmitted to third-party tracking servers.</span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
              {savedSuccess ? 'Settings Saved!' : isSaving ? 'Saving...' : 'Save & Apply LLM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
