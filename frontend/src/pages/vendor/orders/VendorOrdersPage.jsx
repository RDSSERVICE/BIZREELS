import React, { useState, useEffect, useMemo } from 'react';
import {
  FiShoppingCart,
  FiCheck,
  FiX,
  FiCheckCircle,
  FiClock,
  FiTruck,
  FiDollarSign,
  FiSearch,
  FiCalendar,
  FiPackage,
  FiPhone,
  FiMapPin,
  FiInfo,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import { useGetVendorOrdersQuery, useUpdateOrderStatusMutation } from '../../../features/vendor/vendorApi';
import { useLanguage } from '../../../context/LanguageContext';
import { getSocket } from '../../../lib/socket';

export default function VendorOrdersPage() {
  const { bi } = useLanguage();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [shippingModalOrder, setShippingModalOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [courierInput, setCourierInput] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const { data, isFetching, refetch } = useGetVendorOrdersQuery(undefined, {
    refetchOnFocus: true,
  });
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  // Real-time order synchronization via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleOrderEvent = () => {
      refetch();
    };

    socket.on('order:new', handleOrderEvent);
    socket.on('order:updated', handleOrderEvent);

    return () => {
      socket.off('order:new', handleOrderEvent);
      socket.off('order:updated', handleOrderEvent);
    };
  }, [refetch]);

  const orders = useMemo(() => {
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.orders)) return data.orders;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  // Tab counts
  const pendingCount = orders.filter((o) => (o.status || 'pending') === 'pending').length;
  const acceptedCount = orders.filter((o) => ['accepted', 'processing', 'shipped', 'out_for_delivery'].includes(o.status)).length;
  const completedCount = orders.filter((o) => ['completed', 'delivered'].includes(o.status)).length;
  const cancelledCount = orders.filter((o) => ['cancelled', 'rejected', 'refunded'].includes(o.status)).length;

  const TABS = [
    { key: 'pending', label: bi('New Orders', 'नए ऑर्डर (New Orders)'), icon: FiClock, count: pendingCount },
    { key: 'accepted', label: bi('In Progress / Shipped', 'प्रगति पर / भेजा गया (In Progress)'), icon: FiTruck, count: acceptedCount },
    { key: 'completed', label: bi('Completed', 'पूरे किए गए (Completed)'), icon: FiCheckCircle, count: completedCount },
    { key: 'cancelled', label: bi('Cancelled / Rejected', 'रद्द / अस्वीकार (Cancelled)'), icon: FiX, count: cancelledCount },
  ];

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const s = o.status || 'pending';
      let matchesTab = false;
      if (activeTab === 'pending') matchesTab = s === 'pending';
      else if (activeTab === 'accepted') matchesTab = ['accepted', 'processing', 'shipped', 'out_for_delivery'].includes(s);
      else if (activeTab === 'completed') matchesTab = ['completed', 'delivered'].includes(s);
      else if (activeTab === 'cancelled') matchesTab = ['cancelled', 'rejected', 'refunded'].includes(s);
      else matchesTab = s === activeTab;

      if (!matchesTab) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idStr = String(o._id || o.id || '').toLowerCase();
        const customerName = (o.customer?.name || '').toLowerCase();
        const customerPhone = (o.customer?.phone || '').toLowerCase();
        const title = (o.listing?.title || o.itemSnapshot?.title || '').toLowerCase();
        return idStr.includes(q) || customerName.includes(q) || customerPhone.includes(q) || title.includes(q);
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const handleStatusChange = async (id, newStatus, extraPayload = {}) => {
    setSubmittingAction(true);
    try {
      await updateOrderStatus({ id, status: newStatus, ...extraPayload }).unwrap();
      if (newStatus === 'accepted') {
        toast.success(bi('Order accepted! Customer notified.', 'ऑर्डर स्वीकार कर लिया गया! ग्राहक को सूचित कर दिया गया।'));
      } else if (newStatus === 'cancelled' || newStatus === 'rejected') {
        toast.success(bi('Order rejected.', 'ऑर्डर अस्वीकार कर दिया गया।'));
      } else if (newStatus === 'completed') {
        toast.success(bi('Order marked as completed.', 'ऑर्डर पूरा चिह्नित किया गया।'));
      } else if (newStatus === 'shipped') {
        toast.success(bi('Order marked as Shipped! Customer notified with tracking info.', 'ऑर्डर भेज दिया गया!'));
      } else if (newStatus === 'processing') {
        toast.success(bi('Service marked as In Progress.', 'सेवा प्रगति पर चिह्नित की गई।'));
      } else {
        toast.success(bi(`Order marked as ${newStatus.toUpperCase()}`, `ऑर्डर ${newStatus.toUpperCase()} चिह्नित किया गया`));
      }
    } catch (err) {
      toast.error(err?.data?.message || err?.message || `Failed to mark order as ${newStatus.toUpperCase()}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleMarkPaymentReceived = async (id) => {
    setSubmittingAction(true);
    try {
      await updateOrderStatus({ id, paymentStatus: 'paid' }).unwrap();
      toast.success(bi('Payment confirmed as received!', 'भुगतान प्राप्त के रूप में सत्यापित किया गया!'));
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to update payment status');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleShipSubmit = async (e) => {
    e.preventDefault();
    if (!shippingModalOrder) return;
    const id = shippingModalOrder._id || shippingModalOrder.id;
    await handleStatusChange(id, 'shipped', {
      trackingNumber: trackingInput.trim() || undefined,
      shippingDetails: courierInput.trim() ? { courierName: courierInput.trim(), trackingNumber: trackingInput.trim() } : undefined,
    });
    setShippingModalOrder(null);
    setTrackingInput('');
    setCourierInput('');
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in font-sans p-2 sm:p-4">
      <AdminPageHeader
        icon={FiShoppingCart}
        title={bi('Order Requests Management', 'ऑर्डर अनुरोध प्रबंधन (Order Management)')}
        subtitle={bi('Accept, track, ship, and complete online customer order requests in real time', 'आने वाले ऑनलाइन ग्राहक ऑर्डर अनुरोधों को स्वीकार, ट्रैक, शिप और पूरा करें')}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder={bi('Search customer, phone, item, #ID...', 'ग्राहक, फोन, सामग्री, #ID खोजें...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#e3dccb] bg-white focus:outline-none focus:ring-2 focus:ring-[#d99a3d]/40 transition text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {isFetching && !orders.length ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-500 border border-[#e3dccb] space-y-2">
          <FiPackage className="mx-auto text-3xl text-slate-300" />
          <p className="font-semibold text-slate-600">
            {searchQuery
              ? bi('No orders matching your search query.', 'आपकी खोज से मेल खाता कोई ऑर्डर नहीं मिला।')
              : bi(`No ${activeTab} orders found.`, `कोई ${activeTab} ऑर्डर नहीं मिला।`)}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const isService = !!o.scheduledVisitTime ||
              !!o.bookingDate ||
              o.itemSnapshot?.listingType === 'service' ||
              o.listing?.type === 'service' ||
              o.listing?.postType === 'service' ||
              o.listing?.postType === 'services';

            const itemTitle = o.itemSnapshot?.title || o.listing?.title || 'Order Item';
            const orderId = String(o._id || o.id);
            const shortId = orderId.slice(-8).toUpperCase();
            const orderStatus = o.status || 'pending';
            const isPaid = o.paymentStatus === 'paid';

            return (
              <div
                key={orderId}
                className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs flex flex-col lg:flex-row justify-between lg:items-center gap-5 hover:shadow-sm transition-all"
              >
                <div className="space-y-2 flex-1">
                  {/* Top Bar: ID, Date, Item Type Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs text-[#d99a3d] font-mono">#{shortId}</span>
                    <span className="text-[10px] text-slate-400">
                      • {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : o.date || 'Today'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isService ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {isService ? '🛠️ ' + bi('Service Booking', 'सेवा बुकिंग') : '📦 ' + bi('Product Order', 'उत्पाद ऑर्डर')}
                    </span>
                    <AdminStatusBadge status={orderStatus} />
                    {o.deliveryStatus && o.deliveryStatus !== 'pending' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        🚚 {o.deliveryStatus.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {/* Customer Info */}
                  <h4 className="font-extrabold text-sm text-[#1a1a1a] flex items-center gap-2 flex-wrap">
                    <span>{bi('Customer:', 'ग्राहक:')} {o.customer?.name || 'Customer'}</span>
                    {o.customer?.phone && (
                      <a
                        href={`tel:${o.customer.phone}`}
                        className="inline-flex items-center gap-1 font-normal text-xs text-indigo-600 hover:underline"
                      >
                        <FiPhone size={12} /> {o.customer.phone}
                      </a>
                    )}
                  </h4>

                  {/* Item Details */}
                  <p className="text-xs text-slate-600 font-medium">
                    {bi('Item:', 'सामग्री:')}{' '}
                    <span className="font-bold text-slate-800">{itemTitle}</span>{' '}
                    {!isService && <span className="text-slate-500 font-semibold">(x{o.quantity || 1})</span>}
                  </p>

                  {/* Address */}
                  {o.address && (
                    <p className="text-[11px] text-slate-500 flex items-start gap-1">
                      <FiMapPin className="text-slate-400 mt-0.5 shrink-0" />
                      <span>
                        {bi('Delivery Address:', 'डिलीवरी पता:')} {o.address} {o.pincode ? `(${o.pincode})` : ''}
                      </span>
                    </p>
                  )}

                  {/* Booking Date & Slot (for Services) */}
                  {(o.bookingDate || o.scheduledVisitTime) && (
                    <p className="text-[11px] font-bold text-[#d99a3d] flex items-center gap-1.5">
                      <FiCalendar size={13} />
                      <span>
                        {bi('Scheduled Visit:', 'अनुसूचित यात्रा:')} {o.bookingDate || (o.scheduledVisitTime ? new Date(o.scheduledVisitTime).toLocaleDateString() : '')}{' '}
                        {o.bookingTime ? `${bi('at', 'बजे')} ${o.bookingTime}` : ''}
                      </span>
                    </p>
                  )}

                  {/* Tracking Number (if shipped) */}
                  {o.trackingNumber && (
                    <p className="text-[11px] font-mono font-bold text-indigo-600 flex items-center gap-1.5">
                      <FiTruck size={13} />
                      <span>{bi('Tracking #:', 'ट्रैकिंग सं:')} {o.trackingNumber}</span>
                      {o.shippingDetails?.courierName && (
                        <span className="text-[10px] font-sans font-normal text-slate-500">
                          ({o.shippingDetails.courierName})
                        </span>
                      )}
                    </p>
                  )}

                  {/* Pricing and Payment Status */}
                  <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                    <span className="text-xs font-black text-emerald-600">
                      {bi('Total:', 'कुल:')} ₹{(o.price || 0).toLocaleString()}
                    </span>

                    {/* Payment Mode Badge */}
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-600 uppercase">
                      {o.paymentMethod ? o.paymentMethod.replace(/_/g, ' ') : 'Vendor UPI'}
                    </span>

                    {/* Paid / Unpaid Status Badge */}
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                      isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isPaid ? bi('✓ Paid', '✓ भुगतान प्राप्त') : bi('⏳ Unpaid', '⏳ भुगतान शेष')}
                    </span>

                    {/* Revenue Recognized indicator */}
                    {o.revenueRecognized && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {bi('Revenue Recognized', 'राजस्व स्वीकृत')}
                      </span>
                    )}

                    {/* Cancellation & Refund Info */}
                    {orderStatus === 'cancelled' && (
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                        {bi('Refunded:', 'रिफंड किया गया:')} ₹{(o.refundAmount ?? o.price).toLocaleString()} ({o.refundPercentage ?? 100}%)
                        {o.refundMode === 'offline_direct' && ` • ${bi('Direct UPI Refund', 'सीधा UPI रिफंड')}`}
                      </span>
                    )}
                  </div>

                  {/* Notes / Reason */}
                  {o.cancellationReason && (
                    <p className="text-[11px] text-rose-600 italic">
                      <FiInfo className="inline mr-1" />
                      {bi('Reason:', 'कारण:')} {o.cancellationReason}
                    </p>
                  )}
                </div>

                {/* Right Side: Status Actions */}
                <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap lg:justify-end">
                  {/* Mark Payment Received Button (if unpaid and not cancelled) */}
                  {!isPaid && !['cancelled', 'rejected', 'refunded'].includes(orderStatus) && (
                    <button
                      disabled={submittingAction}
                      onClick={() => handleMarkPaymentReceived(orderId)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 font-bold text-xs transition border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                      title={bi('Confirm that customer has paid via UPI/Cash', 'पुष्टि करें कि ग्राहक ने UPI/कैश द्वारा भुगतान कर दिया है')}
                    >
                      <FiDollarSign size={13} /> {bi('Confirm Payment', 'भुगतान की पुष्टि')}
                    </button>
                  )}

                  {/* Pending Tab Actions */}
                  {activeTab === 'pending' && (
                    <>
                      <button
                        disabled={submittingAction}
                        onClick={() => handleStatusChange(orderId, 'accepted')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer border-none shadow-xs disabled:opacity-50"
                      >
                        <FiCheck size={14} /> {isService ? bi('Accept Booking', 'बुकिंग स्वीकार करें') : bi('Accept Order', 'ऑर्डर स्वीकार करें')}
                      </button>
                      <button
                        disabled={submittingAction}
                        onClick={() => handleStatusChange(orderId, 'cancelled')}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold text-xs transition border border-rose-200 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <FiX size={14} /> {bi('Reject', 'अस्वीकार करें')}
                      </button>
                    </>
                  )}

                  {/* Accepted / In Progress Tab Actions */}
                  {activeTab === 'accepted' && (
                    <>
                      {/* For Product Orders: Mark Shipped */}
                      {!isService && orderStatus === 'accepted' && (
                        <button
                          disabled={submittingAction}
                          onClick={() => setShippingModalOrder(o)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-700 transition flex items-center gap-1 cursor-pointer border-none shadow-xs disabled:opacity-50"
                        >
                          <FiTruck size={14} /> {bi('Mark Shipped', 'भेज दिया (Shipped)')}
                        </button>
                      )}

                      {/* For Service Bookings: Mark In Progress */}
                      {isService && orderStatus === 'accepted' && (
                        <button
                          disabled={submittingAction}
                          onClick={() => handleStatusChange(orderId, 'processing')}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-700 transition flex items-center gap-1 cursor-pointer border-none shadow-xs disabled:opacity-50"
                        >
                          <FiClock size={14} /> {bi('Start Service', 'सेवा शुरू करें')}
                        </button>
                      )}

                      {/* Complete Order / Service */}
                      <button
                        disabled={submittingAction}
                        onClick={() => handleStatusChange(orderId, 'completed')}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition flex items-center gap-1 cursor-pointer border-none shadow-xs disabled:opacity-50"
                      >
                        <FiCheckCircle size={14} /> {bi('Mark Completed', 'पूरा चिह्नित करें')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shipping Tracking Details Modal */}
      {shippingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#e3dccb] animate-scale-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <FiTruck className="text-indigo-600" />
                {bi('Dispatch / Ship Order', 'ऑर्डर भेजें (Ship Order)')}
              </h3>
              <button
                onClick={() => setShippingModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {bi('Enter shipping details below to notify customer and update tracking info:', 'ग्राहक को सूचित करने और ट्रैकिंग जानकारी अपडेट करने के लिए विवरण दर्ज करें:')}
            </p>

            <form onSubmit={handleShipSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {bi('Courier / Shipping Partner (Optional)', 'कूरियर कंपनी (वैकल्पिक)')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. BlueDart, Delhivery, SpeedPost, Shadowfax"
                  value={courierInput}
                  onChange={(e) => setCourierInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#e3dccb] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {bi('Tracking / AWB Number', 'ट्रैकिंग / AWB नंबर')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. TRACK12345678IN"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#e3dccb] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShippingModalOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {bi('Cancel', 'रद्द करें')}
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FiCheck size={14} /> {bi('Confirm Dispatch', 'डिस्पैच की पुष्टि करें')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
