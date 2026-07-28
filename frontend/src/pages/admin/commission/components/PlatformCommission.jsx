import React, { useState } from 'react';
import { FiCheck, FiInfo } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import {
  useGetCommissionConfigQuery,
  useUpdateCommissionConfigMutation,
  useListCategoriesQuery,
} from '../../../../features/admin/adminApi';

export default function PlatformCommission() {
  const { data: config, isFetching: loadingConfig } = useGetCommissionConfigQuery();
  const { data: categoriesData, isFetching: loadingCats } = useListCategoriesQuery({ limit: 100 });
  const [updateConfig, { isLoading: updating }] = useUpdateCommissionConfigMutation();

  const [globalRate, setGlobalRate] = useState('');
  const [catRates, setCatRates] = useState({});
  const [reason, setReason] = useState('');

  const commissions = config?.commissions || [];
  const categories = categoriesData?.items || [];

  const globalRateSetting = commissions.find(c => c.config_type === 'global');

  // Initialize inputs on load
  React.useEffect(() => {
    if (globalRateSetting) {
      setGlobalRate(globalRateSetting.rate.toString());
    }
  }, [globalRateSetting]);

  const handleUpdateGlobal = async (e) => {
    e.preventDefault();
    if (!globalRate || parseFloat(globalRate) < 0 || parseFloat(globalRate) > 100) {
      return toast.error('Global rate must be between 0 and 100%');
    }
    if (!reason) return toast.error('Audit trail reason is required');

    try {
      await updateConfig({
        config_type: 'global',
        rate: parseFloat(globalRate),
        reason,
      }).unwrap();
      toast.success('Global platform commission updated!');
      setReason('');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleUpdateCategory = async (catId, rateVal) => {
    if (rateVal === '' || parseFloat(rateVal) < 0 || parseFloat(rateVal) > 100) {
      return toast.error('Rate must be between 0 and 100%');
    }
    const editReason = window.prompt(`Enter reason for updating commission rate to ${rateVal}% (Required for audit trail):`);
    if (!editReason) return toast.error('Reason is required to update category rates');

    try {
      await updateConfig({
        config_type: 'category',
        category_id: catId,
        rate: parseFloat(rateVal),
        reason: editReason,
      }).unwrap();
      toast.success('Category commission rate updated!');
    } catch (err) {
      toast.error('Category rate update failed');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs animate-fade-in">
      {/* Global Setting Column */}
      <div className="glass rounded-2xl p-5 border border-white/50 space-y-4">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1">
          Global Marketplace Rate
        </h3>
        <p className="text-[10px] text-text-tertiary">
          The global commission rate is charged on all completed marketplace sales and customer orders unless a specific category rate is configured.
        </p>

        <form onSubmit={handleUpdateGlobal} className="space-y-3 pt-2">
          <div>
            <label className="block mb-1 text-text-tertiary font-bold uppercase tracking-wider text-[10px]">Commission Rate (%)</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 5"
                value={globalRate}
                onChange={(e) => setGlobalRate(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-surface border border-border rounded-xl font-bold focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-text-tertiary">%</span>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-text-tertiary font-bold uppercase tracking-wider text-[10px]">Reason for Change *</label>
            <textarea
              rows={3}
              placeholder="Explain why this rate is being modified..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={updating || loadingConfig}
            className="w-full py-2.5 bg-brand-purple text-white rounded-xl font-bold hover:bg-brand-purple/95 transition-all flex items-center justify-center gap-1 shadow-premium"
          >
            <FiCheck className="w-4 h-4" /> Save Global Rate
          </button>
        </form>
      </div>

      {/* Category Rates Column */}
      <div className="lg:col-span-2 glass rounded-2xl p-5 border border-white/50 space-y-4">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Per-Category Commission Rules</h3>
        <p className="text-[10px] text-text-tertiary">
          Customize commission percentages per service/product category. Active rules override the global marketplace commission rate.
        </p>

        <div className="border border-border rounded-2xl overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/50">
                  <th className="text-left px-4 py-2.5 font-bold text-text-tertiary uppercase text-[10px]">Category Name</th>
                  <th className="text-right px-4 py-2.5 font-bold text-text-tertiary uppercase text-[10px] w-32">Custom Rate</th>
                  <th className="text-center px-4 py-2.5 font-bold text-text-tertiary uppercase text-[10px] w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingCats ? (
                  <tr><td colSpan={3} className="text-center py-6 text-text-tertiary">Loading categories...</td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-6 text-text-tertiary">No categories configured.</td></tr>
                ) : (
                  categories.map((cat) => {
                    const customRate = commissions.find(c => c.config_type === 'category' && c.category_id === cat._id || c.category_id === cat.id);
                    const currentRateVal = customRate ? customRate.rate : '';
                    
                    return (
                      <tr key={cat.id || cat._id} className="hover:bg-surface-secondary/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-text-primary">{cat.name}</span>
                          <span className="text-[10px] text-text-tertiary block capitalize">
                            Slug: {cat.slug || cat.name.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end relative w-24">
                            <input
                              type="number"
                              step="0.1"
                              placeholder={globalRateSetting ? `${globalRateSetting.rate}` : '5.0'}
                              defaultValue={currentRateVal}
                              onBlur={(e) => {
                                setCatRates(p => ({ ...p, [cat.id || cat._id]: e.target.value }));
                              }}
                              className="w-16 px-2 py-1 bg-surface border border-border rounded-lg text-right font-bold focus:outline-none"
                            />
                            <span className="text-text-tertiary">%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              const rateVal = catRates[cat.id || cat._id] !== undefined ? catRates[cat.id || cat._id] : currentRateVal;
                              handleUpdateCategory(cat.id || cat._id, rateVal);
                            }}
                            className="px-2 py-1 bg-brand-purple/10 text-brand-purple rounded-lg font-bold hover:bg-brand-purple/20 transition-all text-[10px]"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
