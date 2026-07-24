import React, { useState, useEffect } from 'react';
import { FiGift, FiCopy, FiClock, FiCheck, FiChevronLeft, FiChevronRight, FiChevronDown, FiTag, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

function OfferCountdown({ endTime, onExpire }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft('Expired');
        if (onExpire) onExpire();
        return;
      }
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      let str = '';
      if (days > 0) str += `${days}d `;
      str += `${hours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m:${seconds.toString().padStart(2, '0')}s`;
      setTimeLeft(str);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  return (
    <div className="flex items-center gap-1 text-[11px] font-extrabold text-brand-pink bg-brand-pink/10 border border-brand-pink/20 px-2 py-0.5 rounded-lg select-none">
      <FiClock className="animate-pulse" />
      <span>Ends in: {timeLeft}</span>
    </div>
  );
}

export default function ActiveOffersPanel({ role = 'customer' }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/offers/active');
      const items = res.data?.items || [];
      // Filter target audience on client just to be robust
      const filtered = items.filter(o => o.applicableToAll || o.targetRoles?.includes(role) || !o.targetRoles);
      setOffers(filtered);
    } catch (err) {
      console.warn('Failed to load active offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();

    const socket = getSocket();
    if (!socket) return;

    const handleOfferActivated = (newOffer) => {
      if (newOffer.targetRoles?.includes(role)) {
        setOffers(prev => {
          if (prev.some(o => o.id === newOffer.id || o._id === newOffer._id)) return prev;
          toast.success(`🎁 New Special Offer: ${newOffer.title}`);
          return [newOffer, ...prev];
        });
      }
    };

    const handleOfferExpired = ({ id }) => {
      setOffers(prev => prev.filter(o => o.id !== id && o._id !== id));
      setCurrentIndex(0);
    };

    socket.on('offer:activated', handleOfferActivated);
    socket.on('offer:expired', handleOfferExpired);
    socket.on('offer:deleted', handleOfferExpired);
    socket.on('offer:updated', (updatedOffer) => {
      // Re-fetch or replace inline
      if (updatedOffer.targetRoles?.includes(role)) {
        setOffers(prev => prev.map(o => (o.id === updatedOffer.id || o._id === updatedOffer._id) ? updatedOffer : o));
      } else {
        // If roles no longer include current, remove it
        setOffers(prev => prev.filter(o => o.id !== updatedOffer.id && o._id !== updatedOffer._id));
      }
    });

    return () => {
      socket.off('offer:activated', handleOfferActivated);
      socket.off('offer:expired', handleOfferExpired);
      socket.off('offer:deleted', handleOfferExpired);
    };
  }, [role]);

  const handleCopyCode = (e, code, offerId) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(offerId);
    toast.success(`Coupon code "${code}" copied!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOfferClick = async (offerId) => {
    try {
      await api.post(`/v1/offers/${offerId}/click`);
    } catch (err) {
      // silent fail
    }
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % offers.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + offers.length) % offers.length);
  };

  if (loading && offers.length === 0) {
    return (
      <div className="glass p-6 rounded-3xl border border-white/10 flex justify-center items-center shadow-card bg-surface/40 backdrop-blur-md">
        <div className="w-5 h-5 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-xs text-text-secondary font-bold">Scanning active deals...</span>
      </div>
    );
  }

  if (offers.length === 0) return null;

  const currentOffer = offers[currentIndex];

  return (
    <div className="glass rounded-3xl border border-brand-purple/20 p-5 shadow-card bg-gradient-to-r from-brand-purple/10 via-surface to-brand-pink/5 relative overflow-hidden animate-fade-in">
      {/* Decorative Gradient Ring */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-pink/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Offer Icon Badge */}
          <div className="p-3 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple flex-shrink-0 animate-bounce">
            <FiGift size={20} />
          </div>

          {/* Offer Text Details */}
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleOfferClick(currentOffer.id || currentOffer._id)}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Special Deal
              </span>
              <OfferCountdown 
                endTime={currentOffer.endTime} 
                onExpire={() => setOffers(prev => prev.filter(o => o.id !== currentOffer.id && o._id !== currentOffer._id))} 
              />
            </div>
            
            <h3 className="text-sm font-extrabold text-text-primary mt-1.5 font-display line-clamp-1">
              {currentOffer.title}
            </h3>
            
            <p className="text-xs text-text-tertiary mt-1 line-clamp-2 leading-relaxed">
              {currentOffer.description}
            </p>

            {currentOffer.terms && (
              <p className="text-[10px] text-text-tertiary italic mt-1.5 flex items-center gap-1 select-none">
                * {currentOffer.terms}
              </p>
            )}
          </div>
        </div>

        {/* Promo Code & Action Box */}
        <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0">
          {/* Discount Tag */}
          <div className="text-right">
            <span className="text-lg font-black text-emerald-500 block">
              {currentOffer.discountType === 'percentage' 
                ? `${currentOffer.discountValue}% OFF` 
                : `₹${currentOffer.discountValue} OFF`
              }
            </span>
            {currentOffer.minOrderAmount > 0 && (
              <span className="text-[9px] text-text-tertiary font-bold block mt-0.5">
                Min. spend: ₹{currentOffer.minOrderAmount}
              </span>
            )}
          </div>

          {/* Copy Code Action */}
          {currentOffer.code ? (
            <button
              onClick={(e) => handleCopyCode(e, currentOffer.code, currentOffer.id || currentOffer._id)}
              className="mt-3 px-3 py-1.5 rounded-xl border border-brand-purple/30 bg-surface hover:bg-brand-purple/5 text-text-primary text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02]"
              title="Click to copy coupon code"
            >
              <FiTag size={13} className="text-brand-purple" />
              <span>{currentOffer.code}</span>
              {copiedId === (currentOffer.id || currentOffer._id) ? (
                <FiCheck size={12} className="text-emerald-500" />
              ) : (
                <FiCopy size={11} className="text-text-tertiary" />
              )}
            </button>
          ) : (
            <span className="text-[10px] text-text-tertiary font-bold italic mt-3">Auto-Applied</span>
          )}
        </div>
      </div>

      {/* Slide Navigation Dots / Arrows (If multiple offers) */}
      {offers.length > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 mt-4 pt-3 text-[10px] text-text-tertiary font-bold select-none relative z-10">
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handlePrev} 
              className="p-1 hover:bg-surface-tertiary rounded-lg border border-border transition"
              title="Previous Offer"
            >
              <FiChevronLeft size={14} />
            </button>
            <span className="px-1 text-text-secondary">
              Offer {currentIndex + 1} of {offers.length}
            </span>
            <button 
              onClick={handleNext} 
              className="p-1 hover:bg-surface-tertiary rounded-lg border border-border transition"
              title="Next Offer"
            >
              <FiChevronRight size={14} />
            </button>
          </div>
          
          <div className="flex items-center gap-1">
            {offers.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  currentIndex === idx ? 'w-3.5 bg-brand-purple' : 'bg-border hover:bg-text-tertiary'
                }`}
                title={`Go to offer ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
