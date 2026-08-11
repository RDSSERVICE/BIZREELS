import React, { useState, useEffect } from 'react';
import { FiMic, FiMicOff, FiArrowLeft, FiSend, FiCpu, FiZap, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminModal from '../../../features/admin/components/AdminModal';
import { aiApi } from '../../../lib/api';

const LOADING_PHRASES = [
  "Gemini is analyzing your promo idea...",
  "Structuring engaging ad hook and CTA...",
  "Detecting appropriate marketplace categories...",
  "Generating descriptive prompt for ad visualizer...",
  "AI Image Generator is sketching cinematic showcase...",
  "Uploading generated WebP assets to cloud storage..."
];

export default function AiReelGeneratorModal({ isOpen, onClose, refetch, createReel }) {
  const [step, setStep] = useState('input'); // 'input' | 'generating' | 'preview'
  const [prompt, setPrompt] = useState('');
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);

  // Generated AI Content
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [subCategoryName, setSubCategoryName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');

  const [isPublishing, setIsPublishing] = useState(false);

  // Cycle through loading phrases
  useEffect(() => {
    let interval;
    if (step === 'generating') {
      setLoadingPhraseIndex(0);
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Reset modal state on close/open
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setPrompt('');
      setIsListeningVoice(false);
      setCaption('');
      setImageUrl('');
      setCategoryName('');
      setSubCategoryName('');
      setCategoryId('');
      setSubCategoryId('');
      setIsPublishing(false);
    }
  }, [isOpen]);

  const toggleVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return toast.error('Voice input is not supported in this browser. Please type your prompt.');
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Dictates Hindi & English hybrid beautifully

      recognition.onstart = () => {
        setIsListeningVoice(true);
        toast.success('🎙️ Dictating... Speak now (Hindi or English)');
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListeningVoice(false);
        toast.error(`Voice dictation error: ${event.error}`);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch (err) {
      setIsListeningVoice(false);
      toast.error('Failed to start voice recognition');
    }
  };

  const handleGenerateAiReel = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return toast.error('Please enter a description for your promo reel.');

    setStep('generating');
    try {
      const res = await aiApi.generateReel(prompt.trim());
      const data = res.data || res;

      if (data && data.success) {
        setCaption(data.caption);
        setImageUrl(data.mediaUrl);
        setCategoryName(data.category_name);
        setSubCategoryName(data.sub_category_name);
        setCategoryId(data.category_id);
        setSubCategoryId(data.sub_category_id);
        setStep('preview');
        toast.success('AI ad assets generated successfully!');
      } else {
        throw new Error(data.error || 'Failed to parse AI output');
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || 'AI Generation failed. Please try again.');
      setStep('input');
    }
  };

  const handlePublishReel = async () => {
    if (!caption.trim()) return toast.error('Caption cannot be empty');
    
    setIsPublishing(true);
    const toastId = toast.loading('Publishing your AI Reel post...');
    try {
      await createReel({
        title: caption.substring(0, 100),
        caption,
        postType: 'service',
        category: categoryName || 'General',
        subcategory: subCategoryName || 'General',
        postPurpose: 'AI Promotion',
        mediaUrls: [imageUrl],
        videoUrl: imageUrl, // Fallback videoUrl parameter for database Schema validation
        mediaType: 'image',
        status: 'published'
      }).unwrap();

      toast.success('🟢 AI Video/Image Ad Published successfully to feed!', { id: toastId });
      refetch();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || err?.message || 'Failed to publish post', { id: toastId });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Reels / AI Studio"
      maxWidth={step === 'preview' ? 'max-w-4xl' : 'max-w-xl'}
    >
      {/* STEP 1: INPUT PROMPT */}
      {step === 'input' && (
        <form onSubmit={handleGenerateAiReel} className="space-y-4 text-left">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">
              Describe your offer, product, or service *
            </label>
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                isListeningVoice
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20'
              }`}
              title="Click to dictate promo details"
            >
              {isListeningVoice ? <FiMicOff size={13} /> : <FiMic size={13} />}
              <span>{isListeningVoice ? 'Listening...' : 'Voice Dictate'}</span>
            </button>
          </div>

          <textarea
            rows={4}
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Write a 15-second promo reel for a 20% discount on house cleaning services for Independence Day, highlight same-day booking..."
            className="w-full p-4 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-purple transition"
          />

          <p className="text-[10px] text-text-tertiary leading-relaxed">
            💡 <strong>Tip:</strong> Provide details like specific discounts, service areas, or brand strengths. The AI content guard will block contact numbers, URLs or social handles.
          </p>

          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-orange-500 text-white font-extrabold text-xs shadow-premium flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <FiCpu size={15} />
            <span>GENERATE AI AD REEL</span>
          </button>
        </form>
      )}

      {/* STEP 2: LOADING GENERATION */}
      {step === 'generating' && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-brand-purple/20 border-t-brand-purple animate-spin" />
            <FiZap size={24} className="text-brand-purple absolute animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Ad Magic in Progress</h4>
            <p className="text-xs text-text-secondary h-8 animate-fade-in font-medium max-w-sm mx-auto">
              {LOADING_PHRASES[loadingPhraseIndex]}
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & EDIT */}
      {step === 'preview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Ad Media Preview Column */}
          <div className="space-y-3">
            <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">
              Generated Ad Image Visual
            </label>
            <div className="aspect-[9/16] bg-black border border-white/10 rounded-2xl overflow-hidden relative shadow-card">
              <img
                src={imageUrl || 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4'}
                alt="AI Generated Showcase"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-brand-purple text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                <FiZap size={10} />
                <span>AI Generated</span>
              </div>
            </div>
          </div>

          {/* Ad Metadata & Captions Column */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block mb-1.5">
                  AI Generated Promo Script / Caption
                </label>
                <textarea
                  rows={8}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full p-4 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-purple transition leading-relaxed"
                  placeholder="Review or edit your generated ad script..."
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block mb-1.5">
                  Classified Category & Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {categoryName && (
                    <span className="px-3 py-1 rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20 text-xs font-bold">
                      📂 {categoryName}
                    </span>
                  )}
                  {subCategoryName && (
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
                      🏷️ {subCategoryName}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                    🚀 AI Campaign
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handlePublishReel}
                disabled={isPublishing}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-orange-500 text-white font-extrabold text-xs shadow-premium flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-200"
              >
                <FiSend size={14} />
                <span>{isPublishing ? 'PUBLISHING...' : 'PUBLISH AI REEL POST'}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="flex-1 py-3 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <FiArrowLeft size={13} />
                  <span>Edit Prompt</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAiReel}
                  className="flex-1 py-3 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <FiRefreshCw size={13} />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminModal>
  );
}
