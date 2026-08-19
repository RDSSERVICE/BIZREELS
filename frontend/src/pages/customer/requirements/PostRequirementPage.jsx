import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlusCircle, FiShoppingBag, FiTool, FiZap, FiShield, FiHelpCircle, FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCreateRequirementMutation } from '../../../features/customer/requirementsApi';
import { api, resolveMediaUrl } from '../../../lib/api';
import ProductRequirementForm from './ProductRequirementForm';
import ServiceRequirementForm from './ServiceRequirementForm';
import { useLanguage } from '../../../context/LanguageContext';

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
  const { lang, bi } = useLanguage();
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
    const MAX_SIZE = 10 * 1024 * 1024;

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
    const MAX_SIZE = 50 * 1024 * 1024;

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
      toast.success('Requirement posted successfully!');
      navigate('/customer/my-requirements');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to post requirement');
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5 font-sans p-2 sm:p-4 pb-24 sm:pb-12 min-h-full">
      <div className="bg-[#241b15] text-white p-6 rounded-md border-2 border-[#241b15] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">CUSTOMER PORTAL</span>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white">
            {bi('POST A REQUIREMENT', 'आवश्यकता पोस्ट करें')}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            {bi('Get instant quotes and direct proposals from verified local vendors & service providers.', 'सत्यापित स्थानीय विक्रेताओं से त्वरित कोटेशन और सीधे प्रस्ताव प्राप्त करें।')}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0 border border-[#1a1a1a]">
          <FiPlusCircle size={22} />
        </div>
      </div>

      <div className="bg-white rounded-md p-5 sm:p-7 border border-[#e3dccb] shadow-xs w-full space-y-6">
        <div>
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">{bi('1. Select Requirement Type', '1. आवश्यकता प्रकार चुनें')}</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => handleTypeChange('product')} className={`flex items-center justify-center gap-2 p-3.5 rounded-md border text-xs font-extrabold transition ${type === 'product' ? 'bg-[#241b15] text-[#d99a3d]' : 'bg-[#f8f4ec]'}`}>
              <FiShoppingBag size={17} /> <span>{bi('Product Requirement', 'उत्पाद आवश्यकता')}</span>
            </button>
            <button type="button" onClick={() => handleTypeChange('service')} className={`flex items-center justify-center gap-2 p-3.5 rounded-md border text-xs font-extrabold transition ${type === 'service' ? 'bg-[#241b15] text-[#d99a3d]' : 'bg-[#f8f4ec]'}`}>
              <FiTool size={17} /> <span>{bi('Service Requirement', 'सेवा आवश्यकता')}</span>
            </button>
          </div>
        </div>

        {type === 'product' ? (
          <ProductRequirementForm title={title} setTitle={setTitle} category={category} setCategory={setCategory} subcategory={subcategory} setSubcategory={setSubcategory} budgetMin={budgetMin} setBudgetMin={setBudgetMin} budgetMax={budgetMax} setBudgetMax={setBudgetMax} quantity={quantity} setQuantity={setQuantity} state={state} setState={setState} district={district} setDistrict={setDistrict} city={city} setCity={setCity} pincode={pincode} setPincode={setPincode} address={address} setAddress={setAddress} targetDistance={targetDistance} setTargetDistance={setTargetDistance} description={description} setDescription={setDescription} detailedSpecifications={detailedSpecifications} setDetailedSpecifications={setDetailedSpecifications} isGeneratingSpecs={isGeneratingSpecs} handleGenerateSpecs={handleGenerateSpecs} expectedDeliveryDate={expectedDeliveryDate} setExpectedDeliveryDate={setExpectedDeliveryDate} expectedDeliveryTime={expectedDeliveryTime} setExpectedDeliveryTime={setExpectedDeliveryTime} productCondition={productCondition} setProductCondition={setProductCondition} customProductCondition={customProductCondition} setCustomProductCondition={setCustomProductCondition} customCategory={customCategory} setCustomCategory={setCustomCategory} customSubcategory={customSubcategory} setCustomSubcategory={setCustomSubcategory} otherConditions={otherConditions} setOtherConditions={setOtherConditions} photos={photos} video={video} uploading={uploading} handleImageUpload={handleImageUpload} handleVideoUpload={handleVideoUpload} removePhoto={removePhoto} setVideo={setVideo} resolveMediaUrl={resolveMediaUrl} categories={parentCategories} subcategories={subcategories} isLoading={isLoading} statesList={statesList} districtsList={districtsList} handlePincodeChange={handlePincodeChange} onSubmit={handleSubmit} />
        ) : (
          <ServiceRequirementForm title={title} setTitle={setTitle} category={category} setCategory={setCategory} subcategory={subcategory} setSubcategory={setSubcategory} budgetMin={budgetMin} setBudgetMin={setBudgetMin} budgetMax={budgetMax} setBudgetMax={setBudgetMax} quantity={quantity} setQuantity={setQuantity} state={state} setState={setState} district={district} setDistrict={setDistrict} city={city} setCity={setCity} pincode={pincode} setPincode={setPincode} address={address} setAddress={setAddress} targetDistance={targetDistance} setTargetDistance={setTargetDistance} description={description} setDescription={setDescription} detailedSpecifications={detailedSpecifications} setDetailedSpecifications={setDetailedSpecifications} isGeneratingSpecs={isGeneratingSpecs} handleGenerateSpecs={handleGenerateSpecs} expectedDeliveryDate={expectedDeliveryDate} setExpectedDeliveryDate={setExpectedDeliveryDate} expectedDeliveryTime={expectedDeliveryTime} setExpectedDeliveryTime={setExpectedDeliveryTime} serviceModel={serviceModel} setServiceModel={setServiceModel} customServiceModel={customServiceModel} setCustomServiceModel={setCustomServiceModel} customCategory={customCategory} setCustomCategory={setCustomCategory} customSubcategory={customSubcategory} setCustomSubcategory={setCustomSubcategory} otherConditions={otherConditions} setOtherConditions={setOtherConditions} photos={photos} video={video} uploading={uploading} handleImageUpload={handleImageUpload} handleVideoUpload={handleVideoUpload} removePhoto={removePhoto} setVideo={setVideo} resolveMediaUrl={resolveMediaUrl} categories={parentCategories} subcategories={subcategories} isLoading={isLoading} statesList={statesList} districtsList={districtsList} handlePincodeChange={handlePincodeChange} onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}