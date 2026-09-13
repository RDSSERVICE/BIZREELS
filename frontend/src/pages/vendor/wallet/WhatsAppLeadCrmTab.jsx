import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiRefreshCw, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiClock, 
  FiExternalLink, 
  FiSettings, 
  FiShield, 
  FiMessageSquare,
  FiSend,
  FiX,
  FiCheck,
  FiCopy
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { TbCurrencyRupee } from 'react-icons/tb';
import toast from 'react-hot-toast';
import { whatsappApi } from '../../../lib/api';
import { useLanguage } from '../../../context/LanguageContext';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';

export default function WhatsAppLeadCrmTab() {
  const { bi } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    billedLeads: 0,
    unbilledLeads: 0,
    duplicateLeads: 0,
    totalCharged: 0,
    totalMessages: 0,
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  // Connection form state
  const [configForm, setConfigForm] = useState({
    wabaId: '',
    phoneNumberId: '',
    messagingTier: 'Tier 1 — 250 conversations/day',
    status: 'connected',
  });
  const [configSaving, setConfigSaving] = useState(false);

  // Simulation form state
  const [simForm, setSimForm] = useState({
    customerPhone: '919876543210',
    customerName: 'Aarav Sharma',
    messageText: 'Hi, I am interested in your listing! Can you provide more details?',
  });
  const [simulating, setSimulating] = useState(false);

  // Fetch status and leads
  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [statusRes, leadsRes] = await Promise.all([
        whatsappApi.vendorStatus().catch((err) => {
          console.warn('Failed to load WhatsApp vendor status:', err);
          return { data: { data: null } };
        }),
        whatsappApi.vendorLeads({ status: statusFilter, limit: 100 }).catch((err) => {
          console.warn('Failed to load WhatsApp vendor leads:', err);
          return { data: { data: { leads: [], stats: {} } } };
        }),
      ]);

      if (statusRes?.data?.data) {
        setConnectionStatus(statusRes.data.data);
        setConfigForm({
          wabaId: statusRes.data.data.waba_id || '',
          phoneNumberId: statusRes.data.data.phone_number_id || '',
          messagingTier: statusRes.data.data.messaging_tier || 'Tier 1 — 250 conversations/day',
          status: statusRes.data.data.connection_status || 'connected',
        });
      }

      if (leadsRes?.data?.data) {
        setLeads(leadsRes.data.data.leads || []);
        if (leadsRes.data.data.stats) {
          setStats(leadsRes.data.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching WhatsApp CRM data:', err);
      toast.error('Failed to load WhatsApp CRM details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  // Initialize Meta Facebook SDK if app id is available
  useEffect(() => {
    const metaAppId = import.meta.env.VITE_META_APP_ID;
    if (!metaAppId || window.FB) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: metaAppId,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v20.0',
      });
    };

    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      js.async = true;
      js.defer = true;
      document.body.appendChild(js);
    }
  }, []);

  // Handle Meta Embedded Signup popup
  const handleLaunchEmbeddedSignup = () => {
    if (window.FB) {
      window.FB.login(
        function (response) {
          if (response.authResponse?.code) {
            handleMetaSignupSuccess(response.authResponse.code);
          } else {
            console.log('[Meta Signup] User cancelled or incomplete authorization.');
          }
        },
        {
          config_id: import.meta.env.VITE_META_CONFIG_ID,
          response_type: 'code',
          override_default_response_type: true,
          extras: { setup: {} },
        }
      );
    } else {
      setIsConfigModalOpen(true);
    }
  };

  const handleMetaSignupSuccess = async (code, sessionData = {}) => {
    setConfigSaving(true);
    try {
      const res = await whatsappApi.embeddedSignupCallback({
        code,
        wabaId: sessionData.waba_id,
        phoneNumberId: sessionData.phone_number_id,
      });
      if (res?.data?.success) {
        toast.success(res.data.data?.message || res.data.message || 'WhatsApp Business connected successfully!');
        setIsConfigModalOpen(false);
        fetchData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete Meta WhatsApp onboarding');
    } finally {
      setConfigSaving(false);
    }
  };

  // Handle saving connection config
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setConfigSaving(true);
    try {
      const res = await whatsappApi.vendorConnect(configForm);
      if (res?.data?.success) {
        toast.success('WhatsApp Business credentials saved successfully');
        setIsConfigModalOpen(false);
        fetchData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update credentials');
    } finally {
      setConfigSaving(false);
    }
  };

  // Handle simulating an inbound message (development/sandbox testing)
  const handleSimulateInbound = async (e) => {
    e.preventDefault();
    setSimulating(true);
    try {
      const res = await whatsappApi.simulateInbound({
        customerPhone: simForm.customerPhone,
        customerName: simForm.customerName,
        messageText: simForm.messageText,
      });

      if (res?.data?.success) {
        toast.success(
          res.data.charged
            ? 'Simulated inbound message! ₹2.50 deducted.'
            : `Simulated inbound message! (${res.data.reason || 'No charge - 24h window'})`,
          { duration: 4500 }
        );
        setIsSimulateModalOpen(false);
        fetchData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  // Filter leads by search query (customer name, phone, or listing title)
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter((item) => {
      const phone = (item.customer_phone || '').toLowerCase();
      const name = (item.customer_name || '').toLowerCase();
      const listing = (item.listing_id?.title || '').toLowerCase();
      return phone.includes(q) || name.includes(q) || listing.includes(q);
    });
  }, [leads, searchQuery]);

  // Table columns
  const columns = [
    {
      header: bi('Customer / Buyer', 'ग्राहक'),
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <FaWhatsapp size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-[#1a1a1a] truncate">
              {row.customer_name || 'WhatsApp Buyer'}
            </div>
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
              <span>+{row.customer_phone}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(row.customer_phone);
                  toast.success('Phone copied', { id: 'copy-phone', duration: 1500 });
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                title="Copy phone"
              >
                <FiCopy size={11} />
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: bi('Product / Listing', 'उत्पाद'),
      render: (row) => {
        const listing = row.listing_id;
        if (!listing) {
          return (
            <span className="text-[11px] font-semibold text-slate-400 italic">
              {bi('Direct Vendor Store Inquiry', 'सीधा विक्रेता स्टोर पूछताछ')}
            </span>
          );
        }
        const img = listing.images?.[0]?.url || listing.images?.[0] || '';
        return (
          <div className="flex items-center gap-2 max-w-[200px]">
            {img ? (
              <img
                src={img}
                alt={listing.title}
                className="w-8 h-8 rounded-lg object-cover border border-[#e3dccb] shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-center shrink-0 text-slate-400 text-[10px]">
                📦
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1a1a1a] truncate" title={listing.title}>
                {listing.title}
              </p>
              {listing.price != null && (
                <span className="text-[10px] font-black text-emerald-700">
                  ₹{Number(listing.price).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: bi('Messages', 'संदेश'),
      render: (row) => (
        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-black bg-blue-50 text-blue-700 border border-blue-200">
            <FiMessageSquare size={11} />
            {row.message_count || 1} {row.message_count === 1 ? 'msg' : 'msgs'}
          </span>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <FiClock size={10} />
            <span>
              {row.last_message_time
                ? new Date(row.last_message_time).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: bi('Billing Status', 'बिलिंग स्थिति'),
      render: (row) => {
        if (row.status === 'billed') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              <FiCheckCircle size={12} className="text-emerald-700" />
              <span>₹2.50 {bi('Deducted', 'कटौती')}</span>
            </span>
          );
        }
        if (row.status === 'duplicate_window') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-sky-50 text-sky-800 border border-sky-200">
              <FiClock size={12} className="text-sky-600" />
              <span>{bi('Free (24h Window)', 'मुफ्त (24 घंटे विंडो)')}</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200">
            <FiAlertCircle size={12} className="text-amber-600" />
            <span>{bi('Low Balance', 'कम बैलेंस')}</span>
          </span>
        );
      },
    },
    {
      header: bi('24h Window Resets', 'विंडो रीसेट'),
      render: (row) => {
        if (!row.charge_window_expires_at) return <span className="text-xs text-slate-400">—</span>;
        const expires = new Date(row.charge_window_expires_at);
        const isExpired = expires < new Date();
        return (
          <span className={`text-[11px] font-mono ${isExpired ? 'text-slate-400' : 'text-slate-600 font-bold'}`}>
            {isExpired
              ? 'Expired'
              : expires.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      },
    },
    {
      header: bi('Action', 'कार्रवाई'),
      render: (row) => (
        <a
          href={`https://wa.me/${row.customer_phone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-xs cursor-pointer border-none"
        >
          <FaWhatsapp size={13} />
          <span>{bi('Chat', 'चैट')}</span>
          <FiExternalLink size={11} className="opacity-80" />
        </a>
      ),
    },
  ];

  const isConnected = connectionStatus?.connected || connectionStatus?.connection_status === 'connected';

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER & STATUS BAR ── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e3dccb] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-black">
                <FaWhatsapp size={20} />
              </div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm sm:text-base uppercase text-[#1a1a1a] tracking-wide">
                {bi('WHATSAPP LEADS & META CLOUD API CRM', 'व्हाट्सएप लीड्स और मेटा क्लाउड एपीआई सीआरएम')}
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {bi(
                'Direct buyer inquiries initiated via WhatsApp button clicks. Deduplicated once per 24 hours (2.50 Credits charged on inbound message).',
                'व्हाट्सएप के माध्यम से खरीदार पूछताछ। 24 घंटे में एक बार 2.50 क्रेडिट कटौती।'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {!isConnected && (
              <button
                type="button"
                onClick={handleLaunchEmbeddedSignup}
                className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs border-none"
              >
                <FaWhatsapp size={15} />
                <span>{bi('Connect WhatsApp Business', 'व्हाट्सएप बिजनेस कनेक्ट करें')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSimulateModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
              title="Simulate inbound message to test billing and deduplication"
            >
              <FiSend size={13} />
              <span>{bi('Test Webhook', 'टेस्ट वेबहुक')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#f8f4ec] hover:bg-[#eae3d2] text-[#1a1a1a] border border-[#e3dccb] text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
            >
              <FiSettings size={13} />
              <span>{bi('Meta API Config', 'मेटा सेटिंग्स')}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-[#f8f4ec] hover:bg-[#eae3d2] text-slate-700 border border-[#e3dccb] text-xs font-black transition cursor-pointer disabled:opacity-50"
              title="Refresh leads"
            >
              <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* CONNECTION STATUS BANNER */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb]">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${
              isConnected
                ? 'bg-emerald-500 ring-4 ring-emerald-100'
                : connectionStatus?.connection_status === 'pending_verification'
                ? 'bg-amber-500 ring-4 ring-amber-100'
                : connectionStatus?.connection_status === 'action_required'
                ? 'bg-rose-500 ring-4 ring-rose-100'
                : 'bg-slate-400 ring-4 ring-slate-100'
            }`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#1a1a1a]">
                  {isConnected
                    ? 'Meta Cloud API Connected (Ready for billable leads)'
                    : connectionStatus?.connection_status === 'pending_verification'
                    ? 'Signup Submitted (Pending Meta Business Verification)'
                    : connectionStatus?.connection_status === 'action_required'
                    ? 'Action Required in Meta Business Suite'
                    : 'WhatsApp Business: Not Connected (Standard wa.me mode)'}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-800'
                    : connectionStatus?.connection_status === 'pending_verification'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {connectionStatus?.messaging_tier || 'Tier 1 — 250 msgs/day'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {connectionStatus?.phone_number_id 
                  ? `Phone Number ID: ${connectionStatus.phone_number_id} • WABA ID: ${connectionStatus.waba_id || 'Active'}`
                  : 'Click "Connect WhatsApp Business" to link your number via Meta Embedded Signup (receives SMS/Voice OTP from Meta).'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold bg-white px-3 py-1.5 rounded-lg border border-[#e3dccb]">
            <FiShield size={14} className="text-emerald-600" />
            <span>24h Deduplication Protected</span>
          </div>
        </div>
      </div>

      {/* ── 4 SUMMARY METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Leads */}
        <div className="p-4 rounded-2xl bg-white border border-[#e3dccb] shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {bi('TOTAL LEADS', 'कुल लीड्स')}
          </span>
          <div className="flex items-baseline justify-between">
            <h4 className="text-2xl font-black text-[#1a1a1a] font-mono">
              {stats.totalLeads || leads.length}
            </h4>
            <span className="text-xs font-bold text-slate-500">
              {stats.totalMessages || 0} msgs
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 font-medium">
            {bi('Unique buyers contacted', 'कुल अद्वितीय खरीदार')}
          </p>
        </div>

        {/* Card 2: Billed Leads */}
        <div className="p-4 rounded-2xl bg-white border border-[#e3dccb] shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
            {bi('BILLED LEADS (₹2.50)', 'बिल की गई लीड्स')}
          </span>
          <div className="flex items-baseline justify-between">
            <h4 className="text-2xl font-black text-emerald-700 font-mono">
              {stats.billedLeads || 0}
            </h4>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 font-medium">
            {bi('Credits successfully charged', 'क्रेडिट्स सफलतापूर्वक कटे')}
          </p>
        </div>

        {/* Card 3: Free 24h Window Leads */}
        <div className="p-4 rounded-2xl bg-white border border-[#e3dccb] shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">
            {bi('24H DEDUP PROTECTED', '24 घंटे सुरक्षित')}
          </span>
          <div className="flex items-baseline justify-between">
            <h4 className="text-2xl font-black text-sky-700 font-mono">
              {stats.duplicateLeads || 0}
            </h4>
            <span className="text-xs font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              ₹0 Free
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 font-medium">
            {bi('Repeat messages (no extra charge)', 'दोबारा बातचीत (मुफ्त)')}
          </p>
        </div>

        {/* Card 4: Total Deducted */}
        <div className="p-4 rounded-2xl bg-[#241b15] text-white border-2 border-[#241b15] shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#d99a3d]">
            {bi('TOTAL CREDITS USED', 'कुल खर्च क्रेडिट्स')}
          </span>
          <div className="flex items-baseline justify-between">
            <h4 className="text-2xl font-black text-[#d99a3d] font-mono">
              ₹{Number(stats.totalCharged || 0).toFixed(2)}
            </h4>
            <span className="text-xs text-white/70">
              Credits
            </span>
          </div>
          <p className="text-[10.5px] text-white/70 font-medium">
            {bi('₹2.50 per unique buyer', '₹2.50 प्रति नई लीड')}
          </p>
        </div>
      </div>

      {/* ── STATUS FILTER PILLS & SEARCH BAR ── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'all', label: bi('All Leads', 'सभी लीड्स'), count: stats.totalLeads },
              { key: 'billed', label: bi('Billed', 'बिल हुई'), count: stats.billedLeads },
              { key: 'duplicate_window', label: bi('Free (24h)', 'मुफ्त (24 घंटे)'), count: stats.duplicateLeads },
              { key: 'unbilled_insufficient_balance', label: bi('Low Balance', 'कम बैलेंस'), count: stats.unbilledLeads },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                  statusFilter === tab.key
                    ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                    : 'bg-[#f8f4ec] text-slate-700 border-[#e3dccb] hover:border-slate-400'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count != null && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* DATA TABLE */}
        <AdminDataTable
          columns={columns}
          data={filteredLeads}
          loading={loading}
          searchPlaceholder={bi('Search by customer phone, name or product...', 'ग्राहक फोन, नाम या उत्पाद खोजें...')}
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          emptyMessage={bi(
            'No WhatsApp leads received yet. When buyers click the WhatsApp button on your products, their inquiries will appear here.',
            'अभी तक कोई व्हाट्सएप लीड नहीं मिली। जब ग्राहक आपके उत्पाद पर व्हाट्सएप बटन क्लिक करेंगे तो वे यहां दिखाई देंगे।'
          )}
          testId="vendor-whatsapp-leads-table"
        />
      </div>

      {/* ── META API CONFIGURATION MODAL ── */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border-2 border-[#241b15] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <FaWhatsapp size={18} />
                </div>
                <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm font-black text-[#1a1a1a] uppercase">
                  {bi('Meta Cloud API Setup', 'मेटा एपीआई सेटअप')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#f8f4ec] hover:bg-[#e3dccb] text-[#1a1a1a] flex items-center justify-center transition border-none cursor-pointer"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Tab 1: Meta Embedded Signup Direct */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                <FaWhatsapp size={16} className="text-[#25D366]" />
                <span>{bi('Option A: Meta Embedded Signup (Recommended)', 'विकल्प A: मेटा एम्बेडेड साइनअप (अनुशंसित)')}</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                {bi(
                  'Meta will open a secure verification popup. You will enter your phone number and receive an SMS or Voice OTP from Meta to verify ownership. Credentials will link to BizReels automatically.',
                  'मेटा एक सुरक्षित विंडो खोलेगा। अपना फोन नंबर दर्ज करें और सत्यापन के लिए मेटा से एसएमएस या वॉयस ओटीपी प्राप्त करें। यह बिजरील्स से स्वतः लिंक हो जाएगा।'
                )}
              </p>
              <button
                type="button"
                onClick={handleLaunchEmbeddedSignup}
                className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <FaWhatsapp size={16} />
                <span>{bi('Verify & Connect with Meta', 'मेटा से सत्यापित और कनेक्ट करें')}</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#e3dccb]"></div>
              <span className="flex-shrink mx-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {bi('OR ENTER MANUALLY', 'या मैन्युअल दर्ज करें')}
              </span>
              <div className="flex-grow border-t border-[#e3dccb]"></div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  WhatsApp Business Account (WABA) ID
                </label>
                <input
                  type="text"
                  value={configForm.wabaId}
                  onChange={(e) => setConfigForm({ ...configForm, wabaId: e.target.value })}
                  placeholder="e.g. 1098234827498"
                  className="w-full px-3.5 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#241b15]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Meta Phone Number ID
                </label>
                <input
                  type="text"
                  value={configForm.phoneNumberId}
                  onChange={(e) => setConfigForm({ ...configForm, phoneNumberId: e.target.value })}
                  placeholder="e.g. 1092837498273"
                  className="w-full px-3.5 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#241b15]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Messaging Tier
                </label>
                <select
                  value={configForm.messagingTier}
                  onChange={(e) => setConfigForm({ ...configForm, messagingTier: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#241b15]"
                >
                  <option value="Tier 1 — 250 conversations/day">Tier 1 — 250 conversations/day</option>
                  <option value="Tier 2 — 1,000 conversations/day">Tier 2 — 1,000 conversations/day</option>
                  <option value="Tier 3 — 10,000 conversations/day">Tier 3 — 10,000 conversations/day</option>
                  <option value="Tier 4 — 100,000 conversations/day">Tier 4 — 100,000 conversations/day</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e3dccb]">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 text-xs font-black text-slate-600 hover:bg-[#f8f4ec] rounded-xl border border-[#e3dccb] bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={configSaving}
                  className="px-4 py-2 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
                >
                  <FiCheck size={14} />
                  <span>{configSaving ? 'Saving...' : 'Save Manual IDs'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SIMULATE INBOUND MESSAGE MODAL (SANDBOX DEV) ── */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border-2 border-[#241b15] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-black">
                  <FiSend size={16} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm font-black text-[#1a1a1a] uppercase">
                    {bi('Simulate Inbound Webhook', 'इनबाउंड वेबहुक का परीक्षण करें')}
                  </h3>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Test deduction & 24h deduplication window
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulateModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#f8f4ec] hover:bg-[#e3dccb] text-[#1a1a1a] flex items-center justify-center transition border-none cursor-pointer"
              >
                <FiX size={16} />
              </button>
            </div>

            <form onSubmit={handleSimulateInbound} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Buyer Phone Number (with Country Code)
                </label>
                <input
                  type="text"
                  required
                  value={simForm.customerPhone}
                  onChange={(e) => setSimForm({ ...simForm, customerPhone: e.target.value })}
                  placeholder="919876543210"
                  className="w-full px-3.5 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-mono font-bold text-[#1a1a1a] focus:outline-none focus:border-[#241b15]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Buyer Name
                </label>
                <input
                  type="text"
                  required
                  value={simForm.customerName}
                  onChange={(e) => setSimForm({ ...simForm, customerName: e.target.value })}
                  placeholder="Aarav Sharma"
                  className="w-full px-3.5 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#241b15]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Inbound Message Text
                </label>
                <textarea
                  rows={2}
                  required
                  value={simForm.messageText}
                  onChange={(e) => setSimForm({ ...simForm, messageText: e.target.value })}
                  placeholder="Hi, is this available?"
                  className="w-full px-3.5 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#241b15]"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <div className="font-black flex items-center gap-1">
                  <span>ℹ️ Deduplication Rule</span>
                </div>
                <p className="text-[10.5px] leading-relaxed">
                  First message from this buyer: charges ₹2.50 from your wallet. Repeating within 24 hours: ₹0.00 (Free deduplication window).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e3dccb]">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-4 py-2 text-xs font-black text-slate-600 hover:bg-[#f8f4ec] rounded-xl border border-[#e3dccb] bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
                >
                  <FiSend size={13} />
                  <span>{simulating ? 'Sending...' : 'Send Test Inbound Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
