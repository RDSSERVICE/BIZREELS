import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiSend,
  FiCheckCircle,
  FiShield,
  FiHelpCircle,
  FiMessageSquare,
  FiUserCheck,
  FiArrowRight,
  FiCheck,
  FiCopy,
  FiAlertCircle,
  FiZap
} from 'react-icons/fi';
import SEO from '../../components/common/SEO';
import { api } from '../../lib/api';

export default function ContactUs() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const contactChannels = [
    {
      title: 'Support & General Inquiries',
      email: 'support@bizreels.in',
      phone: '+91 98765 43210',
      timing: 'Monday - Saturday: 9:30 AM - 7:00 PM IST',
      description: 'Questions about orders, video reels, vendor onboarding, or account settings.',
      icon: FiMail,
      badge: 'Customer Care',
    },
    {
      title: 'Statutory Grievance & Privacy Officer',
      email: 'grievance@bizreels.in',
      timing: 'Acknowledgment within 48 Hours | Resolution in 30 Days',
      description: 'DPDPA 2023 compliance, data access/erasure requests, and legal dispute redressal.',
      icon: FiShield,
      badge: '48h SLA Response',
    },
    {
      title: 'Merchant & Creator Partnerships',
      email: 'partners@bizreels.in',
      timing: 'Monday - Friday: 10:00 AM - 6:00 PM IST',
      description: 'Brand campaigns, agency collaborations, API integrations, and bulk advertising.',
      icon: FiZap,
      badge: 'B2B & Agencies',
    },
  ];

  const faqs = [
    {
      q: 'How does BizReels escrow protect my payment?',
      a: 'When paying online via Razorpay, funds are securely held in platform escrow until the vendor delivers the product or service. Once verified or 24 hours elapse without disputes, payout is released.',
    },
    {
      q: 'How fast are customer refunds processed?',
      a: 'Prepaid order cancellations trigger an instant 100% automated refund via Razorpay Refund API directly back to your source account (UPI within 24h, cards/netbanking 3-5 days).',
    },
    {
      q: 'How do vendors verify their business on BizReels?',
      a: 'Vendors can submit their GSTIN or business registration proof in the Vendor Business Profile. Once vetted by our admin team, your shop gains the Blue Verified Trust Badge.',
    },
    {
      q: 'Can creators receive brand shoot sponsorships?',
      a: 'Yes! Creators can publish their video showcase reels and commercial rate cards in our Creator Marketplace where verified local vendors can hire them with milestone-based escrow.',
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill out your Name, Email, and Message.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Post to public contact endpoint
      await api.post('/v1/contact', formData);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'general',
        message: '',
      });
    } catch (err) {
      // Even if network fails, provide friendly fallback
      setError(
        err.response?.data?.message ||
          'Failed to send message. Please write to support@bizreels.in directly.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      'name': 'Contact Us — BizReels',
      'url': 'https://bizreels.in/contact',
      'description':
        'Contact BizReels customer support, vendor onboarding desk, and designated Grievance Officer.',
      'mainEntity': {
        '@type': 'Organization',
        'name': 'BizReels',
        'url': 'https://bizreels.in/',
        'contactPoint': [
          {
            '@type': 'ContactPoint',
            'email': 'support@bizreels.in',
            'contactType': 'Customer Support',
            'areaServed': 'IN',
            'availableLanguage': ['en', 'hi'],
          },
          {
            '@type': 'ContactPoint',
            'email': 'grievance@bizreels.in',
            'contactType': 'Grievance Officer',
            'areaServed': 'IN',
          },
        ],
      },
    },
  ];

  return (
    <div
      className="overflow-x-hidden font-sans antialiased selection:bg-[#d99a3d] selection:text-[#1a1a1a]"
      style={{ backgroundColor: '#f2ede4', minHeight: '100vh' }}
    >
      <SEO
        title="Contact Us — BizReels"
        description="Get in touch with BizReels. Dedicated support for buyers, verified merchants, visual creators, and statutory Grievance Redressal."
        canonicalUrl="https://bizreels.in/contact"
        structuredData={structuredData}
      />

      {/* ── 1. HERO BANNER — Bento Dark Container ─────────────────────── */}
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
                  We&apos;re Here To Help
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
                  GET IN TOUCH <br />
                  <span style={{ color: '#d99a3d' }}>WITH BIZREELS.</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.35 }}
                  className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal"
                >
                  Whether you are a customer needing order support, a local merchant looking to scale your store with video reels, an ambitious creator, or require statutory grievance assistance — we&apos;re ready to assist.
                </motion.p>

                {/* Quick Spec Pills */}
                <div className="pt-3 flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[#d99a3d]">⚡</span>
                    <span>Avg. Response: <strong>&lt; 4 Hours</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-emerald-400">🛡️</span>
                    <span>Grievance Desk: <strong>48h SLA Guarantee</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                    <span>🇮🇳</span>
                    <span>Headquarters: <strong>India</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. MAIN BENTO CONTAINER (Channels + Contact Form) ─────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 14px 48px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN: Official Channels & Details (5 Cols) */}
          <aside className="lg:col-span-5 space-y-4">
            
            {/* Communication Channel Cards */}
            <div className="space-y-3">
              {contactChannels.map((ch, idx) => {
                const Icon = ch.icon;
                return (
                  <div
                    key={ch.title}
                    className="p-5 rounded-2xl bg-white border-2 border-[#241b15] shadow-xs space-y-3 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-[#e3dccb] pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-bold shrink-0">
                          <Icon size={16} />
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm text-[#1a1a1a]">
                          {ch.title}
                        </h3>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#faf7f2] border border-[#e3dccb] text-slate-700 shrink-0">
                        {ch.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {ch.description}
                    </p>

                    <div className="pt-1 flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between bg-[#faf7f2] p-2 rounded-xl border border-[#e3dccb]">
                        <a
                          href={`mailto:${ch.email}`}
                          className="font-bold text-[#1a1a1a] hover:text-[#d99a3d] underline text-xs truncate"
                        >
                          {ch.email}
                        </a>
                        <button
                          onClick={() => handleCopyEmail(ch.email)}
                          type="button"
                          className="text-slate-400 hover:text-[#1a1a1a] p-1 cursor-pointer"
                          title="Copy Email"
                        >
                          <FiCopy size={13} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <FiClock size={12} className="text-[#d99a3d] shrink-0" />
                        <span>{ch.timing}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Operating Entity Notice */}
            <div className="p-4 rounded-2xl bg-[#241b15] text-white border-2 border-[#241b15] shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-[#d99a3d] font-black text-xs uppercase tracking-wider">
                <FiMapPin size={15} />
                <span>Operating Entity &amp; Jurisdiction</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                <strong className="text-white">BizReels Technologies India</strong>
                <br />
                Operating across all major commercial hubs and postal pincodes in India.
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Governed under Indian IT Act 2000</span>
                <Link to="/privacy-policy" className="text-[#d99a3d] hover:underline font-bold">
                  View Privacy Policy &rarr;
                </Link>
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: Interactive Send Message Form + FAQs (7 Cols) */}
          <main className="lg:col-span-7 space-y-6">
            
            {/* Contact Form Container */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-[#241b15] shadow-xs space-y-5">
              <div className="border-b border-[#e3dccb] pb-4">
                <h2
                  style={{ fontFamily: "'Archivo Black', sans-serif" }}
                  className="text-base sm:text-xl font-black text-[#1a1a1a] uppercase tracking-wide"
                >
                  SEND US A DIRECT MESSAGE
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Fill out the form below and our dedicated team will get back to you promptly.
                </p>
              </div>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <FiCheckCircle size={24} />
                  </div>
                  <h3 className="font-black text-base text-emerald-950">
                    Message Delivered Successfully!
                  </h3>
                  <p className="text-xs text-emerald-900 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out to BizReels. We have logged your request and a member of our customer care team will respond to your email within 4 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-[#241b15] text-[#d99a3d] font-bold text-xs hover:opacity-90 transition cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                      <FiAlertCircle className="shrink-0 mt-0.5 text-red-600" size={15} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#1a1a1a]">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3.5 py-2.5 bg-[#faf7f2] rounded-xl border border-[#e3dccb] text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d99a3d]"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#1a1a1a]">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="rahul@example.com"
                        className="w-full px-3.5 py-2.5 bg-[#faf7f2] rounded-xl border border-[#e3dccb] text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d99a3d]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#1a1a1a]">
                        Mobile Number (Optional)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 bg-[#faf7f2] rounded-xl border border-[#e3dccb] text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d99a3d]"
                      />
                    </div>

                    {/* Inquiry Category */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#1a1a1a]">
                        Topic / Category
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-[#faf7f2] rounded-xl border border-[#e3dccb] text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d99a3d]"
                      >
                        <option value="general">General Inquiry / Feedback</option>
                        <option value="vendor_onboarding">Vendor Onboarding &amp; Store Setup</option>
                        <option value="creator_marketplace">Creator Marketplace &amp; Collaborations</option>
                        <option value="order_refund">Order, Escrow &amp; Refund Assistance</option>
                        <option value="grievance">Statutory Grievance Redressal</option>
                        <option value="b2b_partnership">B2B &amp; Brand Partnership</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#1a1a1a]">
                      Your Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please provide clear details about your question, store link, or inquiry..."
                      className="w-full px-3.5 py-2.5 bg-[#faf7f2] rounded-xl border border-[#e3dccb] text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d99a3d]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      🔒 Your information is confidential under DPDPA 2023.
                    </span>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#d99a3d] text-[#1a1a1a] hover:bg-[#eab35b] font-bold text-xs transition cursor-pointer border-none shadow-xs disabled:opacity-50"
                    >
                      {submitting ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <FiSend size={13} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Quick Resolution FAQs */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border-2 border-[#241b15] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e3dccb] pb-3">
                <div className="w-8 h-8 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-bold">
                  <FiHelpCircle size={16} />
                </div>
                <h3
                  style={{ fontFamily: "'Archivo Black', sans-serif" }}
                  className="text-sm font-black uppercase text-[#1a1a1a]"
                >
                  Quick Answers &amp; Common Questions
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {faqs.map((faq) => (
                  <div
                    key={faq.q}
                    className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-1.5"
                  >
                    <h4 className="text-xs font-bold text-[#1a1a1a]">{faq.q}</h4>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed font-normal">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Callout Bento Box */}
            <div className="p-6 rounded-2xl bg-[#241b15] text-white space-y-3 border-2 border-[#241b15] text-center sm:text-left sm:flex sm:items-center sm:justify-between">
              <div>
                <h4
                  style={{ fontFamily: "'Archivo Black', sans-serif" }}
                  className="text-base uppercase text-[#d99a3d]"
                >
                  Looking to Sell or Create?
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Launch your storefront reels or join the creator marketplace right now.
                </p>
              </div>

              <div className="pt-2 sm:pt-0 flex items-center justify-center gap-2.5">
                <button
                  onClick={() => navigate('/auth/register?role=vendor')}
                  className="px-4 py-2 bg-[#d99a3d] text-[#1a1a1a] hover:bg-[#eab35b] text-xs font-black rounded-xl transition cursor-pointer border-none"
                >
                  Become Vendor
                </button>
                <button
                  onClick={() => navigate('/creator-marketplace')}
                  className="px-4 py-2 bg-white/10 text-white hover:bg-white/20 text-xs font-black rounded-xl transition border border-white/20 cursor-pointer"
                >
                  Explore Creators
                </button>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
