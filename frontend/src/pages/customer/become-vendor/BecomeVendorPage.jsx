import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiBriefcase, FiCheckCircle, FiDollarSign, FiFileText, FiMapPin, FiCreditCard, FiArrowRight, FiShield, FiUser } from 'react-icons/fi';
import { useAddRoleMutation } from '../../../features/auth/authApi';
import { setCredentials } from '../../../features/auth/authSlice';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';

export default function BecomeVendorPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [addRoleApi] = useAddRoleMutation();

  const [loading, setLoading] = useState(false);

  const [shopName, setShopName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [gst, setGst] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopName || !pan || !businessAddress) {
      toast.error('Please fill all required business details');
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorProfile: {
            shopName,
            businessName,
            category,
            gst,
            pan,
            aadhaar,
            businessAddress,
            bankDetails: { bankAccount, ifsc, upiId },
            createdAt: new Date().toISOString()
          }
        })
      });

      const roleRes = await addRoleApi({ role: 'vendor' }).unwrap();
      const updatedUser = roleRes.user || roleRes.data?.user || roleRes;

      try {
        await fetch('/api/v1/users/me/switch-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'vendor' })
        });
      } catch (e) {}

      dispatch(setCredentials({ user: { ...updatedUser, current_role: 'vendor', activeRole: 'vendor' } }));
      toast.success('Congratulations! Your Vendor Account is active now!');
      navigate('/vendor/dashboard', { replace: true });
    } catch (err) {
      toast.error('Failed to register vendor profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <AdminPageHeader
        icon={FiBriefcase}
        title="Become a Verified Vendor"
        subtitle="Start selling products & services, post boosted reels, receive direct inquiries, and manage orders on BizReels"
      />

      <div className="glass rounded-2xl p-6 sm:p-8 border border-white/50 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Business Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-purple text-white flex items-center justify-center text-xs font-bold">1</span>
              <span>Business Details & Identity</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Shop / Business Display Name *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Trends Boutique Store"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Legal Company / Firm Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Trends Retail Pvt Ltd"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Business Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                >
                  <option value="Electronics">Electronics & IT</option>
                  <option value="Fashion">Fashion & Apparel</option>
                  <option value="Furniture">Furniture & Decor</option>
                  <option value="Jewellery">Jewellery & Accessories</option>
                  <option value="Restaurant">Restaurant & Food</option>
                  <option value="Services">Services & Repairs</option>
                  <option value="Automobile">Automobile & Parts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">PAN Card Number *</label>
                <input
                  type="text"
                  required
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary uppercase focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">GST Number (Optional)</label>
                <input
                  type="text"
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary uppercase focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Aadhaar Number (As Applicable)</label>
                <input
                  type="text"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                  placeholder="e.g. 1234 5678 9012"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Full Business Address *</label>
              <textarea
                required
                rows={3}
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Shop No., Commercial Complex, Street, City, State, Pincode"
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              />
            </div>
          </div>

          {/* Step 2: Bank & UPI */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center text-xs font-bold">2</span>
              <span>Banking & Payout Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. 9182736450"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  placeholder="e.g. SBIN0001234"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary uppercase focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">UPI ID for Payouts</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. shopname@upi"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 gradient-brand text-white rounded-xl text-sm font-bold shadow-premium hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Activating Vendor Profile...' : 'Complete Registration & Launch Vendor Portal'}</span>
            <FiArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
