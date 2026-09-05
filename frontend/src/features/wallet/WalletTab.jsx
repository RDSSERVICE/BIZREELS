import React, { useState } from 'react';
import { useGetTransactionsQuery } from './walletApi';
import { FiTrendingUp, FiPlus, FiArrowDownLeft, FiArrowUpRight, FiDollarSign, FiInfo, FiAlertCircle } from 'react-icons/fi';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Input from '../../components/common/Input';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';

/**
 * Dynamically loads the Razorpay Checkout SDK script.
 * Returns true if loaded successfully, false otherwise.
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[BizReels] Failed to load Razorpay Checkout SDK from https://checkout.razorpay.com/v1/checkout.js');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const WalletTab = ({ user, refetchUser }) => {
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [isRechargingModal, setIsRechargingModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Queries
  const { data: transactionsRes, isLoading: isTransactionsLoading, refetch: refetchTransactions } = useGetTransactionsQuery();

  const transactions = transactionsRes?.data || [];

  const handleRecharge = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(rechargeAmount);
    if (!numAmount || numAmount <= 0) {
      return toast.error('Please enter a valid amount.');
    }

    setIsProcessing(true);
    try {
      // 1. Create Razorpay order via backend
      const res = await api.post('/v1/payments/order', {
        amount_paise: Math.round(numAmount * 100),
        purpose: 'wallet_topup',
      });

      const orderData = res?.data;
      if (!orderData?.razorpay_order_id) {
        console.error('[BizReels] Payment order response missing razorpay_order_id:', orderData);
        throw new Error('Failed to create payment order. Please try again.');
      }

      console.log('[BizReels] Payment order created:', {
        order_id: orderData.razorpay_order_id,
        amount_paise: orderData.amount_paise,
        key_id: orderData.key_id ? `${orderData.key_id.substring(0, 12)}...` : 'MISSING',
      });

      // 2. Load Razorpay Checkout SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !window.Razorpay) {
        console.error('[BizReels] Razorpay SDK failed to load. window.Razorpay =', window.Razorpay);
        throw new Error('Payment gateway could not be loaded. Please check your internet connection and try again.');
      }

      // 3. Configure and open Razorpay Checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency || 'INR',
        name: 'BizReels',
        description: `Wallet Top-up ₹${numAmount}`,
        order_id: orderData.razorpay_order_id,
        handler: async (response) => {
          // 4. Verify payment on backend
          try {
            await api.post('/v1/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(`₹${numAmount} added to your wallet successfully!`);
            setIsRechargingModal(false);
            setRechargeAmount('');
            if (refetchUser) refetchUser();
            refetchTransactions();
          } catch (verifyErr) {
            console.error('[BizReels] Payment verification failed:', verifyErr);
            toast.error('Payment was received but verification failed. Please contact support if your balance is not updated.');
          }
        },
        modal: {
          ondismiss: () => {
            console.log('[BizReels] Razorpay modal dismissed by user');
            toast('Payment cancelled.', { icon: '⚠️' });
            setIsProcessing(false);
          },
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#7C3AED',
        },
      };

      const rzp = new window.Razorpay(options);

      // 5. Handle payment failure
      rzp.on('payment.failed', (response) => {
        console.error('[BizReels] Razorpay payment failed:', {
          code: response.error?.code,
          description: response.error?.description,
          source: response.error?.source,
          step: response.error?.step,
          reason: response.error?.reason,
          order_id: response.error?.metadata?.order_id,
          payment_id: response.error?.metadata?.payment_id,
        });
        toast.error(response.error?.description || 'Payment failed. Please try again.');
      });

      rzp.open();
    } catch (err) {
      console.error('[BizReels] Recharge flow error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Recharge failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in font-sans">
      {/* Wallet Balance Card */}
      <div className="bg-[#241b15] p-6 rounded-2xl text-white border-2 border-[#241b15] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="flex flex-col gap-1 z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#d99a3d]">WALLET BALANCE</span>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-3xl font-black text-white tracking-tight">₹{user?.walletBalance || 0}</h2>
          <p className="text-[11px] text-slate-300 font-bold mt-0.5">Use this balance to purchase plans or boost your Reels instantly.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsRechargingModal(true)}
          className="px-5 py-2.5 bg-[#d99a3d] text-[#1a1a1a] text-xs font-black rounded-xl hover:bg-[#eab35b] transition-all shadow-2xs flex items-center gap-2 z-10 cursor-pointer border-none"
        >
          <FiPlus size={16} /> DEPOSIT FUNDS
        </button>
      </div>

      {/* Transaction List */}
      <div className="flex flex-col gap-4">
        <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase tracking-wider text-[#1a1a1a]">
          LEDGER & TRANSACTION HISTORY
        </h3>
        {isTransactionsLoading ? (
          <div className="py-12 flex justify-center"><Loader /></div>
        ) : transactions.length === 0 ? (
          <div className="bg-white p-10 text-center text-slate-500 rounded-2xl border border-[#e3dccb] shadow-2xs flex flex-col items-center gap-2">
            <FiInfo className="w-6 h-6 text-[#d99a3d]" />
            <p className="text-xs font-bold text-[#1a1a1a]">No recent transactions recorded.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e3dccb] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-[#f8f4ec] border-b border-[#e3dccb] text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Date / Time</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3dccb] text-slate-700">
                  {transactions.map((tx) => {
                    const isDeposit = tx.type === 'deposit' || tx.type === 'credit';
                    return (
                      <tr key={tx._id} className="hover:bg-[#f8f4ec]/50 transition-colors">
                        <td className="p-4 font-mono text-[10px] font-bold text-slate-500">{tx._id}</td>
                        <td className="p-4 font-bold">{new Date(tx.createdAt).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1 w-max ${
                            isDeposit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isDeposit ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-4 font-extrabold text-[#1a1a1a]">{tx.description || 'Wallet Recharge'}</td>
                        <td className={`p-4 text-right font-black ${isDeposit ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isDeposit ? '+' : '-'}₹{tx.amount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Recharge Modal */}
      {isRechargingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl border-2 border-[#241b15] shadow-2xl w-full max-w-md p-6 z-10 relative flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-[#e3dccb] pb-3">
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
                <FiPlus className="text-[#d99a3d]" size={18} /> RECHARGE WALLET BALANCE
              </h3>
              <button
                type="button"
                onClick={() => setIsRechargingModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-[#1a1a1a] hover:bg-[#f8f4ec] transition-colors cursor-pointer border-none bg-transparent"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleRecharge} className="flex flex-col gap-4">
              <Input
                label="Enter Deposit Amount (₹) *"
                type="number"
                placeholder="e.g. 500"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                required
              />
              
              <div className="bg-[#f8f4ec] p-3.5 rounded-xl border border-[#e3dccb] text-[10px] text-slate-600 font-bold leading-relaxed flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 text-[#241b15] shrink-0" />
                <span>Secure payment via Razorpay. Your balance updates instantly upon payment confirmation.</span>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-[#e3dccb] pt-4">
                <button
                  type="button"
                  onClick={() => setIsRechargingModal(false)}
                  className="px-4 py-2 text-xs font-black text-slate-600 hover:bg-[#f8f4ec] rounded-xl transition-all cursor-pointer border border-[#e3dccb] bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-xs transition cursor-pointer border-none"
                >
                  {isProcessing ? 'Opening Payment...' : `Pay ₹${rechargeAmount || '0'} via Razorpay`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletTab;
