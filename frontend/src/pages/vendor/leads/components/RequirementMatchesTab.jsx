import React from 'react';
import { FiSliders } from 'react-icons/fi';
import RequirementCard from './RequirementCard';

export default function RequirementMatchesTab({
  requirements = [],
  distanceKm,
  setDistanceKm,
  sortBy,
  setSortBy,
  currentUserId,
  savedIds = [],
  onViewDetail,
  onOpenProposal,
  onToggleSave,
  onMarkNotInterested
}) {
  return (
    <div className="space-y-4">
      {/* Proximity & Sort Filter Panel */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface-secondary/50 p-3 rounded-xl border border-border text-xs">
        <div className="flex items-center gap-2 font-semibold text-text-secondary w-full sm:w-auto">
          <span>Distance Filter:</span>
          <select
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          >
            <option value="10">Within 10 km</option>
            <option value="25">Within 25 km</option>
            <option value="50">Within 50 km</option>
            <option value="100">Within 100 km</option>
            <option value="any">Any distance</option>
          </select>
        </div>

        <div className="flex items-center gap-2 font-semibold text-text-secondary w-full sm:w-auto sm:ml-auto">
          <span>Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          >
            <option value="distance">Proximity (Nearest first)</option>
            <option value="latest">Latest Posted</option>
            <option value="budget_high_low">Budget: High → Low</option>
            <option value="budget_low_high">Budget: Low → High</option>
          </select>
        </div>
      </div>

      {requirements.length === 0 ? (
        <div className="py-12 text-center text-xs text-text-tertiary space-y-2">
          <FiSliders size={36} className="mx-auto text-brand-purple opacity-40" />
          <p className="font-bold text-text-primary text-sm">No matched requirements found</p>
          <p className="max-w-xs mx-auto text-text-tertiary">
            Requirements matching your business category and service areas will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requirements.map((m) => {
            const reqId = m._id || m.id;
            const isSaved = savedIds.includes(reqId);
            return (
              <RequirementCard
                key={reqId}
                requirement={m}
                currentUserId={currentUserId}
                isSaved={isSaved}
                onViewDetail={onViewDetail}
                onOpenProposal={onOpenProposal}
                onToggleSave={onToggleSave}
                onMarkNotInterested={onMarkNotInterested}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
