import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdateProfileMutation } from '../auth/authApi';
import { updateUser } from '../auth/authSlice';
import { FiDollarSign, FiClock, FiGrid, FiCheckCircle } from 'react-icons/fi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { toast } from 'react-hot-toast';

const CreatorPricingTab = ({ user }) => {
  const dispatch = useDispatch();
  const [updateProfileApi, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [pricingTiers, setPricingTiers] = useState(
    user?.creatorProfile?.pricingTiers?.length > 0
      ? user.creatorProfile.pricingTiers
      : [
          { label: 'Basic 1 Reel Campaign', price: 500, deliverables: '1 vertical short video edit, raw file shared', deliveryDays: 3 },
          { label: 'Standard 3 Reels Bundle', price: 1200, deliverables: '3 vertical videos edits, script writing support', deliveryDays: 7 },
          { label: 'Mega 10 Reels Branding takeover', price: 3500, deliverables: '10 premium quality video edits, captions + script writing', deliveryDays: 14 }
        ]
  );

  const [hourlyRate, setHourlyRate] = useState(user?.creatorProfile?.hourlyRate || '250');
  const [dayRate, setDayRate] = useState(user?.creatorProfile?.dayRate || '1500');

  const handleUpdatePricing = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfileApi({
        creatorProfile: {
          pricingTiers,
          hourlyRate: parseFloat(hourlyRate),
          dayRate: parseFloat(dayRate)
        }
      }).unwrap();
      dispatch(updateUser(res.data.user));
      toast.success('Creator packages pricing updated successfully!');
    } catch (err) {
      toast.error('Failed to save creator package pricing settings.');
    }
  };

  return (
    <form onSubmit={handleUpdatePricing} className="glass p-6 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-6 animate-fade-in">
      <div>
        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Configure package pricing</h3>
        <p className="text-xs text-slate-500 mt-1">Set rates for custom deliverables bundles or hourly shoots. Local vendors can order directly.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Hourly shoot rate (₹) *"
          type="number"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          required
        />
        <Input
          label="Day shoot rate (₹) *"
          type="number"
          value={dayRate}
          onChange={(e) => setDayRate(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 pt-4">
        <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Deliverable Package Tiers</label>
        
        <div className="flex flex-col gap-4">
          {pricingTiers.map((tier, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                <span className="text-xs font-black text-brand-purple uppercase tracking-wider">{tier.label}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Package Price (₹)</label>
                  <input
                    type="number"
                    value={tier.price}
                    onChange={(e) => {
                      const updated = [...pricingTiers];
                      updated[idx].price = parseInt(e.target.value) || 0;
                      setPricingTiers(updated);
                    }}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Delivery Days</label>
                  <input
                    type="number"
                    value={tier.deliveryDays}
                    onChange={(e) => {
                      const updated = [...pricingTiers];
                      updated[idx].deliveryDays = parseInt(e.target.value) || 0;
                      setPricingTiers(updated);
                    }}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Deliverables Details</label>
                  <input
                    type="text"
                    value={tier.deliverables}
                    onChange={(e) => {
                      const updated = [...pricingTiers];
                      updated[idx].deliverables = e.target.value;
                      setPricingTiers(updated);
                    }}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-4 border-t border-slate-100 pt-4">
        <Button
          type="submit"
          variant="primary"
          className="text-xs py-2.5 px-6 rounded-xl cursor-pointer"
        >
          Update Package Prices
        </Button>
      </div>
    </form>
  );
};

export default CreatorPricingTab;
