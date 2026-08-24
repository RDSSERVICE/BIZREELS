import React, { useEffect } from 'react';

const DEFAULT_TITLE = "BizReels — Watch. Discover. Connect.";
const DEFAULT_DESCRIPTION = "Discover local vendors, chat direct, deal fair. India-first reels commerce platform connecting local businesses, creators, and customers.";
const DEFAULT_IMAGE = "https://bizreels.in/logo.png";
const DEFAULT_DOMAIN = "https://bizreels.in";
const DEFAULT_LOCALE = "en_IN";
const DEFAULT_SITE_NAME = "BizReels";

/**
 * Reusable SEO component for managing document metadata, Open Graph, Twitter cards,
 * canonical links, robots directives, and JSON-LD structured data.
 * 
 * Supports React 19 tag hoisting with structured JSON-LD cleanup.
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonical,
  robots = 'index, follow',
  image,
  ogImage,
  ogImageWidth = '1200',
  ogImageHeight = '630',
  ogImageAlt,
  ogType = 'website',
  ogTitle,
  ogDescription,
  ogUrl,
  ogSiteName = DEFAULT_SITE_NAME,
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  twitterImageAlt,
  twitterSite = '@BizReels',
  twitterCreator = '@BizReels',
  locale = DEFAULT_LOCALE,
  structuredData,
  children
}) {
  const fullTitle = title ? (title.includes('BizReels') ? title : `${title} | BizReels`) : DEFAULT_TITLE;
  const metaDesc = description || DEFAULT_DESCRIPTION;
  const currentOgImage = ogImage || image || DEFAULT_IMAGE;
  const currentOgTitle = ogTitle || fullTitle;
  const currentOgDesc = ogDescription || metaDesc;
  const currentTwitterTitle = twitterTitle || currentOgTitle;
  const currentTwitterDesc = twitterDescription || currentOgDesc;
  const currentTwitterImg = twitterImage || currentOgImage;
  const currentTwitterAlt = twitterImageAlt || ogImageAlt || fullTitle;

  // Normalize canonical URL
  let canonicalUrl = canonical || ogUrl;
  if (!canonicalUrl) {
    if (typeof window !== 'undefined') {
      canonicalUrl = `${DEFAULT_DOMAIN}${window.location.pathname}`;
    } else {
      canonicalUrl = DEFAULT_DOMAIN;
    }
  } else if (!canonicalUrl.startsWith('http')) {
    canonicalUrl = `${DEFAULT_DOMAIN}${canonicalUrl.startsWith('/') ? '' : '/'}${canonicalUrl}`;
  }

  // Format structured data (single object or array of objects)
  const structuredDataArray = Array.isArray(structuredData)
    ? structuredData
    : (structuredData ? [structuredData] : []);

  // Update canonical link in document head explicitly to prevent duplicates across route transitions
  useEffect(() => {
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);
  }, [canonicalUrl]);

  return (
    <>
      {/* ── Standard Metadata ── */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {keywords && <meta name="keywords" content={Array.isArray(keywords) ? keywords.join(', ') : keywords} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* ── Open Graph / Facebook ── */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={currentOgTitle} />
      <meta property="og:description" content={currentOgDesc} />
      <meta property="og:image" content={currentOgImage} />
      {ogImageWidth && <meta property="og:image:width" content={String(ogImageWidth)} />}
      {ogImageHeight && <meta property="og:image:height" content={String(ogImageHeight)} />}
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
      <meta property="og:site_name" content={ogSiteName} />
      <meta property="og:locale" content={locale} />

      {/* ── Twitter / X Cards ── */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={currentTwitterTitle} />
      <meta name="twitter:description" content={currentTwitterDesc} />
      <meta name="twitter:image" content={currentTwitterImg} />
      {currentTwitterAlt && <meta name="twitter:image:alt" content={currentTwitterAlt} />}
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />

      {/* ── Structured Data (JSON-LD) ── */}
      {structuredDataArray.map((schema, index) => {
        if (!schema || typeof schema !== 'object') return null;
        return (
          <script
            key={`jsonld-${index}-${schema['@type'] || 'item'}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(schema)
            }}
          />
        );
      })}

      {children}
    </>
  );
}
