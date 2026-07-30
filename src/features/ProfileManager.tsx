import { useState } from 'react';
import { CandidateProfile } from '../types';
import { User, Plus, X, Save, Check } from 'lucide-react';

interface ProfileManagerProps {
  profile: CandidateProfile;
  onUpdateProfile: (updated: CandidateProfile) => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({ profile, onUpdateProfile }) => {
  const [formData, setFormData] = useState<CandidateProfile>(profile);
  const [newSkill, setNewSkill] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-400" /> Candidate Profile & Mem0 Store
          </h1>
          <p className="text-xs text-slate-400">Configure your target titles, skills, and bio used for AI matching & tailoring</p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Candidate Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Target Role Title</label>
            <input
              type="text"
              value={formData.target_title}
              onChange={(e) => setFormData({ ...formData, target_title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Years of Experience</label>
            <input
              type="number"
              value={formData.experience_years}
              onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Target Salary Range ($ USD)</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={formData.target_salary_min}
                onChange={(e) => setFormData({ ...formData, target_salary_min: parseInt(e.target.value) || 0 })}
                className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                placeholder="Min"
              />
              <span className="text-slate-500 text-xs">-</span>
              <input
                type="number"
                value={formData.target_salary_max}
                onChange={(e) => setFormData({ ...formData, target_salary_max: parseInt(e.target.value) || 0 })}
                className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                placeholder="Max"
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Professional Bio & Experience Summary</label>
          <textarea
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium leading-relaxed"
          />
        </div>

        {/* Skills Tag Editor */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-300">Core Technical Skills & Stack</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add skill (e.g. PyTorch, React, Docker)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 flex-1"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-xl bg-slate-950 text-emerald-400 font-semibold border border-emerald-500/20 text-xs flex items-center gap-2"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            {isSaved ? <Check className="w-4 h-4 text-slate-950" /> : <Save className="w-4 h-4" />}
            {isSaved ? 'Saved to Mem0 Store' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
