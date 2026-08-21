import React from 'react';
import { FiCpu, FiMic, FiMicOff, FiRefreshCw, FiPlus, FiX } from 'react-icons/fi';
import { useLanguage } from '../../../../context/LanguageContext';

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
  const { bi } = useLanguage();

  return (
    <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">
          {bi('Basic Product Details', 'उत्पाद की बुनियादी विवरण')}
        </h4>
        <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <FiCpu size={12} /> {bi('AI Assisted', 'एआई सहायता')}
        </span>
      </div>

      {/* AI Description Generator */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-brand-purple/10 via-brand-pink/10 to-brand-orange/10 border border-brand-purple/20 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-brand-purple flex items-center gap-1">
            <FiCpu size={14} /> {bi('AI Description Generator (Voice & Text)', 'एआई विवरण जनरेटर (आवाज और पाठ)')}
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
            <span>{isListeningVoice ? bi('Listening...', 'सुन रहा है...') : bi('Voice Input', 'वॉइस इनपुट')}</span>
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={bi("Tell AI about product features or speak via mic...", "उत्पाद सुविधाओं के बारे में एआई को बताएं या माइक के माध्यम से बोलें...")}
            className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
          <button
            type="button"
            onClick={handleGenerateAiDescription}
            disabled={form.isAiGenerating}
            className="px-3.5 py-1.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 transition flex items-center gap-1 disabled:opacity-50 shrink-0"
          >
            <FiCpu size={13} />
            <span>{form.isAiGenerating ? bi('Generating...', 'बनाया जा रहा है...') : bi('Auto-Generate', 'ऑटो जनरेट')}</span>
          </button>
        </div>

        {/* Real-time Media Auto-Fill */}
        <div className="pt-2 border-t border-brand-purple/10 space-y-1">
          <label className="text-[10px] font-bold text-brand-purple uppercase block">
            {bi('Or Upload Product Media for AI Auto-Fill', 'या एआई ऑटो-फिल के लिए उत्पाद मीडिया अपलोड करें')}
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleAiAutoFillMedia}
            className="text-xs text-text-tertiary"
          />
          <p className="text-[9px] text-text-tertiary">
            {bi('Gemini will scan your sample photo/video to extract highlights & descriptions.', 'जेमिनी मुख्य अंश और विवरण निकालने के लिए आपके नमूना फोटो/वीडियो को स्कैन करेगा।')}
          </p>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-text-tertiary block mb-1">{bi('Product Title *', 'उत्पाद शीर्षक *')}</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => updateForm('title', e.target.value)}
          placeholder={bi("e.g. Wireless Noise-Cancelling Headphones", "उदा. वायरलेस नॉइज़-कैंसलिंग हेडफ़ोन")}
          className="w-full p-2.5 bg-surface border rounded-xl text-xs text-text-primary"
        />
      </div>

      <div>
        <label className="text-[10px] font-bold text-text-tertiary block mb-1">{bi('Short Description', 'संक्षिप्त विवरण')}</label>
        <input
          type="text"
          value={form.shortDescription}
          onChange={(e) => updateForm('shortDescription', e.target.value)}
          placeholder={bi("Brief 1-line summary...", "संक्षिप्त 1-पंक्ति सारांश...")}
          className="w-full p-2.5 bg-surface border rounded-xl text-xs text-text-primary"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] font-bold text-text-tertiary block">{bi('Full Description', 'पूरा विवरण')}</label>
          <button
            type="button"
            onClick={handleGenerateAiDescription}
            className="text-[10px] font-bold text-brand-purple hover:underline flex items-center gap-0.5"
          >
            <FiCpu size={10} /> {bi('Re-generate AI Description', 'पुनः एआई विवरण जनरेट करें')}
          </button>
        </div>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => updateForm('description', e.target.value)}
          placeholder={bi("Comprehensive product details...", "व्यापक उत्पाद विवरण...")}
          className="w-full p-2.5 bg-surface border rounded-xl text-xs text-text-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">{bi('Brand', 'ब्रांड (Brand)')}</label>
          <input
            type="text"
            value={form.brand}
            onChange={(e) => updateForm('brand', e.target.value)}
            placeholder={bi("e.g. Sony", "उदा. सोनी")}
            className="w-full p-2.5 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-bold text-text-tertiary block">{bi('SKU Code', 'एसकेयू कोड')}</label>
            <button
              type="button"
              onClick={generateSKU}
              className="text-[9px] font-bold text-brand-purple hover:underline flex items-center gap-0.5"
            >
              <FiRefreshCw size={9} /> {bi('Auto-Generate', 'ऑटो जनरेट')}
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
        <label className="text-[10px] font-bold text-text-tertiary block mb-1">{bi('Tags / Keywords', 'टैग / कीवर्ड')}</label>
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
            placeholder={bi("Type tag & press Enter or Add...", "टैग टाइप करें और एंटर दबाएं या जोड़ें...")}
            className="flex-1 p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-3 bg-brand-purple/10 text-brand-purple rounded-xl text-xs font-bold hover:bg-brand-purple/20 transition flex items-center gap-1"
          >
            <FiPlus size={13} /> {bi('Add', 'जोड़ें')}
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
