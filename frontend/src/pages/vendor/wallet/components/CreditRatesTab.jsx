import React from 'react';
import { FiCheck, FiInfo, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../../context/LanguageContext';

const DEFAULT_RATES = [
  {
    action: 'Verified WhatsApp Lead',
    rate: '2.50 Credits',
    description:
      'Charged when a customer sends an inbound message to your connected Meta WhatsApp Business number (includes 24-hour deduplication protection)',
    category: 'WhatsApp',
    badge: 'ACTION LEAD',
  },
  {
    action: 'Connected Exotel Voice Call',
    rate: '2.50 Credits',
    description:
      'Charged ONLY when a phone call connects between buyer and vendor for >= 10 seconds via Exotel (0 if busy, missed, or failed)',
    category: 'Telephony',
    badge: 'ACTION LEAD',
  },
  {
    action: 'Reel Feed Feature Boost',
    rate: 'Free / 2.00 Credits',
    description:
      'Plan-included free boosts (Starter: 1, Growth: 3, Business: 5) are consumed first. Additional boosts cost 2.00 Credits per boost',
    category: 'Promotion',
    badge: 'BOOST',
  },
  {
    action: 'Catalog Product & Service Listings',
    rate: '0.00 Credits (FREE)',
    description:
      'Unlimited catalog products and service offerings showcased on your verified store profile with zero listing fees',
    category: 'Catalog',
    badge: 'FREE',
  },
  {
    action: 'Standard 4K Video Reel Uploads',
    rate: '0.00 Credits (FREE)',
    description:
      'Publish unlimited video reels to the local discovery feed with zero upload fees',
    category: 'Reels',
    badge: 'FREE',
  },
  {
    action: 'Customer Orders & Sales Commission',
    rate: '0% Always (FREE)',
    description:
      'Zero platform middleman commission on direct buyer orders, quote bids, or closed customer deals',
    category: 'Orders',
    badge: 'ZERO COMMISSION',
  },
];

/**
 * CreditRatesTab
 * Official credit rate schedule table strictly aligned with platform commercial policy.
 */
export default function CreditRatesTab({ creditRates = DEFAULT_RATES }) {
  const { bi } = useLanguage();
  const ratesList = Array.isArray(creditRates) && creditRates.length > 0 ? creditRates : DEFAULT_RATES;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-7 border-2 border-[#241b15] shadow-xs space-y-7 font-sans">
      <div className="border-b border-[#e3dccb] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              {bi('Commercial Terms V2', 'वाणिज्यिक शर्तें V2')}
            </span>
          </div>
          <h2
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
            className="text-lg sm:text-xl font-black text-[#1a1a1a] uppercase tracking-wide"
          >
            {bi('Official Action Credit Rates', 'आधिकारिक क्रेडिट दर अनुसूची')}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {bi(
              '1 Credit = ₹1 INR. Transparent, metered pay-as-you-grow rates with zero hidden commission.',
              '1 क्रेडिट = ₹1। पारदर्शी और बिना किसी छिपे शुल्क की व्यावसायिक दरें।'
            )}
          </p>
        </div>

        <Link
          to="/pricing"
          target="_blank"
          className="px-3.5 py-2 bg-[#f8f4ec] hover:bg-[#eae3d2] text-[#1a1a1a] text-xs font-black rounded-xl border border-[#e3dccb] transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>{bi('Public Pricing Page', 'मूल्य निर्धारण पृष्ठ')}</span>
          <FiExternalLink size={13} />
        </Link>
      </div>

      {/* Rates Table */}
      <div className="overflow-x-auto rounded-xl border-2 border-[#241b15]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#241b15] text-[#d99a3d] uppercase tracking-wider text-[10px] font-black">
            <tr>
              <th className="py-3 px-4">{bi('Platform Action', 'प्लेटफ़ॉर्म क्रिया')}</th>
              <th className="py-3 px-4">{bi('Consumption Rate', 'कटौती दर')}</th>
              <th className="py-3 px-4">{bi('Category', 'श्रेणी')}</th>
              <th className="py-3 px-4">{bi('Policy & Protection', 'नीति और सुरक्षा')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3dccb] bg-white font-medium text-slate-700">
            {ratesList.map((item, idx) => (
              <tr key={idx} className="hover:bg-[#f8f4ec]/60 transition">
                <td className="py-3.5 px-4">
                  <div className="flex flex-col">
                    <span className="font-black text-xs text-[#1a1a1a]">{item.action}</span>
                    {item.badge && (
                      <span className="inline-block mt-0.5 w-fit text-[9px] font-black px-1.5 py-0.2 rounded bg-[#f8f4ec] text-slate-600 border border-[#e3dccb]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono font-black text-xs text-[#1a1a1a]">
                  {item.rate}
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {item.category || 'General'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-[11px] text-slate-500 max-w-sm leading-relaxed">
                  {item.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Policy Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#1a1a1a]">
            <FiCheck className="text-emerald-600" size={14} />
            <span>{bi('24-Hour Deduplication', '24-घंटे सुरक्षा')}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {bi(
              'Repeat WhatsApp messages from the same buyer within 24 hours are charged zero additional credits.',
              '24 घंटे के भीतर एक ही ग्राहक से आने वाले संदेशों पर अतिरिक्त शुल्क नहीं कटता।'
            )}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#1a1a1a]">
            <FiCheck className="text-emerald-600" size={14} />
            <span>{bi('Connected Calls Only', 'केवल कनेक्टेड कॉल्स')}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {bi(
              'Credits are deducted only when voice calls connect for >= 10 seconds. Missed or unanswered calls are free.',
              'केवल 10 सेकंड से अधिक बात होने पर क्रेडिट कटते हैं। मिस्ड कॉल निःशुल्क हैं।'
            )}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#1a1a1a]">
            <FiCheck className="text-emerald-600" size={14} />
            <span>{bi('0% Sales Commission', '0% कमीशन')}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {bi(
              '100% of customer order earnings belong to you with zero marketplace percentage cut.',
              'ग्राहकों से प्राप्त पूरी राशि आपकी है, प्लेटफ़ॉर्म कोई मध्यस्थ कमीशन नहीं लेता।'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
