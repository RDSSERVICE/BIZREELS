import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlusCircle, FiShoppingBag, FiTool
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { useCreateRequirementMutation } from '../../../features/customer/requirementsApi';
import { api, resolveMediaUrl } from '../../../lib/api';
import ProductRequirementForm from './ProductRequirementForm';
import ServiceRequirementForm from './ServiceRequirementForm';

const DISTANCE_OPTIONS = [
  { value: '', label: 'No distance limit' },
  { value: '5', label: 'Within 5 Km' },
  { value: '10', label: 'Within 10 Km' },
  { value: '25', label: 'Within 25 Km' },
  { value: '50', label: 'Within 50 Km' },
  { value: '100', label: 'Within 100 Km' },
  { value: '200', label: 'Within 200 Km' },
  { value: '500', label: 'Within 500 Km' },
];

export default function PostRequirementPage() {
  const navigate = useNavigate();
  const [createRequirement, { isLoading }] = useCreateRequirementMutation();
  const [type, setType] = useState('product');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [subcategory, setSubcategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [targetDistance, setTargetDistance] = useState('');
  const [description, setDescription] = useState('');
  const [otherConditions, setOtherConditions] = useState('');
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);

  // New Fields States
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [address, setAddress] = useState('');
  const [detailedSpecifications, setDetailedSpecifications] = useState('');
  const [isGeneratingSpecs, setIsGeneratingSpecs] = useState(false);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [expectedDeliveryTime, setExpectedDeliveryTime] = useState('');

  // Product Condition
  const [productCondition, setProductCondition] = useState('');
  const [customProductCondition, setCustomProductCondition] = useState('');

  // Service Model
  const [serviceModel, setServiceModel] = useState('');
  const [customServiceModel, setCustomServiceModel] = useState('');

  // Custom (Other) Category/Subcategory Name
  const [customCategory, setCustomCategory] = useState('');
  const [customSubcategory, setCustomSubcategory] = useState('');

  // India States/Districts list
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);

  // Fetch categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/v1/categories');
        const items = res.data?.items || [];
        setCategories(items);
        
        // Auto select first top-level category of type 'product' (initial type is 'product') on load
        const topLevel = items.filter(c => !c.parent_id);
        const typedCategories = topLevel.filter(c => c.category_type === 'product');
        const targetCategory = typedCategories.length > 0 ? typedCategories[0] : (topLevel.length > 0 ? topLevel[0] : null);
        if (targetCategory) {
          setCategory(targetCategory.name);
        }
      } catch {}
    };
    loadCategories();
  }, []);

  // Fetch India States list on mount
  useEffect(() => {
    const loadStates = async () => {
      try {
        const res = await api.get('/v1/location/states');
        setStatesList(res.data?.states || []);
      } catch {}
    };
    loadStates();
  }, []);

  // Fetch districts list when state changes
  useEffect(() => {
    if (!state) {
      setDistrictsList([]);
      return;
    }
    const loadDistricts = async () => {
      try {
        const res = await api.get(`/v1/location/districts?state=${encodeURIComponent(state)}`);
        setDistrictsList(res.data?.districts || []);
      } catch {}
    };
    loadDistricts();
  }, [state]);

  const parentCategories = categories.filter(c => !c.parent_id && c.category_type === type);
  const selectedParent = parentCategories.find(c => c.name === category);
  const subcategories = selectedParent
    ? categories.filter(c => c.parent_id === selectedParent.id)
    : [];

  const handlePincodeChange = async (pin) => {
    setPincode(pin);
    if (pin.length === 6 && /^\d{6}$/.test(pin)) {
      try {
        const res = await api.post('/v1/location/pincode-lookup', { pincode: pin });
        if (res.data && res.data.state) {
          setState(res.data.state);
          setCity(res.data.city || res.data.area || '');
          if (res.data.city) setDistrict(res.data.city);
        }
      } catch {}
    }
  };

  const handleGenerateSpecs = async () => {
    if (!title.trim()) {
      toast.error('Please enter a product/service title first.');
      return;
    }
    setIsGeneratingSpecs(true);
    try {
      const res = await api.post('/v1/ai/generate-specifications', {
        title,
        category: category === 'Other' ? customCategory : category,
        subcategory: subcategory === 'Other' ? customSubcategory : subcategory,
        requirementType: type,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        otherConditions,
      });
      if (res.data && res.data.ok) {
        setDetailedSpecifications(res.data.specifications);
        toast.success('Detailed specifications generated by AI!');
      } else {
        toast.error(res.data?.error || 'Failed to generate specifications.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error communicating with AI service.');
    } finally {
      setIsGeneratingSpecs(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    setUploading(true);
    const uploaded = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a supported format. Please use JPG, PNG or WebP.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'requirements');
        formData.append('resource_type', 'image');

        const res = await api.post('/v1/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const url = res.data?.url || res.data?.secure_url || res.data?.data?.url;
        if (url) uploaded.push(url);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setPhotos(prev => [...prev, ...uploaded]);
    setUploading(false);
    if (uploaded.length > 0) toast.success(`${uploaded.length} image(s) uploaded`);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Unsupported video format. Please use MP4, MOV or WebM.');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Video is too large. Maximum size is 50MB.');
      return;
    }

    const checkDuration = (file) => {
      return new Promise((resolve, reject) => {
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.onloadedmetadata = () => {
          window.URL.revokeObjectURL(videoElement.src);
          resolve(videoElement.duration);
        };
        videoElement.onerror = () => {
          reject(new Error('Failed to load video metadata.'));
        };
        videoElement.src = URL.createObjectURL(file);
      });
    };

    setUploading(true);
    try {
      const duration = await checkDuration(file);
      if (duration > 30) {
        toast.error('Video is too long. Maximum allowed duration is 30 seconds.');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'requirements');
      formData.append('resource_type', 'video');

      const res = await api.post('/v1/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || res.data?.secure_url || res.data?.data?.url;
      if (url) {
        setVideo(url);
        toast.success('Video uploaded successfully');
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setTitle('');
    
    const topLevel = categories.filter(c => !c.parent_id);
    const typedCategories = topLevel.filter(c => c.category_type === newType);
    const targetCategory = typedCategories.length > 0 ? typedCategories[0] : (topLevel.length > 0 ? topLevel[0] : null);
    
    setCategory(targetCategory ? targetCategory.name : (newType === 'service' ? 'Services' : 'Electronics'));
    setSubcategory('');
    setQuantity('1');
    setState('');
    setDistrict('');
    setCity('');
    setPincode('');
    setTargetDistance('');
    setDescription('');
    setOtherConditions('');
    setPhotos([]);
    setVideo(null);

    // Reset new states
    setBudgetMin('');
    setBudgetMax('');
    setAddress('');
    setDetailedSpecifications('');
    setExpectedDeliveryDate('');
    setExpectedDeliveryTime('');
    setProductCondition('');
    setCustomProductCondition('');
    setServiceModel('');
    setCustomServiceModel('');
    setCustomCategory('');
    setCustomSubcategory('');
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!title || !description) {
      toast.error('Please fill all required fields');
      return;
    }

    if (budgetMin && budgetMax && Number(budgetMin) > Number(budgetMax)) {
      toast.error('Minimum budget cannot exceed maximum budget.');
      return;
    }

    try {
      await createRequirement({
        type,
        requirementType: type,
        title,
        category: category === 'Other' ? customCategory : category,
        subcategory: subcategory === 'Other' ? customSubcategory : subcategory,
        budget: budgetMin ? Number(budgetMin) : 0,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        quantity: Number(quantity),
        city,
        district,
        state,
        pincode,
        address,
        targetDistance: targetDistance ? Number(targetDistance) : null,
        description,
        otherConditions: otherConditions || null,
        photos,
        video,
        detailedSpecifications: detailedSpecifications || null,
        expectedDeliveryDate: expectedDeliveryDate || null,
        expectedDeliveryTime: expectedDeliveryTime || null,
        productCondition: category === 'Other' ? 'other' : (productCondition || null),
        customProductCondition: productCondition === 'other' ? customProductCondition : null,
        serviceModel: serviceModel || null,
        customServiceModel: serviceModel === 'other' ? customServiceModel : null,
        customCategory: category === 'Other' ? customCategory : null,
        customSubcategory: subcategory === 'Other' ? customSubcategory : null,
      }).unwrap();

      toast.success(
        category === 'Other' || subcategory === 'Other'
          ? 'Requirement posted! Pending approval since you requested a new category.'
          : 'Requirement posted successfully! Vendors will submit quotes soon.'
      );
      navigate('/customer/my-requirements');
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to post requirement';
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiPlusCircle}
        title="Post Your Requirement"
        subtitle="Get instant quotes and proposals from verified local vendors & service providers"
      />

      <div className="glass rounded-2xl p-4 sm:p-6 border border-white/50 shadow-card max-w-2xl mx-auto w-full space-y-6">
        {/* Requirement Type Selector */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-2">Requirement Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('product')}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition ${type === 'product'
                  ? 'bg-brand-purple/10 border-brand-purple text-brand-purple shadow-sm'
                  : 'glass border-border text-text-secondary hover:border-brand-purple/40'
                }`}
            >
              <FiShoppingBag size={18} />
              <span>Product Requirement</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('service')}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition ${type === 'service'
                  ? 'bg-brand-orange/10 border-brand-orange text-brand-orange shadow-sm'
                  : 'glass border-border text-text-secondary hover:border-brand-orange/40'
                }`}
            >
              <FiTool size={18} />
              <span>Service Requirement</span>
            </button>
          </div>
        </div>

        {type === 'product' ? (
          <ProductRequirementForm
            title={title} setTitle={setTitle}
            category={category} setCategory={setCategory}
            subcategory={subcategory} setSubcategory={setSubcategory}
            budgetMin={budgetMin} setBudgetMin={setBudgetMin}
            budgetMax={budgetMax} setBudgetMax={setBudgetMax}
            quantity={quantity} setQuantity={setQuantity}
            state={state} setState={setState}
            district={district} setDistrict={setDistrict}
            city={city} setCity={setCity}
            pincode={pincode} setPincode={setPincode}
            address={address} setAddress={setAddress}
            targetDistance={targetDistance} setTargetDistance={setTargetDistance}
            description={description} setDescription={setDescription}
            detailedSpecifications={detailedSpecifications} setDetailedSpecifications={setDetailedSpecifications}
            isGeneratingSpecs={isGeneratingSpecs} handleGenerateSpecs={handleGenerateSpecs}
            expectedDeliveryDate={expectedDeliveryDate} setExpectedDeliveryDate={setExpectedDeliveryDate}
            expectedDeliveryTime={expectedDeliveryTime} setExpectedDeliveryTime={setExpectedDeliveryTime}
            productCondition={productCondition} setProductCondition={setProductCondition}
            customProductCondition={customProductCondition} setCustomProductCondition={customProductCondition}
            customCategory={customCategory} setCustomCategory={setCustomCategory}
            customSubcategory={customSubcategory} setCustomSubcategory={setCustomSubcategory}
            otherConditions={otherConditions} setOtherConditions={setOtherConditions}
            photos={photos} video={video} uploading={uploading}
            handleImageUpload={handleImageUpload} handleVideoUpload={handleVideoUpload}
            removePhoto={removePhoto} setVideo={setVideo}
            resolveMediaUrl={resolveMediaUrl} categories={parentCategories}
            subcategories={subcategories} isLoading={isLoading}
            statesList={statesList} districtsList={districtsList}
            handlePincodeChange={handlePincodeChange}
            onSubmit={handleSubmit}
          />
        ) : (
          <ServiceRequirementForm
            title={title} setTitle={setTitle}
            category={category} setCategory={setCategory}
            subcategory={subcategory} setSubcategory={setSubcategory}
            budgetMin={budgetMin} setBudgetMin={setBudgetMin}
            budgetMax={budgetMax} setBudgetMax={setBudgetMax}
            quantity={quantity} setQuantity={setQuantity}
            state={state} setState={setState}
            district={district} setDistrict={setDistrict}
            city={city} setCity={setCity}
            pincode={pincode} setPincode={setPincode}
            address={address} setAddress={setAddress}
            targetDistance={targetDistance} setTargetDistance={setTargetDistance}
            description={description} setDescription={setDescription}
            detailedSpecifications={detailedSpecifications} setDetailedSpecifications={setDetailedSpecifications}
            isGeneratingSpecs={isGeneratingSpecs} handleGenerateSpecs={handleGenerateSpecs}
            expectedDeliveryDate={expectedDeliveryDate} setExpectedDeliveryDate={setExpectedDeliveryDate}
            expectedDeliveryTime={expectedDeliveryTime} setExpectedDeliveryTime={setExpectedDeliveryTime}
            serviceModel={serviceModel} setServiceModel={setServiceModel}
            customServiceModel={customServiceModel} setCustomServiceModel={customServiceModel}
            customCategory={customCategory} setCustomCategory={setCustomCategory}
            customSubcategory={customSubcategory} setCustomSubcategory={setCustomSubcategory}
            otherConditions={otherConditions} setOtherConditions={setOtherConditions}
            photos={photos} video={video} uploading={uploading}
            handleImageUpload={handleImageUpload} handleVideoUpload={handleVideoUpload}
            removePhoto={removePhoto} setVideo={setVideo}
            resolveMediaUrl={resolveMediaUrl} categories={parentCategories}
            subcategories={subcategories} isLoading={isLoading}
            statesList={statesList} districtsList={districtsList}
            handlePincodeChange={handlePincodeChange}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}