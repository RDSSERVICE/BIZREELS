import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiShield,
  FiLock,
  FiEye,
  FiDatabase,
  FiCreditCard,
  FiMapPin,
  FiVideo,
  FiMessageSquare,
  FiUserCheck,
  FiCheckCircle,
  FiPrinter,
  FiMail,
  FiChevronRight,
  FiSearch,
  FiInfo,
  FiRefreshCw
} from 'react-icons/fi';
import SEO from '../../components/common/SEO';
import { api } from '../../lib/api';

const SECTIONS = [
  {
    id: 'intro',
    title: '1. Introduction & Platform Scope',
    icon: FiInfo,
    content: (
      <div className="space-y-3">
        <p>
          Welcome to <strong>BizReels</strong> (accessible at <a href="https://bizreels.in" className="text-[#d99a3d] font-bold underline">https://bizreels.in</a>). BizReels is India&apos;s first visual reels commerce platform dedicated to empowering local businesses, verified suppliers, visual creators, and consumers through engaging short-form video discovery, direct peer-to-peer deals, and buyer-protected online transactions.
        </p>
        <p>
          This Privacy Policy sets out how BizReels collects, stores, processes, discloses, and protects your personal and business data when you visit our website, install our web applications, create an account, purchase products or services, upload promotional video reels, or engage in vendor-creator collaborations.
        </p>
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-[#d99a3d]/30 text-xs text-[#241b15] font-medium leading-relaxed">
          <strong className="text-[#241b15] font-black block mb-1">Legal Framework Compliance:</strong>
          This document is published in accordance with the provisions of Rule 3(1) of the Information Technology (Intermediaries Guidelines) Rules, 2011, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023 (DPDPA).
        </div>
      </div>
    ),
  },
  {
    id: 'information-collected',
    title: '2. Information We Collect',
    icon: FiDatabase,
    content: (
      <div className="space-y-4">
        <p>
          We collect information that you directly provide to us, information collected automatically via device sensors and interactions, and information generated during commercial transactions:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              For Customers
            </span>
            <h4 className="font-bold text-xs text-[#1a1a1a]">Buyer Profile & Orders</h4>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Full name, mobile number (OTP verified), email.</li>
              <li>Delivery addresses, postal pincode, city.</li>
              <li>Order history, service appointments, booking notes.</li>
              <li>Interactions: liked reels, saved listings, search terms.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              For Vendors
            </span>
            <h4 className="font-bold text-xs text-[#1a1a1a]">Business Profile & Store</h4>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Shop/business name, store physical address, category.</li>
              <li>GSTIN, PAN card, Business proof (for KYC badge).</li>
              <li>Product/service listings, pricing, and video reels.</li>
              <li>Bank account details and UPI VPA for receiving payouts.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">
              For Creators
            </span>
            <h4 className="font-bold text-xs text-[#1a1a1a]">Creator Marketplace</h4>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Portfolio showcase reels and creative specialties.</li>
              <li>Social media handles, follower benchmarks.</li>
              <li>Service packages, commercial shoot rates.</li>
              <li>Payout bank details for campaign compensation.</li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          <strong>Technical & Device Data:</strong> We automatically log your IP address, browser type, operating system version, referring URLs, device identifiers, and platform access timestamps to ensure account security and prevent malicious bot abuse.
        </p>
      </div>
    ),
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Information',
    icon: FiEye,
    content: (
      <div className="space-y-3">
        <p>Your data is processed strictly for legitimate commercial purposes, including:</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
          <li className="p-2.5 rounded-lg bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2">
            <FiCheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={14} />
            <span><strong>Fulfillment:</strong> Delivering products, scheduling service appointments, and generating Shiprocket tracking numbers.</span>
          </li>
          <li className="p-2.5 rounded-lg bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2">
            <FiCheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={14} />
            <span><strong>Hyperlocal Discovery:</strong> Showing relevant reels and verified businesses located near your selected pincode or city.</span>
          </li>
          <li className="p-2.5 rounded-lg bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2">
            <FiCheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={14} />
            <span><strong>Direct Connection:</strong> Enabling buyer-to-vendor direct phone calling, WhatsApp links, and real-time in-app chats.</span>
          </li>
          <li className="p-2.5 rounded-lg bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2">
            <FiCheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={14} />
            <span><strong>Escrow & Payouts:</strong> Safely holding online payments in escrow and executing instant payouts upon completion.</span>
          </li>
          <li className="p-2.5 rounded-lg bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2">
            <FiCheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={14} />
            <span><strong>Creator Collaborations:</strong> Enabling vendors to hire local creators for promotional campaigns with escrow milestone protection.</span>
          </li>
          <li className="p-2.5 rounded-lg bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2">
            <FiCheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={14} />
            <span><strong>Platform Integrity:</strong> KYC verification, AI content moderation, fraud screening, and Trust Score calculations.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'payments-and-escrow',
    title: '4. Payment Processing, Escrow & Automated Refunds',
    icon: FiCreditCard,
    content: (
      <div className="space-y-3.5">
        <p>
          BizReels supports multi-mode payment options designed to balance maximum buyer protection with vendor liquidity:
        </p>

        <div className="space-y-2.5">
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-black text-sm text-blue-900">
              <FiShield className="text-blue-600" />
              <span>Razorpay Payment Gateway & Escrow Protection</span>
            </div>
            <p className="leading-relaxed">
              When you choose <strong>&quot;Pay Online (Razorpay)&quot;</strong>, your payment is processed through Razorpay (a PCI-DSS Level 1 compliant gateway authorized by the Reserve Bank of India). <strong>BizReels never collects, accesses, or stores your Credit/Debit Card numbers, CVV codes, net banking passwords, or UPI MPINs.</strong>
            </p>
            <p className="leading-relaxed">
              Funds are held securely in platform escrow (<code className="font-bold text-blue-800">escrowStatus: &apos;held&apos;</code>) until the seller delivers the product or completes the booked service.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-black text-sm text-emerald-900">
              <FiRefreshCw className="text-emerald-600" />
              <span>100% Automated Instant Refund Guarantee</span>
            </div>
            <p className="leading-relaxed">
              If an online prepaid order is cancelled prior to shipment or rejected by the vendor, our system triggers an automated refund directly via the Razorpay Refund API (<code className="font-bold text-emerald-800">refundMode: &apos;razorpay_gateway&apos;</code>). The money is refunded 100% back to the customer&apos;s source account (UPI, Bank, Card) with <strong>zero deductions from the vendor&apos;s platform wallet balance</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] text-xs text-slate-700 space-y-1.5">
            <div className="font-bold text-xs text-[#1a1a1a]">Direct Peer-to-Peer UPI, Bank &amp; Cash Payments</div>
            <p className="leading-relaxed">
              If you choose Direct Vendor UPI QR, Bank Transfer, or Cash on Delivery (COD), the funds are paid directly to the supplier without platform intermediation. BizReels does not hold or touch offline P2P cash funds.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'location-data',
    title: '5. Location & Geolocation Data (Hyperlocal Discovery)',
    icon: FiMapPin,
    content: (
      <div className="space-y-3">
        <p>
          BizReels is fundamentally built around <strong>hyper-local commerce</strong> to connect buyers with physical stores and nearby creators.
        </p>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>
            <strong>Pincode &amp; City Selection:</strong> You may manually enter or update your preferred pincode or city at any time in the navigation bar to explore offers in that locality.
          </li>
          <li>
            <strong>GPS Coordinates (Optional):</strong> With your explicit browser or mobile device permission, we may access coarse or precise geographic coordinates (<code className="text-slate-800">latitude/longitude</code>) solely to compute proximity distances (e.g. &quot;Within 2.5 km&quot;) and display nearby vendor pins.
          </li>
          <li>
            You can revoke location permissions at any time through your browser or device operating system settings.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'video-reels-ugc',
    title: '6. Video Reels, Media & User Generated Content',
    icon: FiVideo,
    content: (
      <div className="space-y-3">
        <p>
          BizReels allows vendors and verified creators to upload video reels and catalogs showcasing products and services.
        </p>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>
            <strong>Public Visibility:</strong> Videos, captions, and product tags published to public feeds are viewable by all platform visitors and indexed on search engines to maximize supplier visibility.
          </li>
          <li>
            <strong>Media Ownership:</strong> You retain ownership of the original intellectual property of your media. By posting content to BizReels, you grant us a worldwide, non-exclusive license to host, display, stream, and optimize your videos across BizReels discovery channels.
          </li>
          <li>
            <strong>Prohibited Media:</strong> Content violating Indian obscenity laws, depicting violence, containing counterfeit items, or infringing trademark/copyright is subject to instant AI takedown and permanent account termination.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'communication-privacy',
    title: '7. Direct Buyer-Vendor Communication & Leads',
    icon: FiMessageSquare,
    content: (
      <div className="space-y-3">
        <p>
          When you click <strong>&quot;Call Vendor&quot;</strong>, <strong>&quot;Chat on WhatsApp&quot;</strong>, or <strong>&quot;Enquire Now&quot;</strong>:
        </p>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>
            <strong>Direct Communication:</strong> Telephone calls and external WhatsApp interactions occur directly through your device&apos;s native dialer or WhatsApp app, governed by your telecom operator and WhatsApp&apos;s privacy policy.
          </li>
          <li>
            <strong>In-App Chat Threads:</strong> Conversations conducted through the built-in BizReels real-time chat are encrypted in transit via WebSockets/WSS and stored securely to allow seamless chat history review across your devices.
          </li>
          <li>
            <strong>Lead Contact Unlocks:</strong> When a customer submits a public requirement or enquiry, authorized verified vendors may access the contact information strictly for providing quotes on the requested product or service.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'information-sharing',
    title: '8. Information Sharing & Third-Party Disclosures',
    icon: FiUserCheck,
    content: (
      <div className="space-y-3">
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold">
          🛡️ Strict No-Sale Commitment: BizReels NEVER sells, rents, or monetizes your personal data to third-party marketing companies, brokers, or external advertisers.
        </div>
        <p className="text-xs text-slate-600">We share information only in the following necessary circumstances:</p>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>
            <strong>Vendors &amp; Couriers:</strong> When you place an order, your shipping name, delivery address, and phone number are shared with the fulfilling supplier and shipping aggregator (Shiprocket) to complete delivery.
          </li>
          <li>
            <strong>Payment Service Providers:</strong> Necessary transaction and billing amounts are securely passed to Razorpay for processing and automated refunds.
          </li>
          <li>
            <strong>Cloud &amp; Media Infrastructure:</strong> Media assets (reels, images) are hosted and streamed via secure cloud CDNs (Cloudinary / AWS / Cloudflare).
          </li>
          <li>
            <strong>Legal Requirements:</strong> We may disclose data if required to do so by applicable Indian law, court order, or lawful demand by authorized law enforcement agencies.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'data-security',
    title: '9. Data Security & Storage Practices',
    icon: FiLock,
    content: (
      <div className="space-y-3">
        <p>
          We employ enterprise-grade technical, physical, and administrative safeguards to protect your personal and commercial information:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          <div className="p-3 bg-[#faf7f2] border border-[#e3dccb] rounded-xl space-y-1">
            <span className="font-black text-[#1a1a1a] block">🔒 SSL / TLS 1.3 Encryption</span>
            <span>All web traffic between your browser and our servers is strictly encrypted using modern HTTPS and secure WebSockets.</span>
          </div>
          <div className="p-3 bg-[#faf7f2] border border-[#e3dccb] rounded-xl space-y-1">
            <span className="font-black text-[#1a1a1a] block">🛡️ HTTP-Only Secure Cookies</span>
            <span>Authentication sessions and security tokens are stored in tamper-proof, HTTP-only cookies protected against XSS and CSRF attacks.</span>
          </div>
          <div className="p-3 bg-[#faf7f2] border border-[#e3dccb] rounded-xl space-y-1">
            <span className="font-black text-[#1a1a1a] block">💳 PCI-DSS Compliance</span>
            <span>Payment credentials stay within Razorpay&apos;s certified infrastructure and never traverse or reside on BizReels servers.</span>
          </div>
          <div className="p-3 bg-[#faf7f2] border border-[#e3dccb] rounded-xl space-y-1">
            <span className="font-black text-[#1a1a1a] block">📊 Isolated Multi-Role Ledgers</span>
            <span>Customer, vendor, and creator wallet balances are cryptographically isolated in database transactions preventing financial leakage.</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'user-rights',
    title: '10. Your Rights & Privacy Choices (DPDPA 2023)',
    icon: FiUserCheck,
    content: (
      <div className="space-y-3">
        <p>
          Under the Digital Personal Data Protection Act, 2023 (DPDPA) and applicable Indian regulations, you have full ownership and control over your personal data:
        </p>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li><strong>Right to Access:</strong> You can view all profile data, order history, and saved items directly inside your Account Settings.</li>
          <li><strong>Right to Rectification:</strong> You can edit your phone number, delivery address, shop profile, or creator pricing at any time.</li>
          <li><strong>Role Management:</strong> Easily switch between Customer, Vendor, and Creator modes from the unified account switcher without creating multiple accounts.</li>
          <li><strong>Right to Erasure &amp; Deletion:</strong> You may request the permanent deletion of your account and associated personal data by contacting our Privacy Desk or using the Delete Account option in Settings.</li>
          <li><strong>Marketing Opt-Out:</strong> Unsubscribe from promotional email newsletters or notification digests at any time.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'cookies',
    title: '11. Cookie Usage & Tracking Preferences',
    icon: FiDatabase,
    content: (
      <div className="space-y-3">
        <p>
          BizReels uses first-party and essential third-party cookies to remember your login session, save selected pincode filters, and analyze user navigation trends:
        </p>
        <div className="space-y-2 text-xs text-slate-600">
          <p><strong>Essential Cookies:</strong> Required for authentication, security tokens, and maintaining active cart/checkout sessions.</p>
          <p><strong>Preference Cookies:</strong> Store your preferred language (English / Hindi) and recently viewed city or category filters.</p>
          <p><strong>Analytics Cookies:</strong> Help us identify broken pages, reel load latencies, and optimize mobile responsiveness.</p>
        </div>
        <p className="text-xs text-slate-500 italic">
          You can adjust your cookie settings at any time using our Cookie Consent Banner or via your browser&apos;s cookie configuration controls.
        </p>
      </div>
    ),
  },
  {
    id: 'grievance-contact',
    title: '12. Grievance Redressal & Contact Information',
    icon: FiMail,
    content: (
      <div className="space-y-4">
        <p>
          In accordance with Rule 5(9) of the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023, the details of the designated <strong>Grievance Officer</strong> are provided below:
        </p>

        <div className="p-5 rounded-2xl bg-[#241b15] text-white border-2 border-[#241b15] shadow-md space-y-3">
          <div className="flex items-center gap-2 text-[#d99a3d] font-black text-sm uppercase tracking-wider">
            <FiShield size={18} />
            <span>Designated Grievance &amp; Privacy Officer</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-200">
            <div>
              <span className="text-slate-400 block text-[10.5px] uppercase font-bold">Platform Entity:</span>
              <strong className="text-white">BizReels Technologies India</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10.5px] uppercase font-bold">Email for Grievances:</span>
              <a href="mailto:grievance@bizreels.in" className="text-[#d99a3d] hover:underline font-bold">
                grievance@bizreels.in
              </a>
            </div>
            <div>
              <span className="text-slate-400 block text-[10.5px] uppercase font-bold">General Customer Support:</span>
              <a href="mailto:support@bizreels.in" className="text-[#d99a3d] hover:underline font-bold">
                support@bizreels.in
              </a>
            </div>
            <div>
              <span className="text-slate-400 block text-[10.5px] uppercase font-bold">Operating Headquarters:</span>
              <span className="text-white">India</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 border-t border-white/10 pt-2.5">
            <strong>Timelines:</strong> All complaints, notices, or data inquiries received by our Grievance Desk will be acknowledged within <strong>48 hours</strong> and resolved within <strong>30 days</strong> of receipt in compliance with Indian IT Rules.
          </p>
        </div>
      </div>
    ),
  },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('intro');
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicCms, setDynamicCms] = useState(null);

  // Attempt to fetch dynamic CMS overrides from backend if admin configured custom text
  useEffect(() => {
    let isMounted = true;
    api.get('/v1/cms/privacy-policy')
      .then((res) => {
        if (isMounted && res.data?.data?.content) {
          setDynamicCms(res.data.data);
        }
      })
      .catch(() => {
        // Graceful fallback to rich built-in policy
      });
    return () => { isMounted = false; };
  }, []);

  const scrollTo = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredSections = searchQuery.trim()
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SECTIONS;

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Privacy Policy — BizReels',
      'url': 'https://bizreels.in/privacy-policy',
      'description': 'Official Privacy Policy of BizReels detailing data collection, escrow payments, automated Razorpay refunds, and user privacy rights under DPDPA 2023.',
      'publisher': {
        '@type': 'Organization',
        'name': 'BizReels',
        'url': 'https://bizreels.in/',
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#f2ede4] text-[#1a1a1a] font-sans antialiased selection:bg-[#d99a3d] selection:text-[#1a1a1a]">
      <SEO
        title="Privacy Policy — BizReels"
        description="Learn how BizReels protects your privacy, collects and safeguards your data, handles secure Razorpay escrow payments, and complies with DPDPA 2023."
        canonicalUrl="https://bizreels.in/privacy-policy"
        structuredData={structuredData}
      />

      {/* Hero Header */}
      <section className="bg-[#241b15] text-white pt-12 pb-14 px-4 sm:px-6 relative overflow-hidden border-b-2 border-[#241b15]">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#d99a3d_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-6xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#d99a3d] text-xs font-black uppercase tracking-wider border border-white/15">
            <FiShield size={14} />
            <span>Legal, Privacy &amp; Data Protection</span>
          </div>

          <h1
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
            className="text-3xl sm:text-5xl font-black text-white tracking-tight"
          >
            BIZREELS PRIVACY POLICY
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Your trust is our cornerstone. This policy explains our clear data practices, video content guidelines, secure Razorpay escrow transactions, automated refund mechanisms, and how we protect buyers, suppliers, and creators across India.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/15 text-xs text-slate-300">
            <div className="flex items-center gap-4 flex-wrap font-semibold">
              <span>📅 <strong>Last Updated:</strong> September 2026</span>
              <span>🇮🇳 <strong>Governed by:</strong> DPDPA 2023 &amp; IT Act 2000</span>
              <span>🔒 <strong>Version:</strong> 2.4 (Production Standard)</span>
            </div>

            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white font-bold transition cursor-pointer border border-white/20 text-xs"
            >
              <FiPrinter size={14} />
              <span>Print Policy</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Sticky Table of Contents */}
          <aside className="lg:col-span-4 sticky top-6 space-y-4">
            {/* Quick Search */}
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search privacy topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-[#e3dccb] text-xs font-bold text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d99a3d] shadow-xs"
              />
            </div>

            {/* Navigation Box */}
            <div className="bg-white rounded-2xl border-2 border-[#241b15] p-4 shadow-sm space-y-1.5 max-h-[75vh] overflow-y-auto">
              <h3
                style={{ fontFamily: "'Archivo Black', sans-serif" }}
                className="text-xs font-black uppercase tracking-wider text-[#1a1a1a] pb-2 border-b border-[#e3dccb] mb-2 flex items-center justify-between"
              >
                <span>Table of Contents</span>
                <span className="text-[10px] text-slate-400 font-sans font-bold">
                  {filteredSections.length} topics
                </span>
              </h3>

              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isSelected = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollTo(sec.id)}
                    type="button"
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer border-none ${
                      isSelected
                        ? 'bg-[#241b15] text-[#d99a3d] font-black shadow-xs'
                        : 'text-slate-600 hover:bg-[#faf7f2] hover:text-[#1a1a1a]'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon size={14} className={isSelected ? 'text-[#d99a3d]' : 'text-slate-400'} />
                      <span className="truncate">{sec.title}</span>
                    </span>
                    <FiChevronRight size={12} className={isSelected ? 'text-[#d99a3d]' : 'text-slate-300'} />
                  </button>
                );
              })}
            </div>

            {/* Direct Contact Card */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-[#d99a3d]/30 text-xs space-y-2">
              <h4 className="font-black text-[#1a1a1a] flex items-center gap-1.5">
                <FiMail size={15} className="text-[#d99a3d]" />
                <span>Need Data Clarification?</span>
              </h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Reach out directly to our Grievance Redressal Team for any inquiry or data deletion request.
              </p>
              <a
                href="mailto:privacy@bizreels.in"
                className="inline-block font-black text-xs text-[#241b15] underline hover:text-[#d99a3d]"
              >
                privacy@bizreels.in &rarr;
              </a>
            </div>
          </aside>

          {/* Right Column: Detailed Sections */}
          <main className="lg:col-span-8 space-y-6">
            {/* Dynamic CMS Alert if customized */}
            {dynamicCms && (
              <div className="p-4 rounded-2xl bg-white border-2 border-[#241b15] shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2">
                  <h3 className="text-sm font-black text-[#1a1a1a]">{dynamicCms.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Live Published Version
                  </span>
                </div>
                <div className="prose prose-sm max-w-none text-xs text-slate-700 whitespace-pre-wrap font-sans">
                  {dynamicCms.content}
                </div>
              </div>
            )}

            {/* Standard Comprehensive Policy Sections */}
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              return (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="bg-white rounded-2xl border-2 border-[#241b15] p-5 sm:p-7 shadow-xs space-y-4 scroll-mt-6"
                >
                  <div className="flex items-center gap-3 border-b border-[#e3dccb] pb-3">
                    <div className="w-8 h-8 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center shrink-0 shadow-xs">
                      <Icon size={16} />
                    </div>
                    <h2
                      style={{ fontFamily: "'Archivo Black', sans-serif" }}
                      className="text-base sm:text-lg font-black text-[#1a1a1a] uppercase tracking-wide"
                    >
                      {sec.title}
                    </h2>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                    {sec.content}
                  </div>
                </section>
              );
            })}

            {/* Bottom Footer Callout */}
            <div className="p-6 rounded-2xl bg-[#241b15] text-white text-center space-y-3">
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-base uppercase text-[#d99a3d]">
                Transparent. Safe. Community First.
              </h3>
              <p className="text-xs text-slate-300 max-w-lg mx-auto">
                Discover verified suppliers, watch real video reels, and deal with complete confidence on BizReels.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                <Link
                  to="/"
                  className="px-5 py-2.5 bg-[#d99a3d] text-[#1a1a1a] hover:bg-[#eab35b] text-xs font-black rounded-xl transition shadow-xs"
                >
                  Explore Home
                </Link>
                <Link
                  to="/about"
                  className="px-5 py-2.5 bg-white/10 text-white hover:bg-white/20 text-xs font-black rounded-xl transition border border-white/20"
                >
                  About BizReels
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
