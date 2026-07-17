import React, { useState } from 'react';
import { FiShoppingBag, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const CreatorOrdersTab = () => {
  const [orders, setOrders] = useState([
    {
      id: 'ord_101',
      vendor: 'Royal Furniture Store',
      listing: 'Sofa Set Showcase Reel',
      amount: 1200,
      status: 'pending_acceptance', // pending_acceptance | in_production | delivered | revision
    },
    {
      id: 'ord_102',
      vendor: 'Aura Boutique',
      listing: 'Designer Saree Try-on haul',
      amount: 3500,
      status: 'in_production',
    },
    {
      id: 'ord_103',
      vendor: 'Vedic Wellness Spa',
      listing: 'Self-Care Vlog Reel',
      amount: 1500,
      status: 'delivered',
    }
  ]);

  const handleAcceptOrder = (id) => {
    setOrders(prev =>
      prev.map(o => o.id === id ? { ...o, status: 'in_production' } : o)
    );
    toast.success('Order accepted! Moved to production.');
  };

  const handleDeclineOrder = (id) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    toast.error('Order request declined.');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Direct Hire Orders</h3>
        <p className="text-xs text-slate-500 mt-1">Accept custom packages order requests from local businesses and vendors.</p>
      </div>

      <div className="flex flex-col gap-4">
        {orders.map((ord) => (
          <div key={ord.id} className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-premium transition-all duration-300">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-purple">{ord.vendor}</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border
                  ${ord.status === 'pending_acceptance' ? 'bg-pink-50 text-brand-pink border-brand-pink/15' : ''}
                  ${ord.status === 'in_production' ? 'bg-blue-50 text-blue-600 border-blue-100' : ''}
                  ${ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ''}
                `}>
                  {ord.status.replace('_', ' ')}
                </span>
              </div>
              <h4 className="text-sm font-bold text-brand-navy font-display mt-2">{ord.listing}</h4>
              <p className="text-xs text-slate-400 mt-1">Order ID: #{ord.id}</p>
            </div>

            <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Budget</span>
                <span className="text-sm font-black text-brand-navy font-display">₹{ord.amount}</span>
              </div>

              {ord.status === 'pending_acceptance' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeclineOrder(ord.id)}
                    className="p-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAcceptOrder(ord.id)}
                    className="px-3 py-2 text-xs font-bold text-white bg-brand-purple hover:bg-brand-purple-800 rounded-xl shadow-premium cursor-pointer transition-all flex items-center gap-1"
                  >
                    <FiCheck className="w-3.5 h-3.5" /> Accept
                  </button>
                </div>
              )}
              {ord.status === 'in_production' && (
                <span className="flex items-center gap-1.5 text-xs text-blue-600 font-bold bg-blue-50/50 border border-blue-200/40 px-3 py-1.5 rounded-xl">
                  <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> In Production
                </span>
              )}
              {ord.status === 'delivered' && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50/50 border border-emerald-200/40 px-3 py-1.5 rounded-xl">
                  <FiCheck className="w-3.5 h-3.5" /> Delivered
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreatorOrdersTab;
