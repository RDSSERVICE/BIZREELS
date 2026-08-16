import React from 'react';
import { FiUploadCloud, FiX, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProductMediaSection({
  form,
  setForm,
  maxLimits = { maxImages: 5, maxVideos: 1 },
  imageUrlInput,
  setImageUrlInput,
  handleImageUpload,
  uploading,
}) {
  const isLimitReached = form.images.length >= maxLimits.maxImages;

  return (
    <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
      <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">
        Product Images & Media (Max {maxLimits.maxImages})
      </h4>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-text-tertiary block">
          Product Images (First image is Cover)
        </label>
        <div className="flex flex-wrap gap-2">
          {form.images.map((img, idx) => (
            <div
              key={idx}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group"
            >
              <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute bottom-0 inset-x-0 bg-brand-purple/80 text-white text-[8px] text-center font-bold py-0.5">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    images: prev.images.filter((_, i) => i !== idx),
                  }))
                }
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px]"
              >
                <FiX className="w-3 h-3" />
              </button>
            </div>
          ))}

          {!isLimitReached ? (
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-brand-purple flex flex-col items-center justify-center cursor-pointer transition gap-1">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              {uploading ? (
                <div className="w-4 h-4 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiUploadCloud className="w-5 h-5 text-text-tertiary" />
                  <span className="text-[9px] text-text-tertiary">Upload</span>
                </>
              )}
            </label>
          ) : (
            <div className="w-20 h-20 rounded-xl bg-surface-tertiary border border-border flex flex-col items-center justify-center text-[9px] text-text-tertiary text-center font-bold">
              Limit reached
            </div>
          )}
        </div>

        <div className="flex gap-1.5 mt-2 max-w-[280px]">
          <input
            type="url"
            placeholder="Or paste image URL"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            className="flex-1 p-1.5 bg-surface border border-border rounded-xl text-[10px] outline-none focus:border-brand-purple text-text-primary"
          />
          <button
            type="button"
            onClick={() => {
              if (!imageUrlInput.trim()) return;
              if (isLimitReached) {
                return toast.error(`Maximum image limit (${maxLimits.maxImages}) reached!`);
              }
              setForm((prev) => ({
                ...prev,
                images: [...prev.images, imageUrlInput.trim()],
              }));
              setImageUrlInput('');
              toast.success('Image URL added!');
            }}
            className="px-2.5 py-1.5 bg-brand-purple text-white rounded-xl text-[10px] font-bold transition hover:bg-brand-purple/90 shrink-0"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
