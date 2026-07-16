import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiVideo, FiFile, FiTag, FiMapPin, FiArrowLeft } from 'react-icons/fi';
import { usePublishReelMutation } from '../features/reels/reelsApi';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

/**
 * Premium ReelsUpload page.
 * Video file selection preview, caption parsing, tags indexing, and upload progress status hud.
 */
const ReelsUpload = () => {
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  
  const [publishReel, { isLoading }] = usePublishReelMutation();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: { caption: '', tags: '', address: '' }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit check: 50MB max
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video size exceeds 50MB limit.');
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    if (!videoFile) {
      toast.error('Please select a video file to upload.');
      return;
    }

    // Build multipart/form-data payload
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('caption', data.caption);
    formData.append('tags', data.tags);
    formData.append('address', data.address);
    // Add dummy geo coords for mock uploads
    formData.append('lat', '12.9716');
    formData.append('lng', '77.5946');

    try {
      await publishReel(formData).unwrap();
      toast.success('Reel published successfully!');
      reset();
      setVideoFile(null);
      setVideoPreview('');
      navigate('/reels');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to upload video to Cloudinary.');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto animate-fade-in">
      {/* Header back handle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-surface-tertiary rounded-full text-brand-navy transition-all"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-black text-brand-navy">Create Reel</h2>
      </div>

      <div className="glass p-6 rounded-premium border-white/50 shadow-glass flex flex-col gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* File drop zone preview */}
          <div className="relative border-2 border-dashed border-border hover:border-brand-purple/40 rounded-premium h-64 overflow-hidden flex flex-col items-center justify-center transition-all bg-surface-secondary/50">
            {videoPreview ? (
              <video
                src={videoPreview}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 text-center">
                <FiVideo className="w-12 h-12 text-brand-purple mb-3 animate-float" />
                <span className="text-xs font-bold text-brand-navy uppercase tracking-wider">Select short video</span>
                <span className="text-[10px] text-text-tertiary mt-1">MP4, MOV, WEBM (Max 50MB)</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
              <FiFile className="text-brand-purple" /> Caption
            </label>
            <textarea
              placeholder="What is your reel about? Add hashtags like #tech, #food..."
              className="w-full px-4 py-3 text-sm border border-border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple min-h-[90px] placeholder-text-tertiary"
              {...register('caption', { maxLength: { value: 2200, message: 'Caption cannot exceed 2200 characters.' } })}
            />
            {errors.caption && (
              <span className="text-xs font-medium text-error">{errors.caption.message}</span>
            )}
          </div>

          <Input
            label="Tags (Comma Separated)"
            placeholder="e.g. fashion, urbancompany, review"
            icon={FiTag}
            {...register('tags')}
          />

          <Input
            label="Tag Location Address (Optional)"
            placeholder="e.g. MG Road, Bengaluru"
            icon={FiMapPin}
            {...register('address')}
          />

          <Button type="submit" variant="accent" fullWidth isLoading={isLoading} className="mt-2">
            Publish Reel
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ReelsUpload;
