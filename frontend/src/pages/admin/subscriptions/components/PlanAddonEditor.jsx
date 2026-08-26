import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiZap, FiEdit2, FiCheck, FiX } from 'react-icons/fi';

/**
 * PlanAddonEditor — 100% Dynamic Admin Add-ons Manager for Subscription Plans
 * Admin has complete freedom to define custom add-ons, pricing, and quota benefits without hardcoding.
 */
export default function PlanAddonEditor({ addOns = [], onChange }) {
  // New add-on builder state
  const [newAddon, setNewAddon] = useState({
    title: '',
    description: '',
    price_inr: '',
    billing_type: 'per_cycle',
    quota_type: 'custom',
    quota_value: '0',
    is_active: true,
  });

  // State for inline editing an existing add-on
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const handleAddNew = (e) => {
    e.preventDefault();
    if (!newAddon.title.trim()) return;
    const price = parseFloat(newAddon.price_inr);
    if (isNaN(price) || price < 0) return;

    const id = `addon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const addonObj = {
      ...newAddon,
      id,
      title: newAddon.title.trim(),
      description: newAddon.description.trim(),
      price_inr: price,
      quota_value: parseInt(newAddon.quota_value || 0, 10),
      is_active: true,
    };

    onChange([...addOns, addonObj]);
    setNewAddon({
      title: '',
      description: '',
      price_inr: '',
      billing_type: 'per_cycle',
      quota_type: 'custom',
      quota_value: '0',
      is_active: true,
    });
  };

  const handleRemove = (index) => {
    const updated = addOns.filter((_, i) => i !== index);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditForm(null);
    }
    onChange(updated);
  };

  const handleToggleActive = (index) => {
    const updated = addOns.map((item, i) =>
      i === index ? { ...item, is_active: !item.is_active } : item
    );
    onChange(updated);
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditForm({ ...addOns[index] });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const saveEdit = (index) => {
    if (!editForm || !editForm.title.trim()) return;
    const price = parseFloat(editForm.price_inr);
    if (isNaN(price) || price < 0) return;

    const updated = addOns.map((item, i) =>
      i === index
        ? {
            ...editForm,
            price_inr: price,
            quota_value: parseInt(editForm.quota_value || 0, 10),
          }
        : item
    );

    onChange(updated);
    setEditingIndex(null);
    setEditForm(null);
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Header Info */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs space-y-1">
        <span className="font-black text-amber-500 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
          <FiZap size={13} />
          <span>Dynamic Plan Add-Ons</span>
        </span>
        <p className="text-text-secondary text-[11px] leading-relaxed">
          Create dynamic add-ons for this tier. Subscribers can select these optional add-ons during checkout, and charges will be added to the base plan total in real time.
        </p>
      </div>

      {/* Dynamic Add-Ons List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase text-text-tertiary tracking-wider block">
            Plan Add-Ons ({addOns.length})
          </label>
          <span className="text-[10px] text-text-tertiary">
            {addOns.filter((a) => a.is_active !== false).length} Active
          </span>
        </div>

        {addOns.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-text-tertiary italic">
            No add-ons created for this plan yet. Use the form below to add custom add-ons.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {addOns.map((addon, index) => {
              const isEditing = editingIndex === index;

              if (isEditing) {
                return (
                  <div
                    key={addon.id || index}
                    className="p-3 rounded-xl bg-surface border border-brand-purple/50 space-y-2 shadow-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Add-on Name"
                        className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-bold focus:outline-none focus:border-brand-purple"
                      />
                      <input
                        type="number"
                        min="0"
                        value={editForm.price_inr}
                        onChange={(e) => setEditForm({ ...editForm, price_inr: e.target.value })}
                        placeholder="Price in ₹"
                        className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-bold text-emerald-600 focus:outline-none focus:border-brand-purple"
                      />
                      <select
                        value={editForm.quota_type}
                        onChange={(e) => setEditForm({ ...editForm, quota_type: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-purple"
                      >
                        <option value="custom">Custom Benefit</option>
                        <option value="reels_limit">Reels Upload Limit</option>
                        <option value="ai_credits">AI Content Credits</option>
                        <option value="leads_limit">Leads Quota</option>
                        <option value="product_limit">Product Catalog Limit</option>
                        <option value="verified_badge">Verified Badge</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        value={editForm.quota_value}
                        onChange={(e) => setEditForm({ ...editForm, quota_value: e.target.value })}
                        placeholder="Quota amount"
                        className="sm:col-span-1 px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-purple"
                      />
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Description..."
                        className="sm:col-span-2 px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-purple"
                      />
                      <div className="sm:col-span-1 flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => saveEdit(index)}
                          className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer border-none shadow-xs"
                        >
                          <FiCheck size={12} /> Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-2.5 py-1.5 bg-surface-hover text-text-secondary rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer border border-border"
                        >
                          <FiX size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={addon.id || index}
                  className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between gap-3 hover:border-text-tertiary transition"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-text-primary truncate">
                        {addon.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10.5px] font-black font-mono">
                        +₹{addon.price_inr}
                      </span>
                      {addon.quota_type && addon.quota_type !== 'custom' && (
                        <span className="px-2 py-0.5 rounded bg-surface-hover text-text-secondary text-[9px] font-mono uppercase">
                          +{addon.quota_value} {addon.quota_type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    {addon.description && (
                      <p className="text-[10.5px] text-text-secondary line-clamp-1">
                        {addon.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(index)}
                      className={`px-2 py-1 rounded text-[10px] font-black transition cursor-pointer border ${
                        addon.is_active !== false
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-500 border-red-500/30'
                      }`}
                    >
                      {addon.is_active !== false ? 'Active' : 'Disabled'}
                    </button>

                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover text-text-secondary hover:text-brand-purple transition cursor-pointer border border-border"
                      title="Edit Add-on"
                    >
                      <FiEdit2 size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="p-1.5 rounded-lg bg-surface hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition cursor-pointer border border-border"
                      title="Remove Add-on"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Create Add-on Form */}
      <div className="p-3.5 bg-surface rounded-xl border border-border space-y-2.5 text-xs">
        <span className="text-[10.5px] font-black uppercase text-text-tertiary tracking-wider block">
          + Add New Add-on to this Plan
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="text-[9.5px] font-bold text-text-tertiary uppercase block mb-1">
              Add-on Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Extra 20 Reels Uploads"
              value={newAddon.title}
              onChange={(e) => setNewAddon({ ...newAddon, title: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[9.5px] font-bold text-text-tertiary uppercase block mb-1">
              Additional Price in ₹ *
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 199"
              value={newAddon.price_inr}
              onChange={(e) => setNewAddon({ ...newAddon, price_inr: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold text-emerald-600 focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[9.5px] font-bold text-text-tertiary uppercase block mb-1">
              Quota / Benefit Type
            </label>
            <select
              value={newAddon.quota_type}
              onChange={(e) => setNewAddon({ ...newAddon, quota_type: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-purple"
            >
              <option value="custom">Custom Feature / Service</option>
              <option value="reels_limit">Reels Upload Limit</option>
              <option value="ai_credits">AI Content Credits</option>
              <option value="leads_limit">Buyer Leads & Inquiries</option>
              <option value="product_limit">Product Catalog Listings</option>
              <option value="verified_badge">Verified Badge</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
          <div className="sm:col-span-1">
            <label className="text-[9.5px] font-bold text-text-tertiary uppercase block mb-1">
              Quota Quantity
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 50"
              value={newAddon.quota_value}
              onChange={(e) => setNewAddon({ ...newAddon, quota_value: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[9.5px] font-bold text-text-tertiary uppercase block mb-1">
              Description (Shown to Subscriber)
            </label>
            <input
              type="text"
              placeholder="e.g. Upload 50 additional portfolio videos each billing cycle..."
              value={newAddon.description}
              onChange={(e) => setNewAddon({ ...newAddon, description: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="sm:col-span-1">
            <button
              type="button"
              disabled={!newAddon.title.trim() || newAddon.price_inr === ''}
              onClick={handleAddNew}
              className="w-full py-1.5 px-3 bg-brand-purple hover:bg-brand-purple-dark text-white rounded-lg font-black text-xs transition cursor-pointer border-none shadow-xs disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <FiPlus size={13} />
              <span>Add to Plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
