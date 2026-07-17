import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdateProfileMutation } from '../auth/authApi';
import { updateUser } from '../auth/authSlice';
import { FiCalendar, FiClock, FiCoffee, FiCheckCircle } from 'react-icons/fi';
import Button from '../../components/common/Button';
import { toast } from 'react-hot-toast';

const CreatorAvailabilityTab = ({ user }) => {
  const dispatch = useDispatch();
  const [updateProfileApi, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [availability, setAvailability] = useState(user?.creatorProfile?.availability || 'available');

  const handleUpdateAvailability = async () => {
    try {
      const res = await updateProfileApi({
        creatorProfile: {
          availability
        }
      }).unwrap();
      dispatch(updateUser(res.data.user));
      toast.success(`Availability status marked as ${availability.toUpperCase()}!`);
    } catch (e) {
      toast.error('Failed to update availability status.');
    }
  };

  const options = [
    { id: 'available', name: 'Available', desc: 'Active and accepting local sponsorship shoots.', color: 'border-emerald-500 text-emerald-600 bg-emerald-50/20', icon: FiCheckCircle },
    { id: 'busy', name: 'Busy', desc: 'Fully booked with ongoing project campaigns.', color: 'border-indigo-500 text-indigo-600 bg-indigo-50/20', icon: FiClock },
    { id: 'leave', name: 'On Leave', desc: 'Temporarily taking custom booking breaks.', color: 'border-brand-orange text-brand-orange bg-brand-orange/5', icon: FiCoffee }
  ];

  return (
    <div className="glass p-6 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-6 animate-fade-in">
      <div>
        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Availability Schedule Status</h3>
        <p className="text-xs text-slate-500 mt-1">Configure your schedule status. Local vendors will view your occupancy marker before booking.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = availability === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => setAvailability(opt.id)}
              className={`p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col gap-3 cursor-pointer select-none
                ${isSelected
                  ? `${opt.color} shadow-md scale-[1.02] border-opacity-100`
                  : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:text-slate-700'
                }
              `}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider font-display">{opt.name}</span>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">{opt.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-4 border-t border-slate-100 pt-4">
        <Button
          onClick={handleUpdateAvailability}
          variant="primary"
          className="text-xs py-2.5 px-6 rounded-xl cursor-pointer"
        >
          Update availability status
        </Button>
      </div>
    </div>
  );
};

export default CreatorAvailabilityTab;
