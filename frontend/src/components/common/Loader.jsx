import React from 'react';

/**
 * Premium loader spinner using brand colors and gradients.
 */
const Loader = ({ fullPage = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer glowing pulse ring */}
        <div className={`absolute top-0 left-0 rounded-full animate-ping opacity-15 bg-brand-purple ${sizeClasses[size]}`}></div>
        {/* Inner rotating gradient spinner */}
        <div
          className={`rounded-full animate-spin border-t-brand-purple border-r-brand-pink border-b-brand-orange border-l-transparent ${sizeClasses[size]}`}
          style={{ borderStyle: 'solid' }}
        ></div>
      </div>
      {fullPage && (
        <span className="text-xs font-semibold tracking-widest uppercase text-brand-purple animate-pulse">
          BizReels
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-secondary/80 backdrop-blur-md">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default Loader;
