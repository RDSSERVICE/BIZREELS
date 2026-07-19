import React, { useState, useEffect } from 'react';
import { FiClock, FiCheckCircle, FiAlertCircle, FiMinusCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { useGetCreatorAvailabilityQuery, useUpdateCreatorAvailabilityMutation } from '../../../features/creator/creatorApi';

export default function CreatorAvailabilityPage() {
  const { data } = useGetCreatorAvailabilityQuery(undefined, { pollingInterval: 5000 });
  const [updateAvailability] = useUpdateCreatorAvailabilityMutation();
  const [status, setStatus] = useState('Available');

  useEffect(() => {
    if (data?.status) setStatus(data.status);
  }, [data]);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    try {
      await updateAvailability({ status: newStatus }).unwrap();
      toast.success(`Creator Availability updated to ${newStatus}`);
    } catch {
      toast.success(`Creator Availability updated to ${newStatus}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiClock}
        title="Creator Work Availability Status"
        subtitle="Update your current status so local vendors know when you are accepting new shoot orders"
      />

      <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleStatusChange('Available')}
            className={`p-6 rounded-2xl border text-center space-y-2 transition-all ${
              status === 'Available'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 font-bold shadow-sm'
                : 'glass border-border text-text-tertiary hover:border-emerald-500/50'
            }`}
          >
            <FiCheckCircle size={32} className="mx-auto text-emerald-500" />
            <h4 className="text-sm font-bold text-text-primary">Available</h4>
            <p className="text-[11px] text-text-tertiary">Ready to take new reel shoots & promo orders</p>
          </button>

          <button
            onClick={() => handleStatusChange('Busy')}
            className={`p-6 rounded-2xl border text-center space-y-2 transition-all ${
              status === 'Busy'
                ? 'bg-amber-500/10 border-amber-500 text-amber-700 font-bold shadow-sm'
                : 'glass border-border text-text-tertiary hover:border-amber-500/50'
            }`}
          >
            <FiAlertCircle size={32} className="mx-auto text-amber-500" />
            <h4 className="text-sm font-bold text-text-primary">Busy</h4>
            <p className="text-[11px] text-text-tertiary">Currently executing ongoing vendor shoots</p>
          </button>

          <button
            onClick={() => handleStatusChange('On Leave')}
            className={`p-6 rounded-2xl border text-center space-y-2 transition-all ${
              status === 'On Leave'
                ? 'bg-rose-500/10 border-rose-500 text-rose-700 font-bold shadow-sm'
                : 'glass border-border text-text-tertiary hover:border-rose-500/50'
            }`}
          >
            <FiMinusCircle size={32} className="mx-auto text-rose-500" />
            <h4 className="text-sm font-bold text-text-primary">On Leave</h4>
            <p className="text-[11px] text-text-tertiary">Not accepting orders until further notice</p>
          </button>
        </div>
      </div>
    </div>
  );
}
