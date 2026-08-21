import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import AdminModal from '../../../features/admin/components/AdminModal';
import CategoryPicker from './offers/CategoryPicker';
import OfferNameSelect from './offers/OfferNameSelect';
import SharedOfferFields from './offers/SharedOfferFields';
import CategoryConfigFields from './offers/config';
import { OFFER_CATEGORIES, CATEGORY_KEYS } from '../../../constants/offerCategories';
import { useLanguage } from '../../../context/LanguageContext';

const getNextWeekDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getNowDate = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const generateCouponCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'BIZ';
  for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

/**
 * OfferFormModal — 3-Step Wizard for 19-Type Offer Engine
 * Step 1: Select Offer Category (19 types)
 * Step 2: General & Targeting Details (Title, Offer Name, Dates, Products, Description)
 * Step 3: Category-Specific Config ("Extra Menu")
 */
export default function OfferFormModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  allListings = [],
}) {
  const { bi, t } = useLanguage();
  const isEdit = !!editData;
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    category: 'discount',
    offerName: '',
    title: '',
    description: '',
    couponCode: generateCouponCode(),
    startDate: getNowDate(),
    endDate: getNextWeekDate(),
    targetProducts: [],
    targetServices: [],
    bannerImage: '',
    priority: 0,
    config: {},
  });

  useEffect(() => {
    if (editData) {
      const category = editData.category || 'discount';
      setForm({
        category,
        offerName: editData.offerName || '',
        title: editData.title || '',
        description: editData.description || '',
        couponCode: editData.code || editData.couponCode || '',
        startDate: editData.startTime ? new Date(editData.startTime).toISOString().slice(0, 16) : getNowDate(),
        endDate: editData.endTime ? new Date(editData.endTime).toISOString().slice(0, 16) : (editData.validTill || getNextWeekDate()),
        targetProducts: editData.applicableProducts || editData.targetProducts || [],
        targetServices: editData.applicableServices || editData.targetServices || [],
        bannerImage: editData.image || editData.bannerImage || '',
        priority: editData.priority || 0,
        config: editData.config || (editData.discountValue ? {
          discountType: editData.discountType === 'fixed' ? 'fixed' : 'percent',
          discountValue: Number(editData.discountValue || editData.discountPct || 0),
          minOrderAmount: Number(editData.minOrderAmount || 0),
          maxDiscountLimit: editData.maxDiscountLimit || null,
        } : {}),
      });
      setStep(2); // Jump to details when editing
    } else {
      setForm({
        category: 'discount',
        offerName: '',
        title: '',
        description: '',
        couponCode: generateCouponCode(),
        startDate: getNowDate(),
        endDate: getNextWeekDate(),
        targetProducts: [],
        targetServices: [],
        bannerImage: '',
        priority: 0,
        config: {
          discountType: 'percent',
          discountValue: 15,
          minOrderAmount: 0,
        },
      });
      setStep(1);
    }
  }, [editData, isOpen]);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateConfig = (key, value) => {
    setForm(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }));
  };

  const handleSelectCategory = (catKey) => {
    const defaultNames = OFFER_CATEGORIES[catKey]?.offerNames || [];
    updateForm('category', catKey);
    updateForm('offerName', defaultNames[0] || '');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!form.title.trim()) {
      setStep(2);
      return toast.error('Offer title is required');
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setStep(2);
      return toast.error('End date must be after start date');
    }

    setSubmitting(true);
    try {
      const payload = {
        category: form.category,
        offerName: form.offerName || undefined,
        title: form.title.trim(),
        description: form.description,
        code: form.couponCode ? form.couponCode.toUpperCase() : undefined,
        couponCode: form.couponCode ? form.couponCode.toUpperCase() : undefined,
        startTime: new Date(form.startDate).toISOString(),
        endTime: new Date(form.endDate).toISOString(),
        applicableProducts: form.targetProducts,
        applicableServices: form.targetServices,
        image: form.bannerImage || null,
        priority: Number(form.priority || 0),
        config: form.config || {},
        status: 'Active',
      };

      if (isEdit) payload._editId = editData._id || editData.id;
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const currentCategoryMeta = OFFER_CATEGORIES[form.category] || OFFER_CATEGORIES.discount;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? bi('Edit Dynamic Offer', 'डायनामिक ऑफर संपादित करें') : bi('Create New Promotional Offer (19 Engine Types)', 'नया प्रमोशनल ऑफर बनाएं')}
      subtitle={bi('Launch high-conversion discount coupons, buy 1 get 1, flash sales, combo bundles, & cashback deals', 'उच्च-रूपांतरण डिस्काउंट कूपन, कॉम्बो बंडल और कैशबैक ऑफर लॉन्च करें')}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Wizard Step Indicator */}
        <div className="flex items-center justify-between bg-surface border border-border p-2.5 rounded-2xl text-xs">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 font-bold transition ${
              step === 1 ? 'text-brand-purple' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 1 ? 'bg-brand-purple text-white' : 'bg-surface border border-border'
            }`}>1</span>
            <span>{bi('1. Category Type', '1. श्रेणी का प्रकार')}</span>
          </button>

          <span className="text-border">→</span>

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex items-center gap-1.5 font-bold transition ${
              step === 2 ? 'text-brand-purple' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 2 ? 'bg-brand-purple text-white' : 'bg-surface border border-border'
            }`}>2</span>
            <span>{bi('2. General Details', '2. सामान्य विवरण')}</span>
          </button>

          <span className="text-border">→</span>

          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex items-center gap-1.5 font-bold transition ${
              step === 3 ? 'text-brand-purple' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 3 ? 'bg-brand-purple text-white' : 'bg-surface border border-border'
            }`}>3</span>
            <span>{bi(`3. Config (${currentCategoryMeta.label})`, `3. विन्यास (${currentCategoryMeta.label})`)}</span>
          </button>
        </div>

        {/* Step 1: Category Picker */}
        {step === 1 && (
          <div>
            <p className="text-xs text-text-secondary mb-3">
              {bi('Select one of the 19 offer categories for your promotion:', 'अपने प्रचार के लिए 19 ऑफर श्रेणियों में से एक चुनें:')}
            </p>
            <CategoryPicker
              selectedCategory={form.category}
              onSelectCategory={handleSelectCategory}
            />
          </div>
        )}

        {/* Step 2: Shared Fields + Offer Name */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 bg-brand-purple/5 border border-brand-purple/15 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentCategoryMeta.icon}</span>
                <div>
                  <div className="text-xs font-bold text-text-primary">{currentCategoryMeta.label}</div>
                  <div className="text-[10px] text-text-tertiary">{currentCategoryMeta.group}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[10px] font-bold text-brand-purple hover:underline"
              >
                {bi('Change Type', 'प्रकार बदलें')}
              </button>
            </div>

            <OfferNameSelect
              category={form.category}
              value={form.offerName}
              onChange={(val) => updateForm('offerName', val)}
            />

            <SharedOfferFields
              form={form}
              updateForm={updateForm}
              allListings={allListings}
              showCouponField={['coupon', 'discount', 'first_order', 'festival_seasonal'].includes(form.category)}
              generateCouponCode={generateCouponCode}
            />

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-text-secondary hover:bg-surface flex items-center gap-1.5"
              >
                <FiArrowLeft className="w-3.5 h-3.5" /> {bi('Back', 'पीछे')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!form.title.trim()) return toast.error('Offer title is required');
                  setStep(3);
                }}
                className="px-5 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs border-none cursor-pointer"
              >
                {bi('Next: Configure Offer', 'आगे: ऑफर कॉन्फ़िगर करें')} <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Category Config Fields */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-3 bg-surface border border-border rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentCategoryMeta.icon}</span>
                <div>
                  <span className="text-xs font-bold text-text-primary">
                    {bi(`Extra Settings: ${currentCategoryMeta.label}`, `अतिरिक्त सेटिंग्स: ${currentCategoryMeta.label}`)}
                  </span>
                  <div className="text-[10px] text-text-tertiary">
                    {form.title || bi('Untitled Offer', 'बिना शीर्षक वाला ऑफर')}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-[10px] font-bold text-brand-purple hover:underline"
              >
                {bi('Edit General', 'सामान्य जानकारी संपादित करें')}
              </button>
            </div>

            <CategoryConfigFields
              category={form.category}
              config={form.config}
              updateConfig={updateConfig}
            />

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-text-secondary hover:bg-surface flex items-center gap-1.5"
              >
                <FiArrowLeft className="w-3.5 h-3.5" /> {bi('Back', 'पीछे')}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs border-none disabled:opacity-50 cursor-pointer"
              >
                {submitting ? bi('Saving...', 'सहेजा जा रहा है...') : (
                  <>
                    <FiCheck className="w-4 h-4" />
                    {isEdit ? bi('Update Offer', 'ऑफर अपडेट करें') : bi('Publish Offer', 'ऑफर प्रकाशित करें')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
}
