import React, { useState } from 'react';
import { FiInbox, FiShoppingBag, FiTool, FiFileText, FiMessageCircle, FiPhone, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VendorLeadsPage() {
  const [activeTab, setActiveTab] = useState('product-enquiries'); // 'product-enquiries' | 'service-enquiries' | 'quote-requests' | 'requirement-matches'

  const productEnquiries = [
    { id: '1', customer: 'Rahul Sharma', phone: '+91 98200 11223', item: 'Sony 55" OLED TV', msg: 'Interested in instant delivery to Bandra West.', date: 'Today 11:30 AM' }
  ];

  const serviceEnquiries = [
    { id: '2', customer: 'Priya Patel', phone: '+91 97111 88334', item: 'AC Repair Service', msg: 'Need gas refilling for 2 split AC units tomorrow.', date: 'Yesterday' }
  ];

  const quoteRequests = [
    { id: '3', customer: 'Tech Solutions Corp', phone: '+91 99000 55443', item: 'Bulk Laptops (10 Units)', budget: '₹7,50,000', date: 'Jul 15' }
  ];

  const requirementMatches = [
    { id: '4', title: 'Customer Request: 5 Ergonomic Office Chairs', city: 'Mumbai', budget: '₹45,000', distance: '3.5 km' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiInbox className="text-pink-400" />
            <span>Leads & Customer Enquiries</span>
          </h2>
          <p className="text-xs text-slate-400">Respond to customer inquiries, quote requests, and nearby requirement matches</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2 scrollbar-none">
        {[
          { id: 'product-enquiries', label: 'Product Enquiries' },
          { id: 'service-enquiries', label: 'Service Enquiries' },
          { id: 'quote-requests', label: 'Quote Requests' },
          { id: 'requirement-matches', label: 'Requirement Matches' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {activeTab === 'product-enquiries' && (
          <div className="space-y-3">
            {productEnquiries.map((e) => (
              <div key={e.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-xs text-white">{e.customer} ({e.phone})</h4>
                  <p className="text-xs font-semibold text-pink-400 mt-0.5">Item: {e.item}</p>
                  <p className="text-xs text-slate-300 mt-1">"{e.msg}"</p>
                </div>
                <button onClick={() => toast.success(`Opened WhatsApp chat with ${e.customer}`)} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5">
                  <FiMessageCircle size={14} /> Reply on WhatsApp
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'service-enquiries' && (
          <div className="space-y-3">
            {serviceEnquiries.map((e) => (
              <div key={e.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-xs text-white">{e.customer} ({e.phone})</h4>
                  <p className="text-xs font-semibold text-purple-400 mt-0.5">Service: {e.item}</p>
                  <p className="text-xs text-slate-300 mt-1">"{e.msg}"</p>
                </div>
                <button onClick={() => toast.success(`Calling ${e.customer}`)} className="px-3.5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5">
                  <FiPhone size={14} /> Call Customer
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'quote-requests' && (
          <div className="space-y-3">
            {quoteRequests.map((q) => (
              <div key={q.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-xs text-white">{q.customer}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{q.item} • Target Budget: {q.budget}</p>
                </div>
                <button onClick={() => toast.success('Quote submitted to customer!')} className="px-3.5 py-2 bg-pink-600 text-white font-bold text-xs rounded-xl">
                  Submit Proposal Quote
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'requirement-matches' && (
          <div className="space-y-3">
            {requirementMatches.map((m) => (
              <div key={m.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-xs text-white">{m.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Location: {m.city} ({m.distance}) • Budget: {m.budget}</p>
                </div>
                <button onClick={() => toast.success('Sent interest to customer')} className="px-3.5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl">
                  Send Pitch
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
