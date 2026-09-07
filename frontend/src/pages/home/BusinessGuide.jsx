import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import { FiArrowRight, FiPlay, FiTarget, FiTrendingUp, FiShield, FiCheckCircle, FiZap, FiUsers, FiShoppingBag } from 'react-icons/fi';

const guides = [
  {
    icon: <FiPlay style={{ width: 20, height: 20 }} />,
    title: 'Create Compelling Reels',
    tips: [
      'Keep reels under 60 seconds — focus on one product or service per reel.',
      'Use natural lighting and a clean background for professional-looking videos.',
      'Start with a hook in the first 3 seconds to capture attention.',
      'Show the product in action — demonstrate, don\'t just describe.',
      'Add text overlays with key details like pricing and contact info.',
    ],
  },
  {
    icon: <FiTarget style={{ width: 20, height: 20 }} />,
    title: 'Optimize Your Listings',
    tips: [
      'Write clear, keyword-rich titles that describe exactly what you offer.',
      'Upload at least 4 high-quality images from different angles.',
      'Set competitive pricing and clearly state what\'s included.',
      'Fill in all listing fields — complete listings get 3x more visibility.',
      'Categorize correctly to appear in the right search results.',
    ],
  },
  {
    icon: <FiTrendingUp style={{ width: 20, height: 20 }} />,
    title: 'Generate More Leads',
    tips: [
      'Respond to inquiries within 30 minutes — fast response = higher conversion.',
      'Use the Boost feature to get your reels seen by more potential customers.',
      'Encourage satisfied customers to leave reviews on your profile.',
      'Share your BizReels profile link on WhatsApp, social media, and business cards.',
      'Post new reels regularly — active vendors get 5x more impressions.',
    ],
  },
  {
    icon: <FiShield style={{ width: 20, height: 20 }} />,
    title: 'Build Trust & Credibility',
    tips: [
      'Complete KYC verification to get the verified badge — it boosts trust by 70%.',
      'Upload a professional business logo and cover image.',
      'Keep your business information (address, phone, hours) always updated.',
      'Respond professionally to all inquiries, even ones that don\'t convert.',
      'Showcase certifications, awards, or industry affiliations in your profile.',
    ],
  },
  {
    icon: <FiUsers style={{ width: 20, height: 20 }} />,
    title: 'Grow Your Customer Base',
    tips: [
      'Use BizReels analytics to understand which products get the most interest.',
      'Create seasonal or festival-themed reels to tap into trending searches.',
      'Offer introductory pricing or limited-time deals to attract first-time buyers.',
      'Build relationships — follow up with leads even after the first interaction.',
      'Consider hiring a BizReels Creator for professional reel production.',
    ],
  },
  {
    icon: <FiShoppingBag style={{ width: 20, height: 20 }} />,
    title: 'Convert Views to Sales',
    tips: [
      'Include clear calls-to-action in every reel: "Call Now", "DM for Price", etc.',
      'Reply to WhatsApp messages quickly with product details and pricing.',
      'Offer multiple contact options — WhatsApp, call, and chat.',
      'Follow up with interested leads within 24 hours.',
      'Track your conversion rate in the Analytics dashboard and optimize accordingly.',
    ],
  },
];

export default function BusinessGuide() {
  return (
    <div style={{ backgroundColor: '#f2ede4', minHeight: '100vh', padding: '40px 16px 60px' }}>
      <SEO
        title="Business Guide — BizReels"
        description="Learn how to grow your business on BizReels. Tips for creating reels, optimizing listings, generating leads, and building customer trust."
        canonical="https://bizreels.in/business-guide"
      />

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.5px', marginBottom: 10, fontFamily: "'Manrope', system-ui, sans-serif" }}>
            Business Growth Guide
          </h1>
          <p style={{ fontSize: 14, color: '#7a756b', fontWeight: 600, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Actionable strategies to maximize your success on BizReels. Follow these proven tips to generate more leads and grow your business.
          </p>
          <div style={{ width: 40, height: 3, backgroundColor: '#d99a3d', borderRadius: 2, margin: '16px auto 0' }} />
        </div>

        {/* Guides */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {guides.map((guide, idx) => (
            <div
              key={guide.title}
              style={{
                backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
                border: '1px solid #e3dccb',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px',
                backgroundColor: idx % 2 === 0 ? '#241b15' : '#d99a3d',
                color: idx % 2 === 0 ? '#d99a3d' : '#1a1a1a',
              }}>
                {guide.icon}
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{guide.title}</h2>
              </div>
              <div style={{ padding: '18px 22px' }}>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {guide.tips.map((tip, tipIdx) => (
                    <li key={tipIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <FiCheckCircle style={{ width: 16, height: 16, color: '#d99a3d', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13.5, lineHeight: 1.65, color: '#4a4640', fontWeight: 500 }}>
                        {tip}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 44, padding: '28px 24px', backgroundColor: '#241b15', borderRadius: 16, textAlign: 'center',
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#d99a3d', marginBottom: 8 }}>
            Ready to put these tips into action?
          </h3>
          <p style={{ fontSize: 13, color: '#8a8578', fontWeight: 500, marginBottom: 20, maxWidth: 440, margin: '0 auto 20px' }}>
            Create your free vendor account and start listing your products and services today.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/auth/register?role=vendor" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', backgroundColor: '#d99a3d', color: '#1a1a1a',
              fontSize: 13, fontWeight: 800, borderRadius: 12, textDecoration: 'none',
            }}>
              Start for Free <FiArrowRight style={{ width: 15, height: 15 }} />
            </Link>
            <Link to="/pricing" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#c9c4bb',
              fontSize: 13, fontWeight: 700, borderRadius: 12, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
