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
  FiTrendingUp,
  FiAward,
  FiPhoneCall,
  FiChevronDown,
  FiPercent,
  FiUsers,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import SEO from '../../components/common/SEO';
import { useLanguage } from '../../context/LanguageContext';

export default function Pricing() {
  const navigate = useNavigate();
  const { bi, lang } = useLanguage();

  const [activeTab, setActiveTab] = useState('vendor'); // 'vendor' | 'creator'
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const isYearly = billingCycle === 'yearly';

  // Vendor Plans Data
  const vendorPlans = [
    {
      id: 'vendor_starter',
      name: bi('Free Starter', 'फ्री स्टार्टर'),
      badge: null,
      desc: bi('Essential tools for new vendors getting started on visual commerce.', 'विजुअल कॉमर्स की शुरुआत करने वाले नए विक्रेताओं के लिए आवश्यक टूल्स।'),
      priceMonthly: 0,
      priceYearly: 0,
      priceLabel: bi('₹0 / month', '₹0 / महीना'),
      popular: false,
      ctaText: bi('Get Started Free', 'मुफ़्त में शुरू करें'),
      ctaLink: '/auth/register?role=vendor',
      features: [
        { title: bi('Up to 5 Product / Service Listings', '5 उत्पादों / सेवाओं तक की लिस्टिंग'), included: true },
        { title: bi('2 Active Video Reels', '2 सक्रिय वीडियो रील्स'), included: true },
        { title: bi('Direct Customer Chat & Inquiries', 'सीधा ग्राहक चैट एवं पूछताछ'), included: true },
        { title: bi('Standard Local Search Placement', 'मानक स्थानीय खोज प्लेसमेंट'), included: true },
        { title: bi('Standard Dashboard Analytics', 'मानक डैशबोर्ड एनालिटिक्स'), included: true },
        { title: bi('Verified Gold Seller Badge', 'सत्यापित गोल्ड सेलर बैज'), included: false },
        { title: bi('Instant WhatsApp Lead Alerts', 'इंस्टेंट व्हाट्सएप लीड अलर्ट'), included: false },
        { title: bi('AI Product Description Generator', 'एआई उत्पाद विवरण जनरेटर'), included: false },
        { title: bi('Priority City-wide Ranking', 'शहर स्तर पर प्राथमिकता रैंकिंग'), included: false },
      ],
    },
    {
      id: 'vendor_pro',
      name: bi('Growth Pro', 'ग्रोथ प्रो'),
      badge: bi('MOST POPULAR', 'सर्वाधिक लोकप्रिय'),
      desc: bi('For growing businesses that want maximum customer reach and instant leads.', 'अधिकतम ग्राहक पहुंच और त्वरित लीड चाहने वाले बढ़ते व्यवसायों के लिए।'),
      priceMonthly: 999,
      priceYearly: 799,
      priceLabel: isYearly ? bi('₹799 / month', '₹799 / महीना') : bi('₹999 / month', '₹999 / महीना'),
      billedNote: isYearly ? bi('Billed annually (₹9,588/yr)', 'वार्षिक बिल (₹9,588/वर्ष)') : bi('Billed monthly', 'मासिक बिल'),
      popular: true,
      ctaText: bi('Start Pro Trial', 'प्रो ट्रायल शुरू करें'),
      ctaLink: '/auth/register?role=vendor',
      features: [
        { title: bi('Unlimited Product & Service Listings', 'असीमित उत्पाद और सेवा लिस्टिंग'), included: true },
        { title: bi('Unlimited Video Reels & Spotlights', 'असीमित वीडियो रील्स और स्पॉटलाइट्स'), included: true },
        { title: bi('Verified Gold Seller Badge ✓', 'सत्यापित गोल्ड सेलर बैज ✓'), included: true },
        { title: bi('Priority Search & Category Ranking', 'प्राथमिकता खोज और श्रेणी रैंकिंग'), included: true },
        { title: bi('Instant WhatsApp & SMS Lead Alerts', 'त्वरित व्हाट्सएप और एसएमएस लीड अलर्ट'), included: true },
        { title: bi('50 Monthly AI Assistant Credits', '50 मासिक एआई सहायक क्रेडिट्स'), included: true },
        { title: bi('Advanced Buyer Insights & Analytics', 'उन्नत खरीदार अंतर्दृष्टि और एनालिटिक्स'), included: true },
        { title: bi('Commission-Free Direct Deals', 'कमीशन-मुक्त सीधे सौदे'), included: true },
        { title: bi('Dedicated Account Manager', 'समर्पित खाता प्रबंधक'), included: false },
      ],
    },
    {
      id: 'vendor_enterprise',
      name: bi('Enterprise Elite', 'एंटरप्राइज एलीट'),
      badge: bi('MAXIMUM IMPACT', 'अधिकतम प्रभाव'),
      desc: bi('Top-tier power for established brands, distributors & high-volume shops.', 'स्थापित ब्रांडों, वितरकों और उच्च-मात्रा वाली दुकानों के लिए शीर्ष स्तरीय प्लान।'),
      priceMonthly: 2499,
      priceYearly: 1999,
      priceLabel: isYearly ? bi('₹1,999 / month', '₹1,999 / महीना') : bi('₹2,499 / month', '₹2,499 / महीना'),
      billedNote: isYearly ? bi('Billed annually (₹23,988/yr)', 'वार्षिक बिल (₹23,988/वर्ष)') : bi('Billed monthly', 'मासिक बिल'),
      popular: false,
      ctaText: bi('Get Enterprise Access', 'एंटरप्राइज एक्सेस प्राप्त करें'),
      ctaLink: '/auth/register?role=vendor',
      features: [
        { title: bi('Everything in Growth Pro', 'ग्रोथ प्रो की सभी सुविधाएं शामिल'), included: true },
        { title: bi('Featured Homepage & Discovery Spotlight', 'होमपेज और डिस्कवरी पर विशेष स्थान'), included: true },
        { title: bi('Top City-Wide Search Tier Placement', 'पूरे शहर में शीर्ष सर्च टियर प्लेसमेंट'), included: true },
        { title: bi('200 Monthly AI Assistant Credits', '200 मासिक एआई सहायक क्रेडिट्स'), included: true },
        { title: bi('VIP 24/7 Dedicated Account Manager', 'वीआईपी 24/7 समर्पित खाता प्रबंधक'), included: true },
        { title: bi('Custom Brand Landing Page URL', 'कस्टम ब्रांड लैंडिंग पेज यूआरएल'), included: true },
        { title: bi('Direct Creator Collaboration Discounts', 'क्रिएटर सहयोग पर विशेष छूट'), included: true },
        { title: bi('Multi-Branch & Staff Logins Support', 'मल्टी-ब्रांच और स्टाफ लॉगिन समर्थन'), included: true },
        { title: bi('Zero Platform Commission Always', 'हमेशा शून्य प्लेटफॉर्म कमीशन'), included: true },
      ],
    },
  ];

  // Creator Plans Data
  const creatorPlans = [
    {
      id: 'creator_starter',
      name: bi('Free Creator', 'फ्री क्रिएटर'),
      badge: null,
      desc: bi('Showcase your creative work and receive organic client inquiries.', 'अपना रचनात्मक कार्य प्रदर्शित करें और ऑर्गेनिक क्लाइंट पूछताछ प्राप्त करें।'),
      priceMonthly: 0,
      priceYearly: 0,
      priceLabel: bi('₹0 / month', '₹0 / महीना'),
      popular: false,
      ctaText: bi('Join as Creator', 'क्रिएटर के रूप में जुड़ें'),
      ctaLink: '/auth/register?role=creator',
      features: [
        { title: bi('Portfolio Showcase (up to 10 clips)', 'पोर्टफोलियो शोकेस (10 क्लिप तक)'), included: true },
        { title: bi('Direct Messages from Local Businesses', 'स्थानीय व्यवसायों से सीधे संदेश'), included: true },
        { title: bi('Standard Creator Profile in Directory', 'डायरेक्टरी में मानक क्रिएटर प्रोफ़ाइल'), included: true },
        { title: bi('Basic Earnings Analytics', 'मूल कमाई एनालिटिक्स'), included: true },
        { title: bi('Verified Creator Badge', 'सत्यापित क्रिएटर बैज'), included: false },
        { title: bi('Priority Placement in Marketplace', 'मार्केटप्लेस में प्राथमिकता प्लेसमेंट'), included: false },
        { title: bi('Escrow Instant Payout Guarantee', 'एस्क्रो इंस्टेंट भुगतान गारंटी'), included: false },
        { title: bi('0% Platform Commission Fee', '0% प्लेटफॉर्म कमीशन शुल्क'), included: false },
      ],
    },
    {
      id: 'creator_pro',
      name: bi('Pro Influencer', 'प्रो इन्फ्लुएंसर'),
      badge: bi('RECOMMENDED', 'अनुशंसित'),
      desc: bi('For creators ready to land high-paying local business brand deals.', 'उच्च-भुगतान वाले स्थानीय बिजनेस ब्रांड सौदे प्राप्त करने के इच्छुक क्रिएटर्स के लिए।'),
      priceMonthly: 499,
      priceYearly: 399,
      priceLabel: isYearly ? bi('₹399 / month', '₹399 / महीना') : bi('₹499 / month', '₹499 / महीना'),
      billedNote: isYearly ? bi('Billed annually (₹4,788/yr)', 'वार्षिक बिल (₹4,788/वर्ष)') : bi('Billed monthly', 'मासिक बिल'),
      popular: true,
      ctaText: bi('Upgrade to Creator Pro', 'क्रिएटर प्रो में अपग्रेड करें'),
      ctaLink: '/auth/register?role=creator',
      features: [
        { title: bi('Unlimited 4K Portfolio & Reel Showcase', 'असीमित 4K पोर्टफोलियो और रील शोकेस'), included: true },
        { title: bi('Official Verified Blue Creator Badge ✓', 'आधिकारिक सत्यापित ब्लू क्रिएटर बैज ✓'), included: true },
        { title: bi('Priority Placement in Creator Discovery', 'क्रिएटर खोज में प्राथमिकता प्लेसमेंट'), included: true },
        { title: bi('Direct Shoot Hiring Requests & Quotes', 'सीधे शूट हायरिंग अनुरोध और कोट्स'), included: true },
        { title: bi('0% Platform Service Fee on Deals', 'सौदों पर 0% प्लेटफॉर्म सेवा शुल्क'), included: true },
        { title: bi('Instant Escrow Payout Processing', 'त्वरित एस्क्रो भुगतान प्रसंस्करण'), included: true },
        { title: bi('Custom Pricing Packages Setup', 'कस्टम मूल्य निर्धारण पैकेज सेटअप'), included: true },
        { title: bi('Comprehensive Engagement Analytics', 'व्यापक सहभागिता एनालिटिक्स'), included: true },
      ],
    },
    {
      id: 'creator_studio',
      name: bi('Studio Legend', 'स्टूडियो लीजेंड'),
      badge: bi('FOR AGENCIES & PROS', 'एजेंसियों और प्रोफेशनल्स के लिए'),
      desc: bi('Designed for production studios, video directors and agency teams.', 'प्रोडक्शन स्टूडियो, वीडियो निर्देशकों और एजेंसी टीमों के लिए तैयार किया गया।'),
      priceMonthly: 1499,
      priceYearly: 1199,
      priceLabel: isYearly ? bi('₹1,199 / month', '₹1,199 / महीना') : bi('₹1,499 / month', '₹1,499 / महीना'),
      billedNote: isYearly ? bi('Billed annually (₹14,388/yr)', 'वार्षिक बिल (₹14,388/वर्ष)') : bi('Billed monthly', 'मासिक बिल'),
      popular: false,
      ctaText: bi('Join Studio Tier', 'स्टूडियो टियर से जुड़ें'),
      ctaLink: '/auth/register?role=creator',
      features: [
        { title: bi('Everything in Pro Influencer', 'प्रो इन्फ्लुएंसर की सभी सुविधाएं शामिल'), included: true },
        { title: bi('Top VIP Billboard Spotlight in Creator Hub', 'क्रिएटर हब में शीर्ष वीआईपी बिलबोर्ड स्पॉटलाइट'), included: true },
        { title: bi('Multi-Crew Agency Profile Management', 'मल्टी-क्रू एजेंसी प्रोफाइल प्रबंधन'), included: true },
        { title: bi('Direct Access to High-Ticket Requirements', 'हाई-टिकट प्रोजेक्ट आवश्यकताओं तक सीधी पहुंच'), included: true },
        { title: bi('Dedicated Brand Relationship Manager', 'समर्पित ब्रांड संबंध प्रबंधक'), included: true },
        { title: bi('Contract Protection & Legal Invoicing Tools', 'अनुबंध सुरक्षा और कानूनी इनवॉइसिंग टूल्स'), included: true },
        { title: bi('VIP Payout Processing under 2 Hours', '2 घंटे के भीतर वीआईपी भुगतान प्रक्रिया'), included: true },
      ],
    },
  ];

  // Credit Add-ons
  const creditAddons = [
    {
      title: bi('Local Listing Boost Token', 'लोकल लिस्टिंग बूस्ट टोकन'),
      price: '₹299',
      desc: bi('Push your listing to the top of your city feed for 7 days. Gain 5x more views.', '7 दिनों के लिए अपनी लिस्टिंग को शहर के शीर्ष पर ले जाएं। 5 गुना अधिक व्यूज प्राप्त करें।'),
      icon: FiZap,
    },
    {
      title: bi('High-Intent Lead Pack (20 Leads)', 'हाई-इंटेंट लीड पैक (20 लीड्स)'),
      price: '₹499',
      desc: bi('Instant unlocked contact numbers & requirement specs from verified buyers.', 'सत्यापित खरीदारों के फोन नंबर और विस्तृत आवश्यकताएं अनलॉक करें।'),
      icon: FiPhoneCall,
    },
    {
      title: bi('Creator Hire Token', 'क्रिएटर हायर टोकन'),
      price: '₹199',
      desc: bi('Send direct shoot requests and contract briefs to top-ranked video creators.', 'शीर्ष रैंक वाले वीडियो क्रिएटर्स को सीधे शूट अनुरोध और ब्रीफ भेजें।'),
      icon: FiVideo,
    },
  ];

  // FAQs
  const faqs = [
    {
      q: bi('Can I start for free without entering credit card details?', 'क्या मैं क्रेडिट कार्ड दर्ज किए बिना मुफ़्त में शुरुआत कर सकता हूँ?'),
      a: bi('Yes! BizReels offers a lifetime Free Starter plan for both vendors and creators. You can register, list products, post reels, and receive customer inquiries without paying a single rupee.', 'हाँ! BizReels विक्रेताओं और क्रिएटर्स दोनों के लिए लाइफटाइम फ्री स्टार्टर प्लान प्रदान करता है। आप बिना एक भी रुपया दिए पंजीकरण कर सकते हैं, उत्पाद लिस्ट कर सकते हैं और पूछताछ प्राप्त कर सकते हैं।'),
    },
    {
      q: bi('How do subscriptions and renewals work?', 'सदस्यता और नवीनीकरण कैसे काम करता है?'),
      a: bi('Subscriptions can be paid monthly or annually via UPI, Debit/Credit Cards, NetBanking, or Wallet. You can cancel or switch plans at any time from your settings with zero penalty.', 'सब्सक्रिप्शन का भुगतान यूपीआई, डेबिट/क्रेडिट कार्ड, नेटबैंकिंग या वॉलेट के माध्यम से किया जा सकता है। आप बिना किसी पेनल्टी के कभी भी प्लान रद्द या बदल सकते हैं।'),
    },
    {
      q: bi('Does BizReels take a commission on my sales?', 'क्या BizReels मेरी बिक्री पर कोई कमीशन लेता है?'),
      a: bi('No! BizReels does not charge any middleman commission on vendor deals. You negotiate directly with your buyers and keep 100% of your earnings.', 'नहीं! BizReels विक्रेता सौदों पर कोई बिचौलिया कमीशन नहीं लेता है। आप सीधे अपने खरीदारों से बातचीत करते हैं और अपनी 100% कमाई अपने पास रखते हैं।'),
    },
    {
      q: bi('How do I get the Verified Gold Badge for my business?', 'मुझे अपने व्यवसाय के लिए सत्यापित गोल्ड बैज कैसे मिलेगा?'),
      a: bi('Growth Pro and Enterprise Elite members automatically get expedited KYC review. Once your GST, Shop License, or identity document is approved, the Gold Badge displays instantly across all your listings.', 'ग्रोथ प्रो और एंटरप्राइज सदस्यों को त्वरित केवाईसी समीक्षा मिलती है। जीएसटी, शॉप लाइसेंस या आईडी स्वीकृत होने पर गोल्ड बैज तुरंत प्रदर्शित हो जाता है।'),
    },
    {
      q: bi('What is the difference between Monthly and Annual plans?', 'मासिक और वार्षिक प्लान में क्या अंतर है?'),
      a: bi('Annual billing gives you a flat 20% discount across all paid tiers. You get continuous premium ranking, uninterrupted AI assistant credits, and significant cost savings.', 'वार्षिक बिलिंग आपको सभी सशुल्क टियर पर 20% की सीधी छूट देती है। आपको निरंतर प्रीमियम रैंकिंग, निर्बाध एआई क्रेडिट और बड़ी बचत मिलती है।'),
    },
  ];

  const currentPlans = activeTab === 'vendor' ? vendorPlans : creatorPlans;

  return (
    <div className="min-h-screen bg-[#f2ede4] font-sans text-[#1a1a1a] pb-20">
      <SEO
        title="Transparent Pricing Plans — BizReels"
        description="Simple, transparent, commission-free pricing plans for local businesses, shops, and content creators. Watch. Discover. Connect."
      />

      {/* ════════════════════════════════════════════════════════
          HERO HEADER
      ════════════════════════════════════════════════════════ */}
      <section className="pt-14 pb-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d99a3d]/15 border border-[#d99a3d]/30 text-[#1a1a1a] mb-5">
          <HiSparkles className="text-[#d99a3d]" size={14} />
          <span className="text-xs font-black uppercase tracking-wider">
            {bi('WATCH. DISCOVER. CONNECT.', 'वॉच. डिस्कवर. कनेक्ट.')}
          </span>
        </div>

        <h1
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
          className="text-3xl sm:text-5xl lg:text-6xl text-[#1a1a1a] uppercase leading-[1.08] tracking-tight mb-4"
        >
          {bi('FAIR & TRANSPARENT', 'पारदर्शी और सरल')}{' '}
          <span style={{ color: '#d99a3d' }}>{bi('PRICING.', 'मूल्य निर्धारण।')}</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-8">
          {bi(
            'Zero hidden fees, zero commission on sales. Choose the perfect plan to scale your local commerce presence and customer connections.',
            'शून्य छिपी हुई फीस, बिक्री पर शून्य कमीशन। अपनी स्थानीय कॉमर्स उपस्थिति और ग्राहक संपर्कों को बढ़ाने के लिए सही प्लान चुनें।'
          )}
        </p>

        {/* ── Audience Role Switcher (Vendor vs Creator) ── */}
        <div className="inline-flex p-1.5 bg-white rounded-2xl border border-[#e3dccb] shadow-xs gap-1.5 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('vendor')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border-none ${
              activeTab === 'vendor'
                ? 'bg-[#1c1a17] text-[#d99a3d] shadow-xs'
                : 'bg-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FiShoppingBag className="w-4 h-4" />
            <span>{bi('Vendors & Merchants', 'विक्रेता एवं व्यापारी')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('creator')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border-none ${
              activeTab === 'creator'
                ? 'bg-[#1c1a17] text-[#d99a3d] shadow-xs'
                : 'bg-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FiVideo className="w-4 h-4" />
            <span>{bi('Content Creators', 'कंटेंट क्रिएटर्स')}</span>
          </button>
        </div>

        {/* ── Monthly / Yearly Billing Toggle ── */}
        <div className="flex items-center justify-center gap-3 text-xs font-extrabold text-slate-700">
          <span className={billingCycle === 'monthly' ? 'text-[#1a1a1a]' : 'text-slate-400'}>
            {bi('Monthly Billing', 'मासिक बिलिंग')}
          </span>
          <button
            type="button"
            onClick={() => setBillingCycle(isYearly ? 'monthly' : 'yearly')}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer border-none ${
              isYearly ? 'bg-[#d99a3d]' : 'bg-slate-300'
            }`}
            aria-label="Toggle Billing Frequency"
          >
            <motion.div
              className="bg-white w-4 h-4 rounded-full shadow-md"
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ marginLeft: isYearly ? 'auto' : '0' }}
            />
          </button>
          <span className={`flex items-center gap-1.5 ${isYearly ? 'text-[#1a1a1a]' : 'text-slate-400'}`}>
            {bi('Annual Billing', 'वार्षिक बिलिंग')}
            <span className="px-2 py-0.5 bg-[#25D366]/20 text-[#128C7E] text-[10px] font-black rounded-full uppercase tracking-widest border border-[#25D366]/30">
              {bi('Save 20%', '20% छूट')}
            </span>
          </span>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          PRICING CARDS GRID
      ════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {currentPlans.map((plan) => {
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
                              plan.popular ? 'bg-[#d99a3d]/20 text-[#d99a3d]' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            <FiCheck className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="p-0.5 rounded-full mt-0.5 flex-shrink-0 bg-slate-100 text-slate-400">
                            <FiX className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span
                          className={`font-medium ${
                            f.included
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
          PAY-AS-YOU-GO / CREDIT ADD-ONS SECTION
      ════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#e3dccb] shadow-xs">
          <div className="max-w-2xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d99a3d]/15 text-[#1a1a1a] rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-2">
              <FiZap className="text-[#d99a3d]" />
              {bi('Pay-As-You-Go Credits', 'पे-एज-यू-गो क्रेडिट्स')}
            </div>
            <h2
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
              className="text-2xl sm:text-3xl text-[#1a1a1a] uppercase tracking-tight"
            >
              {bi('Flexible Add-ons & Boost Packs', 'लचीले ऐड-ऑन और बूस्ट पैक')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {bi(
                'Need extra reach without upgrading your plan? Top-up credits instantly and use them anytime with lifetime validity.',
                'प्लान अपग्रेड किए बिना अतिरिक्त पहुंच चाहिए? तुरंत क्रेडिट टॉप-अप करें और लाइफटाइम वैधता के साथ कभी भी उपयोग करें।'
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
                    to="/auth/register"
                    className="text-[11px] font-extrabold uppercase tracking-wider text-[#d99a3d] hover:underline flex items-center gap-1 mt-1"
                  >
                    <span>{bi('Purchase on Dashboard', 'डैशबोर्ड पर खरीदें')}</span>
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
            {bi('Compare all capabilities side-by-side to make the right choice.', 'सही विकल्प चुनने के लिए सभी क्षमताओं की तुलना करें।')}
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
                  {bi('Free Starter', 'फ्री स्टार्टर')}
                </th>
                <th className="p-4 sm:p-5 font-black uppercase tracking-wider text-[#d99a3d] text-center bg-[#1c1a17]">
                  {bi('Growth Pro', 'ग्रोथ प्रो')}
                </th>
                <th className="p-4 sm:p-5 font-black uppercase tracking-wider text-slate-600 text-center">
                  {bi('Enterprise Elite', 'एंटरप्राइज एलीट')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dccb]/60">
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('Product & Service Listings', 'उत्पाद एवं सेवा लिस्टिंग')}</td>
                <td className="p-4 text-center font-medium text-slate-600">5 Max</td>
                <td className="p-4 text-center font-bold text-[#1a1a1a] bg-[#fdfaf3]">Unlimited</td>
                <td className="p-4 text-center font-bold text-[#1a1a1a]">Unlimited</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('Video Reels Hosting', 'वीडियो रील्स होस्टिंग')}</td>
                <td className="p-4 text-center font-medium text-slate-600">2 Active</td>
                <td className="p-4 text-center font-bold text-[#1a1a1a] bg-[#fdfaf3]">Unlimited</td>
                <td className="p-4 text-center font-bold text-[#1a1a1a]">Unlimited</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('Direct Customer Chat CRM', 'डायरेक्ट ग्राहक चैट सीआरएम')}</td>
                <td className="p-4 text-center text-emerald-600 font-bold">✓</td>
                <td className="p-4 text-center text-emerald-600 font-bold bg-[#fdfaf3]">✓</td>
                <td className="p-4 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('Verified Gold Merchant Badge', 'सत्यापित गोल्ड मर्चेंट बैज')}</td>
                <td className="p-4 text-center text-slate-300">—</td>
                <td className="p-4 text-center text-emerald-600 font-bold bg-[#fdfaf3]">✓ Gold Badge</td>
                <td className="p-4 text-center text-emerald-600 font-bold">✓ VIP Badge</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('City Search Ranking Priority', 'सिटी सर्च रैंकिंग प्राथमिकता')}</td>
                <td className="p-4 text-center font-medium text-slate-500">Standard</td>
                <td className="p-4 text-center font-bold text-[#d99a3d] bg-[#fdfaf3]">High (Top 3)</td>
                <td className="p-4 text-center font-bold text-[#d99a3d]">Supreme (Tier 1)</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('Instant WhatsApp Lead Notifications', 'इंस्टेंट व्हाट्सएप लीड सूचनाएं')}</td>
                <td className="p-4 text-center text-slate-300">—</td>
                <td className="p-4 text-center text-emerald-600 font-bold bg-[#fdfaf3]">✓ Instant</td>
                <td className="p-4 text-center text-emerald-600 font-bold">✓ Instant</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('AI Copywriting & Reel Description Credits', 'एआई कॉपीराइटिंग एवं विवरण क्रेडिट्स')}</td>
                <td className="p-4 text-center text-slate-300">—</td>
                <td className="p-4 text-center font-bold text-[#1a1a1a] bg-[#fdfaf3]">50 / mo</td>
                <td className="p-4 text-center font-bold text-[#1a1a1a]">200 / mo</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#1a1a1a]">{bi('Dedicated Account Manager', 'समर्पित खाता प्रबंधक')}</td>
                <td className="p-4 text-center text-slate-300">—</td>
                <td className="p-4 text-center text-slate-300 bg-[#fdfaf3]">—</td>
                <td className="p-4 text-center text-emerald-600 font-bold">✓ 24/7 VIP</td>
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
                'Join thousands of merchants, local service providers, and content creators closing profitable deals on BizReels today.',
                'आज ही BizReels पर लाभदायक सौदे करने वाले हजारों व्यापारियों, सेवा प्रदाताओं और कंटेंट क्रिएटर्स से जुड़ें।'
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
                <span>{bi('Join as Creator', 'क्रिएटर के रूप में जुड़ें')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
