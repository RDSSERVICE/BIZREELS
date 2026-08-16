import React from 'react';
import { FiUploadCloud, FiX, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ServiceMediaSection({
  form,
  updateForm,
  setForm,
  maxLimits = { maxImages: 5, maxVideos: 1 },
  coverUrlInput,
  setCoverUrlInput,
  galleryUrlInput,
  setGalleryUrlInput,
  handleImageUpload,
  uploading,
}) {
  const currentImagesCount = (form.coverImage ? 1 : 0) + form.galleryImages.length;
  const isLimitReached = currentImagesCount >= maxLimits.maxImages;

  return (
    <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
      <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">
        5. Images & Media (Max {maxLimits.maxImages})
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Cover Image */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Cover Image</label>
          {form.coverImage ? (
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group">
              <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => updateForm('coverImage', '')}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px]"
              >
                <FiX className="w-3 h-3" />
              </button>
            </div>
          ) : !isLimitReached ? (
            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-brand-purple flex flex-col items-center justify-center cursor-pointer transition gap-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'cover')}
                className="hidden"
              />
              <FiUploadCloud className="w-5 h-5 text-text-tertiary" />
              <span className="text-[9px] text-text-tertiary">Upload</span>
            </label>
          ) : (
            <div className="w-24 h-24 rounded-xl bg-surface-tertiary border border-border flex flex-col items-center justify-center text-[10px] text-text-tertiary text-center font-bold">
              Limit reached
            </div>
          )}

          <div className="flex gap-1.5 mt-2 max-w-[240px]">
            <input
              type="url"
              placeholder="Or paste cover URL"
              value={coverUrlInput}
              onChange={(e) => setCoverUrlInput(e.target.value)}
              className="flex-1 p-1.5 bg-surface border border-border rounded-xl text-[10px] outline-none focus:border-brand-purple text-text-primary"
            />
            <button
              type="button"
              onClick={() => {
                if (!coverUrlInput.trim()) return;
                updateForm('coverImage', coverUrlInput.trim());
                setCoverUrlInput('');
                toast.success('Cover URL set!');
              }}
              className="px-2.5 py-1.5 bg-brand-purple text-white rounded-xl text-[10px] font-bold transition hover:bg-brand-purple/90 shrink-0"
            >
              Set
            </button>
          </div>
        </div>

        {/* Gallery Images */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Gallery Images</label>
          <div className="flex flex-wrap gap-2">
            {form.galleryImages.map((img, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border group">
                <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      galleryImages: prev.galleryImages.filter((_, i) => i !== idx),
                    }))
                  }
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px]"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            ))}

            {!isLimitReached ? (
              <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border hover:border-brand-purple flex items-center justify-center cursor-pointer transition">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, 'gallery')}
                  className="hidden"
                />
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiImage className="w-4 h-4 text-text-tertiary" />
                )}
              </label>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-surface-tertiary border border-border flex flex-col items-center justify-center text-[8px] text-text-tertiary text-center font-bold">
                Max reached
              </div>
            )}
          </div>

          <div className="flex gap-1.5 mt-2 max-w-[240px]">
            <input
              type="url"
              placeholder="Or paste gallery URL"
              value={galleryUrlInput}
              onChange={(e) => setGalleryUrlInput(e.target.value)}
              className="flex-1 p-1.5 bg-surface border border-border rounded-xl text-[10px] outline-none focus:border-brand-purple text-text-primary"
            />
            <button
              type="button"
              onClick={() => {
                if (!galleryUrlInput.trim()) return;
                if (isLimitReached) {
                  return toast.error(`Maximum image limit (${maxLimits.maxImages}) reached!`);
                }
                setForm((prev) => ({
                  ...prev,
                  galleryImages: [...prev.galleryImages, galleryUrlInput.trim()],
                }));
                setGalleryUrlInput('');
                toast.success('Gallery URL added!');
              }}
              className="px-2.5 py-1.5 bg-brand-purple text-white rounded-xl text-[10px] font-bold transition hover:bg-brand-purple/90 shrink-0"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
