import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { FiUser, FiBriefcase, FiVideo, FiPlus, FiCheckCircle } from 'react-icons/fi';
import { selectCurrentUser, updateUser } from '../features/auth/authSlice';
import { useAddRoleMutation } from '../features/auth/authApi';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

/**
 * Premium User Profile page.
 * Displays user identity & handles activating new roles (Vendor/Creator) dynamically.
 */
const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [addRoleApi, { isLoading: isAddingRole }] = useAddRoleMutation();

  const [activeTab, setActiveTab] = useState('profile'); // profile | roles
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleToActivate, setRoleToActivate] = useState(null); // vendor | creator

  const vendorForm = useForm({
    defaultValues: { businessName: '', category: '', address: '', description: '' }
  });

  const creatorForm = useForm({
    defaultValues: { bio: '', skills: '', pricingTiers: [{ label: 'Standard Reel', price: 5000, deliverables: '1 Reel Video' }] }
  });

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
            coordinates: [77.5946, 12.9716], // default fallback coordinates (Bengaluru)
            address: data.address
          },
          description: data.description
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
          <form onSubmit={vendorForm.handleSubmit(handleActivateRoleSubmit)} className="flex flex-col gap-4">
            <Input
              label="Business Name"
              placeholder="e.g. Acme Services"
              error={vendorForm.formState.errors.businessName}
              {...vendorForm.register('businessName', { required: 'Business Name is required' })}
            />
            <Input
              label="Category"
              placeholder="e.g. Electrical Repair, Grocery Store"
              error={vendorForm.formState.errors.category}
              {...vendorForm.register('category', { required: 'Category is required' })}
            />
            <Input
              label="Store / Business Address"
              placeholder="e.g. 123 Main St, Bengaluru"
              error={vendorForm.formState.errors.address}
              {...vendorForm.register('address', { required: 'Address is required' })}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-brand-navy uppercase">Business Description</label>
              <textarea
                placeholder="Brief description of your products or services..."
                className="w-full px-4 py-3 text-sm border border-border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple min-h-[100px]"
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
