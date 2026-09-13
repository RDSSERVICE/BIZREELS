import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSocket } from '../../../lib/socket';
import { 
  FiPlusCircle, 
  FiArrowUpRight, 
  FiArrowDownLeft, 
  FiX, 
  FiCheck, 
  FiPlus, 
  FiCreditCard, 
  FiZap, 
  FiShield, 
  FiInfo,
  FiSearch,
  FiPhoneCall,
  FiClock,
  FiAward,
  FiExternalLink
} from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import { 
  useGetVendorWalletQuery, 
  useGetWalletTransactionsQuery, 
  useGetTopupPacksQuery,
  useGetCreditRatesQuery,
  useRechargeWalletMutation 
} from '../../../features/vendor/vendorApi';
import { api } from '../../../lib/api';
import { useLanguage } from '../../../context/LanguageContext';
import { FaWhatsapp } from 'react-icons/fa';
import WhatsAppLeadCrmTab from './WhatsAppLeadCrmTab';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Official Action Credit Consumption Rate Schedule (Strictly Aligned with /pricing)
const DEFAULT_CREDIT_RATES = [
  { 
    action: 'Verified WhatsApp Lead', 
    rate: '2.50 Credits', 
    description: 'Charged when a customer sends an inbound message to your connected Meta WhatsApp Business number (includes 24-hour deduplication protection)', 
    category: 'WhatsApp',
    badge: 'ACTION LEAD'
  },
  { 
    action: 'Connected Exotel Voice Call', 
    rate: '2.50 Credits', 
    description: 'Charged ONLY when a phone call connects between buyer and vendor for >= 10 seconds via Exotel (0 if busy, missed, or failed)', 
    category: 'Telephony',
    badge: 'ACTION LEAD'
  },
  { 
    action: 'Reel Feed Feature Boost', 
    rate: 'Free / 2.00 Credits', 
    description: 'Plan-included free boosts (Starter: 1, Growth: 3, Business: 5) are consumed first. Additional boosts cost 2.00 Credits per boost', 
    category: 'Promotion',
    badge: 'BOOST'
  },
  { 
    action: 'Catalog Product & Service Listings', 
    rate: '0.00 Credits (FREE)', 
    description: 'Unlimited catalog products and service offerings showcased on your verified store profile with zero listing fees', 
    category: 'Catalog',
    badge: 'FREE'
  },
  { 
    action: 'Standard 4K Video Reel Uploads', 
    rate: '0.00 Credits (FREE)', 
    description: 'Publish unlimited video reels to the local discovery feed with zero upload fees', 
    category: 'Reels',
    badge: 'FREE'
  },
  { 
    action: 'Customer Orders & Sales Commission', 
    rate: '0% Always (FREE)', 
    description: 'Zero platform middleman commission on direct buyer orders, quote bids, or closed customer deals', 
    category: 'Orders',
    badge: 'ZERO COMMISSION'
  },
];

