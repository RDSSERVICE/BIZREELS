import React, { useState } from 'react';
import { FiCpu, FiFileText, FiImage, FiVideo, FiMic, FiClock, FiKey, FiSliders } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import {
  useGetIntegrationSettingsQuery,
  useUpdateIntegrationSettingsMutation,
  useTestIntegrationMutation,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'usage', label: 'AI Credits & Usage', icon: FiCpu },
  { key: 'prompts', label: 'Prompt History', icon: FiClock },
  { key: 'settings', label: 'OpenAI / Gemini / Claude Settings', icon: FiKey },
];

export default function AdminAiPage() {
  const [activeTab, setActiveTab] = useState('usage');
  const { data: settings } = useGetIntegrationSettingsQuery(undefined, { pollingInterval: 5000 });
  const [updateSettings] = useUpdateIntegrationSettingsMutation();
  const [testIntegration] = useTestIntegrationMutation();

  const [aiKeys, setAiKeys] = useState({
    openai_key: '',
    gemini_key: '',
    claude_key: '',
    default_model: 'gemini-3.5-flash',
  });

  const mockPrompts = [
    { id: '1', type: 'Description', prompt: 'Generate SEO description for Gaming Laptop RTX 4060', tokens: 320, provider: 'Gemini', created_at: new Date().toISOString() },
    { id: '2', type: 'Image', prompt: 'Modern luxury spa salon banner background', tokens: 1200, provider: 'Cloudinary AI', created_at: new Date().toISOString() },
    { id: '3', type: 'Voice', prompt: 'Voiceover for 15s reel advertisement', tokens: 450, provider: 'OpenAI TTS', created_at: new Date().toISOString() },
  ];

  const handleTestAi = async () => {
    try {
      const res = await testIntegration('ai_content').unwrap();
      toast.success(res.ok ? 'AI Integration test passed!' : 'Test failed: ' + (res.error || 'Check API keys'));
    } catch (err) {
      toast.error(err?.data?.message || 'Test failed');
    }
  };

  const handleSaveKeys = async () => {
    try {
      await updateSettings({ ai_content: aiKeys }).unwrap();
      toast.success('AI Integration keys saved!');
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed');
    }
  };

  const columns = [
    {
      key: 'type',
      label: 'Generation Type',
      render: (val) => (
        <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
          {val}
        </span>
      ),
    },
    {
      key: 'prompt',
      label: 'Prompt Query',
      render: (val) => <span className="text-text-primary text-xs font-mono truncate max-w-[280px] block">{val}</span>,
    },
    {
      key: 'provider',
      label: 'AI Model / Provider',
      render: (val) => <span className="font-bold text-xs text-text-secondary">{val}</span>,
    },
    {
      key: 'tokens',
      label: 'Tokens / Credits',
      render: (val) => <span className="font-bold text-amber-500">{val} credits</span>,
    },
    {
      key: 'created_at',
      label: 'Time',
      render: (val) => <span className="text-text-tertiary text-xs">{val ? new Date(val).toLocaleTimeString() : '—'}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiCpu}
        title="AI Generation & API Management"
        subtitle="Track AI credits used, Description/Image/Video/Voice generations, prompt history, and configure OpenAI, Gemini & Claude keys"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'usage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass p-5 rounded-2xl border border-white/50 shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-xl"><FiFileText className="w-5 h-5" /></div>
                <div>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase block">Description Gen</span>
                  <span className="text-xl font-black text-text-primary font-display">1,420 calls</span>
                </div>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/50 shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-pink/10 text-brand-pink rounded-xl"><FiImage className="w-5 h-5" /></div>
                <div>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase block">Image Gen</span>
                  <span className="text-xl font-black text-text-primary font-display">380 calls</span>
                </div>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/50 shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl"><FiVideo className="w-5 h-5" /></div>
                <div>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase block">Video Gen</span>
                  <span className="text-xl font-black text-text-primary font-display">115 calls</span>
                </div>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/50 shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><FiMic className="w-5 h-5" /></div>
                <div>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase block">Voice Gen</span>
                  <span className="text-xl font-black text-text-primary font-display">210 calls</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prompts' && (
        <AdminDataTable
          columns={columns}
          data={mockPrompts}
          searchPlaceholder="Search prompt history..."
          testId="ai-prompts-table"
        />
      )}

      {activeTab === 'settings' && (
        <div className="glass p-6 rounded-2xl border border-white/50 max-w-2xl space-y-4">
          <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-2 flex items-center gap-2">
            <FiKey className="text-brand-purple" /> API Provider Credentials
          </h3>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">OpenAI API Key</label>
            <input
              type="password"
              placeholder="sk-..."
              value={aiKeys.openai_key}
              onChange={(e) => setAiKeys((prev) => ({ ...prev, openai_key: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Google Gemini API Key</label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={aiKeys.gemini_key}
              onChange={(e) => setAiKeys((prev) => ({ ...prev, gemini_key: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Anthropic Claude API Key</label>
            <input
              type="password"
              placeholder="sk-ant-..."
              value={aiKeys.claude_key}
              onChange={(e) => setAiKeys((prev) => ({ ...prev, claude_key: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveKeys}
              className="flex-1 py-2.5 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all"
            >
              Save API Keys
            </button>
            <button
              onClick={handleTestAi}
              className="px-4 py-2.5 bg-surface-tertiary text-text-secondary hover:bg-brand-purple/10 hover:text-brand-purple rounded-xl text-xs font-bold transition-all border border-border"
            >
              Test Connection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
