const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const categoryService = require('../services/category.service');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const requireAdmin = (req, res, next) => {
  const user = req.user;
  if (!user || !user.roles || !user.roles.includes('admin')) {
    return next(ApiError.forbidden('Admin only'));
  }
  next();
};

router.get('/', catchAsync(async (req, res) => {
  const parentId = req.query.parent_id || null;
  const topLevel = req.query.top_level === 'true';
  const tree = req.query.tree === 'true';

  const items = await categoryService.listCategories({
    parentId,
    onlyTopLevel: topLevel,
    asTree: tree,
  });
  res.json({ items });
}));

router.get('/:slug', catchAsync(async (req, res) => {
  const cat = await categoryService.getBySlug(req.params.slug);
  if (!cat) {
    throw ApiError.notFound('Category not found');
  }
  res.json(cat);
}));

router.post('/', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { name, parent_id, icon_url } = req.body;
  if (!name) {
    throw ApiError.badRequest('name is required');
  }
  const result = await categoryService.createCategory({
    name,
    parentId: parent_id,
    iconUrl: icon_url,
  });
  res.json(result);
}));

router.patch('/:cid', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await categoryService.updateCategory(req.params.cid, req.body);
  res.json(result);
}));

router.delete('/:cid', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  await categoryService.softDeleteCategory(req.params.cid);
  res.json({ success: true });
}));

module.exports = router;
