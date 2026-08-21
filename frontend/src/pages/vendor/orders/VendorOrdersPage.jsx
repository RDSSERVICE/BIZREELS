import React, { useState } from 'react';
import { FiShoppingCart, FiCheck, FiX, FiCheckCircle, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import { useGetVendorOrdersQuery, useUpdateOrderStatusMutation } from '../../../features/vendor/vendorApi';
import { useLanguage } from '../../../context/LanguageContext';

export default function VendorOrdersPage() {
  const { bi, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('pending');
  const { data, isFetching } = useGetVendorOrdersQuery(undefined, { pollingInterval: 300000 });
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const TABS = [
    { key: 'pending', label: bi('New Orders', 'नए ऑर्डर (New Orders)'), icon: FiClock },
    { key: 'accepted', label: bi('Accepted', 'स्वीकृत (Accepted)') },
    { key: 'completed', label: bi('Completed', 'पूरे किए गए (Completed)'), icon: FiCheckCircle },
    { key: 'cancelled', label: bi('Cancelled', 'रद्द (Cancelled)'), icon: FiX },
  ];

  const orders = Array.isArray(data?.data) ? data.data : Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : [];

  const filtered = orders.filter((o) => (o.status || 'pending') === activeTab);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateOrderStatus({ id, status: newStatus }).unwrap();
      toast.success(`Order ${id} marked as ${newStatus.toUpperCase()}`);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || `Failed to mark order as ${newStatus.toUpperCase()}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in font-sans p-2 sm:p-4">
      <AdminPageHeader
        icon={FiShoppingCart}
        title={bi('Order Requests Management', 'ऑर्डर अनुरोध प्रबंधन (Order Management)')}
        subtitle={bi('Accept, track, complete, or reject incoming online customer order requests', 'आने वाले ऑनलाइन ग्राहक ऑर्डर अनुरोधों को स्वीकार, ट्रैक, पूरा या अस्वीकार करें')}
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {isFetching && !orders.length ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-500 border border-[#e3dccb]">
          {bi(`No ${activeTab} orders found.`, `कोई ${activeTab} ऑर्डर नहीं मिला।`)}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => (
            <div key={o._id || o.id} className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-sm transition-all">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-[#d99a3d]">{o._id || o.id}</span>
                  <span className="text-[10px] text-slate-400">• {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : o.date || 'Today'}</span>
                </div>
                <h4 className="font-extrabold text-sm text-[#1a1a1a] mt-1">{bi('Order from:', 'ग्राहक से ऑर्डर:')} {o.customer?.name || 'Customer'}</h4>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  {bi('Listing:', 'लिस्टिंग:')} {o.listing?.title || 'Standard Order Details'} (x{o.quantity || 1})
                </p>
                {o.bookingDate && (
                  <p className="text-[11px] font-bold text-[#d99a3d] mt-0.5">
                    🗓️ {bi('Scheduled Visit:', 'अनुसूचित यात्रा:')} {o.bookingDate} {o.bookingTime ? `${bi('at', 'बजे')} ${o.bookingTime}` : ''}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-black text-emerald-600">{bi('Total:', 'कुल:')} ₹{(o.price || 0).toLocaleString()}</span>
                  {o.status === 'cancelled' && (
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                      {bi('Refunded:', 'रिफंड किया गया:')} ₹{(o.refundAmount ?? o.price).toLocaleString()} ({o.refundPercentage ?? 100}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <AdminStatusBadge status={o.status || 'pending'} />
                {activeTab === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(o._id || o.id, 'accepted')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer border-none"
                    >
                      <FiCheck size={14} /> {bi('Accept Order', 'ऑर्डर स्वीकार करें')}
                    </button>
                    <button
                      onClick={() => handleStatusChange(o._id || o.id, 'cancelled')}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold text-xs transition border border-rose-200 flex items-center gap-1 cursor-pointer"
                    >
                      <FiX size={14} /> {bi('Reject', 'अस्वीकार करें')}
                    </button>
                  </>
                )}
                {activeTab === 'accepted' && (
                  <button
                    onClick={() => handleStatusChange(o._id || o.id, 'completed')}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition flex items-center gap-1 cursor-pointer border-none"
                  >
                    <FiCheckCircle size={14} /> {bi('Mark Completed', 'पूरा चिह्नित करें')}
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
