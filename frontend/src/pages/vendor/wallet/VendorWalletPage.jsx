import React, { useState, useEffect } from 'react';
import { TbCurrencyRupee } from 'react-icons/tb';
import { FiCreditCard, FiPhoneCall, FiInfo } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import {
  useGetVendorWalletQuery,
  useGetWalletTransactionsQuery,
  useGetTopupPacksQuery,
  useGetCreditRatesQuery,
} from '../../../features/vendor/vendorApi';
import { getSocket } from '../../../lib/socket';
import { api } from '../../../lib/api';
import { useLanguage } from '../../../context/LanguageContext';

// Modular Production-Grade Components
import PlatformCreditsCard from './components/PlatformCreditsCard';
import MerchantRevenueCard from './components/MerchantRevenueCard';
import RechargeCreditsModal from './components/RechargeCreditsModal';
import WithdrawRevenueModal from './components/WithdrawRevenueModal';
import WalletStatSummary from './components/WalletStatSummary';
import TopupPacksSection from './components/TopupPacksSection';
import WalletLedgerTab from './components/WalletLedgerTab';
import CallHistoryTab from './components/CallHistoryTab';
import CreditRatesTab from './components/CreditRatesTab';
import WhatsAppLeadCrmTab from './WhatsAppLeadCrmTab';

/**
 * VendorWalletPage (Production Architecture Shell)
 * Coordinates the dual-wallet financial hub:
 * 1. ⚡ Platform Usage Credits (Non-withdrawable utility tokens for metered platform usage)
 * 2. 💰 Order Sales Revenue (Withdrawable fiat ₹ INR earned from customer orders)
 */
