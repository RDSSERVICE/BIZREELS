import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiPlay,
  FiShoppingBag,
  FiTrendingUp,
  FiArrowRight,
  FiCheckCircle,
  FiShield,
  FiUsers,
  FiZap
} from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from 'react-hot-toast';

const GOLD = '#C9923B';
const GOLD_HOVER = '#B07E2E';
const DARK = '#1C1C2E';

export default function WelcomeModal() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has already permanently dismissed or seen in this session
    const hasDismissed = localStorage.getItem('bizreels_welcome_seen');
    
    // Trigger welcome popup smoothly after 600ms on first visit
    if (!hasDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        // Show a welcoming toast notification as well
        toast.custom(
          (tObj) => (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="bg-white/95 backdrop-blur-md border border-amber-300/80 shadow-2xl rounded-2xl p-4 flex items-center gap-3 text-slate-800 pointer-events-auto"
              style={{ maxWidth: '380px' }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-white text-xl shadow-md shrink-0">
                ✨
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-900 leading-tight">
                  {lang === 'hi' ? 'नमस्ते! BizReels में आपका स्वागत है' : 'Welcome to BizReels!'}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {lang === 'hi'
                    ? 'सत्यापित विक्रेताओं और वीडियो रील्स का अन्वेषण करें।'
                    : "Discover India's #1 Video-First Business Marketplace."}
                </p>
              </div>
              <button
                onClick={() => toast.dismiss(tObj.id)}
                className="text-slate-400 hover:text-slate-700 p-1 transition"
                aria-label="Close notification"
              >
                <FiX className="w-4 h-4" />
              </button>
            </motion.div>
          ),
          { duration: 5000, position: 'top-right' }
        );
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [lang]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('bizreels_welcome_seen', 'true');
    } else {
      // Mark as seen for current session so it doesn't annoy on every single route change
      sessionStorage.setItem('bizreels_welcome_session', 'true');
    }
    setIsOpen(false);
  };

  const handleAction = (path) => {
    handleClose();
    if (path) {
      navigate(path);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-amber-200/60 max-h-[90vh] flex flex-col"
              style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}
            >
              {/* Top Banner Gradient Accent */}
              <div className="relative bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white p-6 sm:p-8 overflow-hidden shrink-0">
                {/* Decorative background glow shapes */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none" />

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition backdrop-blur-sm cursor-pointer"
                  aria-label="Close Welcome Dialog"
                >
                  <FiX className="w-5 h-5" />
                </button>

                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white tracking-wide uppercase mb-3 shadow-sm border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                  <span>{lang === 'hi' ? 'बिजरील्स में आपका स्वागत है' : 'Official Welcome'}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  {lang === 'hi' ? 'नमस्ते! BizReels में आपका स्वागत है 👋' : 'Welcome to BizReels! 👋'}
                </h2>
                <p className="mt-2 text-amber-50 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
                  {lang === 'hi'
                    ? 'भारत का प्रमुख वीडियो-आधारित B2B और स्थानीय बिजनेस डिस्कवरी प्लेटफॉर्म। उत्पादों की रील्स देखें और सीधे सत्यापित विक्रेताओं से जुड़ें।'
                    : "India's premier video-first B2B and business discovery platform. Watch engaging product reels, connect with verified businesses & get real deals."}
                </p>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Card 1: Watch Reels */}
                  <div
                    onClick={() => handleAction('/local-reels')}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition duration-300 shadow-sm">
                        <FiPlay className="w-5 h-5 fill-current" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-amber-700 transition">
                        {lang === 'hi' ? 'लोकल रील्स देखें' : 'Watch Local Reels'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {lang === 'hi'
                          ? 'व्यवसायों के वास्तविक वीडियो और उत्पाद डेमो देखें।'
                          : 'Discover short product video showcases from verified local vendors.'}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center text-xs font-semibold text-amber-600 group-hover:translate-x-1 transition duration-200">
                      <span>{lang === 'hi' ? 'रील्स ब्राउज़ करें' : 'Explore Reels'}</span>
                      <FiArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </div>

                  {/* Card 2: Marketplace */}
                  <div
                    onClick={() => handleAction('/creator-marketplace')}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition duration-300 shadow-sm">
                        <FiShoppingBag className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition">
                        {lang === 'hi' ? 'क्रिएटर व मार्केटप्लेस' : 'Creator Marketplace'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {lang === 'hi'
                          ? 'सत्यापित रचनाकारों और शीर्ष उद्योग श्रेणियों से जुड़ें।'
                          : 'Connect with verified creators and explore top category offerings.'}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition duration-200">
                      <span>{lang === 'hi' ? 'मार्केट देखें' : 'Browse Market'}</span>
                      <FiArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </div>

                  {/* Card 3: Grow Business */}
                  <div
                    onClick={() => handleAction('/auth/register?role=vendor')}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition duration-300 shadow-sm">
                        <FiTrendingUp className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition">
                        {lang === 'hi' ? 'बिजनेस रजिस्टर करें' : 'Grow Your Business'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {lang === 'hi'
                          ? 'अपने उत्पाद सूचीबद्ध करें और सीधे कस्टमर लीड्स प्राप्त करें।'
                          : 'List products, post video reels & capture direct buyer inquiries.'}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition duration-200">
                      <span>{lang === 'hi' ? 'शुरू करें' : 'Join as Vendor'}</span>
                      <FiArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </div>
                </div>

                {/* Trust Badges Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-100 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 font-medium">
                    <FiShield className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'hi' ? '100% सत्यापित विक्रेता' : '100% Verified Vendors'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <FiZap className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'hi' ? 'सीधा चैट व पूछताछ' : 'Direct Inquiry & Fast Chat'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <FiUsers className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'hi' ? '12,000+ व्यवसाय जुड़े हैं' : '12,000+ Businesses Trust Us'}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Actions */}
              <div className="p-4 sm:p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                {/* Don't show again checkbox */}
                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none order-2 sm:order-1">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>{lang === 'hi' ? 'दोबारा न दिखाएं' : "Don't show this again"}</span>
                </label>

                {/* Buttons */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
                  <button
                    onClick={() => handleAction('/local-reels')}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FiPlay className="w-3.5 h-3.5 text-amber-600" />
                    <span>{lang === 'hi' ? 'रील्स देखें' : 'Watch Reels'}</span>
                  </button>

                  <button
                    onClick={handleClose}
                    style={{ backgroundColor: GOLD }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GOLD_HOVER)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{lang === 'hi' ? 'एक्सप्लोर शुरू करें 🚀' : 'Start Exploring 🚀'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Re-open Trigger Button (discreet & sleek at bottom-right) */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 bg-white/90 hover:bg-white text-slate-800 hover:text-amber-700 px-3.5 py-2 rounded-full shadow-lg border border-amber-200/80 backdrop-blur-md flex items-center gap-2 text-xs font-semibold cursor-pointer transition group"
          title="Open Welcome Guide"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <Sparkles className="w-3.5 h-3.5 text-amber-600 group-hover:rotate-12 transition" />
          <span className="hidden sm:inline">
            {lang === 'hi' ? 'बिजरील्स स्वागत गाइड' : 'Welcome to BizReels'}
          </span>
        </motion.button>
      )}
    </>
  );
}
