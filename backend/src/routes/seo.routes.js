const express = require('express');
const seoService = require('../services/seo.service');
const { catchAsync } = require('../utils/helpers');

const router = express.Router();

const getBaseUrl = (req) => {
  const base = process.env.PUBLIC_SITE_URL || process.env.FRONTEND_URL;
  if (base) {
    return base.replace(/\/+$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://bizreels.in';
  }
  return `${req.protocol}://${req.get('host')}`;
};

router.get(['/listing/:idOrSlug', '/product/:idOrSlug'], catchAsync(async (req, res) => {
  const result = await seoService.listingSeo(req.params.idOrSlug, getBaseUrl(req));
  res.json({ success: true, data: result });
}));

router.get(['/sitemap.xml', '/sitemap'], catchAsync(async (req, res) => {
  const xml = await seoService.buildFullSitemap(getBaseUrl(req));
  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(xml);
}));

router.get('/sitemap-index.xml', catchAsync(async (req, res) => {
  const xml = seoService.buildSitemapIndex(getBaseUrl(req));
  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(xml);
}));

router.get('/robots.txt', catchAsync(async (req, res) => {
  const base = getBaseUrl(req);
  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400');
  res.send(
`User-agent: *
Allow: /
Allow: /about
Allow: /local-reels
Allow: /creator-marketplace
Allow: /customer/search
Allow: /customer/listings/
Allow: /customer/vendor/
Allow: /customer/home

Disallow: /admin
Disallow: /admin/
Disallow: /adminlogin
Disallow: /auth/
Disallow: /vendor/
Disallow: /creator/
Disallow: /customer/chat
Disallow: /customer/settings
Disallow: /customer/mycart
Disallow: /customer/cart
Disallow: /customer/activities
Disallow: /customer/notifications
Disallow: /customer/post-requirement
Disallow: /customer/my-requirements
Disallow: /customer/choose-interests
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`
  );
}));

module.exports = router;
