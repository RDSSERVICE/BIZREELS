import React, { useState } from 'react';

/**
 * Transforms Cloudinary URLs to inject format, quality, and width transforms.
 */
export const getOptimizedImageUrl = (url, width) => {
  if (!url || typeof url !== 'string') return url || '';

  // Skip local, blob, or svg assets
  if (
    url.startsWith('/uploads/') ||
    url.startsWith('/api/uploads/') ||
    url.startsWith('blob:') ||
    url.endsWith('.svg')
  ) {
    return url;
  }

  // Optimize Cloudinary URLs (automatic WebP/AVIF conversion, compression, width resize)
  if (url.includes('res.cloudinary.com')) {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex !== -1) {
      const transformStr = width ? `f_auto,q_auto,w_${width},c_limit` : 'f_auto,q_auto';
      return `${url.substring(0, uploadIndex + 8)}${transformStr}/${url.substring(uploadIndex + 8)}`;
    }
  }

  // Optimize Unsplash URLs if present
  if (url.includes('images.unsplash.com')) {
    const w = width || 800;
    return url.replace(/w=\d+/, `w=${w}`).replace(/q=\d+/, 'q=80') + (url.includes('auto=format') ? '' : '&auto=format');
  }

  return url;
};

/**
 * Builds standard responsive srcset for Cloudinary / CDN images.
 */
export const getResponsiveSrcSet = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return undefined;
  }
  return `${getOptimizedImageUrl(url, 400)} 400w, ${getOptimizedImageUrl(url, 800)} 800w, ${getOptimizedImageUrl(url, 1200)} 1200w`;
};

const DEFAULT_FALLBACK = '/logo.png';

/**
 * LazyImage — High-performance responsive image component.
 * 
 * Features:
 * - Priority loading for LCP elements (loading="eager", fetchpriority="high")
 * - Native lazy loading (loading="lazy", decoding="async") for below-the-fold
 * - Shimmer placeholder preventing Cumulative Layout Shift (CLS)
 * - Cloudinary AVIF/WebP auto-formatting and responsive srcset
 * - Graceful fallback on broken image URLs
 */
export default function LazyImage({
  src,
  alt = 'BizReels Media',
  width,
  height,
  aspectRatio,
  priority = false,
  className = '',
  style = {},
  fallback = DEFAULT_FALLBACK,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  onClick,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const finalSrc = hasError
    ? fallback
    : (priority ? getOptimizedImageUrl(src, width || 1200) : getOptimizedImageUrl(src, width));

  const srcSet = !hasError && !priority ? getResponsiveSrcSet(src) : undefined;

  const containerStyle = {
    position: 'relative',
    overflow: 'hidden',
    ...(aspectRatio ? { aspectRatio } : {}),
    ...(width && !aspectRatio ? { width } : {}),
    ...(height && !aspectRatio ? { height } : {}),
    ...style,
  };

  return (
    <div style={containerStyle} className={`inline-block w-full bg-[#f0ebe3] ${className}`}>
      {/* Lightweight Shimmer / Skeleton Placeholder (hidden when loaded or priority) */}
      {!isLoaded && !priority && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#ece5db] via-[#f7f3ed] to-[#ece5db] z-0"
        />
      )}

      <img
        src={finalSrc}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        // @ts-ignore - React 19 / modern HTML fetchPriority attribute
        fetchpriority={priority ? 'high' : 'auto'}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        onClick={onClick}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded || priority ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
}
