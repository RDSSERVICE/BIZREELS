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
    { key: 'accepted', label: bi('Accepted / In Progress', 'स्वीकृत / प्रगति पर (In Progress)') },
    { key: 'completed', label: bi('Completed', 'पूरे किए गए (Completed)'), icon: FiCheckCircle },
    { key: 'cancelled', label: bi('Cancelled', 'रद्द (Cancelled)'), icon: FiX },
  ];

  const orders = Array.isArray(data?.data) ? data.data : Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : [];

  const filtered = orders.filter((o) => {
    const s = o.status || 'pending';
    if (activeTab === 'pending') return s === 'pending';
    if (activeTab === 'accepted') return ['accepted', 'processing', 'shipped', 'out_for_delivery'].includes(s);
    if (activeTab === 'completed') return ['completed', 'delivered'].includes(s);
    if (activeTab === 'cancelled') return ['cancelled', 'rejected', 'refunded'].includes(s);
    return s === activeTab;
  });

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateOrderStatus({ id, status: newStatus }).unwrap();
      toast.success(`Order marked as ${newStatus.toUpperCase()}`);
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
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-[#d99a3d]">#{String(o._id || o.id).slice(-8).toUpperCase()}</span>
                  <span className="text-[10px] text-slate-400">• {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : o.date || 'Today'}</span>
                </div>
                <h4 className="font-extrabold text-sm text-[#1a1a1a]">
                  {bi('Customer:', 'ग्राहक:')} {o.customer?.name || 'Customer'}
                  {o.customer?.phone && <span className="ml-2 font-normal text-xs text-slate-500">📞 {o.customer.phone}</span>}
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  {bi('Item:', 'सामग्री:')} <span className="font-bold text-slate-800">{o.listing?.title || 'Standard Order Details'}</span> (x{o.quantity || 1})
                </p>
                {o.address && (
                  <p className="text-[11px] text-slate-500">
                    📍 {bi('Delivery Address:', 'डिलीवरी पता:')} {o.address} {o.pincode ? `(${o.pincode})` : ''}
                  </p>
                )}
                {o.bookingDate && (
                  <p className="text-[11px] font-bold text-[#d99a3d]">
                    🗓️ {bi('Scheduled Visit:', 'अनुसूचित यात्रा:')} {o.bookingDate} {o.bookingTime ? `${bi('at', 'बजे')} ${o.bookingTime}` : ''}
                  </p>
                )}
                {o.trackingNumber && (
                  <p className="text-[11px] font-mono font-bold text-indigo-600">
                    📦 {bi('Tracking #:', 'ट्रैकिंग सं:')} {o.trackingNumber}
                  </p>
                )}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-black text-emerald-600">{bi('Total:', 'कुल:')} ₹{(o.price || 0).toLocaleString()}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-600 uppercase">
                    {o.paymentMethod || 'Vendor UPI'} • {o.paymentStatus || 'unpaid'}
                  </span>
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
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer border-none shadow-xs"
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
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition flex items-center gap-1 cursor-pointer border-none shadow-xs"
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
