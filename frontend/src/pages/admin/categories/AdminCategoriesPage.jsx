import React, { useState } from 'react';
import { FiFolder, FiPlus, FiTrash2, FiCornerDownRight, FiPackage, FiTool, FiEdit, FiUpload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useBulkUploadCategoriesMutation,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'product', label: 'Product Categories & Subcategories', icon: FiPackage },
  { key: 'service', label: 'Service Categories & Subcategories', icon: FiTool },
];

export default function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState('product');
  const [showAddModal, setShowAddModal] = useState(false);
  const [parentCatId, setParentCatId] = useState('');
  const [catName, setCatName] = useState('');
  const [expandedCats, setExpandedCats] = useState({});

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const { data, isLoading } = useListCategoriesQuery(undefined, { pollingInterval: 4000 });
  const [createCategory] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [bulkUploadCategories] = useBulkUploadCategoriesMutation();

  const downloadTemplate = () => {
    const headers = ['category_name', 'category_type', 'subcategory_name', 'description', 'required_licenses'];
    const sampleRows = [
      ['Electronics', 'product', 'Mobile', 'Smartphones and accessories', 'GST Registration'],
      ['Electronics', 'product', 'Laptop', 'Laptops and notebooks', 'GST Registration'],
      ['Services', 'service', 'Plumber', 'Plumbing and leak fixing services', 'Trade License'],
      ['Beauty & Salon', 'service', 'Makeup', 'Professional makeup services', 'ISO Certification'],
    ];
    const csvRows = [
      headers.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ];
    const csvContent = "\uFEFF" + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "categories_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return toast.error('Please select an Excel or CSV file first');
    const formData = new FormData();
    formData.append('file', selectedFile);
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await bulkUploadCategories(formData).unwrap();
      setUploadResult(res);
      toast.success('Bulk upload processed!');
      setSelectedFile(null);
      document.getElementById('excel-file-input').value = '';
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to upload categories');
    } finally {
      setUploading(false);
    }
  };

  const allCategories = data?.items || [];

  // Filter by active tab's category_type, or show all if no type is set (backward compat)
  const typedCategories = allCategories.filter((c) => {
    if (c.category_type) return c.category_type === activeTab;
    // Legacy categories without category_type: show in product tab by default
    // unless they look like services (heuristic based on common service names)
    const serviceNames = ['services', 'plumber', 'electrician', 'carpenter', 'cleaning', 'painter', 'salon', 'spa', 'yoga'];
    const isServiceLike = serviceNames.some(s => (c.name || '').toLowerCase().includes(s));
    return activeTab === 'service' ? isServiceLike : !isServiceLike;
  });

  const parentCategories = typedCategories.filter((c) => !c.parent_id);

  const getSubcategories = (parentId) => {
    return allCategories.filter((c) => c.parent_id === parentId || c.parent_id === parentId?.toString());
  };

  const toggleExpanded = (id) => {
    setExpandedCats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [requiredLicensesInput, setRequiredLicensesInput] = useState('');
  const [selectedLicenses, setSelectedLicenses] = useState([]);

  const PRESET_LICENSES = ['FSSAI License', 'Drug License', 'GST Registration', 'Trade License', 'BIS Certificate', 'ISO Certification', 'Fire Safety NOC', 'Pollution NOC'];

  const toggleLicense = (lic) => {
    setSelectedLicenses((prev) =>
      prev.includes(lic) ? prev.filter((l) => l !== lic) : [...prev, lic]
    );
  };

  const handleAddLicenseTag = (e) => {
    if (e.key === 'Enter' && requiredLicensesInput.trim()) {
      e.preventDefault();
      if (!selectedLicenses.includes(requiredLicensesInput.trim())) {
        setSelectedLicenses([...selectedLicenses, requiredLicensesInput.trim()]);
      }
      setRequiredLicensesInput('');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return toast.error('Category name required');
    try {
      await createCategory({
        name: catName.trim(),
        parent_id: parentCatId || null,
        category_type: activeTab,
        required_licenses: selectedLicenses,
      }).unwrap();
      toast.success('Category created with special license requirements!');
      setCatName('');
      setParentCatId('');
      setSelectedLicenses([]);
      setRequiredLicensesInput('');
      setShowAddModal(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create category');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}" and all its subcategories?`)) return;
    try {
      await deleteCategory(id).unwrap();
      toast.success('Category deleted!');
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  };

  const totalParent = parentCategories.length;
  const totalSub = typedCategories.filter((c) => c.parent_id).length;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiFolder}
        title="Category & Subcategory Manager"
        subtitle="Organize product and service classifications and define required vendor licenses & certificates"
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setUploadResult(null);
              setSelectedFile(null);
              setShowBulkModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-premium cursor-pointer"
          >
            <FiUpload className="w-4 h-4" /> Bulk Upload (Excel/CSV)
          </button>
          <button
            onClick={() => { setParentCatId(''); setSelectedLicenses([]); setShowAddModal(true); }}
            className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-premium"
          >
            <FiPlus className="w-4 h-4" /> Add Category / Subcategory
          </button>
        </div>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Summary Bar */}
      <div className="glass p-4 rounded-2xl border border-white/50 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-purple/10 text-brand-purple rounded-xl">
            <FiFolder className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-tertiary uppercase block">Parent Categories</span>
            <span className="text-sm font-black text-text-primary font-display">{totalParent}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-orange/10 text-brand-orange rounded-xl">
            <FiCornerDownRight className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-tertiary uppercase block">Sub-Categories</span>
            <span className="text-sm font-black text-text-primary font-display">{totalSub}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 skeleton rounded-2xl" />
          ))}
        </div>
      ) : parentCategories.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center border border-white/50">
          <FiFolder className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-50" />
          <p className="text-sm font-bold text-text-secondary">No {activeTab} categories yet</p>
          <p className="text-xs text-text-tertiary mt-1">Click "Add Category" to create your first {activeTab} category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parentCategories.map((parent) => {
            const parentId = parent._id || parent.id;
            const subs = getSubcategories(parentId);
            const isExpanded = expandedCats[parentId] !== false; // default expanded
            const reqDocs = parent.required_licenses || [];

            return (
              <div key={parentId} className="glass rounded-2xl p-5 border border-white/50 shadow-glass space-y-3">
                {/* Parent Category Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <button
                    onClick={() => toggleExpanded(parentId)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <div className="p-2 bg-brand-purple/10 text-brand-purple rounded-xl">
                      {activeTab === 'service' ? <FiTool className="w-4 h-4" /> : <FiPackage className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary font-display">{parent.name}</h4>
                      <span className="text-[10px] text-text-tertiary">
                        /{parent.slug || parent.name.toLowerCase()} · {subs.length} subcategories
                      </span>
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setParentCatId(parentId); setSelectedLicenses([]); setShowAddModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-brand-purple text-xs font-bold flex items-center gap-1"
                      title="Add Subcategory"
                    >
                      <FiPlus className="w-3.5 h-3.5" /> Sub
                    </button>
                    <button
                      onClick={() => handleDelete(parentId, parent.name)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
                      title="Delete Category"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Required Licenses / Certificates Badges */}
                {reqDocs.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase">Mandatory Docs:</span>
                    {reqDocs.map((doc, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        📜 {doc}
                      </span>
                    ))}
                  </div>
                )}

                {/* Subcategories List */}
                {isExpanded && (
                  <div className="space-y-1.5 pl-4">
                    {subs.length === 0 ? (
                      <span className="text-[10px] text-text-tertiary italic">No subcategories yet. Click '+ Sub' to add.</span>
                    ) : (
                      subs.map((sub) => (
                        <div key={sub._id || sub.id} className="flex items-center justify-between py-1.5 px-3 bg-surface-secondary rounded-xl hover:bg-brand-purple/5 transition-colors">
                          <div className="flex items-center gap-2">
                            <FiCornerDownRight className="w-3 h-3 text-brand-purple/50" />
                            <span className="text-xs font-semibold text-text-primary">{sub.name}</span>
                            {sub.required_licenses && sub.required_licenses.length > 0 && (
                              <span className="text-[9px] bg-brand-purple/10 text-brand-purple font-bold px-1.5 py-0.5 rounded">
                                {sub.required_licenses.length} License(s) Req.
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(sub._id || sub.id, sub.name)}
                            className="text-text-tertiary hover:text-red-500 p-1 rounded transition-all"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <AdminModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Category & Special Document Requirements">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="bg-surface-secondary p-3 rounded-xl">
            <span className="text-[10px] font-bold text-text-tertiary uppercase">Creating for:</span>
            <span className="text-xs font-bold text-brand-purple ml-2 capitalize">{activeTab} Categories</span>
          </div>

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
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Category Name *</label>
            <input
              type="text"
              required
              placeholder={activeTab === 'service' ? 'e.g. Plumbing, Hair Styling' : 'e.g. Mobile Accessories, Laptops'}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>

          {/* Special Document / License Requirements for Category */}
          <div className="space-y-2 border-t border-border pt-3">
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
              Required Special Documents / Licenses for this Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LICENSES.map((lic) => {
                const isSelected = selectedLicenses.includes(lic);
                return (
                  <button
                    type="button"
                    key={lic}
                    onClick={() => toggleLicense(lic)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                      isSelected
                        ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                        : 'bg-surface border-border text-text-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {lic}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Or type custom license/certificate and press Enter..."
              value={requiredLicensesInput}
              onChange={(e) => setRequiredLicensesInput(e.target.value)}
              onKeyDown={handleAddLicenseTag}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple mt-1"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1"
          >
            <FiPlus /> Add Category with Licenses
          </button>
        </form>
      </AdminModal>

      {/* Bulk Upload Modal */}
      <AdminModal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Upload Categories & Subcategories">
        <div className="space-y-4">
          <div className="bg-surface-secondary p-4 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2">
            <FiUpload className="w-8 h-8 text-brand-purple opacity-75 animate-bounce" />
            <div>
              <p className="text-xs font-bold text-text-primary">Upload categories template</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">Supports .xlsx, .xls, and .csv files.</p>
            </div>
            <button
              onClick={downloadTemplate}
              type="button"
              className="text-[11px] font-bold text-brand-purple hover:underline cursor-pointer"
            >
              📥 Download Sample Template
            </button>
          </div>

          <form onSubmit={handleBulkUpload} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Select File *</label>
              <input
                id="excel-file-input"
                type="file"
                required
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {uploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                  Processing File...
                </>
              ) : (
                <>
                  <FiUpload className="w-4 h-4" /> Start Bulk Upload
                </>
              )}
            </button>
          </form>

          {/* Results Summary */}
          {uploadResult && (
            <div className="bg-surface-secondary rounded-xl p-4 border border-border space-y-3">
              <h5 className="text-xs font-bold text-text-primary font-display flex items-center gap-1">
                📊 Upload Summary
              </h5>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="bg-brand-purple/10 text-brand-purple p-2 rounded-lg font-bold">
                  <div>Categories</div>
                  <div className="text-sm mt-0.5">+{uploadResult.createdCategories}</div>
                </div>
                <div className="bg-brand-orange/10 text-brand-orange p-2 rounded-lg font-bold">
                  <div>Subcategories</div>
                  <div className="text-sm mt-0.5">+{uploadResult.createdSubcategories}</div>
                </div>
                <div className="bg-blue-500/10 text-blue-600 p-2 rounded-lg font-bold">
                  <div>Updated</div>
                  <div className="text-sm mt-0.5">{uploadResult.updatedCategories}</div>
                </div>
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-red-500 uppercase">Errors/Warnings ({uploadResult.errors.length}):</div>
                  <div className="max-h-28 overflow-y-auto text-[10px] font-mono text-red-500 bg-red-500/5 p-2 rounded-lg border border-red-500/10 space-y-1">
                    {uploadResult.errors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
