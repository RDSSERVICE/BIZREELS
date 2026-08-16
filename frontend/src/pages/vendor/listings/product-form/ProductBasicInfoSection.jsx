import React from 'react';
import { FiCpu, FiMic, FiMicOff, FiRefreshCw, FiPlus, FiX } from 'react-icons/fi';

export default function ProductBasicInfoSection({
  form,
  updateForm,
  aiPrompt,
  setAiPrompt,
  isListeningVoice,
  toggleVoiceRecording,
  handleGenerateAiDescription,
  handleAiAutoFillMedia,
  generateSKU,
  handleAddTag,
  handleRemoveTag,
}) {
  return (
    <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">
          Basic Product Details
        </h4>
        <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <FiCpu size={12} /> AI Assisted
        </span>
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
            placeholder="Tell AI about product features or speak via mic..."
            className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
          <button
            type="button"
            onClick={handleGenerateAiDescription}
            disabled={form.isAiGenerating}
            className="px-3.5 py-1.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 transition flex items-center gap-1 disabled:opacity-50 shrink-0"
          >
            <FiCpu size={13} />
            <span>{form.isAiGenerating ? 'Generating...' : 'Auto-Generate'}</span>
          </button>
        </div>

        {/* Real-time Media Auto-Fill */}
        <div className="pt-2 border-t border-brand-purple/10 space-y-1">
          <label className="text-[10px] font-bold text-brand-purple uppercase block">
            Or Upload Product Media for AI Auto-Fill
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleAiAutoFillMedia}
            className="text-xs text-text-tertiary"
          />
          <p className="text-[9px] text-text-tertiary">
            Gemini will scan your sample photo/video to extract highlights & descriptions.
          </p>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-text-tertiary block mb-1">Product Title *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => updateForm('title', e.target.value)}
          placeholder="e.g. Wireless Noise-Cancelling Headphones"
          className="w-full p-2.5 bg-surface border rounded-xl text-xs text-text-primary"
        />
      </div>

      <div>
        <label className="text-[10px] font-bold text-text-tertiary block mb-1">Short Description</label>
        <input
          type="text"
          value={form.shortDescription}
          onChange={(e) => updateForm('shortDescription', e.target.value)}
          placeholder="Brief 1-line summary..."
          className="w-full p-2.5 bg-surface border rounded-xl text-xs text-text-primary"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] font-bold text-text-tertiary block">Full Description</label>
          <button
            type="button"
            onClick={handleGenerateAiDescription}
            className="text-[10px] font-bold text-brand-purple hover:underline flex items-center gap-0.5"
          >
            <FiCpu size={10} /> Re-generate AI Description
          </button>
        </div>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => updateForm('description', e.target.value)}
          placeholder="Comprehensive product details..."
          className="w-full p-2.5 bg-surface border rounded-xl text-xs text-text-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Brand</label>
          <input
            type="text"
            value={form.brand}
            onChange={(e) => updateForm('brand', e.target.value)}
            placeholder="e.g. Sony"
            className="w-full p-2.5 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-bold text-text-tertiary block">SKU Code</label>
            <button
              type="button"
              onClick={generateSKU}
              className="text-[9px] font-bold text-brand-purple hover:underline flex items-center gap-0.5"
            >
              <FiRefreshCw size={9} /> Auto-Generate
            </button>
          </div>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => updateForm('sku', e.target.value)}
            placeholder="SKU-XXX-000"
            className="w-full p-2.5 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary block mb-1">Tags / Keywords</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.newTag}
            onChange={(e) => updateForm('newTag', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Type tag & press Enter or Add..."
            className="flex-1 p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-3 bg-brand-purple/10 text-brand-purple rounded-xl text-xs font-bold hover:bg-brand-purple/20 transition flex items-center gap-1"
          >
            <FiPlus size={13} /> Add
          </button>
        </div>
        {form.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.tags.map((t, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-brand-purple/10 text-brand-purple text-[10px] font-bold rounded-lg flex items-center gap-1"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(idx)}
                  className="hover:text-red-500"
                >
                  <FiX size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
