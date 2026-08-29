/**
 * Utility helper to safely extract and resolve image URLs for products, services, and vendors.
 * Handles array of strings, objects ({ url, uri, path }), relative uploads (/uploads/...), and fallbacks.
 */

const BACKEND_HOST = 'https://api.bizreels.in';

export function resolveImageUrl(urlCandidate: any): string | null {
  if (!urlCandidate) return null;

  let rawUrl: string | null = null;

  if (typeof urlCandidate === 'string') {
    rawUrl = urlCandidate;
  } else if (typeof urlCandidate === 'object') {
    rawUrl =
      urlCandidate.url ||
      urlCandidate.uri ||
      urlCandidate.path ||
      urlCandidate.src ||
      urlCandidate.imageUrl ||
      null;
  }

  if (!rawUrl || typeof rawUrl !== 'string') return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // If it's a relative path like /uploads/img.jpg, prepend the backend host
  if (trimmed.startsWith('/')) {
    return `${BACKEND_HOST}${trimmed}`;
  }

  return trimmed;
}

/**
 * Extracts the primary image URL from a product or service listing item.
 */
export function getListingImage(item: any): string | null {
  if (!item) return null;

  // 1. Direct single image properties
  const directImage =
    resolveImageUrl(item.image) ||
    resolveImageUrl(item.imageUrl) ||
    resolveImageUrl(item.coverImage) ||
    resolveImageUrl(item.thumbnailUrl) ||
    resolveImageUrl(item.serviceDetails?.coverImage);

  if (directImage) return directImage;

  // 2. Images array (strings or objects)
  if (Array.isArray(item.images) && item.images.length > 0) {
    for (const img of item.images) {
      const resolved = resolveImageUrl(img);
      if (resolved) return resolved;
    }
  }

  // 3. Media URLs array
  if (Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0) {
    for (const img of item.mediaUrls) {
      const resolved = resolveImageUrl(img);
      if (resolved) return resolved;
    }
  }

  // 4. Service portfolio array
  if (
    item.serviceDetails?.portfolio &&
    Array.isArray(item.serviceDetails.portfolio) &&
    item.serviceDetails.portfolio.length > 0
  ) {
    for (const img of item.serviceDetails.portfolio) {
      const resolved = resolveImageUrl(img);
      if (resolved) return resolved;
    }
  }

  // 5. Variant image
  if (Array.isArray(item.variants) && item.variants.length > 0) {
    for (const v of item.variants) {
      const resolved = resolveImageUrl(v.image || v.imageUrl);
      if (resolved) return resolved;
    }
  }

  return null;
}
