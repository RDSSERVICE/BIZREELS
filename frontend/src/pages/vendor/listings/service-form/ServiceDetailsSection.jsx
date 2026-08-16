import React from 'react';

export default function ServiceDetailsSection({ form, updateForm }) {
  return (
    <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
      <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">
        2. Service Details
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Service Type</label>
          <select
            value={form.serviceType}
            onChange={(e) => updateForm('serviceType', e.target.value)}
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          >
            <option value="At Home">At Home</option>
            <option value="At Shop">At Shop</option>
            <option value="Online">Online</option>
            <option value="On-site">On-site</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Price Type</label>
          <select
            value={form.priceType}
            onChange={(e) => updateForm('priceType', e.target.value)}
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          >
            <option value="Fixed Price">Fixed Price</option>
            <option value="Starting From">Starting From</option>
            <option value="Per Hour">Per Hour</option>
            <option value="Per Day">Per Day</option>
            <option value="Per Project">Per Project</option>
            <option value="Custom Quote">Custom Quote</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Starting Price (₹) *</label>
          <input
            type="number"
            required
            value={form.price}
            onChange={(e) => updateForm('price', e.target.value)}
            placeholder="999"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Duration *</label>
          <input
            type="text"
            required
            value={form.duration}
            onChange={(e) => updateForm('duration', e.target.value)}
            placeholder="e.g. 1 Hour"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Min Order Value (₹)</label>
          <input
            type="number"
            value={form.minOrderValue}
            onChange={(e) => updateForm('minOrderValue', e.target.value)}
            placeholder="e.g. 500"
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Booking Availability</label>
          <select
            value={form.bookingAvailability}
            onChange={(e) => updateForm('bookingAvailability', e.target.value)}
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          >
            <option value="Immediate">Immediate</option>
            <option value="Same Day">Same Day</option>
            <option value="Next Day">Next Day</option>
            <option value="2-3 Days">2-3 Days</option>
            <option value="By Appointment">By Appointment</option>
          </select>
        </div>
      </div>
    </div>
  );
}
