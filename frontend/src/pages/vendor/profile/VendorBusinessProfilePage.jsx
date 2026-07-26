import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiBriefcase, FiMapPin, FiGlobe, FiPhone, FiClock, FiFileText, FiSave, FiCheck, FiInstagram, FiFacebook, FiMessageCircle, FiCamera, FiImage
} from 'react-icons/fi';
import { useGetMeQuery, useUpdateProfileMutation } from '../../../features/auth/authApi';
import { setCredentials } from '../../../features/auth/authSlice';
import api, { tokenStore, resolveMediaUrl } from '../../../lib/api';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';

export default function VendorBusinessProfilePage() {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const { data: profileRes } = useGetMeQuery(undefined, {
    pollingInterval: 300000,
    skip: !authUser && !tokenStore.getAccess(),
  });
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
  const [profilePic, setProfilePic] = useState('');
  const [coverBanner, setCoverBanner] = useState('');
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vendorProfile || user) {
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
      setProfilePic(user.profile_pic || user.avatarUrl || '');
      setCoverBanner(vendorProfile.coverBanner || '');
    }
  }, [vendorProfile, user]);

  const handleFileUpload = async (e, setUrl, setUploading, label) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading(`Uploading ${label}...`);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/v1/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const url = res.data?.url || res.data?.data?.url || res.url;
      if (url) {
        setUrl(url);
        toast.success(`${label} uploaded!`, { id: toastId });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUrl(reader.result);
          toast.success(`${label} attached!`, { id: toastId });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUrl(reader.result);
        toast.success(`${label} attached!`, { id: toastId });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        profile_pic: profilePic || undefined,
        avatarUrl: profilePic || undefined,
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
          coverBanner: coverBanner || '',
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
        {/* Profile Image & Cover Banner Upload Section */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-white/50 shadow-card space-y-6">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2.5 border-b border-border pb-3">
            <div className="p-2 rounded-xl bg-brand-purple/10 text-brand-purple">
              <FiCamera className="w-4 h-4" />
            </div>
            <span>Profile Photo & Cover Banner</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendor Profile Image */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                Shop Logo / Profile Picture *
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-brand-purple/40 overflow-hidden bg-surface-tertiary shrink-0 relative">
                  {profilePic ? (
                    <img src={resolveMediaUrl(profilePic)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-tertiary text-2xl font-bold">
                      {shopName ? shopName.charAt(0).toUpperCase() : 'V'}
                    </div>
                  )}
                  {uploadingPic && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold">
                      ...
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple/10 text-brand-purple text-xs font-bold rounded-xl hover:bg-brand-purple/20 transition cursor-pointer">
                    <FiCamera size={14} />
                    <span>Upload Logo / Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setProfilePic, setUploadingPic, 'Profile Picture')}
                    />
                  </label>
                  <p className="text-[10px] text-text-tertiary">Recommended: Square JPG or PNG (Max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Cover Banner (Optional) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                  Cover Banner <span className="text-emerald-500 font-semibold">(Optional)</span>
                </label>
                {coverBanner && (
                  <button
                    type="button"
                    onClick={() => setCoverBanner('')}
                    className="text-[10px] font-bold text-rose-500 hover:underline"
                  >
                    Remove Banner
                  </button>
                )}
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-border h-24 bg-surface-tertiary">
                {coverBanner ? (
                  <img src={resolveMediaUrl(coverBanner)} alt="Cover Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-cover-gradient flex items-center justify-center text-xs text-text-tertiary font-medium">
                    No cover banner set (Will display dynamic gradient)
                  </div>
                )}
                {uploadingBanner && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold">
                    Uploading Banner...
                  </div>
                )}
              </div>

              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary text-xs font-bold rounded-xl hover:bg-surface-tertiary transition cursor-pointer">
                  <FiImage size={14} />
                  <span>{coverBanner ? 'Change Cover Banner' : 'Upload Cover Banner'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setCoverBanner, setUploadingBanner, 'Cover Banner')}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

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
