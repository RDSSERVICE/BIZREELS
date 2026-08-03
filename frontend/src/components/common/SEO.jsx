import React from 'react';

/**
 * Reusable SEO component for managing document metadata.
 * Uses React 19's native tag hoisting for <title> and <meta> tags.
 */
export default function SEO({
  title,
  description = "Discover local vendors, chat direct, deal fair. India-first reels commerce.",
  image = "https://bizreels.in/logo.png",
  url = "https://bizreels.in/",
  type = "website",
  siteName = "BizReels",
  twitterSite = "@BizReels",
  twitterCreator = "@BizReels"
}) {
  const fullTitle = title ? `${title} | BizReels` : "BizReels — Watch. Discover. Shop.";

  return (
    <>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />
    </>
  );
}
