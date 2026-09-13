import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheck,
  FiX,
  FiZap,
  FiShield,
  FiStar,
  FiArrowRight,
  FiHelpCircle,
  FiShoppingBag,
  FiVideo,
  FiPhoneCall,
  FiChevronDown,
  FiLock,
  FiClock,
  FiAward,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import SEO from '../../components/common/SEO';
import { useLanguage } from '../../context/LanguageContext';
import { useGetSubscriptionPlansQuery, useGetCreditRatesQuery } from '../../features/vendor/vendorApi';

export default function Pricing() {
  const navigate = useNavigate();
  const { bi, lang } = useLanguage();

  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Fetch dynamic plans and live credit rates created/configured by Admin
  const { data: dbVendorPlansData, refetch: refetchVendorPlans } = useGetSubscriptionPlansQuery({ role: 'vendor' });
  const { data: creditRatesData, refetch: refetchCreditRates } = useGetCreditRatesQuery();

  // Listen for live admin updates via socket so any plan changes propagate immediately
  React.useEffect(() => {
    let socket;
    try {
      const { getSocket } = require('../../lib/socket');
      socket = getSocket?.();
      if (socket) {
        const onUpdate = () => {
          refetchVendorPlans();
        };
        socket.on('subscription:updated', onUpdate);
        socket.on('admin:update', onUpdate);
        return () => {
          socket.off('subscription:updated', onUpdate);
          socket.off('admin:update', onUpdate);
        };
      }
    } catch (err) {
      // socket listener optional fallback
    }
  }, [refetchVendorPlans]);

  const formatPlansFromDb = (items) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    const activeItems = items.filter((p) => p.is_active && !p.is_archived);
    if (activeItems.length === 0) return null;

    return activeItems.map((p) => {
      const priceVal = p.price_inr || p.price || 0;
      const creditsVal = Number(p.action_credits || p.wallet_credits || 0);

      const rawFeatures = p.features_list?.length > 0
        ? p.features_list
        : (p.features ? (Array.isArray(p.features) ? p.features : p.features.split(',').map(f => f.trim()).filter(Boolean)) : []);

      const featuresList = [];

      if (creditsVal > 0) {
        featuresList.push({
          title: bi(`${creditsVal.toLocaleString('en-IN')} Action Credits Included`, `${creditsVal.toLocaleString('en-IN')} एक्शन क्रेडिट शामिल`),
          included: true,
          highlight: true,
        });
      }

      if (Number(p.free_reel_boosts || 0) > 0) {
        featuresList.push({
          title: bi(`${p.free_reel_boosts} Free Reel Boost${p.free_reel_boosts > 1 ? 's' : ''}`, `${p.free_reel_boosts} मुफ़्त रील बूस्ट`),
          included: true,
          highlight: true,
        });
      }

      featuresList.push({
        title: bi('Non-Expiring Balance (Lifetime validity)', 'क्रेडिट कभी समाप्त नहीं होते (लाइफटाइम वैधता)'),
        included: true,
      });

      featuresList.push({
        title: bi('Draw down on WhatsApp leads (2.50 Cr) & Calls (2.50 Cr)', 'व्हाट्सएप लीड्स (2.50 Cr) और कॉल्स (2.50 Cr) पर ही कटौती'),
        included: true,
      });

      rawFeatures.forEach((fStr) => {
        const lower = fStr.toLowerCase();
        if (!lower.includes('credit') && !lower.includes('boost') && !lower.includes('non-expiring') && !lower.includes('whatsapp')) {
          featuresList.push({
            title: fStr,
            included: true,
          });
        }
      });

      if (p.product_limit !== undefined && p.product_limit !== null) {
        featuresList.push({
          title: bi(`Product Listings: ${p.product_limit || 'Unlimited'}`, `उत्पाद लिस्टिंग: ${p.product_limit || 'असीमित'}`),
          included: true,
        });
      }

      if (p.verified_badge) {
        featuresList.push({
          title: bi('Verified Merchant Gold Badge ✓', 'सत्यापित मर्चेंट गोल्ड बैज ✓'),
          included: true,
        });
      }

      const defaultBadge = p.badge_text || (p.title?.toLowerCase().includes('growth') || p.is_popular ? bi('MOST POPULAR', 'सर्वाधिक लोकप्रिय') : p.title?.toLowerCase().includes('business') ? bi('BEST VALUE', 'सर्वोत्तम मूल्य') : null);

      return {
        id: p.id || p._id,
        name: p.title || p.name,
        badge: defaultBadge,
        desc: p.description || '',
        walletCredits: creditsVal,
        freeReelBoosts: p.free_reel_boosts || 0,
        priceLabel: `₹${priceVal.toLocaleString('en-IN')}`,
        billedNote: bi(`${creditsVal ? creditsVal.toLocaleString('en-IN') + ' Credits • ' : ''}Non-Expiring Recharge Pack`, `${creditsVal ? creditsVal.toLocaleString('en-IN') + ' क्रेडिट • ' : ''}कभी समाप्त नहीं होते`),
        popular: Boolean(p.is_popular || p.plan_type === 'standard' || p.title?.toLowerCase().includes('growth')),
        ctaText: bi(`Recharge Pack (₹${priceVal.toLocaleString('en-IN')})`, `रीचार्ज करें (₹${priceVal.toLocaleString('en-IN')})`),
        ctaLink: '/vendor/wallet?tab=plans',
        features: featuresList,
      };
    });
  };

  const dynamicVendorPlans = formatPlansFromDb(dbVendorPlansData?.data?.items || dbVendorPlansData?.items || dbVendorPlansData?.data);

  // Vendor Recharge Plans Fallback (Strictly Aligned with Specs: Starter ₹499, Growth ₹1,199, Business ₹2,199)
  const defaultVendorPlans = [
    {
      id: 'vendor_starter',
      name: bi('Starter', 'स्टार्टर'),
      badge: null,
      desc: bi('Entry-level non-expiring credit pack for emerging local businesses and shops.', 'स्थानीय व्यवसायों और दुकानों के लिए एंट्री-लेवल नॉन-एक्सपायरिंग क्रेडिट पैक।'),
      walletCredits: 599,
      freeReelBoosts: 1,
      priceLabel: '₹499',
      billedNote: bi('599 Credits Included • Non-Expiring', '599 क्रेडिट शामिल • कभी समाप्त नहीं होते'),
      popular: false,
      ctaText: bi('Recharge Pack (₹499)', 'रीचार्ज करें (₹499)'),
      ctaLink: '/vendor/wallet?tab=plans',
      features: [
        { title: bi('599 Action Credits Included', '599 एक्शन क्रेडिट शामिल'), included: true, highlight: true },
        { title: bi('1 Free Reel Boost Included', '1 मुफ़्त रील बूस्ट शामिल'), included: true, highlight: true },
        { title: bi('Non-Expiring credits — valid until fully used', 'क्रेडिट कभी समाप्त नहीं होते — पूर्ण उपयोग तक मान्य'), included: true },
        { title: bi('WhatsApp Leads & Exotel Voice Calls (2.50 Cr/action)', 'व्हाट्सएप लीड्स और कॉल्स (2.50 Cr/एक्शन)'), included: true },
        { title: bi('Accumulates with all future recharges', 'भविष्य के सभी रीचार्ज के साथ क्रेडिट जुड़ते हैं'), included: true },
        { title: bi('24-Hour Deduplication Protection on Leads', 'लीड्स पर 24 घंटे की डिडुप सुरक्षा'), included: true },
        { title: bi('Verified Gold Merchant Badge', 'सत्यापित गोल्ड मर्चेंट बैज'), included: false },
      ],
    },
    {
      id: 'vendor_growth',
      name: bi('Growth', 'ग्रोथ'),
      badge: bi('MOST POPULAR', 'सर्वाधिक लोकप्रिय'),
      desc: bi('Most popular credit pack designed for high customer reach and volume leads.', 'उच्च ग्राहक पहुंच और अधिक लीड्स के लिए सर्वाधिक लोकप्रिय पैक।'),
      walletCredits: 1599,
      freeReelBoosts: 3,
      priceLabel: '₹1,199',
      billedNote: bi('1,599 Credits Included • Non-Expiring', '1,599 क्रेडिट शामिल • कभी समाप्त नहीं होते'),
      popular: true,
      ctaText: bi('Recharge Pack (₹1,199)', 'रीचार्ज करें (₹1,199)'),
      ctaLink: '/vendor/wallet?tab=plans',
      features: [
        { title: bi('1,599 Action Credits Included', '1,599 एक्शन क्रेडिट शामिल'), included: true, highlight: true },
        { title: bi('3 Free Reel Boosts Included', '3 मुफ़्त रील बूस्ट शामिल'), included: true, highlight: true },
        { title: bi('Non-Expiring credits — valid until fully used', 'क्रेडिट कभी समाप्त नहीं होते — पूर्ण उपयोग तक मान्य'), included: true },
        { title: bi('Verified Gold Merchant Badge on all listings ✓', 'सभी लिस्टिंग पर सत्यापित गोल्ड बैज ✓'), included: true },
        { title: bi('WhatsApp Leads & Exotel Voice Calls (2.50 Cr/action)', 'व्हाट्सएप लीड्स और कॉल्स (2.50 Cr/एक्शन)'), included: true },
        { title: bi('Priority routing for customer phone calls & chats', 'कॉल व चैट में प्राथमिकता रूटिंग'), included: true },
        { title: bi('24-Hour Deduplication Protection on Leads', 'लीड्स पर 24 घंटे की डिडुप सुरक्षा'), included: true },
      ],
    },
    {
      id: 'vendor_business',
      name: bi('Business', 'बिजनेस'),
      badge: bi('BEST VALUE', 'सर्वोत्तम मूल्य'),
      desc: bi('Best value maximum scale pack with 2,999 credits and 5 free boosts.', '2,999 क्रेडिट और 5 मुफ़्त बूस्ट के साथ सर्वोत्तम मूल्य का स्केल पैक।'),
      walletCredits: 2999,
      freeReelBoosts: 5,
      priceLabel: '₹2,199',
      billedNote: bi('2,999 Credits Included • Non-Expiring', '2,999 क्रेडिट शामिल • कभी समाप्त नहीं होते'),
      popular: false,
      ctaText: bi('Recharge Pack (₹2,199)', 'रीचार्ज करें (₹2,199)'),
      ctaLink: '/vendor/wallet?tab=plans',
      features: [
        { title: bi('2,999 Action Credits Included', '2,999 एक्शन क्रेडिट शामिल'), included: true, highlight: true },
        { title: bi('5 Free Reel Boosts Included', '5 मुफ़्त रील बूस्ट शामिल'), included: true, highlight: true },
        { title: bi('Non-Expiring credits — valid until fully used', 'क्रेडिट कभी समाप्त नहीं होते — पूर्ण उपयोग तक मान्य'), included: true },
        { title: bi('Highest priority listing and reel visibility', 'लिस्टिंग और रील में सर्वोच्च प्राथमिकता'), included: true },
        { title: bi('Verified Gold Merchant Badge on all listings ✓', 'सभी लिस्टिंग पर सत्यापित गोल्ड बैज ✓'), included: true },
        { title: bi('VIP Priority Support & Dedicated Business Desk', 'वीआईपी प्राथमिकता सपोर्ट एवं बिजनेस डेस्क'), included: true },
        { title: bi('24-Hour Deduplication Protection on Leads', 'लीड्स पर 24 घंटे की डिडुप सुरक्षा'), included: true },
      ],
    },
  ];

  const plans = dynamicVendorPlans || defaultVendorPlans;

  const rateItems = Array.isArray(creditRatesData) ? creditRatesData : (creditRatesData?.rates || []);
  const boostItem = rateItems.find(r => r.category === 'Promotion' || r.action?.toLowerCase().includes('reel'));
  const whatsappItem = rateItems.find(r => r.category === 'WhatsApp' || r.action?.toLowerCase().includes('whatsapp'));
  const callItem = rateItems.find(r => r.category === 'Telephony' || r.action?.toLowerCase().includes('call'));

  const boostRateLabel = boostItem?.rate || 'Free / 2.00 Credits/day';
  const whatsappRateLabel = whatsappItem?.rate || '2.50 Credits';
  const callRateLabel = callItem?.rate || '2.50 Credits';

  // Credit Action Add-ons / Usage Reference
  const creditAddons = [
    {
      title: bi('Verified WhatsApp Leads', 'सत्यापित व्हाट्सएप लीड्स'),
      price: whatsappRateLabel,
      desc: bi('Customer sends an inbound message to your connected Meta WhatsApp Business number. Deducted only on successful connects with 24-hour deduplication.', 'ग्राहक आपके कनेक्टेड मेटा व्हाट्सएप बिजनेस नंबर पर मैसेज भेजता है। केवल 24 घंटे के डिडुप के साथ सफल कनेक्ट पर कटौती।'),
      icon: FiPhoneCall,
    },
    {
      title: bi('Exotel Voice Calls', 'एक्सोटेल वॉयस कॉल्स'),
      price: callRateLabel,
      desc: bi('Bridged customer phone call via Exotel with caller privacy masking. Charged only when call successfully connects for at least 10 seconds.', 'एक्सोटेल द्वारा ग्राहक से सीधी फोन कॉल। केवल तभी शुल्क लगता है जब कॉल कम से कम 10 सेकंड तक कनेक्ट रहे।'),
      icon: FiZap,
    },
    {
      title: bi('Reel Feed Boosts', 'रील फीड बूस्ट्स'),
      price: boostRateLabel,
      desc: bi('Boost your product & service showcase reels to top trending local feeds for exponential buyer visibility in your city.', 'स्थानीय खरीदारों की अधिकतम पहुंच के लिए अपनी रील्स को शीर्ष डिस्कवरी फीड में बूस्ट करें।'),
      icon: FiVideo,
    },
  ];

  // FAQs
  const faqs = [
    {
      q: bi('Who needs a subscription on BizReels?', 'BizReels पर किसे सब्सक्रिप्शन की आवश्यकता होती है?'),
      a: bi('Subscriptions on BizReels are exclusively for Vendors & Merchants. Content creators and regular shoppers do not need any subscription — BizReels is 100% free for them.', 'BizReels पर सब्सक्रिप्शन केवल विक्रेताओं और व्यापारियों के लिए है। कंटेंट क्रिएटर्स और खरीदारों के लिए यह 100% मुफ़्त है — उन्हें किसी सब्सक्रिप्शन की आवश्यकता नहीं है।'),
    },
    {
      q: bi('How do Vendor recharge packs and credits work?', 'विक्रेता रीचार्ज पैक और क्रेडिट कैसे काम करते हैं?'),
      a: bi('Vendor subscriptions operate on a pay-and-recharge model. You purchase a credit pack (Starter ₹499 for 599 credits, Growth ₹1,199 for 1,599 credits, or Business ₹2,199 for 2,999 credits). Credits have lifetime validity, never expire, and stack cumulatively with every new recharge.', 'विक्रेता सदस्यता पे-एंड-रीचार्ज मॉडल पर काम करती है। आप क्रेडिट पैक खरीदते हैं (स्टार्टर ₹499 में 599 क्रेडिट, ग्रोथ ₹1,199 में 1,599 क्रेडिट, या बिजनेस ₹2,199 में 2,999 क्रेडिट)। क्रेडिट की लाइफटाइम वैधता होती है, वे कभी समाप्त नहीं होते और प्रत्येक नए रीचार्ज के साथ जुड़ते हैं।'),
    },
    {
      q: bi('When are credits deducted from my wallet?', 'मेरे वॉलेट से क्रेडिट कब काटे जाते हैं?'),
      a: bi(
        `Credits are deducted strictly on measurable customer actions: ${whatsappRateLabel} for WhatsApp inbound leads, ${callRateLabel} for connected Exotel phone calls (>= 10s), and ${boostRateLabel} for additional reel feed boosting. All lead actions include an automatic 24-hour deduplication window so you are never double-charged for the same customer.`,
        `क्रेडिट केवल वास्तविक ग्राहक क्रियाओं पर काटे जाते हैं: व्हाट्सएप लीड के लिए ${whatsappRateLabel}, कनेक्टेड कॉल के लिए ${callRateLabel}, और अतिरिक्त रील बूस्टिंग के लिए ${boostRateLabel}। इसमें 24 घंटे की डिडुप सुरक्षा शामिल है जिससे एक ही ग्राहक के बार-बार संपर्क पर कभी दोहरा शुल्क नहीं लगता।`
      ),
    },
    {
      q: bi('Does BizReels take a commission on my sales?', 'क्या BizReels मेरी बिक्री पर कोई कमीशन लेता है?'),
      a: bi('No! BizReels never charges middleman commissions on your sales or closed deals. You deal directly with buyers and retain 100% of your revenue.', 'नहीं! BizReels आपकी बिक्री या सौदों पर कोई बिचौलिया कमीशन नहीं लेता है। आप सीधे ग्राहकों से लेन-देन करते हैं और अपनी 100% कमाई अपने पास रखते हैं।'),
    },
    {
      q: bi('How do I get the Verified Gold Badge for my business?', 'मुझे अपने व्यवसाय के लिए सत्यापित गोल्ड बैज कैसे मिलेगा?'),
      a: bi('Growth and Business recharge packs automatically qualify your account for priority KYC verification. Once your GST, Shop License, or business identity is verified, the Gold Badge displays permanently across all your listings and reels.', 'ग्रोथ और बिजनेस रीचार्ज पैक आपके खाते को प्राथमिकता केवाईसी सत्यापन प्रदान करते हैं। जीएसटी, शॉप लाइसेंस या पहचान सत्यापित होने पर आपकी सभी लिस्टिंग्स और रील्स पर गोल्ड बैज स्थायी रूप से दिखाई देता है।'),
    },
    {
      q: bi('Do unused credits expire at the end of the month?', 'क्या अप्रयुक्त क्रेडिट महीने के अंत में समाप्त हो जाते हैं?'),
      a: bi('No. Vendor credits NEVER expire. Whatever credits you recharge remain in your wallet until drawn down by real customer interactions.', 'नहीं। विक्रेता क्रेडिट कभी समाप्त नहीं होते। आपके द्वारा रीचार्ज किए गए क्रेडिट वास्तविक ग्राहक संपर्कों द्वारा उपयोग किए जाने तक आपके वॉलेट में सुरक्षित रहते हैं।'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f2ede4] font-sans text-[#1a1a1a] pb-20">
      <SEO
        title="Vendor Subscription Recharge Plans — BizReels"
        description="Transparent, commission-free vendor recharge plans. Get non-expiring action credits for WhatsApp leads and Exotel phone calls. Watch. Discover. Connect."
      />

      {/* ════════════════════════════════════════════════════════
          HERO HEADER
      ════════════════════════════════════════════════════════ */}
      <section className="pt-14 pb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d99a3d]/15 border border-[#d99a3d]/30 text-[#1a1a1a] mb-4">
          <HiSparkles className="text-[#d99a3d]" size={14} />
          <span className="text-xs font-black uppercase tracking-wider">
            {bi('VENDOR SUBSCRIPTION & RECHARGE PLANS', 'विक्रेता सदस्यता एवं रीचार्ज योजनाएं')}
          </span>
        </div>

        <h1
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
          className="text-3xl sm:text-5xl lg:text-6xl text-[#1a1a1a] uppercase leading-[1.08] tracking-tight mb-4"
        >
          {bi('FAIR & TRANSPARENT', 'पारदर्शी और सरल')}{' '}
          <span style={{ color: '#d99a3d' }}>{bi('PRICING.', 'मूल्य निर्धारण।')}</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-6">
          {bi(
            'Zero hidden fees, zero commission on sales. Pay only for real customer leads through non-expiring Action Credit recharge packs.',
            'शून्य छिपी हुई फीस, बिक्री पर शून्य कमीशन। नॉन-एक्सपायरिंग एक्शन क्रेडिट रीचार्ज पैक के माध्यम से केवल वास्तविक ग्राहक लीड्स के लिए भुगतान करें।'
          )}
        </p>

        {/* ── Key Value Highlights Row ── */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-black text-[#1a1a1a]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#e3dccb] shadow-2xs">
            <FiClock className="text-[#d99a3d]" />
            {bi('Non-Expiring Credits', 'कभी समाप्त न होने वाले क्रेडिट्स')}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#e3dccb] shadow-2xs">
            <FiShield className="text-emerald-600" />
            {bi('0% Sales Commission', '0% बिक्री कमीशन')}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#e3dccb] shadow-2xs">
            <FiLock className="text-blue-600" />
            {bi('24h Deduplication Protection', '24 घंटे डिडुप सुरक्षा')}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#e3dccb] shadow-2xs">
            <FiPhoneCall className="text-[#25D366]" />
            {bi('WhatsApp & Call Leads', 'व्हाट्सएप एवं कॉल लीड्स')}
          </span>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          PRICING CARDS GRID
      ════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ${
                  plan.popular
                    ? 'bg-[#1c1a17] text-white border-2 border-[#d99a3d] shadow-xl shadow-[#d99a3d]/10'
                    : 'bg-white text-[#1a1a1a] border border-[#e3dccb] shadow-xs'
                }`}
              >
                {/* Popular / Top Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3.5 py-1 bg-[#d99a3d] text-[#1a1a1a] text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Plan Name & Tagline */}
                  <div className="mb-4">
                    <h3
                      style={{ fontFamily: "'Archivo Black', sans-serif" }}
                      className={`text-xl uppercase tracking-tight ${
                        plan.popular ? 'text-white' : 'text-[#1a1a1a]'
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-xs mt-1.5 font-medium leading-relaxed ${
                        plan.popular ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {plan.desc}
                    </p>
                  </div>

                  {/* Price Tag */}
                  <div className="py-4 border-y border-dashed border-[#e3dccb]/40 my-4">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        style={{ fontFamily: "'Archivo Black', sans-serif" }}
                        className={`text-3xl sm:text-4xl uppercase tracking-tight ${
                          plan.popular ? 'text-[#d99a3d]' : 'text-[#1a1a1a]'
                        }`}
                      >
                        {plan.priceLabel}
                      </span>
                    </div>
                    {plan.billedNote && (
                      <span
                        className={`text-[11px] font-semibold mt-1 block ${
                          plan.popular ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {plan.billedNote}
                      </span>
                    )}
                  </div>

                  {/* Feature List */}
                  <div className="space-y-3 pt-2">
                    <p
                      className={`text-[11px] font-extrabold uppercase tracking-wider ${
                        plan.popular ? 'text-[#d99a3d]' : 'text-slate-400'
                      }`}
                    >
                      {bi("What's Included:", 'शामिल विशेषताएं:')}
                    </p>
                    {plan.features.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        {f.included ? (
                          <div
                            className={`p-0.5 rounded-full mt-0.5 flex-shrink-0 ${
                              f.highlight
                                ? 'bg-amber-400 text-[#1a1a1a]'
                                : plan.popular
                                ? 'bg-[#d99a3d]/20 text-[#d99a3d]'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            <FiCheck className="w-3.5 h-3.5 font-black" />
                          </div>
                        ) : (
                          <div className="p-0.5 rounded-full mt-0.5 flex-shrink-0 bg-slate-100 text-slate-400">
                            <FiX className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span
                          className={`font-medium ${
                            f.highlight
                              ? plan.popular
                                ? 'text-[#d99a3d] font-black'
                                : 'text-amber-900 font-extrabold'
                              : f.included
                              ? plan.popular
                                ? 'text-slate-200'
                                : 'text-slate-700'
                              : 'text-slate-400 line-through opacity-75'
                          }`}
                        >
                          {f.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA Button */}
                <div className="pt-8 mt-auto">
                  <Link
                    to={plan.ctaLink}
                    className={`w-full py-3.5 px-4 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all no-underline ${
                      plan.popular
                        ? 'bg-[#d99a3d] hover:bg-[#c48729] text-[#1c1a17] shadow-md'
                        : 'bg-[#1c1a17] hover:bg-[#2c2824] text-[#d99a3d]'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CREATOR CALLOUT BANNER (BizReels is 100% Free for Creators)
      ════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-gradient-to-r from-[#1c1a17] via-[#26231e] to-[#1c1a17] rounded-3xl p-6 sm:p-8 border border-[#d99a3d]/30 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#d99a3d]/20 border border-[#d99a3d]/40 flex items-center justify-center text-[#d99a3d] shrink-0">
              <FiVideo className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1">
                {bi('100% Free for Content Creators', 'कंटेंट क्रिएटर्स के लिए 100% मुफ़्त')}
              </div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-lg sm:text-xl uppercase tracking-tight text-white">
                {bi('Are you a Video Creator or Influencer?', 'क्या आप वीडियो क्रिएटर या इन्फ्लुएंसर हैं?')}
              </h3>
              <p className="text-xs text-slate-300 font-medium max-w-xl mt-1 leading-relaxed">
                {bi(
                  'BizReels has no subscription fees for content creators! Upload video reels, build your commercial portfolio, get hired by local businesses for shoots, and keep 100% of your earnings.',
                  'BizReels पर क्रिएटर्स के लिए कोई सब्सक्रिप्शन फीस नहीं है! रील्स अपलोड करें, अपना पोर्टफोलियो बनाएं, स्थानीय व्यवसायों से शूट हायरिंग प्राप्त करें और अपनी 100% कमाई रखें।'
                )}
              </p>
            </div>
          </div>
          <Link
            to="/auth/register?role=creator"
            className="px-6 py-3 rounded-full bg-[#d99a3d] hover:bg-[#c48729] text-[#1c1a17] text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all shadow-md no-underline"
          >
            <span>{bi('Join Free as Creator', 'क्रिएटर के रूप में मुफ़्त जुड़ें')}</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          PAY-AS-YOU-GO / CREDIT ACTION RATES REFERENCE
      ════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#e3dccb] shadow-xs">
          <div className="max-w-2xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d99a3d]/15 text-[#1a1a1a] rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-2">
              <FiZap className="text-[#d99a3d]" />
              {bi('Transparent Action Rates', 'पारदर्शी एक्शन दरें')}
            </div>
            <h2
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
              className="text-2xl sm:text-3xl text-[#1a1a1a] uppercase tracking-tight"
            >
              {bi('Measurable Action Deductions', 'स्पष्ट और निश्चित क्रेडिट कटौती')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {bi(
                'Credits are only deducted when a customer takes high-intent actions to reach your business. Protected with a 24-hour deduplication window.',
                'क्रेडिट केवल तभी काटे जाते हैं जब कोई ग्राहक आपके व्यवसाय से संपर्क करने के लिए वास्तविक कदम उठाता है। 24 घंटे की डिडुप सुरक्षा के साथ।'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {creditAddons.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#f8f4ec] border border-[#e3dccb] flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#1c1a17] text-[#d99a3d] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      style={{ fontFamily: "'Archivo Black', sans-serif" }}
                      className="text-lg text-[#1a1a1a]"
                    >
                      {item.price}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#1a1a1a] tracking-tight">{item.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                  <Link
                    to="/vendor/wallet?tab=plans"
                    className="text-[11px] font-extrabold uppercase tracking-wider text-[#d99a3d] hover:underline flex items-center gap-1 mt-1"
                  >
                    <span>{bi('Recharge in Dashboard', 'डैशबोर्ड में रीचार्ज करें')}</span>
                    <FiArrowRight size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURE COMPARISON MATRIX
      ════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
            className="text-2xl sm:text-3xl text-[#1a1a1a] uppercase tracking-tight"
          >
            {bi('DETAILED FEATURE COMPARISON', 'विस्तृत फीचर तुलना')}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {bi('Compare all vendor recharge packs side-by-side to choose the right power for your business.', 'अपने व्यवसाय के लिए सही रीचार्ज पैक चुनने के लिए सुविधाओं की तुलना करें।')}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#e3dccb] shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-[#e3dccb] bg-[#f8f4ec]">
                <th className="p-4 sm:p-5 font-black uppercase tracking-wider text-slate-600">
                  {bi('Feature / Capability', 'सुविधा / क्षमता')}
                </th>
                <th className="p-4 sm:p-5 font-black uppercase tracking-wider text-slate-600 text-center">
                  {bi('Starter Pack (₹499)', 'स्टार्टर पैक (₹499)')}
                </th>
                <th className="p-4 sm:p-5 font-black uppercase tracking-wider text-[#d99a3d] text-center bg-[#1c1a17]">
                  {bi('Growth Pack (₹1,199)', 'ग्रोथ पैक (₹1,199)')}
                </th>
                <th className="p-4 sm:p-5 font-black uppercase tracking-wider text-slate-600 text-center">
                  {bi('Business Pack (₹2,199)', 'बिजनेस पैक (₹2,199)')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dccb]/60">
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('Action Credits Included', 'एक्शन क्रेडिट शामिल')}</td>
                <td className="p-4 text-center font-extrabold text-amber-700">599 Credits</td>
                <td className="p-4 text-center font-black text-amber-800 bg-[#fdfaf3]">1,599 Credits</td>
                <td className="p-4 text-center font-black text-amber-900">2,999 Credits</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('Free Reel Boosts Included', 'मुफ़्त रील बूस्ट शामिल')}</td>
                <td className="p-4 text-center font-bold text-emerald-700">1 Free Boost</td>
                <td className="p-4 text-center font-extrabold text-emerald-800 bg-[#fdfaf3]">3 Free Boosts</td>
                <td className="p-4 text-center font-black text-emerald-900">5 Free Boosts</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('Credit Validity', 'क्रेडिट वैधता')}</td>
                <td className="p-4 text-center font-bold text-emerald-700">Non-Expiring ✓</td>
                <td className="p-4 text-center font-bold text-emerald-700 bg-[#fdfaf3]">Non-Expiring ✓</td>
                <td className="p-4 text-center font-bold text-emerald-700">Non-Expiring ✓</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('WhatsApp Lead Tracking & CRM', 'व्हाट्सएप लीड ट्रैकिंग एवं सीआरएम')}</td>
                <td className="p-4 text-center text-emerald-600 font-bold">✓ (2.50 Cr/lead)</td>
                <td className="p-4 text-center text-emerald-600 font-bold bg-[#fdfaf3]">✓ (2.50 Cr/lead)</td>
                <td className="p-4 text-center text-emerald-600 font-bold">✓ (2.50 Cr/lead)</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('Exotel Click-to-Call Telephony', 'एक्सोटेल क्लिक-टू-कॉल टेलीफोनी')}</td>
                <td className="p-4 text-center text-emerald-600 font-bold">✓ (2.50 Cr/call)</td>
                <td className="p-4 text-center text-emerald-600 font-bold bg-[#fdfaf3]">✓ (2.50 Cr/call)</td>
                <td className="p-4 text-center text-emerald-600 font-bold">✓ (2.50 Cr/call)</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('Verified Gold Merchant Badge', 'सत्यापित गोल्ड मर्चेंट बैज')}</td>
                <td className="p-4 text-center text-slate-300">—</td>
                <td className="p-4 text-center text-emerald-600 font-bold bg-[#fdfaf3]">✓ Gold Badge</td>
                <td className="p-4 text-center text-emerald-600 font-bold">✓ VIP Gold Badge</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('Local Discovery & Reel Placement', 'लोकल डिस्कवरी व रील प्लेसमेंट')}</td>
                <td className="p-4 text-center font-medium text-slate-500">Standard Placement</td>
                <td className="p-4 text-center font-bold text-[#d99a3d] bg-[#fdfaf3]">High Priority (Top 3)</td>
                <td className="p-4 text-center font-bold text-[#d99a3d]">Supreme Priority (Tier 1)</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('Sales Commission', 'बिक्री कमीशन')}</td>
                <td className="p-4 text-center font-bold text-emerald-700">0% Always</td>
                <td className="p-4 text-center font-bold text-emerald-700 bg-[#fdfaf3]">0% Always</td>
                <td className="p-4 text-center font-bold text-emerald-700">0% Always</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FREQUENTLY ASKED QUESTIONS (FAQ)
      ════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d99a3d]/15 text-[#1a1a1a] rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-2">
            <FiHelpCircle className="text-[#d99a3d]" />
            {bi('GOT QUESTIONS?', 'कोई सवाल है?')}
          </div>
          <h2
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
            className="text-2xl sm:text-3xl text-[#1a1a1a] uppercase tracking-tight"
          >
            {bi('FREQUENTLY ASKED QUESTIONS', 'अक्सर पूछे जाने वाले सवाल')}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#e3dccb] overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 flex items-center justify-between text-left cursor-pointer border-none bg-transparent hover:bg-[#f8f4ec]/50 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-extrabold text-[#1a1a1a]">{faq.q}</span>
                  <FiChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 flex-shrink-0 ml-3 ${
                      isOpen ? 'rotate-180 text-[#d99a3d]' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-600 font-medium leading-relaxed border-t border-[#e3dccb]/40">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          BOTTOM CALL TO ACTION BANNER
      ════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-[#1c1a17] rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden border border-[#3a3630]">
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <h2
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
              className="text-2xl sm:text-4xl uppercase tracking-tight text-white leading-tight mb-3"
            >
              {bi('READY TO SCALE YOUR LOCAL REACH?', 'अपनी स्थानीय पहुंच बढ़ाने के लिए तैयार हैं?')}
            </h2>
            <p className="text-xs sm:text-sm text-[#c9c4bb] font-medium mb-8 max-w-lg">
              {bi(
                'Join thousands of merchants, local shops, and service businesses closing profitable customer deals on BizReels today.',
                'आज ही BizReels पर लाभदायक ग्राहक सौदे करने वाले हजारों व्यापारियों, दुकानों और सेवा व्यवसायों से जुड़ें।'
              )}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              <Link
                to="/auth/register?role=vendor"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#d99a3d] hover:bg-[#c48729] text-[#1a1a1a] rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all no-underline"
              >
                <span>{bi('Register as Vendor', 'विक्रेता के रूप में जुड़ें')}</span>
                <FiArrowRight size={14} />
              </Link>
              <Link
                to="/auth/register?role=creator"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#2c2824] hover:bg-[#3d3832] text-[#f2ede4] border border-[#4a453e] rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all no-underline"
              >
                <span>{bi('Join as Creator (100% Free)', 'क्रिएटर के रूप में जुड़ें (100% मुफ़्त)')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
