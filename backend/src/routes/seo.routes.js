const express = require('express');
const seoService = require('../services/seo.service');
const { catchAsync } = require('../utils/helpers');

const router = express.Router();

const getBaseUrl = (req) => {
  const base = process.env.PUBLIC_SITE_URL;
  if (base) {
    return base.replace(/\/+$/, '');
  }
  return `${req.protocol}://${req.get('host')}`;
};

router.get('/listing/:slug', catchAsync(async (req, res) => {
  const result = await seoService.listingSeo(req.params.slug, getBaseUrl(req));
  res.json(result);
}));

router.get('/sitemap.xml', catchAsync(async (req, res) => {
  const xml = await seoService.buildSitemap(getBaseUrl(req));
  res.header('Content-Type', 'application/xml');
  res.status(200).send(xml);
}));

router.get('/robots.txt', catchAsync(async (req, res) => {
  const base = getBaseUrl(req);
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${base}/api/v1/seo/sitemap.xml\n`);
}));

module.exports = router;
