import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  FiSearch
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

// Credit Consumption Rate Schedule
const DEFAULT_CREDIT_RATES = [
  { action: 'Lead Contact Unlock', rate: '5 Credits', description: 'Unlock direct phone & WhatsApp contact of buyer lead', category: 'Leads' },
  { action: 'Standard Reel Upload', rate: '0 Credits (Free)', description: 'Publish product reel to local discovery feed', category: 'Reels' },
  { action: 'Reel 24h Feature Boost', rate: '25 Credits', description: 'Pin reel to top of local feeds for 24 hours with priority ranking', category: 'Boost' },
  { action: 'AI Content Generation', rate: '2 Credits', description: 'Generate AI reel script, caption & SEO hashtags', category: 'AI' },
  { action: 'Catalog Product Boost', rate: '10 Credits', description: 'Highlight product listing in category search results for 7 days', category: 'Catalog' },
  { action: 'Direct Buyer Broadcast', rate: '15 Credits', description: 'Broadcast offer notification to interested buyers in your pincode', category: 'Marketing' },
];

export default function VendorWalletPage() {
  const { bi } = useLanguage();
  const { data: walletData, refetch: refetchWallet } = useGetVendorWalletQuery(undefined, { pollingInterval: 60000 });
  const { data: txData, isFetching: isFetchingTx, refetch: refetchTx } = useGetWalletTransactionsQuery(undefined, { pollingInterval: 60000 });
  const { data: topupPacksData } = useGetTopupPacksQuery();
  const { data: creditRatesData } = useGetCreditRatesQuery();
  const [rechargeWallet] = useRechargeWalletMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('wallet'); // 'wallet' | 'rates'

  // Dynamic Packs & Rates from Backend (zero client-side hardcoding)
  const topupPacks = Array.isArray(topupPacksData) ? topupPacksData : topupPacksData?.data || [];
  const creditRates = Array.isArray(creditRatesData) && creditRatesData.length > 0
    ? creditRatesData
    : creditRatesData?.rates || DEFAULT_CREDIT_RATES;

  const balance = walletData?.data?.balance ?? walletData?.data?.walletBalance ?? walletData?.balance ?? walletData?.walletBalance ?? 0;
  const rawTx = txData?.data || txData || [];
  const transactions = Array.isArray(rawTx) ? rawTx : rawTx.transactions || [];

  const totalCredits = transactions
    .filter(t => t.type === 'credit' || t.type === 'deposit' || t.type === 'recharge')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const totalDebits = transactions
    .filter(t => t.type === 'debit' || t.type === 'withdrawal' || t.type === 'boost' || t.type === 'lead_unlock')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

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
        const typeStr = (val || row?.type || row?.credit_debit || 'debit').toLowerCase();
        const isCredit = typeStr === 'credit' || typeStr === 'deposit' || typeStr === 'recharge' || typeStr === 'referral_bonus' || row?.credit_debit === 'credit';
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
        const typeStr = (row?.type || row?.credit_debit || '').toLowerCase();
        const isCredit = typeStr === 'credit' || typeStr === 'deposit' || typeStr === 'recharge' || typeStr === 'referral_bonus' || row?.credit_debit === 'credit';
        return (
          <span className={`font-black text-xs font-mono ${isCredit ? 'text-emerald-700' : 'text-rose-700'}`}>
            {isCredit ? '+' : '-'}₹{Math.abs(amt).toLocaleString('en-IN')}
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
        title={bi('Vendor Wallet & Credit Rates', 'विक्रेता वॉलेट और क्रेडिट दरें')}
        subtitle={bi('Preload wallet balance, manage reel boost credits, and check platform credit rate schedule', 'वॉलेट बैलेंस लोड करें, रील बूस्ट क्रेडिट प्रबंधित करें और दर तालिका देखें')}
      />

      {/* Navigation Tabs (Neo-Brutalist Pill Bar) */}
      <div className="flex items-center gap-2 border-b-2 border-[#241b15] pb-2">
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
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer border-2 ${
            activeTab === 'rates'
              ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
              : 'bg-white text-[#1a1a1a] border-[#e3dccb] hover:border-[#241b15]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FiZap size={16} />
            <span>{bi('Credit Rate Schedule', 'क्रेडिट दर अनुसूची')}</span>
          </span>
        </button>
      </div>

      {/* HERO BALANCE BANNER */}
      <div className="bg-[#241b15] text-white p-6 sm:p-8 rounded-2xl border-2 border-[#241b15] shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 relative overflow-hidden">
        <div className="flex flex-col gap-1.5 z-10">
          <span className="text-[10.5px] font-black uppercase tracking-widest text-[#d99a3d] bg-white/10 px-3 py-0.5 rounded-md self-start">
            {bi('AVAILABLE VENDOR BALANCE', 'उपलब्ध विक्रेता वॉलेट बैलेंस')}
          </span>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            ₹{balance.toLocaleString('en-IN')}
          </h2>
          <p className="text-xs text-slate-300 font-bold max-w-xl">
            {bi(
              'Preloaded credits for reel boosts, lead contact unlocks, catalog feature badges, and AI tools',
              'रील बूस्ट, लीड अनलॉक, कैटलॉग बैज और AI टूल्स के लिए प्रीलोडेड बैलेंस'
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-[#d99a3d] text-[#1a1a1a] hover:bg-[#eab35b] text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            <FiPlus size={18} strokeWidth={3} />
            <span>{bi('RECHARGE WALLET', 'वॉलेट रीचार्ज करें')}</span>
          </button>
          <Link
            to="/vendor/subscription"
            className="px-5 py-3 bg-white/10 text-white hover:bg-white/20 text-xs font-black rounded-xl transition flex items-center justify-center gap-2 border border-white/20"
          >
            <FiCreditCard size={16} />
            <span>{bi('View Subscriptions', 'सब्सक्रिप्शन देखें')}</span>
          </Link>
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

      {/* CREDIT RATE SCHEDULE TAB CONTENT */}
      {activeTab === 'rates' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#241b15] shadow-xs space-y-6">
          <div className="border-b border-[#e3dccb] pb-4 space-y-1">
            <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm sm:text-base uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
              <FiZap className="text-[#d99a3d]" size={20} /> {bi('OFFICIAL VENDOR CREDIT RATE SCHEDULE', 'आधिकारिक क्रेडिट दर अनुसूची')}
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              {bi(
                'Transparent credit cost deduction rules for product listings, reel boosts, AI tools & buyer lead unlocks.',
                'उत्पाद लिस्टिंग, रील बूस्ट, एआई टूल्स और लीड अनलॉक के लिए स्पष्ट क्रेडिट कटौती दरें।'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditRates.map((item, idx) => (
              <div 
                key={idx} 
                className="p-5 rounded-2xl bg-[#f8f4ec] border-2 border-[#241b15] space-y-3 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#241b15] text-[#d99a3d] text-[10px] font-black uppercase tracking-wider">
                    {item.category}
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    {item.rate}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-black text-[#1a1a1a]">{item.action}</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-bold flex items-center gap-3">
            <FiInfo size={20} className="text-[#d99a3d] shrink-0" />
            <span>
              {bi(
                'Need bulk promotional credits for high-volume catalog listings? Upgrade to a Growth Tier or contact vendor support.',
                'अधिक रील प्रमोशन या कैटलॉग लिस्टिंग्स के लिए ग्रोथ प्लान में अपग्रेड करें।'
              )}
            </span>
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
    </div>
  );
}