export default function VendorWalletPage() {
  const { bi } = useLanguage();
  const { data: walletData, refetch: refetchWallet } = useGetVendorWalletQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const { data: txData, isFetching: isFetchingTx, refetch: refetchTx } = useGetWalletTransactionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const { data: topupPacksData } = useGetTopupPacksQuery();
  const { data: creditRatesData } = useGetCreditRatesQuery();
  const [rechargeWallet] = useRechargeWalletMutation();

  // Call History State
  const [callHistory, setCallHistory] = useState([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  const fetchCalls = () => {
    setLoadingCalls(true);
    api.get('/v1/calls/vendor-history')
      .then((res) => {
        if (res.data?.data?.items) {
          setCallHistory(res.data.data.items);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCalls(false));
  };

  // Production Grade: Real-time Socket.IO listeners for instant wallet updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleWalletUpdate = () => {
      refetchWallet();
      refetchTx();
      fetchCalls();
    };

    socket.on('wallet:updated', handleWalletUpdate);
    socket.on('payment:success', handleWalletUpdate);
    socket.on('transaction:new', handleWalletUpdate);
    socket.on('call:status_update', handleWalletUpdate);

    return () => {
      socket.off('wallet:updated', handleWalletUpdate);
      socket.off('payment:success', handleWalletUpdate);
      socket.off('transaction:new', handleWalletUpdate);
      socket.off('call:status_update', handleWalletUpdate);
    };
  }, [refetchWallet, refetchTx]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('wallet'); // 'wallet' | 'calls' | 'whatsapp' | 'rates'

  useEffect(() => {
    if (activeTab === 'calls') {
      fetchCalls();
    }
  }, [activeTab]);

  // Payout Withdrawal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Balances
  const vendorCredits = walletData?.data?.credits ?? walletData?.credits ?? walletData?.data?.balance ?? walletData?.balance ?? 0;
  const freeReelBoosts = walletData?.data?.free_reel_boosts ?? walletData?.free_reel_boosts ?? 0;
  const earningsInr = (walletData?.data?.balance_inr_paise ?? walletData?.balance_inr_paise ?? 0) / 100;

  const handleRequestPayout = async (e) => {
    if (e) e.preventDefault();
    const numAmt = parseFloat(payoutAmount);
    if (!numAmt || numAmt <= 0) {
      toast.error('Please enter a valid withdrawal amount.');
      return;
    }
    if (numAmt > earningsInr) {
      toast.error('Withdrawal amount cannot exceed available sales earnings.');
      return;
    }

    setPayoutLoading(true);
    try {
      await api.post('/v1/wallet/payout', { amount: numAmt });
      toast.success(`🎉 Payout request for ₹${numAmt.toLocaleString('en-IN')} submitted successfully!`);
      setIsPayoutModalOpen(false);
      setPayoutAmount('');
      if (typeof refetchWallet === 'function') refetchWallet();
      if (typeof refetchTx === 'function') refetchTx();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to submit payout request.');
    } finally {
      setPayoutLoading(false);
    }
  };

  // Dynamic Packs & Rates from Backend
  const topupPacks = Array.isArray(topupPacksData) ? topupPacksData : topupPacksData?.data || [];
  const creditRates = Array.isArray(creditRatesData) && creditRatesData.length > 0
    ? creditRatesData
    : creditRatesData?.rates || DEFAULT_CREDIT_RATES;

  const balance = vendorCredits;
  const rawTx = txData?.data || txData || [];
  const transactions = Array.isArray(rawTx) ? rawTx : rawTx.transactions || [];

  const isTxCredit = (t) => {
    const typeStr = (t?.type || t?.credit_debit || '').toLowerCase();
    return typeStr === 'credit' || typeStr === 'deposit' || typeStr === 'recharge' || typeStr === 'referral_bonus' || typeStr === 'refund' || t?.credit_debit === 'credit';
  };

  const totalCredits = transactions
    .filter(isTxCredit)
    .reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);

  const totalDebits = transactions
    .filter(t => !isTxCredit(t))
    .reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);

  const handleRechargeSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 10) {
      toast.error('Minimum recharge amount is ₹10');
      return;
    }

    setLoading(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Failed to load payment gateway. Please check internet connection.');
        setLoading(false);
        return;
      }

      const res = await rechargeWallet({ amount: numAmount }).unwrap();
      const orderData = res.data || res;

      if (!orderData?.id || !orderData?.key) {
        toast.error('Payment initialization failed.');
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'BizReels Vendor Wallet',
        description: `Wallet Recharge of ₹${numAmount}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            await api.post('/v1/vendor/wallet/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(`🎉 Successfully recharged ₹${numAmount} to your wallet!`);
            setIsModalOpen(false);
            if (typeof refetchWallet === 'function') refetchWallet();
            if (typeof refetchTx === 'function') refetchTx();
          } catch (verifyErr) {
            toast.error('Payment verification failed. Please contact support if amount was deducted.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.error('Payment cancelled.');
            setLoading(false);
          },
        },
        theme: {
          color: '#241b15',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to initiate recharge');
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'created_at',
      label: bi('Date & Time', 'दिनांक और समय'),
      render: (val, row) => {
        const rawDate = val || row?.created_at || row?.createdAt || row?.date || row?.timestamp;
        if (!rawDate) return <span className="text-slate-400 font-bold text-xs">N/A</span>;
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return <span className="text-slate-400 font-bold text-xs">N/A</span>;
        return (
          <div className="flex flex-col font-sans">
            <span className="font-black text-xs text-[#1a1a1a]">
              {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[10px] text-slate-500 font-bold">
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'description',
      label: bi('Description & Reference', 'विवरण (Description)'),
      render: (val, row) => {
        const desc = val || row?.description || row?.admin_remarks || row?.meta?.plan_name || row?.title || row?.type || 'Transaction';
        const refId = row?.reference_id || row?.referenceId || row?.paymentId || row?.payment_id;
        return (
          <div className="flex flex-col font-sans">
            <span className="font-extrabold text-xs text-[#1a1a1a]">{desc}</span>
            {refId && <span className="text-[10px] text-slate-400 font-mono">ID: {refId}</span>}
          </div>
        );
      },
    },
    {
      key: 'type',
      label: bi('Type', 'प्रकार (Type)'),
      render: (val, row) => {
        const isCredit = isTxCredit(row);
        return (
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
            isCredit
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-rose-100 text-rose-800 border border-rose-300'
          }`}>
            {isCredit ? bi('Credit (+)', 'क्रेडिट (+)') : bi('Debit (-)', 'डेबिट (-)')}
          </span>
        );
      },
    },
    {
      key: 'amount',
      label: bi('Amount (INR)', 'राशि (रुपये)'),
      render: (val, row) => {
        const amt = typeof val === 'number' ? val : (typeof row?.amount === 'number' ? row.amount : 0);
        const isCredit = isTxCredit(row);
        return (
          <span className={`font-black text-xs font-mono ${isCredit ? 'text-emerald-700' : 'text-rose-700'}`}>
            {isCredit ? '+' : '-'}₹{Math.abs(amt).toLocaleString('en-IN')}
          </span>
        );
      },
    },
  ];

  const callColumns = [
    {
      key: 'createdAt',
      label: bi('Date & Time', 'दिनांक और समय'),
      render: (val, row) => {
        const d = new Date(val || row?.createdAt);
        if (isNaN(d.getTime())) return <span className="text-slate-400 text-xs">N/A</span>;
        return (
          <div className="flex flex-col font-sans">
            <span className="font-black text-xs text-[#1a1a1a]">
              {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[10px] text-slate-500 font-bold">
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'customerName',
      label: bi('Customer Lead', 'ग्राहक लीड'),
      render: (val, row) => (
        <div className="flex flex-col font-sans">
          <span className="font-extrabold text-xs text-[#1a1a1a]">{val || 'Customer'}</span>
          <span className="text-[10px] text-slate-600 font-mono font-bold">{row?.customerPhone || 'Direct Dial'}</span>
        </div>
      ),
    },
    {
      key: 'productTitle',
      label: bi('Inquiry Subject', 'पूछताछ विषय'),
      render: (val) => (
        <span className="font-bold text-xs text-slate-800 line-clamp-1 max-w-[200px]">
          {val || 'Direct Store Line'}
        </span>
      ),
    },
    {
      key: 'status',
      label: bi('Call Status', 'कॉल स्थिति'),
      render: (val) => {
        const isCompleted = val === 'completed';
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
            isCompleted
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}>
            {isCompleted ? bi('Connected', 'जुड़ गया') : (val || bi('Unconnected', 'अनुत्तरित'))}
          </span>
        );
      },
    },
    {
      key: 'durationSeconds',
      label: bi('Duration', 'अवधि'),
      render: (val) => {
        const secs = Number(val || 0);
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        return (
          <span className="text-xs font-mono font-bold text-slate-700">
            {mins > 0 ? `${mins}m ${remSecs}s` : `${remSecs}s`}
          </span>
        );
      },
    },
    {
      key: 'creditsDeducted',
      label: bi('Credits Deducted', 'कटौती'),
      render: (val, row) => {
        const charged = row?.isCharged;
        return (
          <span className={`font-black text-xs font-mono ${charged ? 'text-rose-600' : 'text-slate-400'}`}>
            {charged ? `-${(val || 2.50).toFixed(2)} Credits` : '0.00 (No Charge)'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 font-sans p-2 sm:p-4 animate-fade-in pb-20">
      {/* Header */}
      <AdminPageHeader
        icon={TbCurrencyRupee}
        title={bi('Vendor Wallet & Commercial Accounts', 'विक्रेता वॉलेट और वाणिज्यिक खाता')}
        subtitle={bi('Manage non-expiring usage credits, track connected call leads, and withdraw sales revenue', 'क्रेडिट बैलेंस प्रबंधित करें, कॉल लीड्स देखें और बिक्री आय निकालें')}
      />

      {/* Navigation Tabs (Neo-Brutalist Pill Bar) */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#241b15] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('wallet')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer border-2 ${
            activeTab === 'wallet'
              ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
              : 'bg-white text-[#1a1a1a] border-[#e3dccb] hover:border-[#241b15]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <TbCurrencyRupee size={16} />
            <span>{bi('Wallet Overview & Ledger', 'वॉलेट अवलोकन और खाता')}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calls')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer border-2 ${
            activeTab === 'calls'
              ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
              : 'bg-white text-[#1a1a1a] border-[#e3dccb] hover:border-[#241b15]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FiZap size={16} />
            <span>{bi('Call History & Leads', 'कॉल इतिहास और लीड्स')}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer border-2 ${
            activeTab === 'whatsapp'
              ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
              : 'bg-white text-[#1a1a1a] border-[#e3dccb] hover:border-[#241b15]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FaWhatsapp size={16} className={activeTab === 'whatsapp' ? 'text-[#25D366]' : 'text-emerald-600'} />
            <span>{bi('WhatsApp Leads & CRM', 'व्हाट्सएप लीड्स और सीआरएम')}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer border-2 ${
            activeTab === 'rates'
              ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
              : 'bg-white text-[#1a1a1a] border-[#e3dccb] hover:border-[#241b15]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FiInfo size={16} />
            <span>{bi('Credit Rate Schedule', 'क्रेडिट दर अनुसूची')}</span>
          </span>
        </button>
      </div>

      {/* NEO-BRUTALIST DUAL BALANCE DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CARD 1: PLATFORM USAGE CREDITS */}
        <div className="bg-[#241b15] text-white p-6 sm:p-7 rounded-2xl border-2 border-[#241b15] shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#d99a3d]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-3 z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#d99a3d] bg-white/10 px-2.5 py-1 rounded-md">
                ⚡ {bi('PLATFORM USAGE CREDITS', 'प्लेटफ़ॉर्म उपयोग क्रेडिट्स')}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                ✓ {bi('Non-Expiring Balance', 'कभी समाप्त नहीं होते')}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {Number(vendorCredits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">{bi('Credits', 'क्रेडिट्स')}</span>
              </div>

              {freeReelBoosts > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black">
                  <FiZap size={13} className="fill-emerald-400 text-emerald-400" />
                  <span>{freeReelBoosts} {bi('Free Reel Boosts Remaining', 'मुफ़्त रील बूस्ट शेष')}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 font-medium">
              {bi(
                'Draws down at 0.20/view, 2.50/WhatsApp, 2.50/call, 0.10/chat, 0.10/inquiry, 5.00/order. Credits accumulate on every recharge.',
                'प्रत्येक रीचार्ज पर क्रेडिट जमा होते हैं और कॉल, व्हाट्सएप, व्यूज़ पर स्वतः कटते हैं।'
              )}
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-white/10 flex items-center gap-3 z-10">
            <Link
              to="/vendor/subscription"
              className="flex-1 py-3 px-4 bg-[#d99a3d] text-[#1a1a1a] hover:bg-[#eab35b] text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-2"
            >
              <FiZap size={16} className="fill-current" />
              <span>{bi('RECHARGE CREDITS', 'क्रेडिट रीचार्ज करें')}</span>
            </Link>
            <button
              type="button"
              onClick={() => setActiveTab('rates')}
              className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-xl border border-white/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FiInfo size={15} />
              <span>{bi('View Rates', 'दरें देखें')}</span>
            </button>
          </div>
        </div>

        {/* CARD 2: SALES EARNINGS & PAYOUTS */}
        <div className="bg-white text-[#1a1a1a] p-6 sm:p-7 rounded-2xl border-2 border-[#241b15] shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
                💰 {bi('ORDER SALES REVENUE', 'ऑर्डर बिक्री राजस्व')}
              </span>
              <span className="text-[10px] font-extrabold text-slate-600 bg-[#f8f4ec] border border-[#e3dccb] px-2 py-0.5 rounded-full">
                {bi('Withdrawable', 'निकासी योग्य')}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-2xl font-black text-emerald-700">₹</span>
                <span style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-3xl sm:text-4xl font-black text-[#1a1a1a] tracking-tight">
                  {Number(earningsInr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {bi('Net customer order earnings processed and cleared into your merchant account.', 'ग्राहकों के पूर्ण ऑर्डर से प्राप्त शुद्ध राशि जो बैंक में हस्तांतरणीय है।')}
              </p>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-[#e3dccb] flex items-center gap-3">
            <button
              onClick={() => {
                setPayoutAmount(earningsInr > 0 ? String(earningsInr) : '');
                setIsPayoutModalOpen(true);
              }}
              disabled={earningsInr <= 0}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiArrowUpRight size={18} strokeWidth={2.5} />
              <span>{bi('WITHDRAW TO BANK', 'बैंक में निकालें')}</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'wallet' && (
        <>
          {/* STATS METRIC ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AdminStatCard 
              label={bi('Available Balance', 'उपलब्ध शेष राशि')} 
              value={`₹${balance.toLocaleString('en-IN')}`} 
              icon={TbCurrencyRupee} 
              color="green" 
            />
            <AdminStatCard 
              label={bi('Total Credits Deposited', 'कुल जमा क्रेडिट')} 
              value={`₹${totalCredits.toLocaleString('en-IN')}`} 
              icon={FiArrowDownLeft} 
              color="blue" 
            />
            <AdminStatCard 
              label={bi('Total Debits Spent', 'कुल खर्च डेबिट')} 
              value={`₹${totalDebits.toLocaleString('en-IN')}`} 
              icon={FiArrowUpRight} 
              color="rose" 
            />
          </div>

          {/* DYNAMIC TOP-UP PACKS PREVIEW (Fetched live from DB) */}
          {topupPacks.length > 0 && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
                <div>
                  <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
                    <FiZap className="text-[#d99a3d]" size={18} /> {bi('AVAILABLE TOP-UP PACKS', 'उपलब्ध टॉप-अप पैक')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {bi('Instant balance deposit via Razorpay UPI, Cards & NetBanking', 'यूपीआई और कार्ड द्वारा त्वरित बैलेंस जमा')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {topupPacks.map((pack, idx) => {
                  const amtVal = pack.amount || pack.price || pack;
                  const labelStr = pack.title || pack.label || `Pack ₹${amtVal}`;
                  const bonusStr = pack.bonus ? `+${pack.bonus} Bonus` : null;

                  return (
                    <div 
                      key={pack.id || idx} 
                      className="p-4 rounded-xl bg-[#f8f4ec] border-2 border-[#e3dccb] hover:border-[#241b15] transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#1a1a1a]">{labelStr}</span>
                          {bonusStr && (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-black text-[9.5px]">
                              {bonusStr}
                            </span>
                          )}
                        </div>
                        <h4 className="text-2xl font-black text-[#1a1a1a] font-mono">
                          ₹{Number(amtVal).toLocaleString('en-IN')}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAmount(String(amtVal));
                          setIsModalOpen(true);
                        }}
                        className="w-full py-2 bg-[#241b15] text-[#d99a3d] hover:bg-[#382b22] text-xs font-black rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <FiPlus size={14} />
                        <span>{bi('Select Pack', 'पैक चुनें')}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LEDGER TRANSACTION TABLE */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
                <FiCreditCard className="text-[#d99a3d]" size={18} /> {bi('WALLET TRANSACTION LEDGER', 'वॉलेट लेन-देन खाता')}
              </h3>
            </div>

            <AdminDataTable
              columns={columns}
              data={transactions}
              loading={isFetchingTx}
              searchPlaceholder={bi('Search transactions by description or reference ID...', 'विवरण या आईडी द्वारा लेन-देन खोजें...')}
              emptyMessage={bi('No wallet transactions found.', 'कोई वॉलेट लेन-देन नहीं मिला।')}
              testId="vendor-wallet-table"
            />
          </div>
        </>
      )}

      {/* CALL HISTORY & TELEPHONY LEADS TAB CONTENT */}
      {activeTab === 'calls' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e3dccb] pb-3 gap-2">
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
                <FiZap className="text-[#d99a3d]" size={18} /> {bi('TELEPHONY CALL LEADS & CONNECT CHARGES', 'कॉल लीड्स और कनेक्ट शुल्क')}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {bi('Incoming buyer voice calls powered by Exotel. 2.50 Credits deducted only when call connects successfully.', 'Exotel पावर्ड कॉल्स। केवल कॉल कनेक्ट होने पर 2.50 क्रेडिट्स कटते हैं।')}
              </p>
            </div>
            <button
              type="button"
              onClick={fetchCalls}
              className="px-3 py-1.5 rounded-lg bg-[#f8f4ec] hover:bg-[#eae3d2] text-slate-700 text-xs font-bold border border-[#e3dccb] self-start sm:self-auto cursor-pointer"
            >
              {bi('Refresh Calls', 'रीफ़्रेश करें')}
            </button>
          </div>

          <AdminDataTable
            columns={callColumns}
            data={callHistory}
            loading={loadingCalls}
            searchPlaceholder={bi('Search by customer or product...', 'ग्राहक या उत्पाद खोजें...')}
            emptyMessage={bi('No voice call interactions recorded yet.', 'अभी तक कोई कॉल बातचीत दर्ज नहीं हुई।')}
            testId="vendor-calls-table"
          />
        </div>
      )}

      {/* WHATSAPP LEADS & META CLOUD API CRM TAB CONTENT */}
      {activeTab === 'whatsapp' && (
        <WhatsAppLeadCrmTab />
      )}

      {/* CREDIT RATE SCHEDULE TAB CONTENT */}
      {activeTab === 'rates' && (
        <div className="bg-white rounded-2xl p-5 sm:p-7 border-2 border-[#241b15] shadow-xs space-y-7 font-sans">
          {/* Header & Subtitle */}
          <div className="border-b border-[#e3dccb] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm sm:text-base uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
                <FiZap className="text-[#d99a3d]" size={20} /> {bi('OFFICIAL VENDOR CREDIT RATE SCHEDULE', 'आधिकारिक विक्रेता क्रेडिट दर अनुसूची')}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {bi(
                  'Transparent action credit deduction rates aligned with your BizReels Vendor Subscription Plan. Deducted strictly when customers take measurable outreach actions.',
                  'आपकी BizReels विक्रेता सदस्यता योजना के अनुसार पारदर्शी क्रेडिट कटौती दरें। केवल वास्तविक ग्राहक संपर्क पर ही कटौती की जाती है।'
                )}
              </p>
            </div>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#241b15] hover:bg-[#382b22] text-[#d99a3d] text-xs font-black uppercase tracking-wider transition shrink-0 no-underline shadow-xs"
            >
              <span>{bi('View Pricing Page', 'मूल्य निर्धारण पेज देखें')}</span>
              <FiExternalLink size={14} />
            </Link>
          </div>

          {/* Core Guarantees Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-black text-[#1a1a1a]">
            <div className="p-3 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center gap-2">
              <FiClock className="text-[#d99a3d] shrink-0" size={16} />
              <span className="text-[11px] leading-tight">{bi('Non-Expiring Lifetime Credits', 'कभी समाप्त न होने वाले क्रेडिट')}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center gap-2">
              <FiShield className="text-emerald-600 shrink-0" size={16} />
              <span className="text-[11px] leading-tight">{bi('0% Sales Commission', '0% बिक्री कमीशन')}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center gap-2">
              <FiZap className="text-blue-600 shrink-0" size={16} />
              <span className="text-[11px] leading-tight">{bi('24h Deduplication Window', '24 घंटे डिडुप सुरक्षा')}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center gap-2">
              <FiPhoneCall className="text-[#25D366] shrink-0" size={16} />
              <span className="text-[11px] leading-tight">{bi('Free Clicks (Inbound Only)', 'क्लिक्स पूरी तरह मुफ़्त')}</span>
            </div>
          </div>

          {/* Subscription Recharge Tiers Summary Banner */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#1c1a17] via-[#28241e] to-[#1c1a17] text-white border-2 border-[#d99a3d]/40 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3a3630] pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#d99a3d]/20 text-[#d99a3d] text-[10px] font-black uppercase tracking-widest border border-[#d99a3d]/30">
                  {bi('RECHARGE & TOP-UP PLANS', 'रीचार्ज एवं टॉप-अप प्लान')}
                </span>
                <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm sm:text-base uppercase text-white mt-1">
                  {bi('Standard Vendor Recharge Tiers', 'मानक विक्रेता रीचार्ज टियर्स')}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#d99a3d] hover:bg-[#c48729] text-[#1c1a17] text-xs font-black uppercase tracking-wider transition cursor-pointer border-none shadow-xs"
              >
                {bi('Recharge Wallet Now', 'वॉलेट रीचार्ज करें')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#221f1a] border border-[#3e3931] space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{bi('Starter Pack', 'स्टार्टर पैक')}</span>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-lg text-white">₹499</span>
                  <span className="text-xs font-black text-[#d99a3d]">599 {bi('Credits', 'क्रेडिट')}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">1 {bi('Free Reel Boost Included', 'मुफ़्त रील बूस्ट शामिल')}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#221f1a] border-2 border-[#d99a3d] space-y-1 relative">
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-[#d99a3d] text-[#1c1a17] text-[9px] font-black uppercase tracking-widest rounded-full">
                  {bi('MOST POPULAR', 'सर्वाधिक लोकप्रिय')}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{bi('Growth Pack', 'ग्रोथ पैक')}</span>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-lg text-[#d99a3d]">₹1,199</span>
                  <span className="text-xs font-black text-white">1,599 {bi('Credits', 'क्रेडिट')}</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">3 {bi('Free Boosts + Gold Badge ✓', 'मुफ़्त बूस्ट + गोल्ड बैज ✓')}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#221f1a] border border-[#3e3931] space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{bi('Business Pack', 'बिजनेस पैक')}</span>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-lg text-white">₹2,199</span>
                  <span className="text-xs font-black text-[#d99a3d]">2,999 {bi('Credits', 'क्रेडिट')}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">5 {bi('Free Boosts + VIP Support', 'मुफ़्त बूस्ट + वीआईपी सपोर्ट')}</p>
              </div>
            </div>
          </div>

          {/* Detailed Commercial Action Rates Grid */}
          <div className="space-y-3">
            <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-slate-500 tracking-wider">
              {bi('CURRENT ACTION DEDUCTION RATES', 'वर्तमान एक्शन कटौती दरें')}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creditRates.map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-5 rounded-2xl bg-[#f8f4ec] border-2 border-[#241b15] space-y-3 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#241b15] text-[#d99a3d] text-[10px] font-black uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                      {item.rate}
                    </span>
                  </div>

                  <div className="space-y-1.5 my-auto">
                    <h5 className="text-sm font-black text-[#1a1a1a]">{item.action}</h5>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.description}</p>
                  </div>

                  {item.badge && (
                    <div className="pt-2 border-t border-[#e3dccb]/70 flex items-center justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <span>{bi('Action Type', 'प्रकार')}:</span>
                      <span className="text-[#241b15] font-black">{item.badge}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Deduplication & Transparency Safeguards */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-[#d99a3d]">
              <FiInfo size={18} />
              <span className="uppercase tracking-wide">{bi('Lead Protection & Deduplication Guarantee', 'लीड सुरक्षा एवं डिडुप गारंटी')}</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
              <li>
                <strong>WhatsApp Leads (2.50 Cr):</strong> {bi('Clicking "Chat on WhatsApp" is 100% free for buyers and vendors. Credits are charged only when a genuine inbound message is received by your connected WhatsApp Business number.', 'व्हाट्सएप बटन दबाना पूरी तरह मुफ़्त है। क्रेडिट केवल तभी कटते हैं जब ग्राहक आपके व्हाट्सएप पर वास्तविक मैसेज भेजता है।')}
              </li>
              <li>
                <strong>Exotel Calls (2.50 Cr):</strong> {bi('Voice calls are charged only upon successful connection lasting at least 10 seconds. Missed calls, busy signals, and unanswered dials cost 0 credits.', 'वॉयस कॉल तभी कटती है जब कॉल कम से कम 10 सेकंड तक कनेक्ट रहे। मिस्ड कॉल या व्यस्त होने पर शून्य शुल्क लगता है।')}
              </li>
              <li>
                <strong>24-Hour Deduplication:</strong> {bi('If the same customer contacts you multiple times within 24 hours, you are never double-charged.', 'यदि एक ही ग्राहक 24 घंटे में दोबारा संपर्क करता है, तो कोई अतिरिक्त क्रेडिट नहीं कटता।')}
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* RECHARGE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white rounded-2xl p-6 border-2 border-[#241b15] shadow-2xl max-w-md w-full space-y-4 relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#241b15] text-[#d99a3d] flex items-center justify-center shrink-0 shadow-xs">
                  <TbCurrencyRupee size={18} />
                </div>
                <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide">
                  RECHARGE VENDOR WALLET
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-[#1a1a1a] hover:bg-[#f8f4ec] transition cursor-pointer border-none bg-transparent"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleRechargeSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Select or Enter Amount (₹)
                </label>
                
                {/* Dynamic Preset Badges from Backend */}
                {topupPacks.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                    {topupPacks.map((pack, idx) => {
                      const valAmt = pack.amount || pack.price || pack;
                      const valStr = String(valAmt);
                      return (
                        <button
                          key={pack.id || idx}
                          type="button"
                          onClick={() => setAmount(valStr)}
                          className={`py-2 px-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                            amount === valStr
                              ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                              : 'bg-[#f8f4ec] text-[#1a1a1a] border-[#e3dccb] hover:bg-white'
                          }`}
                        >
                          ₹{Number(valAmt).toLocaleString('en-IN')}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Amount Input */}
                <div className="relative flex items-center bg-[#f8f4ec] rounded-xl border-2 border-[#241b15] px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-[#d99a3d] transition-all">
                  <span className="font-black text-[#d99a3d] text-base mr-2">₹</span>
                  <input
                    type="number"
                    min="10"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-transparent text-base font-black text-[#1a1a1a] focus:outline-none"
                  />
                </div>
              </div>

              {/* Secured Gateway Pill */}
              <div className="p-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-slate-600 flex items-center justify-between">
                <span>Payment Gateway</span>
                <span className="font-black text-[#1a1a1a] bg-white px-2.5 py-1 rounded-md border border-[#e3dccb] flex items-center gap-1">
                  <FiCheck size={14} className="text-emerald-600" /> Razorpay Secured
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#e3dccb]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-[#f8f4ec] rounded-xl transition cursor-pointer border border-[#e3dccb] bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] text-xs font-black rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer border-none"
                >
                  {loading ? 'Processing...' : `Pay ₹${Number(amount || 0).toLocaleString('en-IN')} via Razorpay`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout / Withdrawal Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border-2 border-[#241b15] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <FiArrowUpRight size={18} />
                </div>
                <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm sm:text-base font-black text-[#1a1a1a] uppercase">
                  {bi('Withdraw to Bank', 'बैंक खाते में निकालें')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#f8f4ec] hover:bg-[#e3dccb] text-[#1a1a1a] flex items-center justify-center transition border-none cursor-pointer"
              >
                <FiX size={16} />
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              {/* Available balance badge */}
              <div className="p-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">Available Balance:</span>
                <span className="font-black text-base text-[#1a1a1a]">₹{balance.toLocaleString('en-IN')}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Withdrawal Amount (₹)
                  </label>
                  {balance > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayoutAmount(String(balance))}
                      className="text-[10px] font-black text-[#d99a3d] hover:underline cursor-pointer bg-transparent border-none"
                    >
                      Withdraw All (₹{balance.toLocaleString('en-IN')})
                    </button>
                  )}
                </div>

                <div className="relative flex items-center bg-[#f8f4ec] rounded-xl border-2 border-[#241b15] px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                  <span className="font-black text-emerald-700 text-base mr-2">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={balance}
                    required
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                    className="w-full bg-transparent text-base font-black text-[#1a1a1a] focus:outline-none"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-black">
                  <FiShield size={14} className="text-emerald-700 shrink-0" />
                  <span>Verified Direct Bank Settlement</span>
                </div>
                <p className="text-[10.5px] text-emerald-800/80 leading-snug">
                  Funds will be disbursed via NEFT/IMPS to your verified bank account on file within 24 to 48 business hours.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#e3dccb]">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-[#f8f4ec] rounded-xl transition cursor-pointer border border-[#e3dccb] bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading || !payoutAmount || parseFloat(payoutAmount) <= 0 || parseFloat(payoutAmount) > balance}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer border-none"
                >
                  {payoutLoading ? 'Submitting...' : `Withdraw ₹${Number(payoutAmount || 0).toLocaleString('en-IN')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
