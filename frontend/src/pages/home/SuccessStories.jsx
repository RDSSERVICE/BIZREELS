import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import { FiArrowRight, FiTrendingUp, FiUsers, FiZap, FiStar, FiTarget } from 'react-icons/fi';

const stories = [
  {
    name: 'Rohit Mehra',
    business: 'SolarBright Energy Solutions',
    city: 'Jaipur, Rajasthan',
    avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&auto=format&fit=crop&q=75',
    cover: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop&q=75',
    category: 'Solar & Energy',
    quote: 'BizReels helped us generate 500+ quality leads in just 30 days. Sales increased by 40%. The reel format makes it easy to showcase our installations.',
    stats: { leads: '500+', growth: '40%', reels: 12 },
  },
  {
    name: 'Priya Sharma',
    business: 'Glow Studio Bridal Makeup',
    city: 'Delhi, NCR',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&auto=format&fit=crop&q=75',
    cover: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=75',
    category: 'Beauty & Salon',
    quote: 'Our bookings tripled in the first month on BizReels. Brides love watching before-and-after transformation reels before choosing their makeup artist.',
    stats: { leads: '300+', growth: '200%', reels: 24 },
  },
  {
    name: 'Amit Patel',
    business: 'Prestige Auto Rentals',
    city: 'Mumbai, Maharashtra',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&auto=format&fit=crop&q=75',
    cover: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=75',
    category: 'Vehicles',
    quote: 'We went from 5 inquiries a week to 50+ daily. BizReels showcases our fleet beautifully and customers can see exactly what they\'re renting.',
    stats: { leads: '1.2K', growth: '120%', reels: 18 },
  },
  {
    name: 'Sneha Reddy',
    business: 'Apex Interior Designs',
    city: 'Hyderabad, Telangana',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&auto=format&fit=crop&q=75',
    cover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=75',
    category: 'Real Estate',
    quote: 'Short reels of our completed projects convert better than any brochure. We\'ve won 15 commercial contracts directly through BizReels leads.',
    stats: { leads: '200+', growth: '85%', reels: 32 },
  },
  {
    name: 'Karan Singh',
    business: 'TechByte Electronics',
    city: 'Bangalore, Karnataka',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&auto=format&fit=crop&q=75',
    cover: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=75',
    category: 'Electronics',
    quote: 'Product demo reels on BizReels consistently outperform our social media ads. The lead quality is exceptional — people who reach out are ready to buy.',
    stats: { leads: '800+', growth: '65%', reels: 45 },
  },
  {
    name: 'Deepa Joshi',
    business: 'Organic Wellness Hub',
    city: 'Pune, Maharashtra',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&auto=format&fit=crop&q=75',
    cover: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=600&auto=format&fit=crop&q=75',
    category: 'Health & Wellness',
    quote: 'BizReels gives us local visibility that no other platform offers. Our organic product orders went up 3x within two months of joining.',
    stats: { leads: '450+', growth: '180%', reels: 20 },
  },
];

export default function SuccessStories() {
  return (
    <div style={{ backgroundColor: '#f2ede4', minHeight: '100vh', padding: '40px 16px 60px' }}>
      <SEO
        title="Success Stories — BizReels"
        description="See how businesses across India are growing with BizReels. Real stories, real results from vendors using visual commerce."
        canonical="https://bizreels.in/success-stories"
      />

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', backgroundColor: '#241b15', borderRadius: 20, marginBottom: 16 }}>
            <FiStar style={{ color: '#d99a3d', width: 14, height: 14 }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#d99a3d', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Real Results</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.5px', marginBottom: 10, fontFamily: "'Manrope', system-ui, sans-serif" }}>
            Success Stories
          </h1>
          <p style={{ fontSize: 14, color: '#7a756b', fontWeight: 600, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Businesses across India are transforming their growth with BizReels. Here are their stories.
          </p>
        </div>

        {/* Stories Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {stories.map((story) => (
            <div
              key={story.name}
              style={{
                backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
                border: '1px solid #e3dccb', transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Cover Image */}
              <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                <img
                  src={story.cover} alt={story.business}
                  loading="lazy" decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', top: 10, right: 10, padding: '4px 10px',
                  backgroundColor: '#d99a3d', borderRadius: 20,
                  fontSize: 10, fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase',
                }}>
                  {story.category}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '16px 18px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <img
                    src={story.avatar} alt={story.name}
                    loading="lazy" decoding="async"
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e3dccb' }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a' }}>{story.name}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#8a8578' }}>{story.business}</div>
                  </div>
                </div>

                <p style={{ fontSize: 13, lineHeight: 1.65, color: '#4a4640', fontWeight: 500, marginBottom: 14 }}>
                  "{story.quote}"
                </p>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 12, paddingTop: 12, borderTop: '1px solid #f0ebe0' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#d99a3d' }}>{story.stats.leads}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#8a8578', textTransform: 'uppercase' }}>Leads</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#2a9d5c' }}>↑{story.stats.growth}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#8a8578', textTransform: 'uppercase' }}>Growth</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>{story.stats.reels}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#8a8578', textTransform: 'uppercase' }}>Reels</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 44, padding: '28px 24px', backgroundColor: '#d99a3d', borderRadius: 16,
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>Ready to write your success story?</h3>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3a2f1f' }}>Join thousands of businesses growing with BizReels.</p>
          </div>
          <Link to="/auth/register?role=vendor" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', backgroundColor: '#1a1a1a', color: '#d99a3d',
            fontSize: 13, fontWeight: 800, borderRadius: 12, textDecoration: 'none',
          }}>
            Get Started Free <FiArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
