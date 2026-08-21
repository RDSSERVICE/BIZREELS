import React from 'react';
import { FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import { useGetCreatorWalletQuery, useGetCreatorTransactionsQuery, useRequestPayoutMutation } from '../../../features/creator/creatorApi';
import { useLanguage } from '../../../context/LanguageContext';

export default function CreatorWalletPage() {
  const { bi } = useLanguage();
  const { data: walletData } = useGetCreatorWalletQuery(undefined, { pollingInterval: 300000 });
  const { data: txData, isFetching: isFetchingTx } = useGetCreatorTransactionsQuery(undefined, { pollingInterval: 300000 });
  const [requestPayout] = useRequestPayoutMutation();

  const balance = walletData?.data?.balance ?? walletData?.data?.walletBalance ?? walletData?.balance ?? walletData?.walletBalance ?? 0;
  const payouts = Array.isArray(txData?.data) ? txData.data : Array.isArray(txData?.transactions) ? txData.transactions : Array.isArray(txData) ? txData : [];

  const pendingAmount = payouts
    .filter((p) => p.status === 'pending')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const handleWithdraw = async () => {
    try {
      await requestPayout({ amount: balance }).unwrap();
      toast.success(bi(`Payout withdrawal request for ₹${balance.toLocaleString('en-IN')} submitted!`, `₹${balance.toLocaleString('en-IN')} की निकासी का अनुरोध सबमिट कर दिया गया है!`));
    } catch (err) {
      toast.error(err?.data?.message || bi('Failed to submit withdrawal request', 'निकासी अनुरोध सबमिट करना विफल रहा'));
    }
  };

  const columns = [
    {
      key: 'project',
      label: bi('Project Details', 'प्रोजेक्ट विवरण'),
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val || row.title || row.description || 'Project Shoot'}</span>
          <span className="text-[10px] text-text-tertiary">{bi('Client:', 'क्लाइंट:')} {row.vendor || 'Vendor'} • {row.date || 'Recent'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: bi('Status', 'स्थिति'),
      render: (val) => (
        <span className="bg-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
          {val ? bi(val, val) : bi('Completed', 'पूर्ण')}
        </span>
      ),
    },
    {
      key: 'amount',
      label: bi('Amount (INR)', 'राशि (₹)'),
      render: (val) => (
        <span className="font-black text-xs text-emerald-600">
          +₹{(val || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in font-sans pb-16">
      <AdminPageHeader
        icon={TbCurrencyRupee}
        title={bi('Creator Earnings & Payout Wallet', 'क्रिएटर कमाई और पेआउट वॉलेट (Earnings & Wallet)')}
        subtitle={bi('Withdraw shoot earnings directly to your bank account or UPI ID', 'शूट की कमाई सीधे अपने बैंक खाते या यूपीआई आईडी में निकालें')}
      >
        <button
          onClick={handleWithdraw}
          className="px-4 py-2.5 bg-[#241b15] text-[#d99a3d] font-black text-xs rounded-xl shadow-2xs hover:bg-[#342820] transition flex items-center gap-1.5 cursor-pointer border-none"
        >
          {bi('Withdraw to Bank / UPI', 'बैंक / यूपीआई में निकालें')}
        </button>
      </AdminPageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label={bi('Total Earnings', 'कुल कमाई')} value={`₹${balance.toLocaleString('en-IN')}`} icon={TbCurrencyRupee} color="green" />
        <AdminStatCard label={bi('Completed Projects', 'पूर्ण किए गए प्रोजेक्ट्स')} value={String(payouts.length)} icon={FiArrowDownLeft} color="purple" />
        <AdminStatCard label={bi('Pending Payouts', 'लंबित पेआउट')} value={`₹${pendingAmount.toLocaleString('en-IN')}`} icon={FiArrowUpRight} color="amber" />
      </div>

      <AdminDataTable
        columns={columns}
        data={payouts}
        loading={isFetchingTx}
        searchPlaceholder={bi("Search earnings history...", "कमाई का इतिहास खोजें...")}
        emptyMessage={bi("No payout history found.", "कोई पेआउट इतिहास नहीं मिला।")}
        testId="creator-wallet-table"
      />
    </div>
  );
}
