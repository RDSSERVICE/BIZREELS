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
  const [budget, setBudget] = useState('');
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

  // Fetch categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/v1/categories');
        const items = res.data?.items || [];
        setCategories(items);
        
        // Auto select first top-level category on load
        const topLevel = items.filter(c => !c.parent_id);
        if (topLevel.length > 0) {
          setCategory(topLevel[0].name);
        }
      } catch {}
    };
    loadCategories();
  }, []);

  const parentCategories = categories.filter(c => !c.parent_id);
  const selectedParent = parentCategories.find(c => c.name === category);
  const subcategories = selectedParent
    ? categories.filter(c => c.parent_id === selectedParent.id)
    : [];

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

    // Video duration validation (Max 30 seconds)
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
    setBudget('');
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
  };

  const handleSubmit = async (e, customConditions) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!title || !budget || !description) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await createRequirement({
        type,
        requirementType: type,
        title,
        category,
        subcategory,
        budget: Number(budget),
        quantity: Number(quantity),
        city,
        district,
        state,
        pincode,
        targetDistance: targetDistance ? Number(targetDistance) : null,
        description,
        otherConditions: customConditions || otherConditions || null,
        photos,
        video,
      }).unwrap();

      toast.success('Requirement posted successfully! Vendors will submit quotes soon.');
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

      <div className="glass rounded-2xl p-6 border border-white/50 shadow-card max-w-2xl mx-auto w-full space-y-6">
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
            budget={budget} setBudget={setBudget}
            quantity={quantity} setQuantity={setQuantity}
            state={state} setState={setState}
            district={district} setDistrict={setDistrict}
            city={city} setCity={setCity}
            pincode={pincode} setPincode={setPincode}
            targetDistance={targetDistance} setTargetDistance={setTargetDistance}
            description={description} setDescription={setDescription}
            otherConditions={otherConditions} setOtherConditions={setOtherConditions}
            photos={photos} video={video} uploading={uploading}
            handleImageUpload={handleImageUpload} handleVideoUpload={handleVideoUpload}
            removePhoto={removePhoto} setVideo={setVideo}
            resolveMediaUrl={resolveMediaUrl} categories={parentCategories}
            subcategories={subcategories} isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        ) : (
          <ServiceRequirementForm
            title={title} setTitle={setTitle}
            category={category} setCategory={setCategory}
            subcategory={subcategory} setSubcategory={setSubcategory}
            budget={budget} setBudget={setBudget}
            quantity={quantity} setQuantity={setQuantity}
            state={state} setState={setState}
            district={district} setDistrict={setDistrict}
            city={city} setCity={setCity}
            pincode={pincode} setPincode={setPincode}
            description={description} setDescription={setDescription}
            otherConditions={otherConditions} setOtherConditions={setOtherConditions}
            photos={photos} video={video} uploading={uploading}
            handleImageUpload={handleImageUpload} handleVideoUpload={handleVideoUpload}
            removePhoto={removePhoto} setVideo={setVideo}
            resolveMediaUrl={resolveMediaUrl} categories={parentCategories}
            subcategories={subcategories} isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}