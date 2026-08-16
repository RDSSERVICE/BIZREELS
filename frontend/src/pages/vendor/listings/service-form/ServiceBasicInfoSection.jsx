import React from 'react';
import { FiCpu, FiMic, FiMicOff } from 'react-icons/fi';
import SearchableSelect from './SearchableSelect';

export default function ServiceBasicInfoSection({
  form,
  updateForm,
  handleCategoryChange,
  serviceCategories = [],
  serviceSubcategories = [],
  aiPrompt,
  setAiPrompt,
  isGeneratingAiDesc,
  isListeningVoice,
  toggleVoiceRecording,
  handleGenerateAiDescription,
  handleAiAutoFillMedia,
}) {
  return (
    <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">
          1. Basic Information
        </h4>
        <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <FiCpu size={12} /> AI Assisted
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SearchableSelect
          label="Category"
          placeholder="Search category..."
          value={form.category}
          onChange={handleCategoryChange}
          options={serviceCategories}
        />
        <SearchableSelect
          label="Subcategory"
          placeholder="Search subcategory..."
          value={form.subcategory}
          onChange={(val) => updateForm('subcategory', val)}
          options={serviceSubcategories}
        />
      </div>

      {/* AI Description Generator */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-brand-purple/10 via-brand-pink/10 to-brand-orange/10 border border-brand-purple/20 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-brand-purple flex items-center gap-1">
            <FiCpu size={14} /> AI Description Generator (Voice & Text)
          </span>
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
              isListeningVoice
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-brand-purple text-white hover:bg-brand-purple/90'
            }`}
            title="Speak details to AI"
          >
            {isListeningVoice ? <FiMicOff size={12} /> : <FiMic size={12} />}
            <span>{isListeningVoice ? 'Listening...' : 'Voice Input'}</span>
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Tell AI about your service specialty or speak via mic..."
            className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
          <button
            type="button"
            onClick={handleGenerateAiDescription}
            disabled={isGeneratingAiDesc}
            className="px-3.5 py-1.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 transition flex items-center gap-1 disabled:opacity-50 shrink-0"
          >
            <FiCpu size={13} />
            <span>{isGeneratingAiDesc ? 'Generating...' : 'Auto-Generate'}</span>
          </button>
        </div>

        {/* Real-time Media Auto-Fill */}
        <div className="pt-2 border-t border-brand-purple/10 space-y-1">
          <label className="text-[10px] font-bold text-brand-purple uppercase block">
            Or Upload Media for AI Specifications Auto-Fill
          </label>
          <input
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleAiAutoFillMedia}
            className="text-xs text-text-tertiary"
          />
          <p className="text-[9px] text-text-tertiary">
            Gemini will scan your sample photo/video/voice note to extract highlights & descriptions.
          </p>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-text-tertiary block mb-1">Short Description *</label>
        <input
          type="text"
          required
          value={form.shortDescription}
          onChange={(e) => updateForm('shortDescription', e.target.value)}
          placeholder="Brief 1-line summary..."
          className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] font-bold text-text-tertiary block">Detailed Description</label>
          <button
            type="button"
            onClick={handleGenerateAiDescription}
            className="text-[10px] font-bold text-brand-purple hover:underline flex items-center gap-0.5"
          >
            <FiCpu size={10} /> Re-generate AI Description
          </button>
        </div>
        <textarea
          rows={4}
          value={form.detailedDescription}
          onChange={(e) => updateForm('detailedDescription', e.target.value)}
          placeholder="Comprehensive service breakdown..."
          className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
        />
      </div>

      <div>
        <label className="text-[10px] font-bold text-text-tertiary block mb-1">Service Highlights</label>
        <textarea
          rows={2}
          value={form.serviceHighlights}
          onChange={(e) => updateForm('serviceHighlights', e.target.value)}
          placeholder="Key features and highlights..."
          className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
        />
      </div>
    </div>
  );
}
