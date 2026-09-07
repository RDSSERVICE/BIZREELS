import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import { FiArrowRight, FiClock, FiTag } from 'react-icons/fi';

const blogPosts = [
  {
    title: 'How Short-Form Video is Revolutionizing B2B Sales in India',
    excerpt: 'Discover how businesses are using 60-second product reels to generate 10x more qualified leads compared to traditional marketing methods.',
    cover: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=75',
    date: 'Sep 3, 2026',
    readTime: '5 min read',
    category: 'Industry Insights',
  },
  {
    title: '7 Tips to Create Product Reels That Actually Convert',
    excerpt: 'Learn the proven formula top vendors on BizReels use to create compelling product reels that turn viewers into paying customers.',
    cover: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=75',
    date: 'Aug 28, 2026',
    readTime: '4 min read',
    category: 'Tips & Tricks',
  },
  {
    title: 'The Rise of Visual Commerce: Why Reels Beat Static Listings',
    excerpt: 'Static product images are losing effectiveness. Here\'s why video-first commerce platforms like BizReels are the future of online selling.',
    cover: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=75',
    date: 'Aug 20, 2026',
    readTime: '6 min read',
    category: 'Industry Insights',
  },
  {
    title: 'Complete Guide to KYC Verification for Vendors',
    excerpt: 'Everything you need to know about BizReels vendor verification — what documents you need, how long it takes, and why it matters.',
    cover: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=600&auto=format&fit=crop&q=75',
    date: 'Aug 12, 2026',
    readTime: '3 min read',
    category: 'How-To',
  },
  {
    title: 'How Local Businesses Are Winning with Hyperlocal Marketing',
    excerpt: 'From neighborhood bakeries to city-wide real estate agents — how BizReels\' local feed helps businesses reach customers in their area.',
    cover: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=75',
    date: 'Aug 5, 2026',
    readTime: '5 min read',
    category: 'Case Study',
  },
  {
    title: 'BizReels Creator Program: Earn By Making Reels for Businesses',
    excerpt: 'Learn how content creators can join BizReels, build a portfolio, and earn money by creating professional reels for vendors.',
    cover: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=75',
    date: 'Jul 28, 2026',
    readTime: '4 min read',
    category: 'Creator Spotlight',
  },
];

export default function Blog() {
  return (
    <div style={{ backgroundColor: '#f2ede4', minHeight: '100vh', padding: '40px 16px 60px' }}>
      <SEO
        title="Blog — BizReels"
        description="Read the latest tips, insights, and success stories about visual commerce, business growth, and content creation on BizReels."
        canonical="https://bizreels.in/blog"
      />

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.5px', marginBottom: 10, fontFamily: "'Manrope', system-ui, sans-serif" }}>
            BizReels Blog
          </h1>
          <p style={{ fontSize: 14, color: '#7a756b', fontWeight: 600, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Tips, insights, and stories to help you grow your business with visual commerce.
          </p>
          <div style={{ width: 40, height: 3, backgroundColor: '#d99a3d', borderRadius: 2, margin: '16px auto 0' }} />
        </div>

        {/* Featured Post */}
        <div
          style={{
            backgroundColor: '#241b15', borderRadius: 20, overflow: 'hidden',
            marginBottom: 32, display: 'grid', gridTemplateColumns: '1fr',
          }}
          className="lg:grid-cols-2"
        >
          <div style={{ position: 'relative' }}>
            <img
              src={blogPosts[0].cover} alt={blogPosts[0].title}
              loading="eager" decoding="async"
              style={{ width: '100%', height: 260, objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', top: 12, left: 12, padding: '4px 12px',
              backgroundColor: '#d99a3d', borderRadius: 20,
              fontSize: 10, fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase',
            }}>
              Featured
            </div>
          </div>
          <div style={{ padding: '24px 24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#d99a3d' }}>{blogPosts[0].category}</span>
              <span style={{ fontSize: 11, color: '#6a655b' }}>•</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#8a8578' }}>{blogPosts[0].date}</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f2ede4', marginBottom: 10, lineHeight: 1.3 }}>
              {blogPosts[0].title}
            </h2>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: '#8a8578', fontWeight: 500, marginBottom: 16 }}>
              {blogPosts[0].excerpt}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8a8578', fontSize: 12, fontWeight: 600 }}>
              <FiClock style={{ width: 13, height: 13 }} /> {blogPosts[0].readTime}
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 20 }}>
          {blogPosts.slice(1).map((post) => (
            <div
              key={post.title}
              style={{
                backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
                border: '1px solid #e3dccb', transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <img
                src={post.cover} alt={post.title}
                loading="lazy" decoding="async"
                style={{ width: '100%', height: 150, objectFit: 'cover' }}
              />
              <div style={{ padding: '14px 16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#d99a3d', textTransform: 'uppercase' }}>{post.category}</span>
                  <span style={{ fontSize: 10, color: '#c9c4bb' }}>•</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#8a8578' }}>{post.date}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 8, lineHeight: 1.35 }}>
                  {post.title}
                </h3>
                <p style={{ fontSize: 12, lineHeight: 1.6, color: '#6a655b', fontWeight: 500, marginBottom: 12 }}>
                  {post.excerpt}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8a8578', fontSize: 11, fontWeight: 600 }}>
                  <FiClock style={{ width: 12, height: 12 }} /> {post.readTime}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div style={{
          marginTop: 44, padding: '28px 24px', backgroundColor: '#d99a3d', borderRadius: 16, textAlign: 'center',
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>
            Stay updated with the latest from BizReels
          </h3>
          <p style={{ fontSize: 13, color: '#3a2f1f', fontWeight: 600, marginBottom: 4 }}>
            New articles, tips, and feature updates delivered to your inbox.
          </p>
          <p style={{ fontSize: 12, color: '#5a4a2f', fontWeight: 500 }}>
            Subscribe via the newsletter in our footer below ↓
          </p>
        </div>
      </div>
    </div>
  );
}
