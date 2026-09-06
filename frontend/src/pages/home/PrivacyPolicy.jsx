import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  FiRefreshCw,
  FiCheck,
  FiExternalLink,
  FiFileText,
  FiSliders,
  FiClock,
  FiAlertCircle,
  FiArrowRight,
  FiLayers,
  FiShare2,
  FiCopy
} from 'react-icons/fi';
import SEO from '../../components/common/SEO';
import { api } from '../../lib/api';

const SECTIONS = [
  {
    id: 'intro',
    badge: 'Scope & Jurisdiction',
    title: '1. Introduction & Platform Scope',
    summary: 'Overview of BizReels platform mission, applicable legal framework under DPDPA 2023 and IT Rules 2011.',
    icon: FiInfo,
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 leading-relaxed">
          Welcome to <strong className="text-[#1a1a1a]">BizReels</strong> (accessible at{' '}
          <a
            href="https://bizreels.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d99a3d] font-bold underline hover:text-[#b87d27] transition-colors"
          >
            https://bizreels.in
          </a>
          ). BizReels is India&apos;s pioneering visual reels commerce platform dedicated to empowering local retail businesses, verified service providers, independent creators, and everyday consumers through engaging short-form video discovery, hyperlocal matching, direct peer-to-peer deals, and buyer-protected online transactions.
        </p>
        <p className="text-slate-700 leading-relaxed">
          This Privacy Policy sets out how BizReels collects, uses, stores, processes, discloses, and safeguards your personal and commercial business information when you visit our website, install our progressive web application, create an account, purchase products or services, upload promotional video reels, or engage in vendor-creator creative collaborations.
        </p>

        {/* Regulatory Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-[#d99a3d]/40 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <FiShield size={16} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#241b15]">
              Statutory Legal Framework Compliance
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              This document is published in accordance with Rule 3(1) of the Information Technology (Intermediaries Guidelines) Rules 2011, the Information Technology (Reasonable Security Practices and Sensitive Personal Data) Rules 2011, and the <strong className="text-[#241b15]">Digital Personal Data Protection Act, 2023 (DPDPA)</strong> enacted by the Parliament of India.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'information-collected',
    badge: 'Data Taxonomies',
    title: '2. Information We Collect',
    summary: 'Granular breakdown of personal and commercial data gathered for Customers, Vendors, and Creators.',
    icon: FiDatabase,
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 leading-relaxed">
          We gather information you directly provide, data captured automatically via device sensors when browsing reels or using search, and operational data generated during commerce interactions:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* Customer Card */}
          <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#e3dccb] hover:border-[#d99a3d]/50 transition-all space-y-2.5 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Buyers & Consumers
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Role: Customer</span>
            </div>
            <h4 className="font-bold text-sm text-[#1a1a1a]">Buyer Profile & Orders</h4>
            <ul className="text-xs text-slate-600 space-y-1.5 flex-1">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-black mt-0.5">•</span>
                <span>Full name, mobile number (OTP verified), email.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-black mt-0.5">•</span>
                <span>Delivery addresses, postal pincode, city preference.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-black mt-0.5">•</span>
                <span>Order history, service appointments, booking notes.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-black mt-0.5">•</span>
                <span>Reel likes, saved listings, requirement posts.</span>
              </li>
            </ul>
          </div>

          {/* Vendor Card */}
          <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#e3dccb] hover:border-[#d99a3d]/50 transition-all space-y-2.5 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Suppliers & Stores
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Role: Vendor</span>
            </div>
            <h4 className="font-bold text-sm text-[#1a1a1a]">Business Profile & Store</h4>
            <ul className="text-xs text-slate-600 space-y-1.5 flex-1">
              <li className="flex items-start gap-1.5">
                <span className="text-[#d99a3d] font-black mt-0.5">•</span>
                <span>Business trading name, storefront address, category.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#d99a3d] font-black mt-0.5">•</span>
                <span>GSTIN, PAN card, Business proof (for KYC verification).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#d99a3d] font-black mt-0.5">•</span>
                <span>Product catalogs, reel video uploads, price cards.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#d99a3d] font-black mt-0.5">•</span>
                <span>Bank account details &amp; UPI VPA for settlement payouts.</span>
              </li>
            </ul>
          </div>

          {/* Creator Card */}
          <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#e3dccb] hover:border-[#d99a3d]/50 transition-all space-y-2.5 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                Content Creators
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Role: Creator</span>
            </div>
            <h4 className="font-bold text-sm text-[#1a1a1a]">Creator Marketplace</h4>
            <ul className="text-xs text-slate-600 space-y-1.5 flex-1">
              <li className="flex items-start gap-1.5">
                <span className="text-purple-500 font-black mt-0.5">•</span>
                <span>Portfolio showcase reels and creative specialties.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-purple-500 font-black mt-0.5">•</span>
                <span>Social media handles, audience demographics.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-purple-500 font-black mt-0.5">•</span>
                <span>Service packages, commercial shoot rate cards.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-purple-500 font-black mt-0.5">•</span>
                <span>Bank accounts for campaign escrow milestone releases.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-[#e3dccb] text-xs text-slate-600 flex items-start gap-2.5">
          <FiLock className="text-[#d99a3d] shrink-0 mt-0.5" size={14} />
          <div>
            <strong className="text-[#1a1a1a] block mb-0.5">Automated Technical &amp; Device Logging:</strong>
            We automatically log IP addresses, browser user-agents, operating system versions, device models, referring URLs, and network diagnostic timestamps solely to mitigate cyber attacks, block abusive bots, and enforce session security.
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'how-we-use',
    badge: 'Lawful Processing',
    title: '3. How We Use Your Information',
    summary: 'Legitimate business purposes: hyperlocal discovery, order fulfillment, escrow, and communications.',
    icon: FiEye,
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 leading-relaxed">
          Your personal and business data is processed strictly for legitimate commercial needs and platform operation:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              ✓
            </div>
            <div>
              <strong className="text-[#1a1a1a] block text-xs mb-0.5">Order Fulfillment &amp; Delivery</strong>
              <p className="text-slate-600 leading-relaxed">
                Dispatching physical items, generating automated courier labels (via Shiprocket), and booking onsite service appointments.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              ✓
            </div>
            <div>
              <strong className="text-[#1a1a1a] block text-xs mb-0.5">Hyperlocal Geolocation Matching</strong>
              <p className="text-slate-600 leading-relaxed">
                Serving reels, products, and verified merchants relevant to your chosen pincode or current geographical city boundaries.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              ✓
            </div>
            <div>
              <strong className="text-[#1a1a1a] block text-xs mb-0.5">Direct Buyer-Seller Connectivity</strong>
              <p className="text-slate-600 leading-relaxed">
                Facilitating direct vendor phone calling, one-click WhatsApp chat transitions, and encrypted in-app messaging.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              ✓
            </div>
            <div>
              <strong className="text-[#1a1a1a] block text-xs mb-0.5">Escrow Protection &amp; Instant Refunds</strong>
              <p className="text-slate-600 leading-relaxed">
                Holding online prepaid funds safely until delivery verification, releasing vendor payouts, and executing 100% automated refunds.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              ✓
            </div>
            <div>
              <strong className="text-[#1a1a1a] block text-xs mb-0.5">Creator Collaboration Workflows</strong>
              <p className="text-slate-600 leading-relaxed">
                Managing brand shoot contracts, video submission milestones, and escrow disbursements between vendors and creators.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              ✓
            </div>
            <div>
              <strong className="text-[#1a1a1a] block text-xs mb-0.5">Platform Trust &amp; Fraud Prevention</strong>
              <p className="text-slate-600 leading-relaxed">
                Conducting vendor KYC verification, automated AI reel content moderation, and anti-spam requirement checks.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'payments-and-escrow',
    badge: 'Razorpay & Escrow',
    title: '4. Payment Processing, Escrow & Automated Refunds',
    summary: 'PCI-DSS Level 1 compliance via Razorpay, escrow hold rules, and 100% automated refund guarantee.',
    icon: FiCreditCard,
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 leading-relaxed">
          BizReels supports multi-mode payment options designed to balance maximum consumer purchase protection with vendor cashflow predictability:
        </p>

        <div className="space-y-3">
          {/* Card 1: Razorpay Escrow */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-200 text-xs text-blue-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-sm text-blue-900">
              <div className="p-1 rounded-lg bg-blue-600 text-white">
                <FiShield size={14} />
              </div>
              <span>Razorpay Payment Gateway &amp; Escrow Safety</span>
            </div>
            <p className="leading-relaxed">
              When you select <strong className="text-blue-900">&quot;Pay Online (Razorpay)&quot;</strong>, your payment is processed through Razorpay, a PCI-DSS Level 1 certified payment aggregator authorized by the Reserve Bank of India. 
              <strong className="text-blue-900"> BizReels does not collect, view, or retain your Credit/Debit Card numbers, CVV codes, net banking passwords, or UPI MPINs.</strong>
            </p>
            <div className="p-2.5 rounded-xl bg-white/80 border border-blue-200/80 flex items-center justify-between gap-2 flex-wrap">
              <span className="font-semibold text-blue-900">Escrow State:</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono font-bold text-[11px]">
                escrowStatus: &apos;held&apos;
              </span>
              <span className="text-slate-600 text-[11px]">Held securely until delivery OTP confirmation.</span>
            </div>
          </div>

          {/* Card 2: 100% Automated Instant Refund Guarantee */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border border-emerald-200 text-xs text-emerald-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
              <div className="p-1 rounded-lg bg-emerald-600 text-white">
                <FiRefreshCw size={14} />
              </div>
              <span>100% Automated Instant Refund Guarantee</span>
            </div>
            <p className="leading-relaxed">
              If a prepaid online order is cancelled prior to shipment or rejected by the merchant, our system automatically initiates a programmatic refund via the Razorpay Refund API (<code className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">refundMode: &apos;razorpay_gateway&apos;</code>). 
              Funds return 100% to the original source account (UPI, Bank, Card) with <strong className="text-emerald-900">zero deductions from the vendor&apos;s wallet balance</strong>.
            </p>
            <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200/80 flex items-center justify-between gap-2 flex-wrap">
              <span className="font-semibold text-emerald-900">Settlement SLA:</span>
              <span className="text-slate-700 font-bold">UPI: Instant - 24 hrs | Cards/Netbanking: 3-5 business days</span>
            </div>
          </div>

          {/* Card 3: Direct P2P & COD */}
          <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#e3dccb] text-xs text-slate-700 space-y-1.5">
            <div className="font-bold text-xs text-[#1a1a1a] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Direct Peer-to-Peer UPI, Bank Transfers &amp; Cash on Delivery (COD)</span>
            </div>
            <p className="leading-relaxed">
              If you choose Direct Vendor UPI QR, Bank Transfer, or Cash on Delivery (COD), payment is transacted directly between buyer and seller without platform custody. BizReels does not hold or intermediated physical cash or peer-to-peer bank transfers.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'location-data',
    badge: 'Hyperlocal Geodata',
    title: '5. Location & Geolocation Data',
    summary: 'How pincode selection and optional GPS coordinates power proximity feeds and local shop discovery.',
    icon: FiMapPin,
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 leading-relaxed">
          BizReels is fundamentally built around <strong className="text-[#1a1a1a]">hyper-local commerce</strong> to bridge nearby physical storefronts with local consumers.
        </p>
        <ul className="text-xs text-slate-600 space-y-2">
          <li className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5">
            <span className="text-[#d99a3d] font-black text-sm mt-0.5">•</span>
            <div>
              <strong className="text-[#1a1a1a] block mb-0.5">Pincode &amp; City Selection:</strong>
              You can manually set, change, or clear your preferred pincode or city at any time in the navigation header to browse local reels and catalogs in that area.
            </div>
          </li>
          <li className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5">
            <span className="text-[#d99a3d] font-black text-sm mt-0.5">•</span>
            <div>
              <strong className="text-[#1a1a1a] block mb-0.5">GPS Proximity Coordinates (Optional):</strong>
              With your explicit browser or mobile device permission, we capture coarse or precise latitude/longitude solely to calculate proximity distances (e.g. &quot;Within 2.5 km&quot;) and plot nearest store locations on interactive maps.
            </div>
          </li>
          <li className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5">
            <span className="text-[#d99a3d] font-black text-sm mt-0.5">•</span>
            <div>
              <strong className="text-[#1a1a1a] block mb-0.5">Revocation of Geolocation:</strong>
              You can revoke browser or device location permissions anytime in your system settings without affecting core browsing features.
            </div>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'video-reels-ugc',
    badge: 'Media & UGC',
    title: '6. Video Reels, Media & User Generated Content',
    summary: 'Content ownership, public streaming distribution, licensing, and automated AI moderation standards.',
    icon: FiVideo,
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 leading-relaxed">
          BizReels empowers verified merchants and freelance creators to post vertical video reels showcasing products, services, and creative shoots.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-1.5">
            <h5 className="font-bold text-xs text-[#1a1a1a]">Public Feeds &amp; SEO</h5>
            <p className="text-slate-600 leading-relaxed">
              Videos published to public feeds are accessible to all visitors and indexed by search engines to generate organic leads for merchants.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-1.5">
            <h5 className="font-bold text-xs text-[#1a1a1a]">Media Ownership</h5>
            <p className="text-slate-600 leading-relaxed">
              You retain 100% intellectual property ownership of your media. You grant BizReels a non-exclusive license to host, stream, and transcode your video.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-1.5">
            <h5 className="font-bold text-xs text-[#1a1a1a]">Zero-Tolerance Policy</h5>
            <p className="text-slate-600 leading-relaxed">
              Content violating Indian obscenity laws, copyright, trademark, or depicting deceptive counterfeit items is subjected to instant automated takedown.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'communication-privacy',
    badge: 'Direct Connect',
    title: '7. Direct Buyer-Vendor Communication & Leads',
    summary: 'Privacy protection protocols for direct phone calling, WhatsApp lead redirects, and in-app chat.',
    icon: FiMessageSquare,
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 leading-relaxed">
          When you click <strong className="text-[#1a1a1a]">&quot;Call Vendor&quot;</strong>, <strong className="text-[#1a1a1a]">&quot;Chat on WhatsApp&quot;</strong>, or <strong className="text-[#1a1a1a]">&quot;Enquire Now&quot;</strong>:
        </p>
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5">
            <span className="text-emerald-600 font-bold mt-0.5">📞</span>
            <div className="space-y-0.5">
              <strong className="text-[#1a1a1a] block">Direct Telecom &amp; WhatsApp Handoff</strong>
              <p className="text-slate-600 leading-relaxed">
                Calls and external WhatsApp chats occur directly through your device&apos;s native dialer or WhatsApp client, governed by your telecom operator and WhatsApp&apos;s encryption and privacy terms.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5">
            <span className="text-blue-600 font-bold mt-0.5">💬</span>
            <div className="space-y-0.5">
              <strong className="text-[#1a1a1a] block">Encrypted In-App Messaging</strong>
              <p className="text-slate-600 leading-relaxed">
                Chats conducted via the built-in BizReels messaging drawer are encrypted in transit over secure WebSockets (WSS) and stored to maintain conversation logs across your devices.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5">
            <span className="text-amber-600 font-bold mt-0.5">🎯</span>
            <div className="space-y-0.5">
              <strong className="text-[#1a1a1a] block">Customer Requirement Postings</strong>
              <p className="text-slate-600 leading-relaxed">
                When you post a public requirement or quote inquiry, verified vendors matching the category and locality can access your contact details strictly to respond with tailored quotes.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'information-sharing',
    badge: 'Third Parties',
    title: '8. Information Sharing & Third-Party Disclosures',
    summary: 'Absolute no-sale commitment: We never sell customer or merchant data to third-party advertisers.',
    icon: FiUserCheck,
    content: (
      <div className="space-y-4">
        {/* Strict No-Sale Highlight */}
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <FiShield size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">
              Strict No-Sale Commitment
            </h4>
            <p className="text-xs text-emerald-900 font-semibold leading-relaxed mt-0.5">
              BizReels NEVER sells, rents, monetizes, or trades your personal or business data to third-party brokers, data aggregators, or external advertisers. Period.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-700">We disclose data only to the following certified service providers strictly necessary to execute platform services:</p>

        <ul className="text-xs text-slate-600 space-y-2">
          <li className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5">
            <span className="font-bold text-[#d99a3d]">•</span>
            <div>
              <strong className="text-[#1a1a1a]">Fulfilling Merchants &amp; Logistics Partners:</strong> Shipping recipient name, delivery address, and phone number are shared with the merchant and shipping carrier (Shiprocket) solely to complete package delivery.
            </div>
          </li>
          <li className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5">
            <span className="font-bold text-[#d99a3d]">•</span>
            <div>
              <strong className="text-[#1a1a1a]">Payment Aggregators:</strong> Transaction billing amounts and customer identifiers are securely passed to Razorpay for payment capture and automated refunds.
            </div>
          </li>
          <li className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5">
            <span className="font-bold text-[#d99a3d]">•</span>
            <div>
              <strong className="text-[#1a1a1a]">Cloud &amp; Media CDN:</strong> Uploaded video reels and images are streamed globally via encrypted cloud content delivery networks (Cloudinary, AWS, Cloudflare).
            </div>
          </li>
          <li className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5">
            <span className="font-bold text-[#d99a3d]">•</span>
            <div>
              <strong className="text-[#1a1a1a]">Legal &amp; Law Enforcement Demands:</strong> We may disclose data when legally compelled by valid court orders or lawful directives issued by Indian government authorities under the IT Act 2000.
            </div>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'data-security',
    badge: 'Security Protocols',
    title: '9. Data Security & Storage Practices',
    summary: 'Enterprise encryption, isolated multi-role ledgers, HTTP-only authentication, and SOC-2 standard infrastructure.',
    icon: FiLock,
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 leading-relaxed">
          We maintain defense-in-depth technical, physical, and procedural security safeguards designed to prevent unauthorized data loss, alteration, or interception:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-1.5">
            <div className="flex items-center gap-2 font-black text-[#1a1a1a]">
              <FiLock className="text-[#d99a3d]" size={14} />
              <span>TLS 1.3 / HTTPS Encryption</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              All web and WebSocket traffic between your client device and our server cluster is strictly encrypted using industry-standard TLS 1.3 cryptographic protocols.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-1.5">
            <div className="flex items-center gap-2 font-black text-[#1a1a1a]">
              <FiShield className="text-emerald-600" size={14} />
              <span>Tamper-Proof Secure Cookies</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Auth session tokens are stored exclusively in HTTP-only, SameSite-strict cookies shielded from client-side JavaScript access and XSS vectors.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-1.5">
            <div className="flex items-center gap-2 font-black text-[#1a1a1a]">
              <FiCreditCard className="text-blue-600" size={14} />
              <span>PCI-DSS Card Isolation</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Debit and credit card numbers are processed directly within Razorpay&apos;s certified PCI-DSS Level 1 vault. BizReels never stores card data on our databases.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-1.5">
            <div className="flex items-center gap-2 font-black text-[#1a1a1a]">
              <FiLayers className="text-purple-600" size={14} />
              <span>Cryptographically Isolated Ledgers</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Platform wallet balances, escrow reserves, and referral commissions are reconciled in atomic database transactions to guarantee mathematical integrity.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'user-rights',
    badge: 'Your Rights',
    title: '10. Your Rights & Privacy Choices (DPDPA 2023)',
    summary: 'Statutory data principal rights: right to access, rectification, account deletion, and marketing opt-out.',
    icon: FiUserCheck,
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 leading-relaxed">
          Under the <strong className="text-[#1a1a1a]">Digital Personal Data Protection Act, 2023 (DPDPA)</strong>, you are the Data Principal and retain unambiguous ownership rights over your personal data:
        </p>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5">
            <span className="font-black text-[#d99a3d]">1.</span>
            <div>
              <strong className="text-[#1a1a1a]">Right to Information &amp; Access:</strong> You can inspect all profile details, saved addresses, order records, and wallet history at any time from your Account Settings.
            </div>
          </div>
          <li className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5 list-none">
            <span className="font-black text-[#d99a3d]">2.</span>
            <div>
              <strong className="text-[#1a1a1a]">Right to Correction &amp; Updation:</strong> Seamlessly update inaccurate phone numbers, addresses, shop listings, or creator pricing cards in real time.
            </div>
          </li>
          <li className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5 list-none">
            <span className="font-black text-[#d99a3d]">3.</span>
            <div>
              <strong className="text-[#1a1a1a]">Unified Role Switching:</strong> Switch dynamically between Customer, Vendor, and Creator workspaces from your top navigation switcher without managing duplicate accounts.
            </div>
          </li>
          <li className="p-3 rounded-xl bg-[#faf7f2] border border-[#e3dccb] flex items-start gap-2.5 list-none">
            <span className="font-black text-[#d99a3d]">4.</span>
            <div>
              <strong className="text-[#1a1a1a]">Right to Erasure &amp; Account Deletion:</strong> You can request full erasure of your account and associated personal data by contacting our Grievance Officer or using the account deletion workflow in Settings.
            </div>
          </li>
        </div>
      </div>
    ),
  },
  {
    id: 'cookies',
    badge: 'Cookie Policy',
    title: '11. Cookie Usage & Tracking Preferences',
    summary: 'Categorization of essential session cookies, language preferences, and analytical monitoring.',
    icon: FiSliders,
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 leading-relaxed">
          BizReels uses first-party and essential performance cookies to manage your login session, remember language settings, and optimize video streaming latency:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-1">
            <span className="font-black text-[#1a1a1a] block">Essential Cookies</span>
            <p className="text-slate-600 leading-relaxed">
              Strictly necessary for login token validation, CSRF security, and active cart preservation.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-1">
            <span className="font-black text-[#1a1a1a] block">Preference Cookies</span>
            <p className="text-slate-600 leading-relaxed">
              Remembers your selected language preference (English / Hindi) and recently searched pincode.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-1">
            <span className="font-black text-[#1a1a1a] block">Analytics Cookies</span>
            <p className="text-slate-600 leading-relaxed">
              Anonymized telemetry to diagnose video playback stutter and optimize mobile responsive rendering.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500 italic">
          You can modify or withdraw your non-essential cookie consents at any time using our Cookie Consent Banner or via your browser settings.
        </p>
      </div>
    ),
  },
  {
    id: 'grievance-contact',
    badge: 'Statutory Officer',
    title: '12. Grievance Redressal & Official Contacts',
    summary: 'Designated Grievance Officer details, contact email, and strict 48-hour SLA response guarantees.',
    icon: FiMail,
    content: (
      <div className="space-y-4">
        <p className="text-slate-700 leading-relaxed">
          In strict accordance with Rule 5(9) of the Information Technology Rules, 2011, and the Digital Personal Data Protection Act, 2023, the details of our designated <strong className="text-[#1a1a1a]">Grievance &amp; Data Protection Officer</strong> are set out below:
        </p>

        {/* Highlight Grievance Officer Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#241b15] text-white border-2 border-[#241b15] shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div className="flex items-center gap-2 text-[#d99a3d] font-black text-sm uppercase tracking-wider">
              <FiShield size={18} />
              <span>Designated Grievance &amp; Privacy Officer</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              48h SLA Response
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-200">
            <div>
              <span className="text-slate-400 block text-[10.5px] uppercase font-bold tracking-wider">
                Operating Entity:
              </span>
              <strong className="text-white text-sm">BizReels Technologies India</strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[10.5px] uppercase font-bold tracking-wider">
                Statutory Grievance Desk:
              </span>
              <a
                href="mailto:grievance@bizreels.in"
                className="text-[#d99a3d] hover:text-[#f5c366] underline font-bold text-sm"
              >
                grievance@bizreels.in
              </a>
            </div>

            <div>
              <span className="text-slate-400 block text-[10.5px] uppercase font-bold tracking-wider">
                Customer Support Email:
              </span>
              <a
                href="mailto:support@bizreels.in"
                className="text-white hover:text-[#d99a3d] underline font-medium"
              >
                support@bizreels.in
              </a>
            </div>

            <div>
              <span className="text-slate-400 block text-[10.5px] uppercase font-bold tracking-wider">
                Jurisdiction &amp; Headquarters:
              </span>
              <span className="text-white font-medium">India</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-start gap-2 text-[11px] text-slate-300">
            <FiClock className="text-[#d99a3d] shrink-0 mt-0.5" size={13} />
            <p>
              <strong className="text-white">Statutory Timelines:</strong> Any grievance or data inquiry submitted will be acknowledged within <strong className="text-white">48 hours</strong> and fully resolved within <strong className="text-white">30 days</strong> of receipt.
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('intro');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [dynamicCms, setDynamicCms] = useState(null);

  // Attempt to fetch dynamic CMS overrides from backend if admin configured custom text
  useEffect(() => {
    let isMounted = true;
    api
      .get('/v1/cms/privacy-policy')
      .then((res) => {
        if (isMounted && res.data?.data?.content) {
          setDynamicCms(res.data.data);
        }
      })
      .catch(() => {
        // Fallback gracefully to built-in policy
      });
    return () => {
      isMounted = false;
    };
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const q = searchQuery.toLowerCase();
    return SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.badge?.toLowerCase().includes(q) ||
        s.summary?.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Privacy Policy — BizReels',
      'url': 'https://bizreels.in/privacy-policy',
      'description':
        'Official Privacy Policy of BizReels detailing data collection, escrow payments, automated Razorpay refunds, and user privacy rights under DPDPA 2023.',
      'publisher': {
        '@type': 'Organization',
        'name': 'BizReels',
        'url': 'https://bizreels.in/',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': 'https://bizreels.in/',
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Privacy Policy',
          'item': 'https://bizreels.in/privacy-policy',
        },
      ],
    },
  ];

  return (
    <div
      className="overflow-x-hidden font-sans antialiased selection:bg-[#d99a3d] selection:text-[#1a1a1a]"
      style={{ backgroundColor: '#f2ede4', minHeight: '100vh' }}
    >
      <SEO
        title="Privacy Policy — BizReels"
        description="Learn how BizReels protects your privacy, collects and safeguards your data, handles secure Razorpay escrow payments, and complies with DPDPA 2023."
        canonicalUrl="https://bizreels.in/privacy-policy"
        structuredData={structuredData}
      />

      {/* ── 1. HERO BANNER — Bento Style Matching About/Pricing ──────────────── */}
      <section style={{ backgroundColor: '#f2ede4' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 14px 0' }}>
          <div
            style={{
              backgroundColor: '#241b15',
              borderRadius: 24,
              border: '2px solid #241b15',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 8px 30px rgba(36,27,21,0.15)',
            }}
          >
            {/* Subtle dot matrix background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#d99a3d_1.5px,transparent_1.5px)] [background-size:20px_20px]" />

            <div className="relative z-10 px-6 sm:px-12 py-10 sm:py-14 text-white">
              <div className="max-w-3xl space-y-4">
                {/* Eyebrow Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 text-[#d99a3d] border border-white/15"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d99a3d] animate-pulse" />
                  Legal, Privacy &amp; Data Trust
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    fontFamily: "'Archivo Black', sans-serif",
                    fontSize: 'clamp(28px, 4.2vw, 48px)',
                    lineHeight: 1.08,
                    letterSpacing: '-0.5px',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                  }}
                >
                  BIZREELS <br />
                  <span style={{ color: '#d99a3d' }}>PRIVACY &amp; DATA POLICY.</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.35 }}
                  className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal"
                >
                  Your trust is our cornerstone. We uphold absolute transparency across our hyperlocal discovery engine, short-form video reels, Razorpay escrow protection, and 100% automated refund architecture.
                </motion.p>

                {/* Quick Spec Pills */}
                <div className="pt-3 flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[#d99a3d]">📅</span>
                    <span>Last Updated: <strong>September 2026</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                    <span>🇮🇳</span>
                    <span>Statutory: <strong>DPDPA 2023 &amp; IT Act</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-emerald-400">🛡️</span>
                    <span>No Data Sale: <strong>Guaranteed</strong></span>
                  </div>
                </div>

                {/* Actions (Print, Share, Breadcrumbs) */}
                <div className="pt-4 flex items-center gap-3 flex-wrap border-t border-white/15">
                  <button
                    onClick={handlePrint}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d99a3d] text-[#1a1a1a] hover:bg-[#eab35b] font-bold transition-all text-xs cursor-pointer shadow-xs"
                  >
                    <FiPrinter size={14} />
                    <span>Print Document</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 font-bold transition-all text-xs cursor-pointer border border-white/20"
                  >
                    {copiedLink ? <FiCheck size={14} className="text-emerald-400" /> : <FiCopy size={14} />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Policy Link'}</span>
                  </button>

                  <Link
                    to="/about"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-300 hover:text-white text-xs font-semibold ml-auto transition-colors"
                  >
                    <span>About BizReels</span>
                    <FiArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. MAIN BENTO LAYOUT (Sticky Navigation + Article Sections) ─────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 14px 48px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDEBAR: Table of Contents & Interactive Search */}
          <aside className="lg:col-span-4 sticky top-6 space-y-4">
            {/* Search Input Box */}
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search topics (e.g., Escrow, KYC, Refunds)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border-2 border-[#241b15] text-xs font-bold text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d99a3d] shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Index List */}
            <div className="bg-white rounded-2xl border-2 border-[#241b15] p-3 sm:p-4 shadow-sm space-y-1.5 max-h-[72vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#e3dccb] mb-2 px-1">
                <h3
                  style={{ fontFamily: "'Archivo Black', sans-serif" }}
                  className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]"
                >
                  Policy Directory
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#faf7f2] border border-[#e3dccb] text-slate-600">
                  {filteredSections.length} of {SECTIONS.length}
                </span>
              </div>

              {filteredSections.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No matching topics found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredSections.map((sec) => {
                  const Icon = sec.icon;
                  const isSelected = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollTo(sec.id)}
                      type="button"
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border-none ${
                        isSelected
                          ? 'bg-[#241b15] text-[#d99a3d] font-bold shadow-xs'
                          : 'text-slate-600 hover:bg-[#faf7f2] hover:text-[#1a1a1a]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon
                          size={14}
                          className={isSelected ? 'text-[#d99a3d]' : 'text-slate-400 shrink-0'}
                        />
                        <span className="truncate">{sec.title}</span>
                      </span>
                      <FiChevronRight
                        size={12}
                        className={isSelected ? 'text-[#d99a3d] shrink-0' : 'text-slate-300 shrink-0'}
                      />
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick Contact Grievance Desk Card */}
            <div className="p-4 rounded-2xl bg-[#241b15] text-white border-2 border-[#241b15] shadow-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-bold">
                  <FiMail size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Have a Privacy Question?</h4>
                  <span className="text-[10px] text-slate-400">Direct Grievance Desk</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Contact our data protection team for inquiries, consent withdrawal, or deletion requests.
              </p>
              <a
                href="mailto:grievance@bizreels.in"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d99a3d] hover:underline"
              >
                <span>grievance@bizreels.in</span>
                <FiArrowRight size={12} />
              </a>
            </div>
          </aside>

          {/* RIGHT COLUMN: Rich Policy Content Cards */}
          <main className="lg:col-span-8 space-y-6">
            
            {/* Dynamic CMS Live Publish Alert (if admin edited via CMS) */}
            {dynamicCms && (
              <div className="p-5 rounded-2xl bg-white border-2 border-[#241b15] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2.5">
                  <h3 className="text-sm font-black text-[#1a1a1a]">{dynamicCms.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Live Dynamic CMS
                  </span>
                </div>
                <div className="prose prose-sm max-w-none text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {dynamicCms.content}
                </div>
              </div>
            )}

            {/* Render Standard Sections */}
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              return (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="bg-white rounded-2xl border-2 border-[#241b15] p-5 sm:p-7 shadow-xs space-y-4 scroll-mt-6 transition-all hover:shadow-md"
                >
                  {/* Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e3dccb] pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center shrink-0 shadow-xs">
                        <Icon size={18} />
                      </div>
                      <div>
                        <h2
                          style={{ fontFamily: "'Archivo Black', sans-serif" }}
                          className="text-base sm:text-lg font-black text-[#1a1a1a] uppercase tracking-wide"
                        >
                          {sec.title}
                        </h2>
                        {sec.summary && (
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                            {sec.summary}
                          </p>
                        )}
                      </div>
                    </div>

                    {sec.badge && (
                      <span className="self-start sm:self-center text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#faf7f2] border border-[#e3dccb] text-slate-700">
                        {sec.badge}
                      </span>
                    )}
                  </div>

                  {/* Section Body */}
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                    {sec.content}
                  </div>
                </section>
              );
            })}

            {/* Bottom Callout Bento Box */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#241b15] text-white space-y-4 border-2 border-[#241b15]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0">
                  <FiShield size={20} />
                </div>
                <div>
                  <h3
                    style={{ fontFamily: "'Archivo Black', sans-serif" }}
                    className="text-base sm:text-lg uppercase text-[#d99a3d] tracking-wide"
                  >
                    Transparent. Safe. Community-Driven.
                  </h3>
                  <p className="text-xs text-slate-300">
                    Shop verified local merchants, explore short video reels, and transact with 100% confidence.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 bg-[#d99a3d] text-[#1a1a1a] hover:bg-[#eab35b] text-xs font-black rounded-xl transition shadow-xs cursor-pointer border-none"
                >
                  Explore Reels
                </button>
                <button
                  onClick={() => navigate('/about')}
                  className="px-5 py-2.5 bg-white/10 text-white hover:bg-white/20 text-xs font-black rounded-xl transition border border-white/20 cursor-pointer"
                >
                  About BizReels
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-5 py-2.5 bg-white/10 text-white hover:bg-white/20 text-xs font-black rounded-xl transition border border-white/20 cursor-pointer"
                >
                  Vendor Plans &amp; Pricing
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
