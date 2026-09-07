import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import { FiArrowRight, FiHeart, FiZap, FiStar, FiUsers, FiGlobe, FiTarget } from 'react-icons/fi';

const openings = [
  {
    title: 'Full Stack Developer',
    department: 'Engineering',
    type: 'Full-time',
    location: 'Jaipur / Remote',
    description: 'Build and scale BizReels\' core platform — from real-time feeds to payment processing.',
  },
  {
    title: 'React Native Developer',
    department: 'Mobile',
    type: 'Full-time',
    location: 'Jaipur / Remote',
    description: 'Develop the BizReels mobile app with smooth video playback, push notifications, and native integrations.',
  },
  {
    title: 'UI/UX Designer',
    department: 'Design',
    type: 'Full-time',
    location: 'Jaipur / Remote',
    description: 'Design beautiful, intuitive interfaces that make BizReels a joy to use for vendors, creators, and customers.',
  },
  {
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    type: 'Full-time',
    location: 'Jaipur',
    description: 'Drive user acquisition and retention through data-driven marketing campaigns across channels.',
  },
  {
    title: 'Content & Community Manager',
    department: 'Marketing',
    type: 'Full-time',
    location: 'Jaipur / Remote',
    description: 'Create engaging content, manage social channels, and build the BizReels vendor community.',
  },
  {
    title: 'Customer Success Associate',
    department: 'Support',
    type: 'Full-time',
    location: 'Jaipur',
    description: 'Help vendors onboard, troubleshoot issues, and get the most value out of BizReels.',
  },
];

const values = [
  { icon: <FiZap style={{ width: 22, height: 22 }} />, title: 'Move Fast', desc: 'We ship frequently, iterate quickly, and don\'t wait for perfect.' },
  { icon: <FiHeart style={{ width: 22, height: 22 }} />, title: 'Customer First', desc: 'Every decision starts with "How does this help our users grow?"' },
  { icon: <FiTarget style={{ width: 22, height: 22 }} />, title: 'Own It', desc: 'Take full ownership of your work, from idea to production and beyond.' },
  { icon: <FiGlobe style={{ width: 22, height: 22 }} />, title: 'Think Big', desc: 'We\'re building for a billion Indians. Design for scale from day one.' },
];

export default function Careers() {
  return (
    <div style={{ backgroundColor: '#f2ede4', minHeight: '100vh', padding: '40px 16px 60px' }}>
      <SEO
        title="Careers — Join BizReels"
        description="Join the BizReels team and help build India's leading visual commerce platform. Explore open positions in engineering, design, marketing, and more."
        canonical="https://bizreels.in/careers"
      />

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', backgroundColor: '#241b15', borderRadius: 20, marginBottom: 16 }}>
            <FiStar style={{ color: '#d99a3d', width: 14, height: 14 }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#d99a3d', textTransform: 'uppercase', letterSpacing: '0.08em' }}>We're Hiring</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.5px', marginBottom: 10, fontFamily: "'Manrope', system-ui, sans-serif" }}>
            Build the Future of Visual Commerce
          </h1>
          <p style={{ fontSize: 14, color: '#7a756b', fontWeight: 600, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            BizReels is transforming how Indian businesses connect with customers. Join us and make an impact.
          </p>
        </div>

        {/* Values */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16, marginBottom: 44,
        }}>
          {values.map((v) => (
            <div
              key={v.title}
              style={{
                backgroundColor: '#241b15', borderRadius: 16, padding: '22px 18px',
                textAlign: 'center', color: '#d99a3d',
              }}
            >
              <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>{v.icon}</div>
              <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, color: '#f2ede4' }}>{v.title}</h3>
              <p style={{ fontSize: 12, lineHeight: 1.55, color: '#8a8578', fontWeight: 500 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Open Positions */}
        <div style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 20, textAlign: 'center' }}>
            Open Positions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {openings.map((job) => (
              <a
                key={job.title}
                href={`mailto:careers@bizreels.in?subject=Application: ${encodeURIComponent(job.title)}&body=Hi BizReels Team,%0D%0A%0D%0AI'm interested in the ${encodeURIComponent(job.title)} position.%0D%0A%0D%0A[Please attach your resume and share a brief intro]`}
                style={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                  gap: 12, padding: '18px 22px', backgroundColor: '#fff', borderRadius: 14,
                  border: '1px solid #e3dccb', textDecoration: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d99a3d'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e3dccb'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{job.title}</h3>
                  <p style={{ fontSize: 12, color: '#6a655b', fontWeight: 500, marginBottom: 6, lineHeight: 1.5 }}>{job.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', backgroundColor: '#f0ebe0', borderRadius: 20, color: '#5a5043' }}>{job.department}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', backgroundColor: '#f0ebe0', borderRadius: 20, color: '#5a5043' }}>{job.type}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', backgroundColor: '#f0ebe0', borderRadius: 20, color: '#5a5043' }}>{job.location}</span>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', backgroundColor: '#d99a3d', borderRadius: 10,
                  fontSize: 12, fontWeight: 800, color: '#1a1a1a', flexShrink: 0,
                }}>
                  Apply <FiArrowRight style={{ width: 13, height: 13 }} />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div style={{
          padding: '28px 24px', backgroundColor: '#241b15', borderRadius: 16, textAlign: 'center',
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#d99a3d', marginBottom: 8 }}>
            Don't see the right role?
          </h3>
          <p style={{ fontSize: 13, color: '#8a8578', fontWeight: 500, marginBottom: 16, maxWidth: 440, margin: '0 auto 16px' }}>
            We're always looking for talented people. Send us your resume and tell us how you can contribute.
          </p>
          <a
            href="mailto:careers@bizreels.in?subject=General Application"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', backgroundColor: '#d99a3d', color: '#1a1a1a',
              fontSize: 13, fontWeight: 800, borderRadius: 12, textDecoration: 'none',
            }}
          >
            Send Your Resume <FiArrowRight style={{ width: 15, height: 15 }} />
          </a>
        </div>
      </div>
    </div>
  );
}
