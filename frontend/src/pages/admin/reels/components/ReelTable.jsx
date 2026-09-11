import React from 'react';
import {
  FiPlay,
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiZap,
  FiTrash2,
  FiRefreshCw,
  FiShield,
  FiShoppingBag,
  FiLayers,
  FiCheckCircle,
  FiAlertTriangle,
  FiTv
} from 'react-icons/fi';
import { formatCompactNumber } from './reelUtils';

export default function ReelTable({
  items,
  isFetching,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onPreview,
  onModerate,
  onToggleBoost,
  onTakedown,
  onRestore,
  activeTab
}) {
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < items.length;

  if (isFetching && (!items || items.length === 0)) {
    return (
      <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-xl p-8 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-[#1a1a1a]/60 font-['Outfit']">
          Loading video catalog & telemetry...
        </span>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-xl p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-[#e3dccb]/50 flex items-center justify-center text-[#1a1a1a]/50 mb-3">
          <FiPlay className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#1a1a1a] font-['Outfit'] mb-1">
          No reels found in this view
        </h3>
        <p className="text-xs text-[#1a1a1a]/60 max-w-sm font-['Outfit']">
          Try adjusting your search criteria or switch to another status tab.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e3dccb] bg-[#fbf9f4]/60 text-[11px] font-black uppercase tracking-wider text-[#1a1a1a]/70 font-['Outfit']">
              <th className="py-3 px-3.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={onToggleSelectAll}
                  className="rounded border-[#e3dccb] text-[#1a1a1a] focus:ring-[#1a1a1a] cursor-pointer"
                />
              </th>
              <th className="py-3 px-3 w-16">Video</th>
              <th className="py-3 px-3 min-w-[220px]">Reel Details</th>
              <th className="py-3 px-3 min-w-[140px]">Creator</th>
              <th className="py-3 px-3 min-w-[130px]">Telemetry</th>
              <th className="py-3 px-3 min-w-[120px]">Status</th>
              <th className="py-3 px-3 text-right min-w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3dccb]/60 text-xs font-['Outfit']">
            {items.map((reel) => {
              const id = reel.id || reel._id;
              const isSelected = selectedIds.includes(id);

              return (
                <tr
                  key={id}
                  className={`hover:bg-[#fbf9f4] transition-colors ${
                    isSelected ? 'bg-[#fbf9f4]/90' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-3 px-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(id)}
                      className="rounded border-[#e3dccb] text-[#1a1a1a] focus:ring-[#1a1a1a] cursor-pointer"
                    />
                  </td>

                  {/* Thumbnail / Video preview box */}
                  <td className="py-3 px-3">
                    <div
                      onClick={() => onPreview(reel)}
                      className="relative w-12 h-16 rounded-lg bg-[#1a1a1a]/10 overflow-hidden border border-[#e3dccb] group cursor-pointer shrink-0 shadow-xs"
                    >
                      {reel.thumbnailUrl ? (
                        <img
                          src={reel.thumbnailUrl}
                          alt="Thumbnail"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : reel.isLiveStream ? (
                        <div className="w-full h-full bg-rose-950/80 flex items-center justify-center text-white">
                          <FiTv className="w-5 h-5 text-rose-400" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-900 text-[#fbf9f4]">
                          <FiPlay className="w-4 h-4 text-[#d99a3d]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <FiPlay className="w-4 h-4 fill-white" />
                      </div>
                    </div>
                  </td>

                  {/* Caption & Commerce Listing Info */}
                  <td className="py-3 px-3">
                    <div className="space-y-1 max-w-sm">
                      <p
                        className="font-bold text-[#1a1a1a] line-clamp-2 leading-snug cursor-pointer hover:text-[#d99a3d] transition-colors"
                        onClick={() => onPreview(reel)}
                        title={reel.caption}
                      >
                        {reel.caption || (reel.isLiveStream ? 'Live Broadcast' : 'Untitled Reel')}
                      </p>

                      {/* Hashtags */}
                      {reel.hashtags && reel.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {reel.hashtags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] text-[#1a1a1a]/60 bg-[#e3dccb]/50 px-1.5 py-0.5 rounded font-mono"
                            >
                              #{tag.replace(/^#/, '')}
                            </span>
                          ))}
                          {reel.hashtags.length > 3 && (
                            <span className="text-[9px] text-[#1a1a1a]/50 font-medium">
                              +{reel.hashtags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Shoppable commerce linkage */}
                      {reel.targetListing && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#d99a3d]/10 border border-[#d99a3d]/20 text-[#1a1a1a] text-[10px] font-semibold">
                          <FiShoppingBag className="w-3 h-3 text-[#d99a3d]" />
                          <span className="truncate max-w-[140px]">
                            {reel.targetListing.title}
                          </span>
                          {reel.price > 0 && (
                            <span className="font-bold font-mono">₹{reel.price}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Creator */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#1a1a1a] truncate max-w-[130px]">
                        {reel.creator_name || reel.creator?.name || 'Unknown'}
                      </span>
                      {reel.creator?.phone && (
                        <span className="text-[10px] text-[#1a1a1a]/50 font-mono">
                          {reel.creator.phone}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Telemetry Metrics */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1 text-[11px] text-[#1a1a1a]/70">
                      <div className="flex items-center gap-1.5">
                        <FiEye className="w-3.5 h-3.5 text-[#1a1a1a]/50 shrink-0" />
                        <span className="font-mono font-bold text-[#1a1a1a]">
                          {formatCompactNumber(reel.views || 0)}
                        </span>
                        <span className="text-[10px] text-[#1a1a1a]/50">views</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[#1a1a1a]/60">
                        <span className="flex items-center gap-1">
                          <FiHeart className="w-3 h-3 text-rose-500/70" />
                          {formatCompactNumber(reel.likesCount || 0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiMessageCircle className="w-3 h-3 text-sky-500/70" />
                          {formatCompactNumber(reel.commentsCount || 0)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Status Badges */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col items-start gap-1">
                      {reel.isDeleted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                          Deleted
                        </span>
                      ) : (
                        <>
                          {reel.isLiveStream && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              LIVE
                            </span>
                          )}

                          {reel.isBoosted && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <FiZap className="w-2.5 h-2.5 fill-current" />
                              Boosted
                            </span>
                          )}

                          {reel.aiModeration?.passed === false && (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 truncate max-w-[120px]"
                              title={reel.aiModeration?.violationReason || 'AI Flagged'}
                            >
                              AI Flagged
                            </span>
                          )}

                          {reel.adminReview?.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              Pending Review
                            </span>
                          )}

                          {reel.adminReview?.status === 'approved' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <FiCheckCircle className="w-2.5 h-2.5" />
                              Approved
                            </span>
                          )}

                          {!reel.isBoosted &&
                            !reel.isLiveStream &&
                            reel.aiModeration?.passed !== false &&
                            reel.adminReview?.status !== 'pending' &&
                            reel.adminReview?.status !== 'approved' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e3dccb]/50 text-[#1a1a1a]/70">
                                Published
                              </span>
                            )}
                        </>
                      )}
                    </div>
                  </td>

                  {/* Row Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Play Preview */}
                      <button
                        type="button"
                        onClick={() => onPreview(reel)}
                        title="Play & Inspect Reel"
                        className="p-1.5 bg-[#fbf9f4] border border-[#e3dccb] hover:border-[#1a1a1a] rounded-lg text-[#1a1a1a] hover:bg-[#e3dccb]/30 transition-colors"
                      >
                        <FiPlay className="w-3.5 h-3.5" />
                      </button>

                      {/* Moderate / Review */}
                      <button
                        type="button"
                        onClick={() => onModerate(reel)}
                        title="Moderate / Flag / Review"
                        className="p-1.5 bg-[#fbf9f4] border border-[#e3dccb] hover:border-[#1a1a1a] rounded-lg text-[#1a1a1a] hover:bg-amber-100 hover:text-amber-900 transition-colors"
                      >
                        <FiShield className="w-3.5 h-3.5" />
                      </button>

                      {/* Boost toggle (only for non-deleted, non-live) */}
                      {!reel.isDeleted && !reel.isLiveStream && (
                        <button
                          type="button"
                          onClick={() => onToggleBoost(reel)}
                          title={reel.isBoosted ? 'Remove Boost' : 'Boost Reel'}
                          className={`p-1.5 border rounded-lg transition-colors ${
                            reel.isBoosted
                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                              : 'bg-[#fbf9f4] border-[#e3dccb] hover:border-[#1a1a1a] text-[#1a1a1a]'
                          }`}
                        >
                          <FiZap className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Takedown or Restore */}
                      {reel.isDeleted ? (
                        <button
                          type="button"
                          onClick={() => onRestore(id)}
                          title="Restore Reel"
                          className="p-1.5 bg-emerald-50 border border-emerald-200 hover:border-emerald-600 rounded-lg text-emerald-700 transition-colors"
                        >
                          <FiRefreshCw className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onTakedown(reel)}
                          title={reel.isLiveStream ? 'End Live Broadcast' : 'Takedown Reel'}
                          className="p-1.5 bg-[#fbf9f4] border border-[#e3dccb] hover:border-rose-600 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
