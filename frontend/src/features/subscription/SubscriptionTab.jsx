import React from 'react';
import { useSubscribeToPlanMutation } from '../wallet/walletApi';
import { FiCheckCircle, FiStar, FiCalendar, FiTrendingUp, FiCreditCard, FiZap } from 'react-icons/fi';
import Button from '../../components/common/Button';
import { toast } from 'react-hot-toast';

const SubscriptionTab = ({ user, refetchUser }) => {
  const [subscribeToPlan, { isLoading: isSubscribing }] = useSubscribeToPlanMutation();

  const currentPlan = user?.subscription?.plan || 'Free Starter';
  const planExpires = user?.subscription?.expiresAt;

  const subscriptionPlans = [
    {
      id: 'free',
      name: 'Free Starter',
      price: 0,
      period: 'lifetime',
      features: ['List up to 5 Products', 'Upload 3 Reels / Month', 'Standard Analytics Dashboard', 'Standard Support'],
      popular: false,
    },
    {
      id: 'growth',
      name: 'Local Growth',
      price: 1500,
      period: 'month',
      features: ['List Unlimited Products & Services', 'Upload Unlimited Reels & Videos', 'AI Assistant Descriptions & Copy', '1 Reel Boost included / month', 'Priority Customer Enquiries'],
      popular: true,
    },
    {
      id: 'ultimate',
      name: 'Ultimate Professional',
      price: 3500,
      period: 'month',
      features: ['All Local Growth Features', '3 Reel Boosts included / month', 'Live Broadcast Streaming to Nearby feeds', 'Hire Creators with 0% Commission', 'Dedicated Account Support Desk'],
      popular: false,
    },
  ];

  const handleUpgrade = async (planId, price) => {
    if (user?.walletBalance < price) {
      return toast.error('Insufficient wallet balance. Please recharge your wallet first.');
    }
    if (window.confirm(`Upgrade/Renew subscription to ${planId.toUpperCase()} plan for ₹${price}?`)) {
      try {
        await subscribeToPlan({ planId }).unwrap();
        toast.success(`Successfully subscribed to ${planId.toUpperCase()}!`);
        if (refetchUser) refetchUser();
      } catch (err) {
        toast.error('Subscription purchase failed. Please check wallet balance or try again.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Current Plan Overview Card */}
      <div className="glass p-6 rounded-2xl border border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-2xl">
            <FiStar className="w-8 h-8 fill-brand-purple/20" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Account tier</span>
            <h3 className="text-xl font-black text-brand-navy font-display mt-0.5">{currentPlan}</h3>
            {planExpires && (
              <span className="text-xs text-slate-500 mt-1 block flex items-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5 text-brand-purple" />
                Active until: {new Date(planExpires).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex items-center gap-3 shrink-0">
          <FiCreditCard className="text-brand-purple w-5 h-5" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Billing Source</span>
            <span className="text-xs font-bold text-brand-navy">Simulated Wallet Balance</span>
          </div>
        </div>
      </div>

      {/* Subscription Plans Grid */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider px-1">Subscription plans catalog</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => {
            const isCurrent = currentPlan.toLowerCase().includes(plan.id) || 
                              (plan.id === 'free' && currentPlan === 'Free Starter');
            return (
              <div
                key={plan.id}
                className={`glass p-6 rounded-2xl border flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-premium
                  ${plan.popular ? 'border-brand-purple shadow-premium ring-2 ring-brand-purple/15' : 'border-white/50 shadow-glass'}
                  ${isCurrent ? 'bg-slate-50/70 border-brand-purple' : ''}
                `}
              >
                {plan.popular && (
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white bg-brand-purple rounded-lg shadow-sm">
                    Most Popular
                  </span>
                )}

                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-black text-brand-navy font-display uppercase tracking-wide">{plan.name}</h4>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-2xl font-black text-brand-navy font-display">₹{plan.price}</span>
                    <span className="text-xs text-slate-400">/ {plan.period}</span>
                  </div>
                </div>

                <ul className="flex flex-col gap-2.5 my-6 text-xs text-slate-600 flex-grow">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <FiCheckCircle className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <span className="w-full text-center py-2.5 text-xs font-bold text-brand-purple bg-brand-purple-50 rounded-xl border border-brand-purple/20">
                    Active Plan
                  </span>
                ) : plan.id === 'free' ? (
                  <button
                    disabled
                    className="w-full py-2.5 text-xs font-bold text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed"
                  >
                    Included Default
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpgrade(plan.id, plan.price)}
                    disabled={isSubscribing}
                    className="w-full py-2.5 text-xs font-bold text-white bg-brand-purple rounded-xl shadow-premium hover:bg-brand-purple-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FiZap className="w-3.5 h-3.5 fill-current text-white" /> Upgrade Plan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTab;
