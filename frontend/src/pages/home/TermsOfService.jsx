import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';

export default function TermsOfService() {
  const effectiveDate = 'September 1, 2026';

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing or using BizReels ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use the Platform. We may update these Terms from time to time; continued use after changes constitutes acceptance.`,
    },
    {
      title: '2. Description of Service',
      content: `BizReels is a visual commerce platform that connects businesses, content creators, and buyers through short-form video content (reels). The Platform enables vendors to list products and services, creators to produce content, and customers to discover, engage, and transact with businesses.`,
    },
    {
      title: '3. User Accounts',
      content: `To access certain features, you must register and create an account. You agree to provide accurate, current, and complete information, and to update it as needed. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. BizReels reserves the right to suspend or terminate accounts that violate these Terms.`,
    },
    {
      title: '4. User Roles & Responsibilities',
      items: [
        'Customers may browse, search, save, and interact with listings and reels.',
        'Vendors may list products/services, upload reels, manage orders, and respond to leads. Vendors must ensure all listed products comply with applicable laws and regulations.',
        'Creators may offer content creation services, manage portfolios, and collaborate with vendors. All content must be original or properly licensed.',
      ],
    },
    {
      title: '5. Content Standards',
      content: `Users must not upload, post, or transmit content that is unlawful, harmful, threatening, abusive, defamatory, obscene, or otherwise objectionable. BizReels reserves the right to remove any content and suspend accounts that violate these standards, at our sole discretion and without prior notice.`,
    },
    {
      title: '6. Payments & Transactions',
      content: `Certain features require payment, including subscription plans, credit purchases, and reel boost services. All payments are processed through Razorpay. Prices are listed in Indian Rupees (₹). Refund policies are governed by BizReels Refund Policy. BizReels acts as a marketplace facilitator and is not a party to vendor-customer transactions.`,
    },
    {
      title: '7. Intellectual Property',
      content: `All content, trademarks, logos, and software on the Platform are the property of BizReels or its licensors. Users retain ownership of content they upload but grant BizReels a worldwide, non-exclusive, royalty-free license to use, display, and distribute such content on the Platform for promotional and operational purposes.`,
    },
    {
      title: '8. Prohibited Activities',
      items: [
        'Using the Platform for any illegal purpose or in violation of any laws.',
        'Scraping, crawling, or using automated tools to extract data from the Platform.',
        'Interfering with or disrupting the Platform or its servers.',
        'Impersonating another person or entity.',
        'Posting fake reviews, misleading listings, or fraudulent content.',
        'Attempting to circumvent BizReels payment systems or commission structures.',
      ],
    },
    {
      title: '9. KYC & Verification',
      content: `Vendors and Creators may be required to complete Know Your Customer (KYC) verification. This may include submitting identity documents, business registration proofs, and other information. Failure to complete KYC may result in restricted access to certain features including lead management, payouts, and verified badges.`,
    },
    {
      title: '10. Limitation of Liability',
      content: `BizReels is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, BizReels shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, even if BizReels has been advised of the possibility of such damages. Our total liability shall not exceed the amount paid by you to BizReels in the twelve (12) months preceding the claim.`,
    },
    {
      title: '11. Indemnification',
      content: `You agree to indemnify and hold harmless BizReels, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses (including legal fees) arising from your use of the Platform, your content, or your violation of these Terms.`,
    },
    {
      title: '12. Termination',
      content: `BizReels may terminate or suspend your account at any time for any reason, including violation of these Terms. Upon termination, your right to use the Platform ceases immediately. Provisions that by their nature should survive termination shall continue to apply.`,
    },
    {
      title: '13. Governing Law & Dispute Resolution',
      content: `These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts in Jaipur, Rajasthan, India.`,
    },
    {
      title: '14. Contact Us',
      content: `If you have any questions about these Terms, please contact us at support@bizreels.in or through our Contact Us page.`,
    },
  ];

  return (
    <div style={{ backgroundColor: '#f2ede4', minHeight: '100vh', padding: '40px 16px 60px' }}>
      <SEO
        title="Terms of Service — BizReels"
        description="Read the Terms of Service for BizReels. Learn about user agreements, account policies, payments, content standards, and more."
        canonical="https://bizreels.in/terms-of-service"
      />

      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.5px', marginBottom: 8, fontFamily: "'Manrope', system-ui, sans-serif" }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 13, color: '#7a756b', fontWeight: 600 }}>
            Effective Date: {effectiveDate}
          </p>
          <div style={{ width: 40, height: 3, backgroundColor: '#d99a3d', borderRadius: 2, marginTop: 12 }} />
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {sections.map((section) => (
            <div key={section.title}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 10, fontFamily: "'Manrope', system-ui, sans-serif" }}>
                {section.title}
              </h2>
              {section.content && (
                <p style={{ fontSize: 14, lineHeight: 1.75, color: '#4a4640', fontWeight: 500 }}>
                  {section.content}
                </p>
              )}
              {section.items && (
                <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {section.items.map((item, idx) => (
                    <li key={idx} style={{ fontSize: 14, lineHeight: 1.75, color: '#4a4640', fontWeight: 500 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer link */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #d8d2c5', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/privacy-policy" style={{ fontSize: 13, fontWeight: 700, color: '#d99a3d', textDecoration: 'none' }}>
            Privacy Policy →
          </Link>
          <Link to="/contact" style={{ fontSize: 13, fontWeight: 700, color: '#d99a3d', textDecoration: 'none' }}>
            Contact Us →
          </Link>
        </div>
      </div>
    </div>
  );
}
