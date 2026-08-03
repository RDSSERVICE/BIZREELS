import React from 'react';
import { motion } from 'framer-motion';
import { FiGlobe, FiShield, FiTv, FiUsers, FiTarget, FiHeart } from 'react-icons/fi';
import SEO from '../../components/common/SEO';

const About = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 120, damping: 20 }
    }
  };

  const values = [
    {
      title: 'Hyper-Local Focus',
      desc: 'Connecting businesses and creators within real geographical boundaries to enhance community growth.',
      icon: FiGlobe,
      accent: 'brand-purple',
    },
    {
      title: 'Secure Escrow Ledger',
      desc: 'Ensuring creators are paid and businesses receive high-quality deliverables via automated wallets.',
      icon: FiShield,
      accent: 'brand-orange',
    },
    {
      title: 'Authentic Visuals First',
      desc: 'Replacing standard image-based catalogs with short video reels to build immediate buyer trust.',
      icon: FiTv,
      accent: 'brand-pink',
    },
    {
      title: 'Unified Accounts',
      desc: 'Allowing users to switch roles instantly (Buyer, Seller, or Creator) from a single user profile.',
      icon: FiUsers,
      accent: 'brand-purple',
    },
  ];

  return (
    <div className="overflow-x-hidden min-h-screen bg-surface-secondary">
      <SEO 
        title="About Us"
        description="Learn more about BizReels - India's first AI-powered visual reels commerce platform connecting local vendors, creators, and buyers."
        url="https://bizreels.in/about"
      />
      {/* ── HEADER BANNER ──────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-10 sm:pb-14 overflow-hidden">
        {/* BG decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-brand-purple/[0.06] rounded-full blur-[120px]" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto text-center flex flex-col items-center gap-5 z-10 relative"
        >
          <motion.span
            variants={itemVariants}
            className="px-4 py-2 text-[11px] font-bold bg-brand-purple/[0.08] text-brand-purple rounded-full uppercase tracking-widest border border-brand-purple/[0.12]"
          >
            Who We Are
          </motion.span>
          <motion.h1
            variants={itemVariants}
            className="text-[1.75rem] leading-[1.2] sm:text-[2.5rem] md:text-[3rem] font-black text-brand-navy"
          >
            Reimagining Local Commerce Through{' '}
            <span className="gradient-text font-black">Video Marketing</span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-sm sm:text-base text-text-secondary max-w-2xl leading-relaxed"
          >
            BizReels was founded to bridge the gap between brick-and-mortar
            storefronts and local content creators. By bringing requirements
            and video reels into a unified geolocation-based marketplace, we
            help community ecosystems thrive.
          </motion.p>
        </motion.div>
      </section>

      {/* ── MISSION & VISION ────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Text */}
          <div className="flex flex-col gap-5 order-2 lg:order-1">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-brand-purple/[0.08] text-brand-purple flex items-center justify-center">
                <FiTarget className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold text-brand-purple uppercase tracking-widest">Our Mission</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-navy leading-tight">
              Bridging Local Commerce & Creative Talent
            </h2>
            <div className="flex flex-col gap-3">
              <p className="text-[13px] sm:text-sm text-text-secondary leading-relaxed">
                Local physical stores represent the backbone of the economy, yet
                struggle to compete with massive digital e-commerce chains.
                Concurrently, thousands of talented local video creators search
                for regular paid work.
              </p>
              <p className="text-[13px] sm:text-sm text-text-secondary leading-relaxed">
                Our mission is to <strong className="text-brand-navy font-semibold">unify these forces</strong>. By creating a
                simple platform where local shops can request video content and
                creators can display their visual portfolios, we allow businesses
                to capture mobile screens and drive physical check-ins.
              </p>
            </div>

            {/* Small stat row */}
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { val: '50+', label: 'Cities' },
                { val: '99.9%', label: 'Uptime' },
                { val: '24/7', label: 'Support' },
              ].map((s) => (
                <div key={s.label} className="bg-surface-tertiary/50 border border-border/40 rounded-xl p-3 text-center">
                  <div className="text-base sm:text-lg font-black text-brand-purple">{s.val}</div>
                  <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="relative order-1 lg:order-2">
            {/* Ambient glow */}
            <div className="absolute -inset-6 bg-brand-purple/[0.04] rounded-3xl blur-[40px] pointer-events-none" />
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border/60 shadow-card">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=700&q=80"
                alt="Local business visual marketing"
                className="w-full h-[220px] sm:h-[280px] lg:h-[320px] object-cover"
              />
              {/* Gradient overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/50 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE VALUES GRID ───────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-14 sm:py-20 bg-surface-tertiary/30 border-t border-b border-border/60">
        <div className="max-w-5xl mx-auto flex flex-col gap-10 sm:gap-12">
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-3">
            <span className="px-3.5 py-1.5 text-[11px] font-bold bg-brand-purple/[0.08] text-brand-purple rounded-full uppercase tracking-widest border border-brand-purple/[0.12]">
              Our Principles
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-navy">Core Values</h2>
            <p className="text-sm text-text-secondary max-w-md">
              The principles that drive how we build BizReels every day.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {values.map((v, index) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -3 }}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-border/60 shadow-card hover:shadow-card-hover transition-all duration-300 flex gap-4"
                >
                  <div className={`w-11 h-11 bg-${v.accent}/[0.08] text-${v.accent} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-[15px] font-bold text-brand-navy">{v.title}</h3>
                    <p className="text-[13px] text-text-secondary leading-relaxed">{v.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── OUR VISION BANNER ──────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-5">
          <span className="w-12 h-12 rounded-2xl bg-brand-pink/[0.08] text-brand-pink flex items-center justify-center">
            <FiHeart className="w-6 h-6" />
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-navy leading-tight">
            Our Vision for Tomorrow
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-xl">
            We envision a future where every neighbourhood vendor has access
            to professional video marketing, every creator has steady paid
            gigs, and every customer discovers authentic local services through
            engaging short-form content — all within a single, trustworthy platform.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;
