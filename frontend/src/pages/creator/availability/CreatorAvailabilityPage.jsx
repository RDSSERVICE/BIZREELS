import React, { useState } from 'react';
import { FiClock, FiCheckCircle, FiAlertCircle, FiMinusCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CreatorAvailabilityPage() {
  const [status, setStatus] = useState('Available'); // 'Available' | 'Busy' | 'On Leave'

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    toast.success(`Creator Availability updated to ${newStatus}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FiClock className="text-purple-400" />
          <span>Creator Work Availability Status</span>
        </h2>
        <p className="text-xs text-slate-400">Update your current status so local vendors know when you are accepting new shoot orders</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleStatusChange('Available')}
            className={`p-5 rounded-2xl border text-center space-y-2 transition ${
              status === 'Available'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <FiCheckCircle size={28} className="mx-auto text-emerald-400" />
            <h4 className="text-sm font-bold">Available</h4>
            <p className="text-[10px] text-slate-400">Ready to take new reel shoots & promo orders</p>
          </button>

          <button
            onClick={() => handleStatusChange('Busy')}
            className={`p-5 rounded-2xl border text-center space-y-2 transition ${
              status === 'Busy'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <FiAlertCircle size={28} className="mx-auto text-amber-400" />
            <h4 className="text-sm font-bold">Busy</h4>
            <p className="text-[10px] text-slate-400">Currently executing ongoing vendor shoots</p>
          </button>

          <button
            onClick={() => handleStatusChange('On Leave')}
            className={`p-5 rounded-2xl border text-center space-y-2 transition ${
              status === 'On Leave'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <FiMinusCircle size={28} className="mx-auto text-rose-400" />
            <h4 className="text-sm font-bold">On Leave</h4>
            <p className="text-[10px] text-slate-400">Not accepting orders until further notice</p>
          </button>
        </div>
      </div>
    </div>
  );
}
