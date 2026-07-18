import React, { useState } from 'react';
import { FiFolder, FiPlus, FiTrash2, FiTag, FiCornerDownRight, FiPackage, FiTool } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'products', label: 'Product Categories & Subcategories', icon: FiPackage },
  { key: 'services', label: 'Service Categories & Subcategories', icon: FiTool },
];

export default function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [showAddModal, setShowAddModal] = useState(false);
  const [parentCatId, setParentCatId] = useState('');
  const [catName, setCatName] = useState('');

  const { data, isLoading } = useListCategoriesQuery(undefined, { pollingInterval: 4000 });
  const [createCategory] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const allCategories = data?.items || [
    { _id: 'cat_1', name: 'Electronics', slug: 'electronics', parent_id: null },
    { _id: 'cat_1_1', name: 'Mobile Phones', slug: 'mobile-phones', parent_id: 'cat_1' },
    { _id: 'cat_1_2', name: 'Laptops', slug: 'laptops', parent_id: 'cat_1' },
    { _id: 'cat_2', name: 'Beauty & Salon', slug: 'beauty-salon', parent_id: null },
    { _id: 'cat_2_1', name: 'Hair Styling', slug: 'hair-styling', parent_id: 'cat_2' },
    { _id: 'cat_2_2', name: 'Spa & Massage', slug: 'spa-massage', parent_id: 'cat_2' },
  ];

  const parentCategories = allCategories.filter((c) => !c.parent_id);

  const getSubcategories = (parentId) => {
    return allCategories.filter((c) => c.parent_id === parentId || c.parent_id === parentId.toString());
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return toast.error('Category name required');
    try {
      await createCategory({ name: catName.trim(), parent_id: parentCatId || null }).unwrap();
      toast.success('Category created successfully!');
      setCatName('');
      setParentCatId('');
      setShowAddModal(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create category');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await deleteCategory(id).unwrap();
      toast.success('Category deleted!');
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiFolder}
        title="Category & Subcategory Manager"
        subtitle="Organize product and service classifications into hierarchical categories"
      >
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-premium"
        >
          <FiPlus className="w-4 h-4" /> Add Category / Subcategory
        </button>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {isLoading ? (
        <div className="py-12 text-center text-xs text-text-tertiary">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parentCategories.map((parent) => {
            const subs = getSubcategories(parent._id || parent.id);
            return (
              <div key={parent._id || parent.id} className="glass rounded-2xl p-5 border border-white/50 shadow-glass space-y-3">
                {/* Parent Category Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-purple/10 text-brand-purple rounded-xl">
                      <FiFolder className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary font-display">{parent.name}</h4>
                      <span className="text-[10px] text-text-tertiary">/{parent.slug || parent.name.toLowerCase()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setParentCatId(parent._id || parent.id); setShowAddModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-brand-purple text-xs font-bold flex items-center gap-1"
                      title="Add Subcategory"
                    >
                      <FiPlus className="w-3.5 h-3.5" /> Sub
                    </button>
                    <button
                      onClick={() => handleDelete(parent._id || parent.id, parent.name)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
                      title="Delete Category"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subcategories List */}
                <div className="space-y-1.5 pl-4">
                  {subs.length === 0 ? (
                    <span className="text-[10px] text-text-tertiary italic">No subcategories yet. Click '+ Sub' to add.</span>
                  ) : (
                    subs.map((sub) => (
                      <div key={sub._id || sub.id} className="flex items-center justify-between py-1.5 px-3 bg-surface-secondary rounded-xl hover:bg-brand-purple/5 transition-colors">
                        <div className="flex items-center gap-2">
                          <FiCornerDownRight className="w-3 h-3 text-brand-purple/50" />
                          <span className="text-xs font-semibold text-text-primary">{sub.name}</span>
                        </div>
                        <button
                          onClick={() => handleDelete(sub._id || sub.id, sub.name)}
                          className="text-text-tertiary hover:text-red-500 p-1 rounded transition-all"
                        >
                          <FiTrash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <AdminModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Category / Subcategory">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Category Type / Parent</label>
            <select
              value={parentCatId}
              onChange={(e) => setParentCatId(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            >
              <option value="">(None - Top Level Category)</option>
              {parentCategories.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>Subcategory of {p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Category Name</label>
            <input
              type="text"
              placeholder="e.g. Mobile Accessories or Salon & Spa"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1"
          >
            <FiPlus /> Add Category
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
