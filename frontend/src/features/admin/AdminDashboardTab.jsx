import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSliders,
  FiUserCheck,
  FiTrendingUp,
  FiAlertTriangle,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiX,
  FiLayers,
  FiActivity
} from 'react-icons/fi';
import Button from '../../components/common/Button';
import { toast } from 'react-hot-toast';
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation
} from './adminApi';

const AdminDashboardTab = () => {
  const [activePanel, setActivePanel] = useState('approvals'); // approvals | boosts | categories
  
  // Mock listing approvals
  const [approvals, setApprovals] = useState([
    { _id: 'app_1', businessName: 'Glow Spa Delhi', category: 'Beauty & Wellness', documentName: 'GST Registration certificate', status: 'pending' },
    { _id: 'app_2', businessName: 'Rohan Electrics', category: 'Electronics', documentName: 'Trade License certificate', status: 'pending' }
  ]);

  // Mock boost requests
  const [boosts, setBoosts] = useState([
    { _id: 'bst_1', itemTitle: 'Gaming Laptop RTX 4060', vendorName: 'Ankit Stores', creditsRequested: 10, status: 'pending' },
    { _id: 'bst_2', itemTitle: 'Sofa cleaning service package', vendorName: 'Delhi Cleaning Co', creditsRequested: 5, status: 'pending' }
  ]);

  const { data: catData, isLoading: catLoading } = useListCategoriesQuery(undefined, {
    skip: activePanel !== 'categories',
    pollingInterval: 4000
  });
  const [createCategory] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const categories = catData?.items || [];
  const [newCategory, setNewCategory] = useState('');

  const handleVerify = (id, status) => {
    setApprovals(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    toast.success(`Verification request marked as ${status.toUpperCase()}`);
  };

  const handleBoost = (id, status) => {
    setBoosts(prev => prev.map(b => b._id === id ? { ...b, status } : b));
    toast.success(`Sponsorship campaign ${status.toUpperCase()}`);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      toast.loading('Creating category...', { id: 'add-cat' });
      await createCategory({ name: newCategory.trim() }).unwrap();
      setNewCategory('');
      toast.success('Category created successfully!', { id: 'add-cat' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create category.', { id: 'add-cat' });
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      toast.loading('Deleting category...', { id: 'del-cat' });
      await deleteCategory(id).unwrap();
      toast.success('Category deleted successfully!', { id: 'del-cat' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete category.', { id: 'del-cat' });
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      {/* Header stats banner */}
      <div className="glass p-6 rounded-premium border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-brand-navy font-display">
            Admin <span className="gradient-text font-black">Control Hub</span>
          </h2>
          <p className="text-xs text-text-tertiary mt-1">
            Configure system classifications, evaluate document verifications, and approve advertising boosts.
          </p>
        </div>

        <div className="flex gap-2">
          {['approvals', 'boosts', 'categories'].map((panel) => (
            <button
              key={panel}
              onClick={() => setActivePanel(panel)}
              className={`px-4 py-2.5 rounded-premium text-xs font-bold capitalize transition-all border cursor-pointer
                ${activePanel === panel
                  ? 'bg-brand-purple text-white border-brand-purple shadow-premium'
                  : 'bg-white text-text-secondary border-border hover:text-brand-purple'
                }
              `}
            >
              {panel === 'approvals' ? 'Business Approvals' : panel}
            </button>
          ))}
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Verifications', val: approvals.filter(a => a.status === 'pending').length, color: 'text-brand-purple', icon: FiUserCheck },
          { label: 'Boost Request queue', val: boosts.filter(b => b.status === 'pending').length, color: 'text-brand-orange', icon: FiTrendingUp },
          { label: 'Category Count', val: categories.length, color: 'text-brand-pink', icon: FiLayers },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass p-5 rounded-premium border-white/50 shadow-glass flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{stat.label}</span>
                <span className={`text-xl font-black mt-1 font-display ${stat.color}`}>{stat.val}</span>
              </div>
              <div className="p-3 bg-surface-secondary rounded-premium">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main panel content */}
      <div className="w-full">
        {activePanel === 'approvals' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider px-1">Verifications Pipeline</h3>

            <div className="flex flex-col gap-3">
              {approvals.map((app) => (
                <div key={app._id} className="glass p-5 rounded-premium border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-brand-navy font-display">{app.businessName}</span>
                    <span className="text-[10px] text-brand-purple font-semibold">{app.category}</span>
                    <p className="text-xs text-text-secondary mt-1">Uploaded document: <span className="underline font-bold text-brand-navy">{app.documentName}</span></p>
                  </div>

                  {app.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerify(app._id, 'rejected')}
                        className="p-2 hover:bg-error-light/30 text-error rounded-premium transition-all cursor-pointer"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleVerify(app._id, 'approved')}
                        className="p-2 hover:bg-success-light/35 text-success rounded-premium transition-all cursor-pointer"
                      >
                        <FiCheck className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <span className={`px-2.5 py-1 rounded text-xs font-bold capitalize
                      ${app.status === 'approved' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}
                    `}>
                      {app.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activePanel === 'boosts' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider px-1">Sponsored Boost requests</h3>

            <div className="flex flex-col gap-3">
              {boosts.map((bst) => (
                <div key={bst._id} className="glass p-5 rounded-premium border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-brand-navy font-display">{bst.itemTitle}</span>
                    <span className="text-[10px] text-text-tertiary">by {bst.vendorName}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs">
                      <span className="text-[9px] text-text-tertiary block">Boost balance</span>
                      <span className="font-bold text-brand-orange">{bst.creditsRequested} credits</span>
                    </div>

                    {bst.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBoost(bst._id, 'rejected')}
                          className="p-2 hover:bg-error-light/30 text-error rounded-premium transition-all cursor-pointer"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleBoost(bst._id, 'approved')}
                          className="p-2 hover:bg-success-light/35 text-success rounded-premium transition-all cursor-pointer"
                        >
                          <FiCheck className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2.5 py-1 rounded text-xs font-bold capitalize
                        ${bst.status === 'approved' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}
                      `}>
                        {bst.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePanel === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass p-6 rounded-premium border-white/50 shadow-glass">
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-border pb-3 mb-4">Category listings</h3>
              
              {catLoading ? (
                <div className="text-xs text-text-tertiary">Loading categories…</div>
              ) : categories.length === 0 ? (
                <div className="text-xs text-text-tertiary">No categories defined yet.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <span key={c._id || c.name} className="px-3 py-1.5 text-xs font-bold bg-brand-purple/10 text-brand-purple rounded-premium border border-brand-purple/10 flex items-center gap-2">
                      {c.name}
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c._id)}
                        className="hover:text-error text-brand-purple/50 cursor-pointer"
                        title="Delete category"
                      >
                        <FiX className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="glass p-6 rounded-premium border-white/50 shadow-glass self-start">
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pb-3 mb-4 border-b border-border">Create Category</h3>
              <form onSubmit={handleAddCategory} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Category title..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-premium text-xs focus:outline-none"
                />
                <Button type="submit" variant="primary" className="text-xs py-2 w-full cursor-pointer flex items-center justify-center gap-1">
                  <FiPlus /> Add
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardTab;
