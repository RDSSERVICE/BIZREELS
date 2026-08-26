import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, Check, X, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const COOKIE_STORAGE_KEY = 'bizreels_cookie_consent';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: true,
    marketing: true,
  });

  useEffect(() => {
    // Check if consent has already been given
    try {
      const storedConsent = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!storedConsent) {
        // Show after a subtle delay for smooth user entry
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch {
      // In case localStorage is blocked or throws
    }
  }, []);

  const saveConsent = (status, customPreferences = null) => {
    const consentData = {
      status, // 'accepted' | 'declined' | 'custom'
      preferences: customPreferences || {
        necessary: true,
        analytics: status === 'accepted',
        marketing: status === 'accepted',
      },
      timestamp: new Date().toISOString(),
      version: '1.0',
    };

    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(consentData));
    } catch {
      // Handle storage write error silently
    }

    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent('accepted', {
      necessary: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleDeclineAll = () => {
    saveConsent('declined', {
      necessary: true,
      analytics: false,
      marketing: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent('custom', preferences);
  };

  const togglePreference = (key) => {
    if (key === 'necessary') return; // Cannot disable essential cookies
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <aside aria-label="Cookie Consent Banner">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md md:max-w-lg z-[9999] bg-[#1c1a17]/95 backdrop-blur-md border border-[#d99a3d]/30 text-[#f2ede4] rounded-2xl shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7), 0 0 25px -5px rgba(217,154,61,0.15)',
          }}
        >
          {/* Top Accent Line */}
          <div className="h-1 w-full bg-gradient-to-r from-[#d99a3d] via-[#f5c366] to-[#d99a3d]" />

          <div className="p-5 sm:p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d99a3d]/15 border border-[#d99a3d]/40 flex items-center justify-center text-[#d99a3d] shrink-0">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight tracking-tight flex items-center gap-2">
                    Cookie Preferences
                  </h3>
                  <p className="text-[11px] text-[#8a8578] font-semibold mt-0.5">
                    We value your privacy and trust
                  </p>
                </div>
              </div>

              <button
                onClick={handleDeclineAll}
                className="text-[#8a8578] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                title="Decline Non-Essential"
                aria-label="Decline Non-Essential Cookies"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description Text */}
            <p className="text-xs text-[#c9c4bb] leading-relaxed font-normal">
              We use cookies to enhance your experience, serve personalized reels and business listings, analyze traffic, and ensure platform security. Choose your preference below or learn more in our{' '}
              <Link
                to="/about"
                className="text-[#d99a3d] underline hover:text-[#f5c366] transition-colors font-semibold"
              >
                Privacy Policy
              </Link>
              .
            </p>

            {/* Expandable Preferences Section */}
            {showPreferences && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-2.5 pt-2 border-t border-[#3a3630]"
              >
                {/* 1. Necessary Cookies */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#241b15] border border-[#3a3630]/60">
                  <div className="flex items-center gap-2.5 pr-2">
                    <Shield className="w-4 h-4 text-[#d99a3d] shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        Essential Cookies
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#d99a3d]/20 text-[#d99a3d] border border-[#d99a3d]/30">
                          Always Active
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8a8578] leading-tight mt-0.5">
                        Required for secure login, session verification &amp; core functions.
                      </p>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-[#8a8578] shrink-0" />
                </div>

                {/* 2. Analytics Cookies */}
                <div
                  onClick={() => togglePreference('analytics')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#241b15] border border-[#3a3630]/60 hover:border-[#d99a3d]/40 transition-colors cursor-pointer"
                >
                  <div className="pr-2">
                    <div className="text-xs font-bold text-white">Analytics &amp; Performance</div>
                    <p className="text-[10px] text-[#8a8578] leading-tight mt-0.5">
                      Helps us measure page engagement &amp; improve platform speed.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.analytics}
                    className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${
                      preferences.analytics ? 'bg-[#d99a3d]' : 'bg-[#3a3630]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        preferences.analytics ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Marketing Cookies */}
                <div
                  onClick={() => togglePreference('marketing')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#241b15] border border-[#3a3630]/60 hover:border-[#d99a3d]/40 transition-colors cursor-pointer"
                >
                  <div className="pr-2">
                    <div className="text-xs font-bold text-white">Marketing &amp; Personalization</div>
                    <p className="text-[10px] text-[#8a8578] leading-tight mt-0.5">
                      Used to show relevant product reels and tailored vendor promotions.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.marketing}
                    className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${
                      preferences.marketing ? 'bg-[#d99a3d]' : 'bg-[#3a3630]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        preferences.marketing ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-extrabold text-xs transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Accept All Cookies</span>
                </button>

                {showPreferences ? (
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#2e261f] hover:bg-[#3a322b] text-white border border-[#d99a3d]/50 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Save My Choices</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDeclineAll}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-[#c9c4bb] hover:text-white border border-[#3a3630] font-bold text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Decline Non-Essential</span>
                  </button>
                )}
              </div>

              {/* Toggle Customize Preferences */}
              <button
                type="button"
                onClick={() => setShowPreferences((prev) => !prev)}
                className="w-full py-1.5 text-[11px] font-semibold text-[#8a8578] hover:text-[#d99a3d] transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{showPreferences ? 'Hide Preferences' : 'Customize Preferences'}</span>
                {showPreferences ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
        </aside>
      )}
    </AnimatePresence>
  );
}
