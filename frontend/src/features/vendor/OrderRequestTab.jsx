import React, { useState, useEffect } from 'react';
import { useGetOrdersQuery } from '../customer/activitiesApi';
import { FiCheck, FiX, FiCheckCircle, FiInfo, FiLayers, FiCalendar } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { toast } from 'react-hot-toast';

const OrderRequestTab = ({ user }) => {
  const [orderFilter, setOrderFilter] = useState('new');
  const [localOrders, setLocalOrders] = useState([]);

  // API Queries & Mutations
  const { data: ordersRes, isLoading: isOrdersLoading, refetch } = useGetOrdersQuery();

  useEffect(() => {
    if (ordersRes?.orders) {
      setLocalOrders(ordersRes.orders);
    }
  }, [ordersRes]);

  // Filter orders by status
  const filteredOrders = localOrders.filter((ord) => {
    if (orderFilter === 'new') return ord.status === 'new' || ord.status === 'pending';
    return ord.status === orderFilter;
  });

  const handleUpdateOrderStatus = (orderId, status) => {
    // Optimistic local update
    setLocalOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status } : o))
    );
    toast.success(`Order request status updated to ${status.toUpperCase()}!`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center px-1 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Store checkout orders</h3>
          <p className="text-xs text-slate-500 mt-1">Accept and track client purchases from listing catalogs.</p>
        </div>

        {/* Tab Filter List */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200/50">
          {[
            { id: 'new', label: 'New / Pending' },
            { id: 'accepted', label: 'Accepted' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setOrderFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap
                ${orderFilter === tab.id ? 'bg-white text-brand-purple shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isOrdersLoading ? (
        <div className="py-16 flex justify-center"><Loader /></div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass p-16 text-center rounded-2xl text-slate-500 border border-white/50 shadow-glass flex flex-col items-center gap-3">
          <FiInfo className="w-8 h-8 text-brand-purple/60" />
          <p className="text-sm font-semibold">No order requests found under this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((ord) => (
            <div
              key={ord._id}
              className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col justify-between gap-4 hover:shadow-premium transition-all duration-300"
            >
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-400 font-mono">Order ID: {ord._id.slice(-6)}</span>
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-lg font-black uppercase tracking-wider shadow-sm
                    ${ord.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      ord.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      ord.status === 'accepted' ? 'bg-indigo-100 text-indigo-800' : 'bg-brand-orange/20 text-brand-orange'}
                  `}>
                    {ord.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-brand-navy font-display mt-2">{ord.listing?.title || 'Catalog Item Purchase'}</h4>
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] mt-1">
                  <FiCalendar className="w-3.5 h-3.5" />
                  <span>Placed: {new Date(ord.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 mt-2 flex justify-between items-center text-xs">
                  <span>Price: <strong className="text-brand-navy">₹{ord.price}</strong></span>
                  <span>Quantity: <strong className="text-brand-navy">{ord.quantity || 1}</strong></span>
                </div>
              </div>

              {/* Action Buttons based on status */}
              {(ord.status === 'new' || ord.status === 'pending' || !ord.status) && (
                <div className="border-t border-slate-100 pt-3.5 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateOrderStatus(ord._id, 'cancelled')}
                    className="px-3.5 py-2 text-xs font-bold text-red-500 border border-red-200/50 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateOrderStatus(ord._id, 'accepted')}
                    className="px-4 py-2 text-xs font-bold text-white bg-brand-purple hover:bg-brand-purple-800 rounded-xl shadow-premium cursor-pointer transition-all flex items-center gap-1"
                  >
                    <FiCheck className="w-4 h-4" /> Accept Order
                  </button>
                </div>
              )}

              {ord.status === 'accepted' && (
                <div className="border-t border-slate-100 pt-3.5 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateOrderStatus(ord._id, 'cancelled')}
                    className="px-3.5 py-2 text-xs font-bold text-red-500 border border-red-200/50 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                  >
                    Cancel Order
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateOrderStatus(ord._id, 'completed')}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1"
                  >
                    <FiCheckCircle className="w-4 h-4" /> Complete Order
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderRequestTab;
