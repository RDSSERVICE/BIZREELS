import React, { useState } from 'react';
import {
  FiX, FiEye, FiHeart, FiBookmark, FiShare2, FiShoppingCart,
  FiStar, FiTrendingUp, FiPackage, FiEdit2, FiTrash2, FiCopy,
  FiEyeOff, FiAlertTriangle, FiDollarSign, FiBarChart2
} from 'react-icons/fi';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';

/**
 * ListingDetailDrawer — Slide-out drawer showing full listing details + analytics
 */
export default function ListingDetailDrawer({
  listing,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onToggleVisibility,
  onDelete,
  onUpdateStock,
}) {
  const [stockInput, setStockInput] = useState('');
  const [updatingStock, setUpdatingStock] = useState(false);

  if (!isOpen || !listing) return null;

  const lid = listing._id || listing.id;
  const image = listing.images?.[0];
  const sellingPrice = listing.sellingPrice || listing.price || 0;
  const views = listing.views || 0;
  const likes = listing.likes ?? listing.likes_count ?? 0;
  const saves = listing.saves_count ?? listing.saves ?? 0;
  const shares = listing.shares || 0;
  const orders = listing.orders_count || 0;
  const revenue = listing.revenue || 0;
  const rating = listing.rating || 0;
  const stock = listing.stock ?? 0;
  const threshold = listing.lowStockThreshold ?? 5;
  const conversionRate = views > 0 ? ((orders / views) * 100).toFixed(1) : '0.0';
  const ctr = views > 0 ? ((likes / views) * 100).toFixed(1) : '0.0';

  const handleStockUpdate = async () => {
    if (!stockInput && stockInput !== 0) return;
    setUpdatingStock(true);
    try {
      await onUpdateStock(lid, Number(stockInput));
      setStockInput('');
    } finally {
      setUpdatingStock(false);
    }
  };

  const stats = [
    { label: 'Total Views', value: views, icon: FiEye, color: 'text-blue-500' },
    { label: 'Unique Visitors', value: listing.uniqueVisitors || Math.floor(views * 0.7), icon: FiEye, color: 'text-cyan-500' },
    { label: 'Likes', value: likes, icon: FiHeart, color: 'text-red-400' },
    { label: 'Saves', value: saves, icon: FiBookmark, color: 'text-amber-500' },
    { label: 'Shares', value: shares, icon: FiShare2, color: 'text-emerald-500' },
    { label: 'Orders', value: orders, icon: FiShoppingCart, color: 'text-purple-500' },
    { label: 'Revenue', value: `₹${revenue.toLocaleString('en-IN')}`, icon: FiDollarSign, color: 'text-emerald-600' },
    { label: 'Rating', value: rating > 0 ? `${rating.toFixed(1)} ⭐` : 'No rating', icon: FiStar, color: 'text-amber-500' },
    { label: 'Conversion', value: `${conversionRate}%`, icon: FiTrendingUp, color: 'text-brand-purple' },
    { label: 'CTR', value: `${ctr}%`, icon: FiBarChart2, color: 'text-brand-orange' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl border-l border-[#e3dccb] animate-slide-in-right overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[#241b15] bg-[#241b15] text-white">
          <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm font-black text-[#d99a3d] uppercase tracking-wider truncate pr-2">
            Listing Details
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border-none">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Image + Title */}
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#f8f4ec] border border-[#e3dccb] overflow-hidden flex-shrink-0">
              {image ? (
                <img src={image} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><FiPackage className="w-8 h-8 text-slate-400" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="font-black text-sm text-[#1a1a1a] truncate">{listing.title}</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase">{listing.category} • {listing.subcategory || 'General'}</p>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-emerald-700">₹{sellingPrice.toLocaleString('en-IN')}</span>
                <AdminStatusBadge status={listing.status || 'published'} />
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                listing.type === 'service' ? 'bg-[#f8f4ec] text-[#241b15] border border-[#e3dccb]' : 'bg-[#241b15] text-[#d99a3d]'
              }`}>
                {listing.type}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { onEdit(listing); onClose(); }} className="flex-1 py-2.5 px-3 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] text-xs font-black rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer border-none">
              <FiEdit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => { onDuplicate(listing); onClose(); }} className="flex-1 py-2.5 px-3 bg-[#f8f4ec] border border-[#e3dccb] text-[#1a1a1a] text-xs font-bold rounded-xl hover:bg-white transition flex items-center justify-center gap-1.5 cursor-pointer">
              <FiCopy className="w-3.5 h-3.5" /> Duplicate
            </button>
            <button onClick={() => onToggleVisibility(listing, listing.status === 'hidden' ? 'published' : 'hidden')} className="flex-1 py-2.5 px-3 bg-[#d99a3d] text-[#241b15] hover:bg-[#c8892c] text-xs font-black rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer border-none">
              <FiEyeOff className="w-3.5 h-3.5" /> {listing.status === 'hidden' ? 'Publish' : 'Hide'}
            </button>
            <button onClick={() => { onDelete(listing); onClose(); }} className="py-2.5 px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border-none">
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Inventory Section (Products only) */}
          {listing.type === 'product' && (
            <div className="p-4 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] space-y-3">
              <h5 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs text-[#1a1a1a] uppercase tracking-wider">
                Inventory
              </h5>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-[#1a1a1a]">{stock}</span>
                  <span className="text-xs text-slate-500 font-bold ml-1">in stock</span>
                </div>
                {stock <= 0 ? (
                  <span className="px-2.5 py-1 bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-black rounded-lg flex items-center gap-1">
                    <FiAlertTriangle className="w-3 h-3" /> OUT OF STOCK
                  </span>
                ) : stock <= threshold ? (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black rounded-lg flex items-center gap-1">
                    <FiAlertTriangle className="w-3 h-3" /> LOW STOCK
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black rounded-lg">IN STOCK</span>
                )}
              </div>
              {/* Quick stock update */}
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={stockInput}
                  onChange={(e) => setStockInput(e.target.value)}
                  placeholder="Update stock quantity"
                  className="flex-1 p-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
                <button
                  onClick={handleStockUpdate}
                  disabled={updatingStock || (!stockInput && stockInput !== 0)}
                  className="px-4 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] text-xs font-black rounded-xl shadow-2xs disabled:opacity-50 cursor-pointer border-none"
                >
                  {updatingStock ? '...' : 'Update'}
                </button>
              </div>
              <p className="text-[9px] text-slate-400 font-bold">Low stock alert threshold: {threshold} units</p>
            </div>
          )}

          {/* Analytics Grid */}
          <div className="space-y-3">
            <h5 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs text-[#1a1a1a] uppercase tracking-wider">
              Live Analytics
            </h5>
            <div className="grid grid-cols-2 gap-2.5">
              {stats.map((stat, i) => (
                <div key={i} className="p-3 bg-[#f8f4ec] rounded-xl border border-[#e3dccb] space-y-1">
                  <div className="flex items-center gap-1.5">
                    <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    <span className="text-[9px] font-black text-slate-400 uppercase">{stat.label}</span>
                  </div>
                  <span className="text-sm font-black text-[#1a1a1a]">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          {listing.description && (
            <div className="space-y-2">
              <h5 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs text-[#1a1a1a] uppercase tracking-wider">
                Description
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Labels / Specs */}
          {listing.labels?.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider">Specifications</h5>
              <div className="flex flex-wrap gap-1.5">
                {listing.labels.map((lbl, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-surface-secondary border border-border text-[10px] rounded-xl">
                    <strong className="text-brand-purple">{lbl.key}:</strong> {lbl.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Service Pricing Breakdown */}
          {listing.type === 'service' && (
            <div className="p-4 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] space-y-2">
              <h5 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs text-[#1a1a1a] uppercase tracking-wider flex items-center justify-between">
                <span>💰 Pricing Structure</span>
                <span className="text-[10px] text-brand-purple font-mono font-bold">
                  {listing.serviceDetails?.priceType || 'Fixed Price'}
                </span>
              </h5>
              {(() => {
                const sd = listing.serviceDetails || {};
                const cp = sd.customPricing;
                if (!cp) {
                  return (
                    <div className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-[#e3dccb]">
                      <span className="text-slate-500 font-bold">Base Price:</span>
                      <span className="font-extrabold text-[#1a1a1a]">₹{(listing.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                  );
                }

                return (
                  <div className="space-y-1.5 text-xs">
                    {cp.pricingModel === 'price_range' && (
                      <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-[#e3dccb]">
                        <span className="text-slate-500 font-bold">Estimated Range:</span>
                        <span className="font-extrabold text-emerald-800">
                          ₹{Number(cp.minPrice || listing.price || 0).toLocaleString()} — ₹{Number(cp.maxPrice || 0).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {cp.pricingModel === 'unit_rate' && (
                      <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-[#e3dccb]">
                        <span className="text-slate-500 font-bold">Unit Rate:</span>
                        <span className="font-extrabold text-blue-800">
                          ₹{Number(cp.unitRate || listing.price || 0).toLocaleString()} / {cp.unitType || 'Unit'}
                        </span>
                      </div>
                    )}
                    {cp.pricingModel === 'inspection_fee' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-[#e3dccb]">
                          <span className="text-slate-500 font-bold">Inspection / Visit Fee:</span>
                          <span className="font-extrabold text-amber-800">
                            ₹{Number(cp.inspectionFee || listing.price || 0).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 italic pl-1">
                          {cp.deductibleFromBill !== false ? '✓ Deductible from final bill' : 'Non-deductible visit fee'}
                        </p>
                      </div>
                    )}
                    {cp.pricingModel === 'tiered' && Array.isArray(cp.tiers) && (
                      <div className="space-y-1">
                        {cp.tiers.filter(t => t.price).map((tier, tidx) => (
                          <div key={tidx} className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-[#e3dccb] text-[11px]">
                            <span className="font-bold text-brand-purple">{tier.name}:</span>
                            <span className="font-black">₹{Number(tier.price).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cp.pricingNotes && (
                      <p className="text-[10px] text-slate-500 pt-1 italic">
                        Note: {cp.pricingNotes}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Service Cancellation Policy */}
          {listing.type === 'service' && (
            <div className="p-4 bg-surface-secondary rounded-2xl border border-border space-y-2">
              <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between">
                <span>🛡️ Cancellation Policy</span>
                <span className="text-[9px] text-brand-purple font-mono">Pre-Payment</span>
              </h5>
              {(() => {
                const p = listing.serviceDetails?.policies || {};
                const freeH = p.freeCancellationHours ?? 24;
                const winH = p.withinWindowHours ?? 24;
                const winP = p.withinWindowRefundPercent ?? 50;
                const aftP = p.afterVisitRefundPercent ?? 0;
                return (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 bg-surface rounded-xl border border-border text-[11px]">
                      <span className="text-text-secondary flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Free Cancel:
                      </span>
                      <span className="font-bold text-emerald-700">≥ {freeH}h before visit (100% Refund)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-surface rounded-xl border border-border text-[11px]">
                      <span className="text-text-secondary flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Within {winH}h:
                      </span>
                      <span className="font-bold text-amber-700">{winP}% Refund</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-surface rounded-xl border border-border text-[11px]">
                      <span className="text-text-secondary flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500" /> After Visit:
                      </span>
                      <span className="font-bold text-red-700">{aftP}% Refund</span>
                    </div>
                    {p.termsAndConditions && (
                      <p className="text-[10px] text-text-tertiary pt-1 italic">
                        Note: {p.termsAndConditions}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Shipping & Delivery Details */}
          {(() => {
            const ship = listing.shippingDetails || listing.productDetails?.shippingDetails;
            if (!ship || (!ship.weight && !ship.dimensions && !ship.shippingType)) return null;
            return (
              <div className="p-3.5 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] space-y-2">
                <h5 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs text-[#1a1a1a] uppercase tracking-wider flex items-center justify-between">
                  <span>📦 Shipping &amp; Package Specifications</span>
                  {ship.freeShipping && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-black">
                      FREE SHIPPING
                    </span>
                  )}
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {ship.weight && (
                    <div className="bg-white p-2.5 rounded-xl border border-[#e3dccb]">
                      <span className="text-[9px] font-black text-slate-400 uppercase block">Weight</span>
                      <span className="font-bold text-[#1a1a1a]">{ship.weight}</span>
                    </div>
                  )}
                  {ship.dimensions && (
                    <div className="bg-white p-2.5 rounded-xl border border-[#e3dccb]">
                      <span className="text-[9px] font-black text-slate-400 uppercase block">Dimensions (L×W×H)</span>
                      <span className="font-bold text-[#1a1a1a]">{ship.dimensions}</span>
                    </div>
                  )}
                  {ship.shippingType && (
                    <div className="bg-white p-2.5 rounded-xl border border-[#e3dccb]">
                      <span className="text-[9px] font-black text-slate-400 uppercase block">Payment / Dispatch</span>
                      <span className="font-bold text-[#1a1a1a]">
                        {ship.shippingType === 'prepaid' ? '💳 Prepaid Only' : ship.shippingType === 'cod' ? '💵 COD Only' : '🔄 COD & Prepaid'}
                      </span>
                    </div>
                  )}
                  {ship.estimatedDays && (
                    <div className="bg-white p-2.5 rounded-xl border border-[#e3dccb]">
                      <span className="text-[9px] font-black text-slate-400 uppercase block">Est. Delivery</span>
                      <span className="font-bold text-[#1a1a1a]">{ship.estimatedDays} Days</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Product Return Policy */}
          {listing.type === 'product' && listing.returnPolicy && (
            <div className="p-3.5 bg-surface-secondary rounded-2xl border border-border space-y-1.5">
              <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span>🔄 Return / Replacement Policy</span>
              </h5>
              <p className="text-xs text-text-secondary leading-relaxed bg-surface p-2.5 rounded-xl border border-border">
                {listing.returnPolicy}
              </p>
            </div>
          )}

          {/* Tags */}
          {listing.tags?.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider">Tags</h5>
              <div className="flex flex-wrap gap-1.5">
                {listing.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-brand-purple/10 text-brand-purple text-[10px] font-bold rounded-lg">#{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="space-y-1 text-[10px] text-text-tertiary border-t border-border pt-3">
            <div>Created: {listing.createdAt ? new Date(listing.createdAt).toLocaleString('en-IN') : '—'}</div>
            <div>Updated: {listing.updatedAt ? new Date(listing.updatedAt).toLocaleString('en-IN') : '—'}</div>
            {listing.publishedAt && <div>Published: {new Date(listing.publishedAt).toLocaleString('en-IN')}</div>}
            <div>ID: {lid}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
