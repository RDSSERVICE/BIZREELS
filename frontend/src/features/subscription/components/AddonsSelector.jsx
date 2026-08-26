import React from 'react';
import { FiCheck, FiPlus, FiZap, FiInfo } from 'react-icons/fi';

/**
 * AddonsSelector — Modular interactive component for selecting subscription add-ons
 */
export default function AddonsSelector({
  availableAddons = [],
  selectedAddons = [],
  onToggleAddon,
}) {
  if (!availableAddons || availableAddons.length === 0) {
    return null;
  }

  const activeAddons = availableAddons.filter((a) => a.is_active !== false);
  if (activeAddons.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FiZap size={14} className="text-[#d99a3d]" />
          <h4 className="text-xs font-black uppercase text-[#1a1a1a] tracking-wide">
            Enhance Your Plan with Add-Ons
          </h4>
        </div>
        <span className="text-[10px] text-slate-500 font-bold">
          {selectedAddons.length} of {activeAddons.length} selected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {activeAddons.map((addon) => {
          const isSelected = selectedAddons.some(
            (a) => a.id === addon.id || a.title === addon.title
          );

          return (
            <div
              key={addon.id || addon.title}
              onClick={() => onToggleAddon(addon)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                isSelected
                  ? 'bg-amber-500/10 border-[#d99a3d] ring-1 ring-[#d99a3d] shadow-2xs'
                  : 'bg-white border-[#e3dccb] hover:border-slate-400 hover:bg-[#faf7f2]'
              }`}
            >
              {/* Checkbox Icon */}
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center transition shrink-0 mt-0.5 ${
                  isSelected
                    ? 'bg-[#241b15] text-[#d99a3d]'
                    : 'border border-[#e3dccb] bg-[#f8f4ec] text-transparent'
                }`}
              >
                <FiCheck size={12} strokeWidth={3} />
              </div>

              {/* Add-on details */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-[#1a1a1a] truncate">
                    {addon.title}
                  </span>
                  <span className="text-xs font-black text-emerald-700 shrink-0 font-mono">
                    +₹{addon.price_inr}
                  </span>
                </div>

                {addon.description && (
                  <p className="text-[10.5px] text-slate-500 leading-snug line-clamp-2">
                    {addon.description}
                  </p>
                )}

                {addon.quota_type && addon.quota_type !== 'custom' && (
                  <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-[#f0ebe0] text-slate-600 text-[9px] font-mono font-bold uppercase">
                    +{addon.quota_value} {addon.quota_type.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
