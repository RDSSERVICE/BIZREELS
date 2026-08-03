import React from 'react';
import { FiMic, FiMicOff } from 'react-icons/fi';
import AdminModal from '../../../features/admin/components/AdminModal';

export default function AiReelGeneratorModal({
  isOpen,
  onClose,
  aiPrompt,
  setAiPrompt,
  isGeneratingAi,
  onSubmit,
  toggleVoiceRecording,
  isListeningVoice
}) {
  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Reels / AI Generator"
      maxWidth="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-bold text-text-tertiary uppercase block">
              Product Offer / Promo Description *
            </label>
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                isListeningVoice
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20'
              }`}
              title="Speak to dictate description"
            >
              {isListeningVoice ? <FiMicOff size={14} /> : <FiMic size={14} />}
              <span>{isListeningVoice ? 'Listening...' : 'Voice Dictate'}</span>
            </button>
          </div>
          <textarea
            rows={4}
            required
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Type or click 'Voice Dictate' to speak in Hindi/English... (e.g. Create a 15-second promo reel for 20% discount on AC repair service)"
            className="w-full p-3 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple"
          />
        </div>
        <button
          type="submit"
          disabled={isGeneratingAi}
          className="w-full py-3 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium flex items-center justify-center hover:brightness-110 disabled:opacity-50"
        >
          {isGeneratingAi ? 'AI Generating Reel...' : 'Generate AI Reel Video'}
        </button>
      </form>
    </AdminModal>
  );
}
