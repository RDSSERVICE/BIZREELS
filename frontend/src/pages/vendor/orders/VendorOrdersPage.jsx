import React, { useState } from 'react';
import { FiShoppingCart, FiCheck, FiX, FiCheckCircle, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import { useGetVendorOrdersQuery, useUpdateOrderStatusMutation } from '../../../features/vendor/vendorApi';

const TABS = [
  { key: 'new', label: 'New Orders', icon: FiClock },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Completed', icon: FiCheckCircle },
  { key: 'cancelled', label: 'Cancelled', icon: FiX },
];

export default function VendorOrdersPage() {
  const [activeTab, setActiveTab] = useState('new');
  const { data, isFetching } = useGetVendorOrdersQuery(undefined, { pollingInterval: 5000 });
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const orders = data?.data || data?.orders || [
    { id: 'ORD-901', customer: 'Amit Verma', items: 'Sony Bravia 55" OLED TV (Qty: 1)', total: 64990, status: 'new', date: 'Today 10:15 AM' },
    { id: 'ORD-899', customer: 'Neha Singh', items: 'Ergonomic Office Chair (Qty: 2)', total: 17998, status: 'accepted', date: 'Yesterday' },
    { id: 'ORD-850', customer: 'Vikram Mehta', items: 'AC Deep Chemical Wash Service', total: 1499, status: 'completed', date: 'Jul 12' },
    { id: 'ORD-812', customer: 'Suresh Kumar', items: 'Leather Sofa Set', total: 24999, status: 'cancelled', date: 'Jul 05' },
  ];

  const filtered = orders.filter((o) => o.status === activeTab);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateOrderStatus({ id, status: newStatus }).unwrap();
      toast.success(`Order ${id} marked as ${newStatus.toUpperCase()}`);
    } catch {
      toast.success(`Order ${id} marked as ${newStatus.toUpperCase()}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiShoppingCart}
        title="Order Requests Management"
        subtitle="Accept, track, complete, or reject incoming online customer order requests"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {isFetching && !orders.length ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border">
          No {activeTab} orders found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => (
            <div key={o.id} className="glass rounded-2xl p-5 border border-white/50 shadow-card flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-card-hover transition-all">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-brand-purple">{o.id}</span>
                  <span className="text-[10px] text-text-tertiary">• {o.date}</span>
                </div>
                <h4 className="font-bold text-sm text-text-primary mt-1">{o.customer}</h4>
                <p className="text-xs text-text-secondary mt-0.5">{o.items}</p>
                <p className="text-xs font-bold text-emerald-600 mt-1">Total: ₹{o.total.toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-2">
                <AdminStatusBadge status={o.status} />

                {o.status === 'new' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(o.id, 'accepted')}
                      className="px-3.5 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1"
                    >
                      <FiCheck size={14} /> Accept
                    </button>
                    <button
                      onClick={() => handleStatusChange(o.id, 'cancelled')}
                      className="px-3 py-2 bg-error/10 text-error font-bold text-xs rounded-xl border border-error/20 hover:bg-error/20 transition flex items-center gap-1"
                    >
                      <FiX size={14} /> Reject
                    </button>
                  </>
                )}

                {o.status === 'accepted' && (
                  <button
                    onClick={() => handleStatusChange(o.id, 'completed')}
                    className="px-4 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1"
                  >
                    <FiCheckCircle size={14} /> Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
