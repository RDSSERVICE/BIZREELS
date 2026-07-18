import React, { useState } from 'react';
import { FiPackage, FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff, FiCheck, FiClock, FiShoppingBag, FiTool } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VendorListingsPage() {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'services' | 'used' | 'draft' | 'published' | 'expired' | 'hidden'
  const [showAddModal, setShowAddModal] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newType, setNewType] = useState('product');
  const [newCategory, setNewCategory] = useState('Electronics');

  const [listings, setListings] = useState([
    { id: '1', title: 'Sony Bravia 55" 4K Smart OLED TV', type: 'product', price: 64990, status: 'published', isUsed: false, views: 1420 },
    { id: '2', title: 'Professional AC Servicing & Chemical Wash', type: 'service', price: 1499, status: 'published', isUsed: false, views: 890 },
    { id: '3', title: 'Used iPhone 13 Pro 128GB (Good Condition)', type: 'product', price: 42000, status: 'published', isUsed: true, views: 650 },
    { id: '4', title: 'Draft: Wooden Dining Table 6 Seater', type: 'product', price: 18500, status: 'draft', isUsed: false, views: 0 },
    { id: '5', title: 'Seasonal Clearance Discount Pack', type: 'product', price: 499, status: 'expired', isUsed: false, views: 310 },
    { id: '6', title: 'Hidden Listing: Secret Combo Deal', type: 'product', price: 2999, status: 'hidden', isUsed: false, views: 45 },
  ]);

  const filtered = listings.filter((item) => {
    if (activeTab === 'products') return item.type === 'product' && !item.isUsed;
    if (activeTab === 'services') return item.type === 'service';
    if (activeTab === 'used') return item.isUsed;
    if (activeTab === 'draft') return item.status === 'draft';
    if (activeTab === 'published') return item.status === 'published';
    if (activeTab === 'expired') return item.status === 'expired';
    if (activeTab === 'hidden') return item.status === 'hidden';
    return true;
  });

  const handleAddListing = (e) => {
    e.preventDefault();
    if (!newTitle || !newPrice) {
      toast.error('Please enter title and price');
      return;
    }

    const item = {
      id: Date.now().toString(),
      title: newTitle,
      type: newType,
      price: Number(newPrice),
      status: 'published',
      isUsed: false,
      views: 0
    };

    setListings([item, ...listings]);
    setNewTitle('');
    setNewPrice('');
    setShowAddModal(false);
    toast.success('New listing published successfully!');
  };

  const handleToggleHide = (id) => {
    setListings(listings.map((l) => l.id === id ? { ...l, status: l.status === 'hidden' ? 'published' : 'hidden' } : l));
    toast.success('Listing visibility updated');
  };

  const handleDelete = (id) => {
    setListings(listings.filter((l) => l.id !== id));
    toast.success('Listing deleted');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiPackage className="text-pink-400" />
            <span>My Business Listings</span>
          </h2>
          <p className="text-xs text-slate-400">Manage products, services, used goods, drafts, published, and expired items</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-lg shadow-pink-500/20 transition"
        >
          <FiPlus size={16} />
          <span>Add New Listing</span>
        </button>
      </div>

      {/* Categories & Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2 scrollbar-none">
        {[
          { id: 'products', label: 'Products' },
          { id: 'services', label: 'Services' },
          { id: 'used', label: 'Used Products' },
          { id: 'published', label: 'Published' },
          { id: 'draft', label: 'Draft' },
          { id: 'expired', label: 'Expired' },
          { id: 'hidden', label: 'Hidden' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition ${activeTab === tab.id
                ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-slate-700 transition flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="font-bold text-pink-400 uppercase tracking-wider">{item.type}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'published' ? 'bg-emerald-500/20 text-emerald-300' :
                    item.status === 'draft' ? 'bg-amber-500/20 text-amber-300' :
                      item.status === 'hidden' ? 'bg-purple-500/20 text-purple-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                  {item.status}
                </span>
              </div>
              <h4 className="font-bold text-sm text-white line-clamp-2">{item.title}</h4>
              <p className="text-lg font-black text-white mt-2">₹{item.price.toLocaleString()}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <FiEye size={14} className="text-slate-500" />
                {item.views} Views
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleHide(item.id)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title={item.status === 'hidden' ? 'Unhide Listing' : 'Hide Listing'}
                >
                  {item.status === 'hidden' ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                  title="Delete Listing"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Listing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create New Listing</h3>
            <form onSubmit={handleAddListing} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Listing Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Listing title..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Price..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
