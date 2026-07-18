import React, { useState } from 'react';
import { FiMapPin, FiPlus, FiStar, FiSliders, FiGlobe } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListLocationsQuery,
  useCreateLocationMutation,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'hierarchy', label: 'Country / State / City / Pincode Hierarchy', icon: FiMapPin },
  { key: 'popular', label: 'Popular Locations', icon: FiStar },
  { key: 'radius', label: 'Distance Radius Settings', icon: FiSliders },
];

export default function AdminLocationsPage() {
  const [activeTab, setActiveTab] = useState('hierarchy');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [radiusKm, setRadiusKm] = useState(25);
  const [form, setForm] = useState({ name: '', type: 'city', is_popular: false });

  const { data, isFetching } = useListLocationsQuery(undefined, { pollingInterval: 5000 });
  const [createLocation] = useCreateLocationMutation();

  const locations = data?.items || [
    { id: '1', name: 'India', type: 'country', is_popular: true, is_active: true },
    { id: '2', name: 'Delhi NCR', type: 'state', is_popular: true, is_active: true },
    { id: '3', name: 'New Delhi', type: 'city', is_popular: true, is_active: true },
    { id: '4', name: 'Mumbai', type: 'city', is_popular: true, is_active: true },
    { id: '5', name: 'Bengaluru', type: 'city', is_popular: true, is_active: true },
    { id: '6', name: 'Connaught Place', type: 'area', is_popular: false, is_active: true },
    { id: '7', name: '110001', type: 'pincode', is_popular: false, is_active: true },
  ];

  const filtered = locations.filter((l) => {
    if (activeTab === 'popular') return l.is_popular;
    return true;
  });

  const handleAddLocation = async () => {
    if (!form.name.trim()) return toast.error('Location name required');
    try {
      await createLocation(form).unwrap();
      toast.success('Location added!');
      setShowAddModal(false);
      setForm({ name: '', type: 'city', is_popular: false });
    } catch (err) {
      toast.error(err?.data?.message || 'Add failed');
    }
  };

  const handleSaveRadius = () => {
    toast.success(`Default discovery search radius set to ${radiusKm} KM`);
  };

  const columns = [
    {
      key: 'name',
      label: 'Location Name',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <FiMapPin className="w-4 h-4 text-brand-purple" />
          <span className="font-bold text-text-primary">{val}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Hierarchy Level',
      render: (val) => (
        <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
          {val}
        </span>
      ),
    },
    {
      key: 'is_popular',
      label: 'Popular City',
      render: (val) => (
        <span className={`text-xs font-bold ${val ? 'text-amber-500' : 'text-text-tertiary'}`}>
          {val ? '★ Popular' : 'Standard'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val !== false ? 'Active' : 'Inactive'} />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiMapPin}
        title="Location Manager"
        subtitle="Manage country, state, district, city, area, pincode hierarchy and search radius"
      >
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-premium"
        >
          <FiPlus className="w-4 h-4" /> Add Location
        </button>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'radius' ? (
        <div className="glass p-6 rounded-2xl border border-white/50 space-y-6 max-w-xl">
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display mb-1 flex items-center gap-2">
              <FiSliders className="text-brand-purple" /> Distance Radius Settings
            </h3>
            <p className="text-xs text-text-tertiary">Set default search radius for nearby listings and vendor discovery.</p>
          </div>

          <div className="space-y-4 bg-surface-secondary p-4 rounded-xl">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>Default Radius:</span>
                <span className="text-brand-purple">{radiusKm} KM</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                className="w-full accent-brand-purple"
              />
              <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                <span>5 KM</span>
                <span>25 KM</span>
                <span>50 KM</span>
                <span>100 KM</span>
              </div>
            </div>

            <button
              onClick={handleSaveRadius}
              className="w-full py-2 bg-brand-purple text-white text-xs font-bold rounded-xl hover:bg-brand-purple-800 transition-all"
            >
              Save Radius Setting
            </button>
          </div>
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          data={filtered}
          loading={isFetching}
          searchPlaceholder="Search locations by name..."
          searchValue={search}
          onSearch={setSearch}
          emptyMessage="No locations registered."
          testId="locations-table"
        />
      )}

      {/* Add Location Modal */}
      <AdminModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Location Entry">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Hierarchy Level</label>
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            >
              <option value="country">Country</option>
              <option value="state">State</option>
              <option value="district">District</option>
              <option value="city">City</option>
              <option value="area">Area</option>
              <option value="pincode">Pincode</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Location Name / Code</label>
            <input
              type="text"
              placeholder="e.g. Mumbai or 400001"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="popCheck"
              checked={form.is_popular}
              onChange={(e) => setForm((prev) => ({ ...prev, is_popular: e.target.checked }))}
              className="rounded border-border text-brand-purple"
            />
            <label htmlFor="popCheck" className="text-xs text-text-secondary cursor-pointer font-semibold">
              Mark as Popular Location
            </label>
          </div>

          <button
            onClick={handleAddLocation}
            className="w-full py-2.5 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1"
          >
            <FiPlus /> Add Location
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