export default function VendorWalletPage() {
  const { bi } = useLanguage();

  // Queries
  const { data: walletData, refetch: refetchWallet } = useGetVendorWalletQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    pollingInterval: 30000,
  });

  const { data: txData, isFetching: isFetchingTx, refetch: refetchTx } = useGetWalletTransactionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    pollingInterval: 30000,
  });

  const { data: topupPacksData } = useGetTopupPacksQuery();
  const { data: creditRatesData } = useGetCreditRatesQuery();

  // Navigation & Modal States
  const [activeTab, setActiveTab] = useState('wallet'); // 'wallet' | 'calls' | 'whatsapp' | 'rates'
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeInitialAmount, setRechargeInitialAmount] = useState('1000');
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  // Telephony Calls State
  const [callHistory, setCallHistory] = useState([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  const fetchCalls = () => {
    setLoadingCalls(true);
    api
      .get('/v1/calls/vendor-history')
      .then((res) => {
        if (res.data?.data?.items) {
          setCallHistory(res.data.data.items);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCalls(false));
  };

  useEffect(() => {
    if (activeTab === 'calls') {
      fetchCalls();
    }
  }, [activeTab]);

  // Real-time Socket.IO synchronization
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleWalletUpdate = () => {
      refetchWallet();
      refetchTx();
      if (activeTab === 'calls') fetchCalls();
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
  }, [refetchWallet, refetchTx, activeTab]);

  // Decoupled Domain Balances
  const vendorCredits =
    walletData?.data?.credits ?? walletData?.credits ?? walletData?.data?.balance ?? walletData?.balance ?? 0;
  const freeReelBoosts = walletData?.data?.free_reel_boosts ?? walletData?.free_reel_boosts ?? 0;
  const earningsInr =
    walletData?.data?.earnings_inr ??
    (walletData?.data?.balance_inr_paise ?? walletData?.balance_inr_paise ?? 0) / 100;
  const bankDetails = walletData?.data?.bankAccount || walletData?.bankAccount;

  // Transactions & Metrics
  const rawTx = txData?.data || txData || [];
  const transactions = Array.isArray(rawTx)
    ? rawTx
    : Array.isArray(rawTx.items)
    ? rawTx.items
    : Array.isArray(rawTx.transactions)
    ? rawTx.transactions
    : [];

  const isTxCredit = (t) => {
    const typeStr = (t?.type || t?.credit_debit || '').toLowerCase();
    return (
      typeStr === 'credit' ||
      typeStr === 'deposit' ||
      typeStr === 'recharge' ||
      typeStr === 'referral_bonus' ||
      typeStr === 'refund' ||
      t?.transaction_type === 'recharge' ||
      t?.transaction_type === 'manual_credit'
    );
  };

  const totalCredits = transactions
    .filter(isTxCredit)
    .reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);

  const totalDebits = transactions
    .filter((t) => !isTxCredit(t))
    .reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);

  const topupPacks = Array.isArray(topupPacksData) ? topupPacksData : topupPacksData?.data || [];
  const creditRates = Array.isArray(creditRatesData)
    ? creditRatesData
    : creditRatesData?.rates || [];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 font-sans p-2 sm:p-4 animate-fade-in pb-20">
      {/* Header */}
      <AdminPageHeader
        icon={TbCurrencyRupee}
        title={bi('Vendor Commercial Accounts & Wallet', 'विक्रेता वाणिज्यिक खाता और वॉलेट')}
        subtitle={bi(
          'Manage non-expiring platform credits, withdraw customer order sales revenue, and view verified call leads',
          'उपयोग क्रेडिट्स प्रबंधित करें, ऑर्डर बिक्री आय निकालें और सत्यापित कॉल लीड्स देखें'
        )}
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
            <FiCreditCard size={16} />
            <span>{bi('Wallet & Ledger', 'वॉलेट और लेन-देन')}</span>
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
            <FiPhoneCall size={16} />
            <span>{bi('Call Leads & Telephony', 'कॉल लीड्स और टेलीफोनी')}</span>
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
        {/* DOMAIN 1: ⚡ PLATFORM USAGE CREDITS */}
        <PlatformCreditsCard
          credits={vendorCredits}
          freeReelBoosts={freeReelBoosts}
          onOpenRecharge={() => {
            setRechargeInitialAmount('1000');
            setIsRechargeModalOpen(true);
          }}
          onViewRates={() => setActiveTab('rates')}
        />

        {/* DOMAIN 2: 💰 ORDER SALES REVENUE */}
        <MerchantRevenueCard
          earningsInr={earningsInr}
          bankDetails={bankDetails}
          onOpenPayout={() => setIsPayoutModalOpen(true)}
        />
      </div>

      {/* TAB CONTENT: WALLET & LEDGER */}
      {activeTab === 'wallet' && (
        <>
          <WalletStatSummary
            balance={vendorCredits}
            totalCredits={totalCredits}
            totalDebits={totalDebits}
          />

          <TopupPacksSection
            topupPacks={topupPacks}
            onSelectPack={(amt) => {
              setRechargeInitialAmount(amt);
              setIsRechargeModalOpen(true);
            }}
          />

          <WalletLedgerTab
            transactions={transactions}
            isLoading={isFetchingTx}
          />
        </>
      )}

      {/* TAB CONTENT: CALL HISTORY & TELEPHONY */}
      {activeTab === 'calls' && (
        <CallHistoryTab
          callHistory={callHistory}
          loading={loadingCalls}
          onRefresh={fetchCalls}
        />
      )}

      {/* TAB CONTENT: WHATSAPP LEADS CRM */}
      {activeTab === 'whatsapp' && <WhatsAppLeadCrmTab />}

      {/* TAB CONTENT: CREDIT RATE SCHEDULE */}
      {activeTab === 'rates' && <CreditRatesTab creditRates={creditRates} />}

      {/* RECHARGE CREDITS MODAL */}
      <RechargeCreditsModal
        isOpen={isRechargeModalOpen}
        initialAmount={rechargeInitialAmount}
        onClose={() => setIsRechargeModalOpen(false)}
        onSuccess={() => {
          refetchWallet();
          refetchTx();
        }}
      />

      {/* WITHDRAW REVENUE MODAL */}
      <WithdrawRevenueModal
        isOpen={isPayoutModalOpen}
        earningsInr={earningsInr}
        bankDetails={bankDetails}
        onClose={() => setIsPayoutModalOpen(false)}
        onSuccess={() => {
          refetchWallet();
          refetchTx();
        }}
      />
    </div>
  );
}
