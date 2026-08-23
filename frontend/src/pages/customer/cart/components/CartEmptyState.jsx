import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiCompass, FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function CartEmptyState() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#e3dccb] rounded-3xl p-8 sm:p-14 text-center max-w-lg mx-auto shadow-xs space-y-6"
    >
      <div className="w-20 h-20 bg-[#241b15] text-[#d99a3d] rounded-3xl flex items-center justify-center mx-auto shadow-md border-2 border-[#d99a3d]/20">
        <FiShoppingBag className="w-9 h-9" />
      </div>

      <div className="space-y-2">
        <h2 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl font-black text-[#1a1a1a] uppercase tracking-tight">
          Your Cart is Empty
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Looks like you haven't added any products or services to your cart yet. Explore local vendors and reels to find great deals!
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={() => navigate('/customer/home')}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-xs font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer border-none"
        >
          <FiCompass size={15} />
          <span>Explore Feed</span>
        </button>

        <button
          onClick={() => navigate('/customer/search')}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#f8f4ec] hover:bg-[#eae3d2] text-[#1a1a1a] text-xs font-bold transition border border-[#e3dccb] flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <FiZap size={15} className="text-[#d99a3d]" />
          <span>Search Products</span>
        </button>
      </div>
    </motion.div>
  );
}
