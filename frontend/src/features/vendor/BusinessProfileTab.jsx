import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdateProfileMutation } from '../auth/authApi';
import { updateUser } from '../auth/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { toast } from 'react-hot-toast';

const BusinessProfileTab = ({ user }) => {
  const dispatch = useDispatch();
  const [updateProfileApi, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();

  // Profile Form States
  const [shopName, setShopName] = useState(user?.vendorProfile?.shopName || '');
  const [bizName, setBizName] = useState(user?.vendorProfile?.businessName || '');
  const [bizCategory, setBizCategory] = useState(user?.vendorProfile?.category || 'Electronics');
  const [bizDesc, setBizDesc] = useState(user?.vendorProfile?.description || '');
  const [bizGst, setBizGst] = useState(user?.vendorProfile?.gst || '');
  const [bizPan, setBizPan] = useState(user?.vendorProfile?.pan || '');
  const [bizAddress, setBizAddress] = useState(user?.vendorProfile?.location?.address || '');
  const [bizWebsite, setBizWebsite] = useState(user?.vendorProfile?.website || '');
  const [bizWhatsapp, setBizWhatsapp] = useState(user?.vendorProfile?.whatsapp || '');
  const [bizLogoUrl, setBizLogoUrl] = useState(user?.vendorProfile?.logoUrl || '');
  const [bizFb, setBizFb] = useState(user?.vendorProfile?.socialLinks?.facebook || '');
  const [bizInsta, setBizInsta] = useState(user?.vendorProfile?.socialLinks?.instagram || '');
  const [bizTwitter, setBizTwitter] = useState(user?.vendorProfile?.socialLinks?.twitter || '');
  const [bizYoutube, setBizYoutube] = useState(user?.vendorProfile?.socialLinks?.youtube || '');
  const [openTime, setOpenTime] = useState(user?.vendorProfile?.operatingHours?.open || '09:00');
  const [closeTime, setCloseTime] = useState(user?.vendorProfile?.operatingHours?.close || '21:00');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        vendorProfile: {
          shopName,
          businessName: bizName,
          category: bizCategory,
          description: bizDesc,
          gst: bizGst,
          pan: bizPan,
          website: bizWebsite,
          whatsapp: bizWhatsapp,
          logoUrl: bizLogoUrl,
          location: {
            type: 'Point',
            coordinates: user?.vendorProfile?.location?.coordinates || [77.209, 28.6139],
            address: bizAddress,
          },
          operatingHours: {
            open: openTime,
            close: closeTime,
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          },
          socialLinks: {
            facebook: bizFb,
            instagram: bizInsta,
            twitter: bizTwitter,
            youtube: bizYoutube,
          },
        },
      };
      const res = await updateProfileApi(payload).unwrap();
      dispatch(updateUser(res.data.user));
      toast.success('Business Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update business profile.');
    }
  };

  return (
    <form onSubmit={handleUpdateProfile} className="glass p-6 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-6 animate-fade-in">
      <div>
        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Business Profile Settings</h3>
        <p className="text-xs text-slate-500 mt-1">Provide verify information about your shop or local business franchise details.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Shop / Display Name *"
          placeholder="Enter shop display name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          required
        />
        <Input
          label="Legal Business Name *"
          placeholder="Enter registered business legal name"
          value={bizName}
          onChange={(e) => setBizName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Business Category *</label>
          <select
            value={bizCategory}
            onChange={(e) => setBizCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all h-[42px]"
          >
            <option value="Electronics">Electronics</option>
            <option value="Home Services">Home Services</option>
            <option value="Fashion & Apparel">Fashion & Apparel</option>
            <option value="Beauty & Wellness">Beauty & Wellness</option>
            <option value="Consulting & Professional">Consulting & Professional</option>
            <option value="Automotive">Automotive</option>
            <option value="Health & Fitness">Health & Fitness</option>
          </select>
        </div>
        <Input
          label="GSTIN (Optional)"
          placeholder="e.g. 22AAAAA0000A1Z5"
          value={bizGst}
          onChange={(e) => setBizGst(e.target.value)}
        />
        <Input
          label="PAN Card Number *"
          placeholder="e.g. ABCDE1234F"
          value={bizPan}
          onChange={(e) => setBizPan(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Business Description</label>
        <textarea
          rows={3}
          value={bizDesc}
          onChange={(e) => setBizDesc(e.target.value)}
          placeholder="Briefly pitch what products or services you specialize in..."
          className="w-full p-3.5 bg-slate-50/50 border border-slate-200 focus:border-brand-purple rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <Input
          label="Logo Image URL"
          placeholder="https://example.com/logo.jpg"
          value={bizLogoUrl}
          onChange={(e) => setBizLogoUrl(e.target.value)}
        />
        <Input
          label="Business Storefront Address"
          placeholder="Shop No., Street, Locality, Pincode"
          value={bizAddress}
          onChange={(e) => setBizAddress(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <Input
          label="WhatsApp Number *"
          placeholder="e.g. +919876543210"
          value={bizWhatsapp}
          onChange={(e) => setBizWhatsapp(e.target.value)}
          required
        />
        <Input
          label="Website URL (Optional)"
          placeholder="https://example.com"
          value={bizWebsite}
          onChange={(e) => setBizWebsite(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Open Time</label>
          <input
            type="time"
            value={openTime}
            onChange={(e) => setOpenTime(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all h-[42px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Close Time</label>
          <input
            type="time"
            value={closeTime}
            onChange={(e) => setCloseTime(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all h-[42px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-4">
        <Input label="Facebook URL" placeholder="https://facebook.com/..." value={bizFb} onChange={(e) => setBizFb(e.target.value)} />
        <Input label="Instagram URL" placeholder="https://instagram.com/..." value={bizInsta} onChange={(e) => setBizInsta(e.target.value)} />
        <Input label="Twitter URL" placeholder="https://twitter.com/..." value={bizTwitter} onChange={(e) => setBizTwitter(e.target.value)} />
        <Input label="YouTube URL" placeholder="https://youtube.com/..." value={bizYoutube} onChange={(e) => setBizYoutube(e.target.value)} />
      </div>

      <div className="flex justify-end mt-4 border-t border-slate-100 pt-4">
        <Button
          type="submit"
          disabled={isUpdatingProfile}
          variant="primary"
          className="text-xs py-2.5 px-6 rounded-xl cursor-pointer"
        >
          {isUpdatingProfile ? 'Updating...' : 'Save Profile Changes'}
        </Button>
      </div>
    </form>
  );
};

export default BusinessProfileTab;
