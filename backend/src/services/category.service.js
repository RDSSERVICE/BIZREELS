const Category = require('../models/Category');
const slugify = require('slugify');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const SEED_TREE = [
  {
    name: 'Electronics',
    icon: '📱',
    children: ['Mobile', 'Laptop', 'TV', 'Home Appliances', 'Accessories'],
  },
  {
    name: 'Fashion',
    icon: '👗',
    children: ['Men', 'Women', 'Kids', 'Footwear', 'Accessories'],
  },
  {
    name: 'Home & Furniture',
    icon: '🛋️',
    children: ['Furniture', 'Kitchen', 'Decor', 'Bedding'],
  },
  {
    name: 'Vehicles',
    icon: '🏍️',
    children: ['Car', 'Bike', 'Scooter', 'Commercial'],
  },
  {
    name: 'Real Estate',
    icon: '🏠',
    children: ['Rent', 'Buy', 'Sell', 'PG/Hostel'],
  },
  {
    name: 'Services',
    icon: '🛠️',
    children: ['Plumber', 'Electrician', 'Carpenter', 'AC Repair', 'Cleaning', 'Painter'],
  },
  {
    name: 'Food & Grocery',
    icon: '🍲',
    children: ['Restaurants', 'Grocery', 'Bakery', 'Sweets'],
  },
  {
    name: 'Beauty & Salon',
    icon: '💇',
    children: ['Men Salon', 'Women Salon', 'Spa', 'Makeup'],
  },
  {
    name: 'Health & Fitness',
    icon: '🏋️',
    children: ['Gym', 'Yoga', 'Doctor', 'Medical Store'],
  },
  {
    name: 'Education & Coaching',
    icon: '📚',
    children: ['School', 'Coaching', 'Tuition', 'Skill Courses'],
  },
];

const serializeCategory = (cat) => {
  if (!cat) return null;
  const d = cat.toObject ? cat.toObject() : cat;
  return {
    id: (d._id || d.id).toString(),
    name: d.name,
    slug: d.slug,
    icon_url: d.icon_url,
    category_type: d.category_type || null,
    parent_id: d.parent_id ? d.parent_id.toString() : null,
    sort_order: d.sort_order || 0,
    is_active: d.is_active !== false,
  };
};

const seedCategories = async () => {
  const count = await Category.countDocuments({ is_deleted: { $ne: true } });
  if (count > 0) {
    return;
  }
  for (let idx = 0; idx < SEED_TREE.length; idx++) {
    const group = SEED_TREE[idx];
    const parentSlug = slugify(group.name, { lower: true });
    const parent = await Category.create({
      name: group.name,
      slug: parentSlug,
      icon_url: group.icon,
      parent_id: null,
      sort_order: idx,
    });
    const parentId = parent._id.toString();
    for (let cidx = 0; cidx < group.children.length; cidx++) {
      const childName = group.children[cidx];
      const childSlug = slugify(`${group.name}-${childName}`, { lower: true });
      await Category.create({
        name: childName,
        slug: childSlug,
        icon_url: null,
        parent_id: parentId,
        sort_order: cidx,
      });
    }
  }
  logger.info(`Seeded ${SEED_TREE.length} category groups`);
};

const listCategories = async ({ parent_id = null, only_top_level = false, as_tree = false, category_type = null } = {}) => {
  const q = { is_deleted: { $ne: true }, is_active: true };
  if (only_top_level) {
    q.parent_id = null;
  } else if (parent_id) {
    q.parent_id = parent_id;
  }
  if (category_type) {
    q.category_type = category_type;
  }
  const docs = await Category.find(q).sort({ sort_order: 1, name: 1 });
  const serialized = docs.map(serializeCategory);
  if (!as_tree) {
    return serialized;
  }
  // Build tree
  const byParent = {};
  for (const d of serialized) {
    const pId = d.parent_id;
    if (!byParent[pId]) {
      byParent[pId] = [];
    }
    byParent[pId].push(d);
  }
  const roots = byParent[null] || byParent['null'] || [];
  for (const r of roots) {
    r.children = byParent[r.id] || [];
  }
  return roots;
};

const getBySlug = async (slug) => {
  const doc = await Category.findOne({ slug, is_deleted: { $ne: true } });
  if (!doc) return null;
  const result = serializeCategory(doc);
  // Attach children
  const children = await Category.find({
    parent_id: result.id,
    is_deleted: { $ne: true },
    is_active: true,
  }).sort({ sort_order: 1 });
  result.children = children.map(serializeCategory);
  return result;
};

const getById = async (cid) => {
  const doc = await Category.findOne({ _id: cid, is_deleted: { $ne: true } });
  return doc ? serializeCategory(doc) : null;
};

const createCategory = async (name, parent_id = null, icon_url = null, category_type = null) => {
  const slugBase = slugify(name, { lower: true });
  let slug = slugBase;
  let i = 1;
  while (await Category.findOne({ slug })) {
    i++;
    slug = `${slugBase}-${i}`;
  }
  // If adding subcategory, inherit parent's category_type
  let resolvedType = category_type;
  if (parent_id && !resolvedType) {
    const parent = await Category.findById(parent_id);
    if (parent) resolvedType = parent.category_type;
  }
  const doc = await Category.create({
    name: name.trim(),
    slug,
    icon_url,
    parent_id,
    category_type: resolvedType,
  });
  return serializeCategory(doc);
};

const updateCategory = async (cid, updates) => {
  const allowed = ['name', 'icon_url', 'sort_order', 'is_active'];
  const clean = {};
  for (const k of allowed) {
    if (updates[k] !== undefined && updates[k] !== null) {
      clean[k] = updates[k];
    }
  }
  if (Object.keys(clean).length === 0) {
    throw ApiError.badRequest('No updatable fields');
  }
  const doc = await Category.findOneAndUpdate({ _id: cid }, { $set: clean }, { returnDocument: 'after' });
  if (!doc) {
    throw ApiError.notFound('Category not found');
  }
  return serializeCategory(doc);
};

const softDeleteCategory = async (cid) => {
  await Category.updateOne({ _id: cid }, { $set: { is_deleted: true } });
};

module.exports = {
  seedCategories,
  listCategories,
  getBySlug,
  getById,
  createCategory,
  updateCategory,
  softDeleteCategory,
};
