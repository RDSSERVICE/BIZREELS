import React from 'react';

/**
 * Premium Loader matching BizReels Warm Editorial Bento Design System
 */
const Loader = ({ fullPage = false, size = 'md', message = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-[3px]',
    lg: 'w-16 h-16 border-4',
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-4 font-sans">
      <div className="relative flex items-center justify-center">
        {/* Subtle Outer Track */}
        <div
          className={`rounded-full border-[#e3dccb] ${sizeClasses[size]}`}
          style={{ borderStyle: 'solid' }}
        />
        {/* Spinning Gold & Dark Brand Arc */}
        <div
          className={`absolute inset-0 rounded-full animate-spin border-transparent border-t-[#d99a3d] border-r-[#241b15] ${sizeClasses[size]}`}
          style={{ borderStyle: 'solid' }}
        />
      </div>

      {fullPage && (
        <div className="flex flex-col items-center gap-1.5 mt-1">
          <div className="flex items-center gap-1.5">
            <span style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs font-black tracking-widest uppercase text-[#1a1a1a]">
              BIZ<span className="text-[#d99a3d]">REELS</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#d99a3d] animate-ping" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
            {message}
          </span>
        </div>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f2ede4] select-none">
        <img src="/logo.png" alt="BizReels" className="h-11 w-auto mb-6 object-contain" />
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default Loader;

