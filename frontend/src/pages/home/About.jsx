import React from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiShield, FiHeart, FiGlobe, FiTv, FiUsers } from 'react-icons/fi';

const About = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const values = [
    { title: 'Hyper-Local Focus', desc: 'Connecting businesses and creators within real geographical boundaries to enhance community growth.', icon: FiGlobe },
    { title: 'Secure Escrow Ledger', desc: 'Ensuring creators are paid and businesses receive high-quality deliverables via automated wallets.', icon: FiShield },
    { title: 'Authentic Visuals First', desc: 'Replacing standard image-based catalogs with short video reels to build immediate buyer trust.', icon: FiTv },
    { title: 'Unified Accounts', desc: 'Allowing users to switch roles instantly (Buyer, Seller, or Creator) from a single user profile.', icon: FiUsers },
  ];

  return (
    <div className="overflow-x-hidden min-h-screen bg-surface-secondary py-16 px-6">
      {/* ── HEADER BANNER ──────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto text-center flex flex-col gap-6 mb-20 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-purple/5 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-4 z-10"
        >
          <motion.span
            variants={itemVariants}
            className="px-3.5 py-1 text-[10px] font-black bg-brand-purple/10 text-brand-purple rounded-full uppercase tracking-wider"
          >
            Who We Are
          </motion.span>
          <motion.h1
            variants={itemVariants}
            className="text-3xl sm:text-5xl font-black text-brand-navy leading-tight"
          >
            Reimagining Local Commerce Through <span className="gradient-text font-black">Video Marketing</span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed mt-2"
          >
            BizReels was founded to bridge the gap between brick-and-mortar storefronts and local content creators. By bringing requirements and video reels into a unified geolocation-based marketplace, we help community ecosystems thrive.
          </motion.p>
        </motion.div>
      </section>

      {/* ── MISSION & VISION (Split Layout) ────────────────────── */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 mb-24 items-center">
        <div className="flex flex-col gap-5">
          <h2 className="text-2xl font-black text-brand-navy">Our Mission</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Local physical stores represent the backbone of the economy, yet struggle to compete with massive digital e-commerce chains. Concurrently, thousands of talented local video creators search for regular paid work.
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            Our mission is to **unify these forces**. By creating a simple platform where local shops can request video content and creators can display their visual portfolios, we allow businesses to capture mobile screens and drive physical check-ins.
          </p>
        </div>
        <div className="glass p-6 rounded-premium border-white/50 shadow-glass relative">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80"
            alt="Local business visual marketing"
            className="w-full h-[240px] object-cover rounded-premium shadow-md"
          />
        </div>
      </section>

      {/* ── CORE VALUES GRID ───────────────────────────────────── */}
      <section className="max-w-5xl mx-auto flex flex-col gap-12">
        <div className="text-center flex flex-col gap-3">
          <h2 className="text-2xl font-black text-brand-navy">Core Values</h2>
          <p className="text-xs text-text-secondary">The principles that drive how we build BizReels every day.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {values.map((v, index) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="glass p-6 rounded-premium border-white/50 shadow-glass flex gap-4"
              >
                <div className="w-10 h-10 bg-brand-purple/10 text-brand-purple rounded-premium flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-black text-brand-navy">{v.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default About;
