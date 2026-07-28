import React from 'react';

/**
 * Optimizes Cloudinary URLs to inject automatic format, quality, and sizing transformations.
 * 
 * @param {string} url - Original image URL
 * @param {number} [width] - Desired container-constrained width
 * @returns {string} - Optimized URL
 */
export const optimizeCloudinaryUrl = (url, width) => {
  if (!url || typeof url !== 'string') return url;

  // Skip local mock assets
  if (url.startsWith('/uploads/') || url.startsWith('/api/uploads/') || url.startsWith('blob:')) {
    return url;
  }

  // Optimize Cloudinary URLs
  if (url.includes('res.cloudinary.com')) {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex !== -1) {
      const transformStr = width ? `f_auto,q_auto,w_${width},c_limit` : 'f_auto,q_auto';
      return `${url.substring(0, uploadIndex + 8)}${transformStr}/${url.substring(uploadIndex + 8)}`;
    }
  }

  return url;
};

/**
 * Reusable image component applying Cloudinary transformation, lazy loading, and default fallbacks.
 */
export default function OptimizedImage({ src, alt, width, className, ...props }) {
  const optimizedSrc = optimizeCloudinaryUrl(src, width);

  return (
    <img
      src={optimizedSrc}
      alt={alt || 'BizReels Media'}
      loading="lazy"
      className={className}
      {...props}
    />
  );
}
