import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiBriefcase, FiMapPin, FiGlobe, FiPhone, FiClock, FiFileText, FiSave, FiCheck, FiInstagram, FiFacebook, FiMessageCircle
} from 'react-icons/fi';
import { useGetMeQuery, useUpdateProfileMutation } from '../../../features/auth/authApi';
import { setCredentials } from '../../../features/auth/authSlice';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';

export default function VendorBusinessProfilePage() {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const { data: profileRes } = useGetMeQuery(undefined, { pollingInterval: 300000 });
  const [updateProfileApi] = useUpdateProfileMutation();

  const user = profileRes?.data?.user || profileRes?.user || authUser || {};
  const vendorProfile = user.vendorProfile || {};

  const [shopName, setShopName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [gst, setGst] = useState('');
  const [pan, setPan] = useState('');
  const [businessHours, setBusinessHours] = useState('9:00 AM - 9:00 PM (Mon-Sat)');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vendorProfile) {
      setShopName(vendorProfile.shopName || user.name || '');
      setBusinessName(vendorProfile.businessName || '');
      setCategory(vendorProfile.category || 'Electronics');
      setDescription(vendorProfile.description || '');
      setGst(vendorProfile.gst || '');
      setPan(vendorProfile.pan || '');
      setBusinessHours(vendorProfile.businessHours || '9:00 AM - 9:00 PM (Mon-Sat)');
      setAddress(vendorProfile.businessAddress || user.location?.address || '');
      setWebsite(vendorProfile.website || '');
      setWhatsapp(vendorProfile.whatsapp || user.phone || '');
      setInstagram(vendorProfile.instagram || '');
      setFacebook(vendorProfile.facebook || '');
    }
  }, [vendorProfile, user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        vendorProfile: {
          ...vendorProfile,
          shopName,
          businessName,
          category,
          description,
          gst,
          pan,
          businessHours,
          businessAddress: address,
          website,
          whatsapp,
          instagram,
          facebook,
          updatedAt: new Date().toISOString()
        }
      };

      const res = await updateProfileApi(payload).unwrap();
      dispatch(setCredentials({ user: res.user || res.data?.user }));
      toast.success('Business Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update business profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiBriefcase}
        title="Business Profile & Branding"
        subtitle="Manage your shop name, logo, business hours, contact numbers, and social media links"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Shop & Legal Details */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-white/50 shadow-card space-y-5">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2.5 border-b border-border pb-3">
            <div className="p-2 rounded-xl bg-brand-purple/10 text-brand-purple">
              <FiBriefcase className="w-4 h-4" />
            </div>
            <span>Basic Shop & Legal Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Shop / Display Name *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Metro Electronics & Accessories"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Business Registered Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Metro Enterprises Pvt Ltd"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Business Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
              >
                <option value="Electronics">Electronics & IT</option>
                <option value="Fashion">Fashion & Apparel</option>
                <option value="Furniture">Furniture & Decor</option>
                <option value="Jewellery">Jewellery & Accessories</option>
                <option value="Restaurant">Restaurant & Food</option>
                <option value="Services">Services & Repairs</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Business Hours</label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="e.g. 9:00 AM - 9:00 PM (Mon-Sat)"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">GST Number (Optional)</label>
              <input
                type="text"
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                placeholder="27AAAAA0000A1Z5"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium uppercase focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">PAN Card Number</label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                placeholder="ABCDE1234F"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium uppercase focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Shop Description & Tagline</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your shop offerings, specialty products, brands sold..."
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Business Physical Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop No., Street, Landmark, City, State, Pincode"
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Online & Social Links */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-white/50 shadow-card space-y-5">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2.5 border-b border-border pb-3">
            <div className="p-2 rounded-xl bg-brand-pink/10 text-brand-pink">
              <FiGlobe className="w-4 h-4" />
            </div>
            <span>Online Presence & Social Links</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">WhatsApp Number</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://myshop.com"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Instagram Handle</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@shopname"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Facebook Page</label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="facebook.com/shopname"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <FiSave className="w-4 h-4" />
            <span>{loading ? 'Saving Profile...' : 'Save Business Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
