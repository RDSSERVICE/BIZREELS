import React from 'react';
import { FiCamera } from 'react-icons/fi';
import AdminModal from '../../../features/admin/components/AdminModal';

export default function InteractiveLiveModal({
  isOpen,
  onClose,
  liveVideoRef,
  isStreaming,
  cameraError,
  liveTitle,
  setLiveTitle,
  handleToggleLiveStream
}) {
  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Go Live Interactive Console"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-center">
        <div className="aspect-video bg-black rounded-2xl relative flex items-center justify-center overflow-hidden border border-border">
          <video
            ref={liveVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {isStreaming && (
            <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full animate-pulse backdrop-blur-sm border border-white/20 shadow-md">
              🔴 LIVE BROADCASTING NOW
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center text-rose-400 text-xs space-y-2">
              <FiCamera size={32} className="opacity-70" />
              <p className="font-bold">{cameraError}</p>
              <p className="text-[10px] text-text-tertiary">Please allow camera permissions in browser address bar.</p>
            </div>
          )}
        </div>
        
        {!isStreaming && (
          <div className="text-left space-y-1">
            <label className="text-[10px] font-bold text-text-tertiary uppercase block">Live Broadcast Title *</label>
            <input
              type="text"
              required
              value={liveTitle}
              onChange={(e) => setLiveTitle(e.target.value)}
              placeholder="e.g. Special Product Showcase"
              className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple"
            />
          </div>
        )}

        <button
          onClick={handleToggleLiveStream}
          disabled={!!cameraError}
          className={`w-full py-3 text-white font-bold text-xs rounded-xl transition ${
            isStreaming ? 'bg-gray-700 hover:bg-gray-800' : 'bg-red-600 hover:bg-red-700'
          } disabled:opacity-50`}
        >
          {isStreaming ? 'End Live Stream' : 'Start Live Stream Now'}
        </button>
      </div>
    </AdminModal>
  );
}
