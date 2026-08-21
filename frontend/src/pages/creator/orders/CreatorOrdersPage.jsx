import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiCheck, FiClock, FiX, FiInfo, FiDollarSign, FiTruck, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useGetCreatorOrdersQuery, useUpdateCreatorOrderStatusMutation } from '../../../features/creator/creatorApi';
import { useLanguage } from '../../../context/LanguageContext';

export default function CreatorOrdersPage() {
  const { bi } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const TABS = [
    { key: 'all', label: bi('All Projects', 'सभी प्रोजेक्ट्स'), icon: FiBriefcase },
    { key: 'pending', label: bi('Pending', 'लंबित'), icon: FiClock },
    { key: 'active', label: bi('In Progress', 'प्रगति पर'), icon: FiBriefcase },
    { key: 'completed', label: bi('Completed', 'पूर्ण'), icon: FiCheck },
    { key: 'cancelled', label: bi('Cancelled', 'रद्द'), icon: FiX },
  ];

  const { data, isFetching } = useGetCreatorOrdersQuery(undefined, { pollingInterval: 300000 });
  const [updateStatus] = useUpdateCreatorOrderStatusMutation();

  const allOrders = Array.isArray(data?.data?.data)
    ? data.data.data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : [];

  const filtered = allOrders.filter((o) => {
    const status = (o.status || '').toLowerCase();
    if (activeTab === 'pending') return status === 'pending' || status === 'requested';
    if (activeTab === 'active') return status === 'active' || status === 'in_progress' || status === 'accepted' || status === 'processing';
    if (activeTab === 'completed') return status === 'completed' || status === 'delivered';
    if (activeTab === 'cancelled') return status === 'cancelled' || status === 'rejected';
    return true;
  });

  const handleUpdateStatus = async (id, statusLabel) => {
    try {
      await updateStatus({ id, status: statusLabel }).unwrap();
      toast.success(bi(`Project status updated to ${statusLabel}!`, `प्रोजेक्ट स्थिति बदलकर ${statusLabel} कर दी गई!`));
      setSelectedOrder(null);
    } catch (err) {
      toast.error(err?.data?.message || bi('Failed to update status', 'स्थिति अपडेट करना विफल रहा'));
    }
  };

  const columns = [
    {
      key: 'type',
      label: bi('Type', 'प्रकार'),
      render: (val) => (
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase ${
          val === 'Collaboration' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
        }`}>
          {val || 'Direct'}
        </span>
      ),
    },
    {
      key: 'title',
      label: bi('Project', 'प्रोजेक्ट'),
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block max-w-[200px] truncate">{val || row.listing_title || 'Project'}</span>
          <span className="text-[10px] text-text-tertiary">{bi('Client:', 'क्लाइंट:')} {row.vendor_name || row.buyer_name || 'Vendor'}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      label: bi('Budget', 'बजट'),
      render: (val, row) => <span className="font-bold text-emerald-600">₹{(val || row.final_amount || row.current_offer || 0).toLocaleString()}</span>,
    },
    {
      key: 'paymentStatus',
      label: bi('Escrow Status', 'एस्क्रो स्थिति'),
      render: (val) => (
        <span className={`text-[10px] font-bold uppercase ${val === 'paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
          {val === 'paid' ? bi('● Secure Escrow', '● सुरक्षित एस्क्रो') : bi('○ Pending Pay', '○ भुगतान लंबित')}
        </span>
      ),
    },
    {
      key: 'status',
      label: bi('Status', 'स्थिति'),
      render: (val) => <AdminStatusBadge status={val || 'pending'} />,
    },
    {
      key: 'created_at',
      label: bi('Date', 'तिथि'),
      render: (val) => <span className="text-text-tertiary">{val ? new Date(val).toLocaleDateString('en-IN') : '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in font-sans pb-16">
      <AdminPageHeader
        icon={FiBriefcase}
        title={bi('My Projects & Orders', 'मेरे प्रोजेक्ट्स और ऑर्डर')}
        subtitle={bi('Manage vendor project requests, track progress, and mark deliveries', 'विक्रेता प्रोजेक्ट अनुरोध प्रबंधित करें, प्रगति ट्रैक करें और डिलीवरी अपडेट करें')}
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={filtered}
        loading={isFetching}
        searchPlaceholder={bi("Search projects...", "प्रोजेक्ट्स खोजें...")}
        searchValue={search}
        onSearch={setSearch}
        emptyMessage={bi("No projects found in this view.", "इस दृश्य में कोई प्रोजेक्ट नहीं मिला।")}
        testId="creator-orders-table"
        actions={(row) => {
          const status = (row.status || '').toLowerCase();
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedOrder(row)}
                className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
                title={bi('View Details', 'विवरण देखें')}
              >
                <FiInfo className="w-3.5 h-3.5" />
              </button>
              {row.vendor_id && (
                <button
                  onClick={() => navigate(`/creator/chat?userId=${row.vendor_id}&name=${encodeURIComponent(row.vendor_name)}`)}
                  className="p-1.5 rounded-lg hover:bg-brand-orange/10 text-text-tertiary hover:text-brand-orange transition-all"
                  title={bi('Chat with Client', 'क्लाइंट से चैट करें')}
                >
                  <FiMessageSquare className="w-3.5 h-3.5" />
                </button>
              )}
              {(status === 'pending' || status === 'requested') && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(row.id || row._id, 'accepted')}
                    className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-text-tertiary hover:text-emerald-500 transition-all"
                    title={bi('Accept Project', 'प्रोजेक्ट स्वीकार करें')}
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(row.id || row._id, 'rejected')}
                    className="p-1.5 rounded-lg hover:bg-error/10 text-text-tertiary hover:text-error transition-all"
                    title={bi('Reject Project', 'प्रोजेक्ट अस्वीकार करें')}
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {(status === 'active' || status === 'accepted' || status === 'in_progress' || status === 'processing') && (
                <button
                  onClick={() => handleUpdateStatus(row.id || row._id, 'completed')}
                  className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-text-tertiary hover:text-emerald-500 transition-all"
                  title={bi('Mark Completed', 'पूर्ण के रूप में चिह्नित करें')}
                >
                  <FiCheck className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        }}
      />

      {/* Details Dialog / Modal */}
      {selectedOrder && (
        <AdminModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title="Project Order Details"
        >
          <div className="space-y-5 text-xs">
            <div className="flex justify-between items-start border-b border-border pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-text-primary">{selectedOrder.title}</h4>
                <p className="text-[10px] text-text-tertiary mt-0.5">
                  Type: <strong className="text-brand-purple">{selectedOrder.type}</strong> • ID: {selectedOrder._id}
                </p>
              </div>
              <AdminStatusBadge status={selectedOrder.status || 'pending'} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-secondary p-3.5 rounded-xl border border-border flex items-center gap-3">
                <FiDollarSign size={20} className="text-emerald-500 flex-shrink-0" />
                <div>
                  <span className="text-[9px] font-bold text-text-tertiary uppercase block">Budget / Price</span>
                  <span className="font-black text-text-primary text-sm">₹{(selectedOrder.amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-surface-secondary p-3.5 rounded-xl border border-border flex items-center gap-3">
                <FiClock size={20} className="text-brand-purple flex-shrink-0" />
                <div>
                  <span className="text-[9px] font-bold text-text-tertiary uppercase block">Timeline / Delivery</span>
                  <span className="font-black text-text-primary text-sm">
                    {selectedOrder.deliveryDays ? `${selectedOrder.deliveryDays} Days` : 'Instant Delivery'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1 bg-surface-secondary p-4 rounded-xl border border-border">
              <span className="text-[9px] font-bold text-text-tertiary uppercase block">Client / Vendor Details</span>
              <p className="font-bold text-text-primary">{selectedOrder.vendor_name || 'Vendor Client'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  selectedOrder.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {selectedOrder.paymentStatus === 'paid' ? 'Secure Escrow Paid' : 'Pending Payment Escrow'}
                </span>
              </div>
            </div>

            {selectedOrder.description && (
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-text-tertiary uppercase block">Campaign Description & Requirements</span>
                <p className="text-text-secondary leading-relaxed bg-surface p-3.5 rounded-xl border border-border whitespace-pre-line">
                  {selectedOrder.description}
                </p>
              </div>
            )}

            {selectedOrder.type === 'Direct Purchase' && (
              <div className="space-y-1 bg-surface-secondary p-3.5 rounded-xl border border-border">
                <span className="text-[9px] font-bold text-text-tertiary uppercase block flex items-center gap-1">
                  <FiTruck /> Shipping / Delivery Address
                </span>
                <p className="text-text-secondary">{selectedOrder.address}</p>
              </div>
            )}

            {/* Modal Actions */}
            {selectedOrder.vendor_id && (
              <button
                onClick={() => navigate(`/creator/chat?userId=${selectedOrder.vendor_id}&name=${encodeURIComponent(selectedOrder.vendor_name)}`)}
                className="w-full py-3 bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange rounded-xl font-bold transition-all text-center flex items-center justify-center gap-2 border border-brand-orange/20"
              >
                <FiMessageSquare /> Chat with Client
              </button>
            )}

            <div className="flex gap-2.5 pt-3 border-t border-border mt-3">
              {(selectedOrder.status === 'pending' || selectedOrder.status === 'requested') && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'accepted')}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all text-center"
                  >
                    Accept Collaboration
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'rejected')}
                    className="flex-1 py-3 bg-error/10 text-error rounded-xl font-bold hover:bg-error/20 transition-all text-center border border-error/20"
                  >
                    Decline
                  </button>
                </>
              )}

              {(selectedOrder.status === 'active' || selectedOrder.status === 'accepted' || selectedOrder.status === 'in_progress' || selectedOrder.status === 'processing') && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'completed')}
                  className="w-full py-3 gradient-brand text-white rounded-xl font-bold hover:opacity-90 transition-all text-center shadow-premium"
                >
                  Mark as Project Completed
                </button>
              )}

              <button
                onClick={() => setSelectedOrder(null)}
                className="py-3 px-4 bg-surface border border-border rounded-xl font-bold text-text-secondary hover:bg-surface-tertiary transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
