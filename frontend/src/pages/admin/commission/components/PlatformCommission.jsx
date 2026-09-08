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
      <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1">
          Global Marketplace Rate
        </h3>
        <p className="text-[10px] text-slate-500">
          The global commission rate is charged on all completed marketplace sales and customer orders unless a specific category rate is configured.
        </p>

        <form onSubmit={handleUpdateGlobal} className="space-y-3 pt-2">
          <div>
            <label className="block mb-1 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Commission Rate (%)</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 5"
                value={globalRate}
                onChange={(e) => setGlobalRate(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-white border border-[#e3dccb] rounded-xl font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Reason for Change *</label>
            <textarea
              rows={3}
              placeholder="Explain why this rate is being modified..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={updating || loadingConfig}
            className="w-full py-2.5 bg-[#1a1a1a] text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
          >
            <FiCheck className="w-4 h-4" /> Save Global Rate
          </button>
        </form>
      </div>

      {/* Category Rates Column */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wider">Per-Category Commission Rules</h3>
        <p className="text-[10px] text-slate-500">
          Customize commission percentages per service/product category. Active rules override the global marketplace commission rate.
        </p>

        <div className="border border-[#e3dccb] rounded-2xl overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e3dccb] bg-[#f8f4ec]">
                  <th className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase text-[10px]">Category Name</th>
                  <th className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase text-[10px] w-32">Custom Rate</th>
                  <th className="text-center px-4 py-2.5 font-bold text-slate-500 uppercase text-[10px] w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3dccb]">
                {loadingCats ? (
                  <tr><td colSpan={3} className="text-center py-6 text-slate-400">Loading categories...</td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-6 text-slate-400">No categories configured.</td></tr>
                ) : (
                  categories.map((cat) => {
                    const customRate = commissions.find(c => c.config_type === 'category' && (c.category_id === cat._id || c.category_id === cat.id));
                    const currentRateVal = customRate ? customRate.rate : '';
                    
                    return (
                      <tr key={cat.id || cat._id} className="hover:bg-[#fbf9f4] transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-[#1a1a1a]">{cat.name}</span>
                          <span className="text-[10px] text-slate-400 block capitalize">
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
                              className="w-16 px-2 py-1 bg-white border border-[#e3dccb] rounded-lg text-right font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                            />
                            <span className="text-slate-400">%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              const rateVal = catRates[cat.id || cat._id] !== undefined ? catRates[cat.id || cat._id] : currentRateVal;
                              handleUpdateCategory(cat.id || cat._id, rateVal);
                            }}
                            className="px-2.5 py-1 bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] rounded-lg font-bold hover:bg-white transition-all text-[10px] cursor-pointer shadow-xs"
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
