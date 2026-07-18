import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiPlus, FiShoppingBag, FiTool, FiClock, FiCheckCircle, FiDollarSign, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MyRequirementsPage() {
  const [activeTab, setActiveTab] = useState('product'); // 'product' | 'service'
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/requirements');
      const data = await res.json();
      const list = data.data?.requirements || data.requirements || [
        {
          _id: 'req-1',
          type: 'product',
          title: 'Bulk Order: 10 Gaming Laptops i7 16GB RAM',
          category: 'Electronics',
          budget: 750000,
          quantity: 10,
          status: 'active',
          quotesReceived: 3,
          createdAt: '2026-07-15'
        },
        {
          _id: 'req-2',
          type: 'service',
          title: 'Full House Interior Designing & Woodwork',
          category: 'Services',
          budget: 400000,
          quantity: 1,
          status: 'active',
          quotesReceived: 5,
          createdAt: '2026-07-12'
        }
      ];
      setRequirements(list);
    } catch (err) {
      toast.error('Failed to load requirements');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequirements = requirements.filter(
    (r) => (r.type || 'product') === activeTab
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiFileText className="text-indigo-400" />
            <span>My Requirements</span>
          </h2>
          <p className="text-xs text-slate-400">Manage your product and service requests and review vendor quotes</p>
        </div>

        <Link
          to="/customer/post-requirement"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:opacity-90 transition"
        >
          <FiPlus size={16} />
          <span>Post New Requirement</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('product')}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold border-b-2 transition ${activeTab === 'product'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
            }`}
        >
          <FiShoppingBag size={16} />
          <span>Product Requirements</span>
        </button>

        <button
          onClick={() => setActiveTab('service')}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold border-b-2 transition ${activeTab === 'service'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
            }`}
        >
          <FiTool size={16} />
          <span>Service Requirements</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading requirements...</div>
      ) : filteredRequirements.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <FiFileText size={36} className="mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300">No {activeTab} requirements posted yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Post your first requirement to get competitive quotes directly from verified vendors.
          </p>
          <Link
            to="/customer/post-requirement"
            className="inline-block mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
          >
            Post Requirement Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequirements.map((req) => (
            <div
              key={req._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition shadow-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {req.category}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">{req.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Budget: ₹{req.budget?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <FiClock size={13} className="text-slate-500" />
                    {req.createdAt}
                  </span>
                  <span className="flex items-center gap-1 text-purple-400 font-semibold">
                    <FiMessageSquare size={13} />
                    {req.quotesReceived || 0} Quotes Received
                  </span>
                </div>

                <Link
                  to="/customer/chat"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  View Vendor Responses
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
