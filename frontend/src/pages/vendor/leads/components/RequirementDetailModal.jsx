import React from 'react';
import { FiCheck } from 'react-icons/fi';
import AdminModal from '../../../../features/admin/components/AdminModal';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';
import { resolveMediaUrl } from '../../../../lib/api';

export default function RequirementDetailModal({
  isOpen,
  onClose,
  detailReq,
  displayReq,
  currentUserId,
  onOpenProposal
}) {
  const req = displayReq || detailReq;

  if (!req) return null;

  const hasResponded = req.vendorsResponded && req.vendorsResponded.some(
    vId => (vId._id || vId).toString() === currentUserId?.toString()
  );

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Requirement Lead Detail"
    >
      <div className="space-y-4 text-xs">
        <div className="bg-surface-secondary p-4 rounded-xl space-y-2 border border-border">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-sm text-text-primary">{req.title}</h4>
            <AdminStatusBadge status={req.status || 'Pending'} />
          </div>
          <p className="text-text-secondary leading-relaxed mt-2 whitespace-pre-wrap">{req.description}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 bg-surface border border-border rounded-xl">
            <span className="text-text-tertiary block mb-0.5">Budget Allocation</span>
            <strong className="text-brand-purple text-sm">
              {req.budget_min || req.budget_max ? (
                `₹${(req.budget_min || 0).toLocaleString('en-IN')} - ₹${(req.budget_max || 0).toLocaleString('en-IN')}`
              ) : (
                `₹${(req.budget || 0).toLocaleString('en-IN')}`
              )}
            </strong>
          </div>
          <div className="p-3 bg-surface border border-border rounded-xl">
            <span className="text-text-tertiary block mb-0.5">
              {req.type === 'service' || req.requirementType === 'service' ? 'Service Scope' : 'Quantity Requested'}
            </span>
            <strong className="text-text-primary text-sm">
              {req.quantity || 1} {req.type === 'service' || req.requirementType === 'service' ? 'deliverables/days' : 'units'}
            </strong>
          </div>
          <div className="p-3 bg-surface border border-border rounded-xl">
            <span className="text-text-tertiary block mb-0.5">
              {req.type === 'service' || req.requirementType === 'service' ? 'Service Location' : 'Delivery Target Location'}
            </span>
            <strong className="text-text-primary text-sm">
              {req.location?.area === 'Remote' ? 'Remote (Online)' : `${req.location?.city || 'Local'}, ${req.location?.state || 'Punjab'}`}
            </strong>
          </div>
          <div className="p-3 bg-surface border border-border rounded-xl">
            <span className="text-text-tertiary block mb-0.5">Category & Type</span>
            <strong className="text-text-primary text-sm capitalize">{req.type || 'product'} — {req.category}</strong>
          </div>
        </div>

        {/* Extended Details */}
        {(req.detailedSpecifications || req.address || req.expectedDeliveryDate || req.productCondition || req.serviceModel) && (
          <div className="p-4 bg-surface border border-border rounded-xl space-y-2.5">
            <h5 className="font-bold text-brand-navy">Detailed Requirements</h5>
            {req.detailedSpecifications && (
              <div>
                <span className="text-text-tertiary block mb-0.5">Specifications:</span>
                <p className="text-text-secondary leading-relaxed bg-surface-secondary p-2.5 rounded-lg whitespace-pre-wrap font-mono">{req.detailedSpecifications}</p>
              </div>
            )}
            {req.address && (
              <div>
                <span className="text-text-tertiary">Venue Address:</span>{' '}
                <strong className="text-text-primary">{req.address}</strong>
              </div>
            )}
            {req.expectedDeliveryDate && (
              <div className="flex gap-4 text-text-primary">
                <div>
                  <span className="text-text-tertiary">Fulfillment Date:</span>{' '}
                  <strong>{new Date(req.expectedDeliveryDate).toLocaleDateString('en-IN')}</strong>
                </div>
                {req.expectedDeliveryTime && (
                  <div>
                    <span className="text-text-tertiary">Preferred Time:</span>{' '}
                    <strong>{req.expectedDeliveryTime}</strong>
                  </div>
                )}
              </div>
            )}
            {req.productCondition && (
              <div>
                <span className="text-text-tertiary">Condition Preference:</span>{' '}
                <strong className="capitalize">{req.productCondition === 'other' ? req.customProductCondition || 'Other' : req.productCondition}</strong>
              </div>
            )}
            {req.serviceModel && (
              <div>
                <span className="text-text-tertiary">Service Model:</span>{' '}
                <strong className="capitalize">{req.serviceModel === 'other' ? req.customServiceModel || 'Other' : req.serviceModel}</strong>
              </div>
            )}
          </div>
        )}

        {/* Media Attachments for Vendor */}
        {((req.photos && req.photos.length > 0) || req.video) && (
          <div className="p-4 bg-surface border border-border rounded-xl space-y-3">
            <h5 className="font-bold text-brand-navy">Requirement Media & Attachments</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {req.photos && req.photos.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Photos</span>
                  <div className="grid grid-cols-3 gap-2">
                    {req.photos.map((url, idx) => (
                      <a
                        key={idx}
                        href={resolveMediaUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden border border-border hover:border-brand-purple transition bg-surface flex items-center justify-center"
                      >
                        <img src={resolveMediaUrl(url)} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {req.video && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Reference Video</span>
                  <div className="rounded-lg overflow-hidden border border-border bg-surface-tertiary">
                    <video
                      src={resolveMediaUrl(req.video)}
                      controls
                      className="max-h-[120px] w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-brand-purple/5 p-3 sm:p-4 rounded-xl border border-brand-purple/10 space-y-1.5 sm:space-y-1">
          <h5 className="font-bold text-brand-navy">Customer Context Details</h5>
          <div className="flex flex-col sm:flex-row justify-between gap-0.5 sm:gap-0">
            <span className="text-text-secondary">Posted By:</span>
            <strong className="text-text-primary">{req.customer?.name || 'Client Buyer'}</strong>
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-0.5 sm:gap-0">
            <span className="text-text-secondary">Phone Details:</span>
            <strong className="text-text-primary">{req.customer?.phone || 'Hidden until bid accepted'}</strong>
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-0.5 sm:gap-0">
            <span className="text-text-secondary">Email Reference:</span>
            <strong className="text-text-primary">{req.customer?.email || 'N/A'}</strong>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 glass border border-border rounded-xl text-text-secondary font-bold"
          >
            Close View
          </button>
          {hasResponded ? (
            <span className="px-5 py-2 bg-emerald-500/10 text-emerald-600 font-bold rounded-xl border border-emerald-500/20 flex items-center gap-1">
              <FiCheck size={14} /> Proposal Sent
            </span>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenProposal(req);
              }}
              className="px-5 py-2 gradient-brand text-white font-bold rounded-xl shadow-premium"
            >
              Respond with Proposal
            </button>
          )}
        </div>
      </div>
    </AdminModal>
  );
}
