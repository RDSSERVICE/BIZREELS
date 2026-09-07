import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import { FiSearch, FiMessageCircle, FiBookOpen, FiMail, FiPhone, FiArrowRight, FiHelpCircle, FiShield, FiCreditCard, FiUsers, FiUpload, FiSettings } from 'react-icons/fi';

const faqCategories = [
  {
    icon: <FiUsers style={{ width: 20, height: 20 }} />,
    title: 'Getting Started',
    faqs: [
      { q: 'How do I create an account?', a: 'Click "Get Started" on the homepage and fill in your details. You can register as a Customer, Vendor, or Creator.' },
      { q: 'Is BizReels free to use?', a: 'Yes! Creating an account and browsing is completely free. Vendors can list products for free with a basic plan, and premium features are available via subscription.' },
      { q: 'What are the different user roles?', a: 'BizReels has three roles: Customers (browse & buy), Vendors (list products & services), and Creators (create reel content for vendors).' },
    ],
  },
  {
    icon: <FiUpload style={{ width: 20, height: 20 }} />,
    title: 'For Vendors',
    faqs: [
      { q: 'How do I list my product or service?', a: 'After registering as a vendor, go to your dashboard and click "Add Listing". Fill in the details, upload images, and publish.' },
      { q: 'How do I get more leads?', a: 'Upload high-quality reels showcasing your products, boost them for wider reach, complete your KYC for a verified badge, and respond promptly to inquiries.' },
      { q: 'What is the KYC verification process?', a: 'KYC involves uploading government ID, business registration, and a selfie. It typically takes 24-48 hours to review and helps build trust with customers.' },
    ],
  },
  {
    icon: <FiCreditCard style={{ width: 20, height: 20 }} />,
    title: 'Payments & Billing',
    faqs: [
      { q: 'What payment methods are accepted?', a: 'We accept UPI, credit/debit cards, net banking, and wallets via Razorpay — India\'s most trusted payment gateway.' },
      { q: 'How does the credit system work?', a: 'Credits are BizReels\' internal currency used for actions like boosting reels and revealing contact details. You can purchase credits from your Wallet page.' },
      { q: 'How do refunds work?', a: 'Refunds are processed as per our Refund Policy. For subscription cancellations, unused days may be pro-rated. Contact support for specific cases.' },
    ],
  },
  {
    icon: <FiShield style={{ width: 20, height: 20 }} />,
    title: 'Trust & Safety',
    faqs: [
      { q: 'How do you verify vendors?', a: 'We verify vendors through KYC documentation including government-issued IDs and business registration. Verified vendors receive a trust badge.' },
      { q: 'How do I report a fraudulent listing?', a: 'Click the report button on any listing or contact our support team. We investigate all reports within 24 hours.' },
      { q: 'Is my personal data safe?', a: 'Yes, we follow industry-standard encryption and data protection practices. Read our Privacy Policy for complete details.' },
    ],
  },
  {
    icon: <FiSettings style={{ width: 20, height: 20 }} />,
    title: 'Account & Settings',
    faqs: [
      { q: 'How do I change my password?', a: 'Go to Settings in your dashboard and click "Change Password". You can also use "Forgot Password" on the login page.' },
      { q: 'How do I delete my account?', a: 'Go to Settings > Account and click "Delete Account". Note that this action is irreversible and all your data will be permanently removed.' },
      { q: 'Can I switch between roles?', a: 'Yes! You can switch between Customer, Vendor, and Creator roles from your dashboard without creating separate accounts.' },
    ],
  },
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [openFaq, setOpenFaq] = React.useState(null);

  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return faqCategories;
    const q = searchQuery.toLowerCase();
    return faqCategories
      .map((cat) => ({
        ...cat,
        faqs: cat.faqs.filter(
          (faq) => faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.faqs.length > 0);
  }, [searchQuery]);

  return (
    <div style={{ backgroundColor: '#f2ede4', minHeight: '100vh', padding: '40px 16px 60px' }}>
      <SEO
        title="Help Center — BizReels"
        description="Find answers to frequently asked questions about BizReels. Learn about accounts, payments, listings, verification, and more."
        canonical="https://bizreels.in/help"
      />

      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#241b15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#d99a3d' }}>
            <FiHelpCircle style={{ width: 24, height: 24 }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.5px', marginBottom: 8, fontFamily: "'Manrope', system-ui, sans-serif" }}>
            Help Center
          </h1>
          <p style={{ fontSize: 14, color: '#7a756b', fontWeight: 600, maxWidth: 440, margin: '0 auto' }}>
            Find quick answers to your questions. Can't find what you need? Contact our support team.
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <FiSearch style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8a8578', width: 18, height: 18 }} />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px 14px 46px', fontSize: 14, fontWeight: 600,
              backgroundColor: '#fff', border: '1.5px solid #e3dccb', borderRadius: 12,
              outline: 'none', color: '#1a1a1a', fontFamily: 'inherit', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#d99a3d'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e3dccb'; }}
          />
        </div>

        {/* FAQ Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {filteredCategories.map((cat) => (
            <div key={cat.title} style={{ backgroundColor: '#fff', border: '1px solid #e3dccb', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #e3dccb', backgroundColor: '#faf7f0' }}>
                <div style={{ color: '#d99a3d' }}>{cat.icon}</div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>{cat.title}</h2>
              </div>
              <div>
                {cat.faqs.map((faq, idx) => {
                  const faqKey = `${cat.title}-${idx}`;
                  const isOpen = openFaq === faqKey;
                  return (
                    <div key={idx} style={{ borderBottom: idx < cat.faqs.length - 1 ? '1px solid #f0ebe0' : 'none' }}>
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : faqKey)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '14px 20px',
                          background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: 12, fontFamily: 'inherit',
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 700, color: isOpen ? '#d99a3d' : '#1a1a1a', transition: 'color 0.15s' }}>
                          {faq.q}
                        </span>
                        <span style={{
                          fontSize: 18, color: '#8a8578', transition: 'transform 0.2s',
                          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', flexShrink: 0,
                        }}>
                          +
                        </span>
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 20px 16px', fontSize: 13, lineHeight: 1.7, color: '#5a5650', fontWeight: 500 }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8a8578' }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>No results found for "{searchQuery}"</p>
              <p style={{ fontSize: 13 }}>Try a different search term or contact our support team.</p>
            </div>
          )}
        </div>

        {/* Contact Support Card */}
        <div style={{
          marginTop: 40, padding: 24, backgroundColor: '#241b15', borderRadius: 16,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#d99a3d' }}>Still need help?</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#8a8578', fontWeight: 500 }}>
            Our support team is available Monday to Saturday, 10 AM — 7 PM IST. We typically respond within 4 hours.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', backgroundColor: '#d99a3d', color: '#1a1a1a',
              fontSize: 13, fontWeight: 800, borderRadius: 10, textDecoration: 'none',
              transition: 'background 0.15s',
            }}>
              <FiMessageCircle style={{ width: 15, height: 15 }} /> Contact Support
            </Link>
            <a href="mailto:support@bizreels.in" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#c9c4bb',
              fontSize: 13, fontWeight: 700, borderRadius: 10, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <FiMail style={{ width: 15, height: 15 }} /> support@bizreels.in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
