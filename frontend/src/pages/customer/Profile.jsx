import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiUser, FiBriefcase, FiVideo, FiPlus, FiCheckCircle } from 'react-icons/fi';
import { selectCurrentUser, updateUser, setActiveRole } from '../../features/auth/authSlice';
import { useAddRoleMutation, useSwitchRoleMutation } from '../../features/auth/authApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import LocationPicker from '../../components/common/LocationPicker';

/**
 * Premium User Profile page.
 * Displays user identity & handles activating new roles (Vendor/Creator) dynamically.
 */
const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [addRoleApi, { isLoading: isAddingRole }] = useAddRoleMutation();
  const [switchRoleApi] = useSwitchRoleMutation();
  const [searchParams] = useSearchParams();

  const handleRoleChange = async (newRole) => {
    try {
      const res = await switchRoleApi({ role: newRole }).unwrap();
      dispatch(updateUser(res.data.user));
      dispatch(setActiveRole(newRole));
      toast.success(`Switched active role to ${newRole.toUpperCase()}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to switch role.');
    }
  };

  const [activeTab, setActiveTab] = useState('profile'); // profile | roles
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleToActivate, setRoleToActivate] = useState(null); // vendor | creator

  useEffect(() => {
    const activate = searchParams.get('activate');
    if (activate === 'vendor') {
      setRoleToActivate('vendor');
      setIsRoleModalOpen(true);
    } else if (activate === 'creator') {
      setRoleToActivate('creator');
      setIsRoleModalOpen(true);
    }
  }, [searchParams]);

  const vendorForm = useForm({
    defaultValues: {
      businessName: '',
      category: '',
      address: '',
      description: '',
      gst: '',
      pan: '',
      aadhaar: '',
      shopName: '',
      upi: '',
      website: '',
      whatsapp: '',
      logoUrl: ''
    }
  });

  const creatorForm = useForm({
    defaultValues: { bio: '', skills: '', pricingTiers: [{ label: 'Standard Reel', price: 5000, deliverables: '1 Reel Video' }] }
  });

  const [vendorLocation, setVendorLocation] = useState({ address: '', lat: 12.9716, lng: 77.5946 });

  const handleActivateRoleSubmit = async (data) => {
    let payload = {};
    
    if (roleToActivate === 'vendor') {
      payload = {
        role: 'vendor',
        profileData: {
          businessName: data.businessName,
          category: data.category,
          location: {
            type: 'Point',
            coordinates: [vendorLocation.lng, vendorLocation.lat],
            address: vendorLocation.address || data.address
          },
          description: data.description,
          gst: data.gst,
          pan: data.pan,
          aadhaar: data.aadhaar,
          shopName: data.shopName,
          upi: data.upi,
          website: data.website,
          whatsapp: data.whatsapp,
          logoUrl: data.logoUrl
        }
      };
    } else if (roleToActivate === 'creator') {
      payload = {
        role: 'creator',
        profileData: {
          bio: data.bio,
          skills: data.skills.split(',').map(s => s.trim()),
          pricingTiers: data.pricingTiers
        }
      };
    }

    try {
      const res = await addRoleApi(payload).unwrap();
      dispatch(updateUser(res.data.user));
      toast.success(`Activated ${roleToActivate.toUpperCase()} workspace!`);
      setIsRoleModalOpen(false);
      vendorForm.reset();
      creatorForm.reset();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to activate role.');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
      <div className="glass p-6 rounded-premium border-white/50 shadow-glass flex flex-col md:flex-row items-center gap-6">
        <img
          src={user?.avatarUrl || 'https://via.placeholder.com/150'}
          alt={user?.name}
          className="w-24 h-24 rounded-full border-2 border-brand-purple object-cover"
        />
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-black text-brand-navy">{user?.name}</h2>
          <p className="text-sm text-text-secondary mt-1">{user?.email || user?.phone}</p>
          <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
            {user?.roles.map(r => (
              <span key={r} className="px-3 py-1 text-xs font-bold bg-brand-purple/10 text-brand-purple rounded-full capitalize">
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Role Switcher Widget */}
      <div className="glass p-6 rounded-premium border-white/50 shadow-glass flex flex-col gap-4">
        <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Workspace Role Switcher</h3>
        <p className="text-[10px] text-slate-500">Easily swap between Customer, Vendor, and Creator modes instantly from this profile dashboard.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          {['customer', 'vendor', 'creator'].map((role) => {
            const hasRole = user?.roles.includes(role);
            const isActive = user?.activeRole === role;
            
            return (
              <div
                key={role}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3.5 transition-all duration-300
                  ${isActive 
                    ? 'border-brand-purple bg-brand-purple/5 shadow-premium' 
                    : 'border-slate-100 bg-white hover:border-slate-200'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-brand-navy font-display">{role} Mode</span>
                  {isActive && <span className="text-[10px] font-bold text-brand-purple">✓ Active</span>}
                  {hasRole && !isActive && <span className="text-[10px] text-emerald-600 font-bold">✓ Ready</span>}
                  {!hasRole && <span className="text-[10px] text-slate-400 font-bold">Not Setup</span>}
                </div>
                
                {isActive ? (
                  <button
                    disabled
                    className="w-full py-2 bg-brand-purple/10 text-brand-purple text-xs font-bold rounded-xl cursor-not-allowed text-center"
                  >
                    Active Role
                  </button>
                ) : hasRole ? (
                  <button
                    onClick={() => handleRoleChange(role)}
                    className="w-full py-2 bg-brand-purple text-white text-xs font-bold rounded-xl hover:bg-brand-purple-800 transition-all text-center cursor-pointer shadow-sm"
                  >
                    Switch to {role.toUpperCase()}
                  </button>
                ) : (
                  <button
                    onClick={() => { setRoleToActivate(role); setIsRoleModalOpen(true); }}
                    className="w-full py-2 border border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white text-xs font-bold rounded-xl transition-all text-center cursor-pointer"
                  >
                    Activate {role.toUpperCase()}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all
            ${activeTab === 'profile' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-text-tertiary'}
          `}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all
            ${activeTab === 'roles' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-text-tertiary'}
          `}
        >
          Manage Workspaces (Roles)
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'profile' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass p-5 rounded-premium border-white/40 shadow-glass flex flex-col gap-2">
            <h3 className="font-bold text-brand-navy flex items-center gap-2">
              <FiUser className="text-brand-purple" /> Personal Details
            </h3>
            <div className="text-sm space-y-1 mt-2 text-text-secondary">
              <p><strong className="text-brand-navy">Name:</strong> {user?.name}</p>
              <p><strong className="text-brand-navy">Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong className="text-brand-navy">Phone:</strong> {user?.phone || 'N/A'}</p>
            </div>
          </div>

          <div className="glass p-5 rounded-premium border-white/40 shadow-glass flex flex-col gap-2">
            <h3 className="font-bold text-brand-navy flex items-center gap-2">
              <FiBriefcase className="text-brand-orange" /> Wallet & Subscriptions
            </h3>
            <div className="text-sm space-y-1 mt-2 text-text-secondary">
              <p><strong className="text-brand-navy">Wallet Balance:</strong> ₹{user?.walletBalance}</p>
              <p><strong className="text-brand-navy">Membership:</strong> <span className="capitalize">{user?.subscription?.plan}</span></p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Vendor Workspace */}
          <div className="glass p-5 rounded-premium border-white/40 shadow-glass flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-premium bg-brand-orange/10 text-brand-orange">
                <FiBriefcase className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-brand-navy">Business / Vendor Mode</h4>
                <p className="text-xs text-text-secondary">List products, offer services, boost ads, receive customer requirements.</p>
              </div>
            </div>
            {user?.roles.includes('vendor') ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-success">
                <FiCheckCircle className="w-4 h-4" /> Activated
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setRoleToActivate('vendor'); setIsRoleModalOpen(true); }}
              >
                Activate Business
              </Button>
            )}
          </div>

          {/* Creator Workspace */}
          <div className="glass p-5 rounded-premium border-white/40 shadow-glass flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-premium bg-brand-pink/10 text-brand-pink">
                <FiVideo className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-brand-navy">Content Creator Mode</h4>
                <p className="text-xs text-text-secondary">Publish reels, live stream, create portfolios, get hired by vendors.</p>
              </div>
            </div>
            {user?.roles.includes('creator') ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-success">
                <FiCheckCircle className="w-4 h-4" /> Activated
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setRoleToActivate('creator'); setIsRoleModalOpen(true); }}
              >
                Activate Creator
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Role Activation Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={roleToActivate === 'vendor' ? 'Activate Business Profile' : 'Activate Creator Profile'}
      >
        {roleToActivate === 'vendor' ? (
          <form onSubmit={vendorForm.handleSubmit(handleActivateRoleSubmit)} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Shop Name *"
                placeholder="e.g. Acme Supermart"
                error={vendorForm.formState.errors.shopName}
                {...vendorForm.register('shopName', { required: 'Shop Name is required' })}
              />
              <Input
                label="Business Legal Name *"
                placeholder="e.g. Acme Services Private Limited"
                error={vendorForm.formState.errors.businessName}
                {...vendorForm.register('businessName', { required: 'Business Legal Name is required' })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-brand-navy uppercase">Business Category *</label>
                <select
                  {...vendorForm.register('category', { required: 'Category is required' })}
                  className="w-full px-4 py-2.5 text-xs border border-border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple h-10 animate-fade-in"
                >
                  <option value="">Select Category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Home Services">Home Services</option>
                  <option value="Fashion & Apparel">Fashion & Apparel</option>
                  <option value="Beauty & Wellness">Beauty & Wellness</option>
                  <option value="Consulting & Professional">Consulting & Professional</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Health & Fitness">Health & Fitness</option>
                </select>
                {vendorForm.formState.errors.category && (
                  <span className="text-[10px] font-bold text-error">{vendorForm.formState.errors.category.message}</span>
                )}
              </div>
              <Input
                label="Logo Image URL (Optional)"
                placeholder="https://example.com/logo.jpg"
                {...vendorForm.register('logoUrl')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-3">
              <Input
                label="WhatsApp Number *"
                placeholder="e.g. +919876543210"
                error={vendorForm.formState.errors.whatsapp}
                {...vendorForm.register('whatsapp', { required: 'WhatsApp number is required' })}
              />
              <Input
                label="Website URL (Optional)"
                placeholder="https://example.com"
                {...vendorForm.register('website')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-3">
              <div className="sm:col-span-1">
                <Input
                  label="PAN Number *"
                  placeholder="e.g. ABCDE1234F"
                  error={vendorForm.formState.errors.pan}
                  {...vendorForm.register('pan', { required: 'PAN is required for tax validation' })}
                />
              </div>
              <div className="sm:col-span-1">
                <Input
                  label="Aadhaar Card Number *"
                  placeholder="e.g. 1234 5678 9012"
                  error={vendorForm.formState.errors.aadhaar}
                  {...vendorForm.register('aadhaar', { required: 'Aadhaar is required for verification' })}
                />
              </div>
              <div className="sm:col-span-1">
                <Input
                  label="GSTIN (Optional)"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  {...vendorForm.register('gst')}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border pt-3">
              <label className="text-xs font-semibold text-brand-navy uppercase">Store / Business Location & Address *</label>
              <LocationPicker
                initialAddress={vendorForm.getValues('address') || ''}
                initialLat={vendorLocation.lat}
                initialLng={vendorLocation.lng}
                onChange={(loc) => {
                  setVendorLocation(loc);
                  vendorForm.setValue('address', loc.address, { shouldValidate: true });
                }}
              />
              {vendorForm.formState.errors.address && (
                <span className="text-[10px] font-bold text-error">{vendorForm.formState.errors.address.message}</span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-border pt-3">
              <Input
                label="UPI ID or Bank Details (For direct buyer payments) *"
                placeholder="e.g. shopname@upi or Account: 123456, IFSC: SBIN000123"
                error={vendorForm.formState.errors.upi}
                {...vendorForm.register('upi', { required: 'Bank payout UPI ID is required' })}
              />
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border pt-3">
              <label className="text-xs font-semibold text-brand-navy uppercase">Business Description</label>
              <textarea
                placeholder="Tell customers about your products or services..."
                className="w-full px-4 py-3 text-sm border border-border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple min-h-[80px]"
                {...vendorForm.register('description')}
              />
            </div>

            <Button type="submit" variant="primary" fullWidth isLoading={isAddingRole} className="mt-2">
              Activate Business Mode
            </Button>
          </form>
        ) : (
          <form onSubmit={creatorForm.handleSubmit(handleActivateRoleSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-brand-navy uppercase">Creator Bio</label>
              <textarea
                placeholder="Tell vendors about yourself, e.g. Experienced tech reel creator..."
                className="w-full px-4 py-3 text-sm border border-border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple min-h-[100px]"
                {...creatorForm.register('bio', { required: 'Bio is required' })}
              />
            </div>
            <Input
              label="Skills (Comma Separated)"
              placeholder="e.g. Video Editing, Script Writing, Modeling"
              error={creatorForm.formState.errors.skills}
              {...creatorForm.register('skills', { required: 'Skills are required' })}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs font-bold text-brand-navy uppercase">Sample Service Tier</span>
            </div>
            <div className="p-3 bg-surface-secondary border border-border rounded-premium grid grid-cols-2 gap-3">
              <Input
                label="Tier Name"
                placeholder="Standard Package"
                {...creatorForm.register('pricingTiers.0.label')}
              />
              <Input
                label="Price (₹)"
                type="number"
                placeholder="5000"
                {...creatorForm.register('pricingTiers.0.price')}
              />
              <div className="col-span-2">
                <Input
                  label="Deliverables Description"
                  placeholder="1 Instagram Reel, 3 revisions, delivered in 4 days"
                  {...creatorForm.register('pricingTiers.0.deliverables')}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" fullWidth isLoading={isAddingRole} className="mt-2">
              Activate Creator Mode
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Profile;
