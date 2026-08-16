import React from 'react';

export default function ServiceCancellationPolicySection({ form, updateForm }) {
  const policies = form.policies || {
    freeCancellationHours: 24,
    withinWindowHours: 24,
    withinWindowRefundPercent: 50,
    afterVisitRefundPercent: 0,
    termsAndConditions: '',
  };

  const updatePolicies = (patch) => {
    updateForm('policies', { ...policies, ...patch });
  };

  return (
    <div className="space-y-4 p-4 bg-surface-secondary rounded-2xl border border-border">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider flex items-center gap-1.5">
          <span>6. Cancellation & Refund Policy</span>
          <span className="text-[10px] lowercase font-normal text-text-tertiary">(Pre-Payment Bookings)</span>
        </h4>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          Live Auto-Calculate
        </span>
      </div>

      <p className="text-[11px] text-text-tertiary">
        Configure automated refund rules when a customer cancels an appointment where advance/pre-payment has been made.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Rule 1: Free Cancellation */}
        <div className="p-3 bg-surface rounded-xl border border-border space-y-1.5">
          <label className="text-[10px] font-bold text-text-primary uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> 1. Free Cancellation
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              required
              value={policies.freeCancellationHours}
              onChange={(e) =>
                updatePolicies({
                  freeCancellationHours: Math.max(0, parseInt(e.target.value, 10) || 0),
                })
              }
              className="w-24 p-2 bg-surface-secondary border border-border rounded-xl text-xs font-bold text-text-primary"
            />
            <span className="text-xs text-text-secondary">hours before scheduled visit</span>
          </div>
          <p className="text-[9px] text-text-tertiary">
            Customer receives <strong>100% full refund</strong> if cancelled ≥ this time.
          </p>
        </div>

        {/* Rule 2: Cancellation Within X Hours */}
        <div className="p-3 bg-surface rounded-xl border border-border space-y-1.5">
          <label className="text-[10px] font-bold text-text-primary uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> 2. Cancellation Within Window
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-text-tertiary block mb-0.5">Within (Hours)</label>
              <input
                type="number"
                min="0"
                required
                value={policies.withinWindowHours}
                onChange={(e) =>
                  updatePolicies({
                    withinWindowHours: Math.max(0, parseInt(e.target.value, 10) || 0),
                  })
                }
                className="w-full p-2 bg-surface-secondary border border-border rounded-xl text-xs font-bold text-text-primary"
              />
            </div>
            <div>
              <label className="text-[9px] text-text-tertiary block mb-0.5">Refund (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={policies.withinWindowRefundPercent}
                onChange={(e) =>
                  updatePolicies({
                    withinWindowRefundPercent: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                  })
                }
                className="w-full p-2 bg-surface-secondary border border-border rounded-xl text-xs font-bold text-text-primary"
              />
            </div>
          </div>
          <p className="text-[9px] text-text-tertiary">
            Customer receives <strong>{policies.withinWindowRefundPercent}% refund</strong> if cancelled within {policies.withinWindowHours}h.
          </p>
        </div>

        {/* Rule 3: After Visit Cancellation */}
        <div className="p-3 bg-surface rounded-xl border border-border space-y-1.5 sm:col-span-2">
          <label className="text-[10px] font-bold text-text-primary uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> 3. Cancellation After Scheduled Visit Time
          </label>
          <div className="flex items-center gap-3">
            <div className="w-32">
              <input
                type="number"
                min="0"
                max="100"
                required
                value={policies.afterVisitRefundPercent}
                onChange={(e) =>
                  updatePolicies({
                    afterVisitRefundPercent: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                  })
                }
                className="w-full p-2 bg-surface-secondary border border-border rounded-xl text-xs font-bold text-text-primary"
              />
            </div>
            <span className="text-xs text-text-secondary font-medium">
              % refund for cancellations submitted after visit/service time has passed
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Live Customer Preview Card */}
      <div className="p-3.5 bg-gradient-to-br from-brand-purple/5 to-brand-pink/5 rounded-2xl border border-brand-purple/20 space-y-2">
        <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider block">
          🛡️ Customer Policy Preview (Shown at Checkout & Booking)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="p-2 bg-surface rounded-xl border border-emerald-500/20 text-emerald-700">
            <span className="font-bold block text-xs">🟢 Free Cancel</span>
            Up to <strong>{policies.freeCancellationHours}h</strong> before visit → <span className="font-black">100% Refund</span>
          </div>
          <div className="p-2 bg-surface rounded-xl border border-amber-500/20 text-amber-700">
            <span className="font-bold block text-xs">🟡 Within Window</span>
            Within <strong>{policies.withinWindowHours}h</strong> of visit → <span className="font-black">{policies.withinWindowRefundPercent}% Refund</span>
          </div>
          <div className="p-2 bg-surface rounded-xl border border-red-500/20 text-red-700">
            <span className="font-bold block text-xs">🔴 After Visit</span>
            After scheduled visit time → <span className="font-black">{policies.afterVisitRefundPercent}% Refund</span>
          </div>
        </div>
        {Number(form.price) > 0 && (
          <div className="pt-1 text-[10px] text-text-tertiary">
            <strong>Example for ₹{Number(form.price).toLocaleString('en-IN')} booking:</strong>
            {' '}≥{policies.freeCancellationHours}h: ₹{Number(form.price).toLocaleString('en-IN')} |
            {' '}&lt;{policies.withinWindowHours}h: ₹{Math.round(Number(form.price) * (policies.withinWindowRefundPercent / 100)).toLocaleString('en-IN')} |
            {' '}After visit: ₹{Math.round(Number(form.price) * (policies.afterVisitRefundPercent / 100)).toLocaleString('en-IN')}
          </div>
        )}
      </div>

      {/* Terms & Additional Notes */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary block mb-1">
          Terms & Conditions / Special Instructions (Optional)
        </label>
        <input
          type="text"
          value={policies.termsAndConditions}
          onChange={(e) => updatePolicies({ termsAndConditions: e.target.value })}
          placeholder="e.g. Please ensure power supply is active during AC servicing..."
          className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
        />
      </div>
    </div>
  );
}
