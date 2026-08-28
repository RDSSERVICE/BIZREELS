const Category = require('../models/Category');
const slugify = require('slugify');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const SEED_TREE = [
  {
    name: 'Electronics',
    icon: '📱',
    category_type: 'product',
    children: ['Mobile', 'Laptop', 'TV', 'Home Appliances', 'Accessories'],
  },
  {
    name: 'Fashion',
    icon: '👗',
    category_type: 'product',
    children: ['Men', 'Women', 'Kids', 'Footwear', 'Accessories'],
  },
  {
    name: 'Home & Furniture',
    icon: '🛋️',
    category_type: 'product',
    children: ['Furniture', 'Kitchen', 'Decor', 'Bedding'],
  },
  {
    name: 'Vehicles',
    icon: '🏍️',
    category_type: 'product',
    children: ['Car', 'Bike', 'Scooter', 'Commercial'],
  },
  {
    name: 'Real Estate',
    icon: '🏠',
    category_type: 'service',
    children: ['Rent', 'Buy', 'Sell', 'PG/Hostel'],
  },
  {
    name: 'Services',
    icon: '🛠️',
    category_type: 'service',
    children: ['Plumber', 'Electrician', 'Carpenter', 'AC Repair', 'Cleaning', 'Painter'],
  },
  {
    name: 'Food & Grocery',
    icon: '🍲',
    category_type: 'product',
    children: ['Restaurants', 'Grocery', 'Bakery', 'Sweets'],
  },
  {
    name: 'Beauty & Salon',
    icon: '💇',
    category_type: 'service',
    children: ['Men Salon', 'Women Salon', 'Spa', 'Makeup'],
  },
  {
    name: 'Health & Fitness',
    icon: '🏋️',
    category_type: 'service',
    children: ['Gym', 'Yoga', 'Doctor', 'Medical Store'],
  },
  {
    name: 'Education & Coaching',
    icon: '📚',
    category_type: 'service',
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
    required_licenses: Array.isArray(d.required_licenses) ? d.required_licenses : [],
    sort_order: d.sort_order || 0,
    is_active: d.is_active !== false,
  };
};

const seedCategories = async () => {
  const count = await Category.countDocuments({ is_deleted: { $ne: true } });
  if (count === 0) {
    for (let idx = 0; idx < SEED_TREE.length; idx++) {
      const group = SEED_TREE[idx];
      const parentSlug = slugify(group.name, { lower: true });
      const parent = await Category.create({
        name: group.name,
        slug: parentSlug,
        icon_url: group.icon,
        parent_id: null,
        sort_order: idx,
        category_type: group.category_type,
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
          category_type: group.category_type,
        });
      }
    }
    logger.info(`Seeded ${SEED_TREE.length} category groups`);
  } else {
    // If they already exist, update any missing category_type
    for (const group of SEED_TREE) {
      const parent = await Category.findOneAndUpdate(
        { name: group.name, parent_id: null },
        { $set: { category_type: group.category_type } },
        { returnDocument: 'after' }
      );
      if (parent) {
        await Category.updateMany(
          { parent_id: parent._id.toString() },
          { $set: { category_type: group.category_type } }
        );
      }
    }
    logger.info("Validated and updated existing categories' types.");
  }
};

const cache = require('../utils/cache');

const listCategories = async ({ parent_id = null, only_top_level = false, as_tree = false, category_type = null, search = null } = {}) => {
  const version = await cache.getCache('categories:version') || 1;
  const cacheKey = `categories:v${version}:${parent_id || 'null'}:${only_top_level}:${as_tree}:${category_type || 'null'}:${search || 'null'}`;
  
  const cached = await cache.getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const q = { is_deleted: { $ne: true }, is_active: true };
  if (only_top_level) {
    q.parent_id = null;
  } else if (parent_id) {
    q.parent_id = parent_id;
  }
  if (category_type) {
    q.category_type = category_type;
  }
  if (search && search.trim()) {
    q.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { slug: { $regex: search.trim(), $options: 'i' } },
    ];
  }
  const docs = await Category.find(q).sort({ sort_order: 1, name: 1 }).lean();
  const serialized = docs.map(serializeCategory);
  let result = serialized;
  if (as_tree) {
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
    result = roots;
  }

  await cache.setCache(cacheKey, result, 3600); // cache for 1 hour
  return result;
};

const getBySlug = async (slug) => {
  const doc = await Category.findOne({ slug, is_deleted: { $ne: true } }).lean();
  if (!doc) return null;
  const result = serializeCategory(doc);
  // Attach children
  const children = await Category.find({
    parent_id: result.id,
    is_deleted: { $ne: true },
    is_active: true,
  }).sort({ sort_order: 1 }).lean();
  result.children = children.map(serializeCategory);
  return result;
};

const getById = async (cid) => {
  const doc = await Category.findOne({ _id: cid, is_deleted: { $ne: true } }).lean();
  return doc ? serializeCategory(doc) : null;
};

const createCategory = async (name, parent_id = null, icon_url = null, category_type = null, required_licenses = []) => {
  const slugBase = slugify(name, { lower: true });
  let slug = slugBase;
  let i = 1;
  while (await Category.findOne({ slug }).lean()) {
    i++;
    slug = `${slugBase}-${i}`;
  }
  // If adding subcategory, inherit parent's category_type
  let resolvedType = category_type;
  if (parent_id && !resolvedType) {
    const parent = await Category.findById(parent_id).lean();
    if (parent) resolvedType = parent.category_type;
  }
  const doc = await Category.create({
    name: name.trim(),
    slug,
    icon_url,
    parent_id,
    category_type: resolvedType,
    required_licenses: Array.isArray(required_licenses) ? required_licenses : [],
  });
  
  await cache.incrCache('categories:version');
  return serializeCategory(doc);
};

const updateCategory = async (cid, updates) => {
  const allowed = ['name', 'icon_url', 'sort_order', 'is_active', 'required_licenses'];
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
  
  await cache.incrCache('categories:version');
  return serializeCategory(doc);
};

const bulkUploadCategories = async (buffer) => {
  const xlsx = require('xlsx');
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw ApiError.badRequest('Excel sheet is empty or invalid');
  }
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  if (data.length === 0) {
    throw ApiError.badRequest('No data rows found in the Excel sheet');
  }

  const results = {
    createdCategories: 0,
    createdSubcategories: 0,
    updatedCategories: 0,
    errors: []
  };

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    
    // Normalize keys (lowercase, remove spaces and underscores)
    const normalizedRow = {};
    for (const k of Object.keys(row)) {
      const normalizedKey = k.toLowerCase().trim().replace(/[\s_]+/g, '');
      normalizedRow[normalizedKey] = row[k];
    }
    
    const categoryName = normalizedRow['categoryname'] || normalizedRow['name'];
    const categoryType = normalizedRow['categorytype'] || normalizedRow['type'];
    const subcategoryName = normalizedRow['subcategoryname'] || normalizedRow['subcategory'];
    const description = normalizedRow['description'] || normalizedRow['desc'];
    const requiredLicensesStr = normalizedRow['requiredlicenses'] || normalizedRow['licenses'];
    
    if (!categoryName) {
      results.errors.push(`Row ${index + 2}: Missing category name`);
      continue;
    }
    
    // Parse required licenses (comma separated list)
    let requiredLicenses = [];
    if (requiredLicensesStr) {
      requiredLicenses = String(requiredLicensesStr)
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }
    
    // Ensure category_type is valid (product or service)
    let cleanType = null;
    if (categoryType) {
      const typeStr = String(categoryType).toLowerCase().trim();
      if (['product', 'service'].includes(typeStr)) {
        cleanType = typeStr;
      }
    }
    
    try {
      // 1. Look for or create Parent Category
      let parentCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') },
        parent_id: null,
        is_deleted: { $ne: true }
      });
      
      if (!parentCategory) {
        // Create new parent category
        const slugBase = slugify(categoryName.trim(), { lower: true });
        let slug = slugBase;
        let i = 1;
        while (await Category.findOne({ slug }).lean()) {
          i++;
          slug = `${slugBase}-${i}`;
        }
        
        parentCategory = await Category.create({
          name: categoryName.trim(),
          slug,
          icon_url: null,
          description: description ? String(description).trim() : null,
          category_type: cleanType || 'product', // default to product
          required_licenses: requiredLicenses,
          parent_id: null
        });
        results.createdCategories++;
      } else {
        // Update existing parent category properties if provided in the row
        const updates = {};
        if (description) updates.description = String(description).trim();
        if (cleanType) updates.category_type = cleanType;
        if (requiredLicenses.length > 0) {
          // Merge licenses uniquely
          const existingLicenses = parentCategory.required_licenses || [];
          updates.required_licenses = [...new Set([...existingLicenses, ...requiredLicenses])];
        }
        
        if (Object.keys(updates).length > 0) {
          await Category.updateOne({ _id: parentCategory._id }, { $set: updates });
          results.updatedCategories++;
        }
      }
      
      // 2. If subcategory_name is specified, look for or create Subcategory
      if (subcategoryName && String(subcategoryName).trim()) {
        const subNameTrim = String(subcategoryName).trim();
        let subcategory = await Category.findOne({
          name: { $regex: new RegExp(`^${subNameTrim}$`, 'i') },
          parent_id: parentCategory._id.toString(),
          is_deleted: { $ne: true }
        });
        
        if (!subcategory) {
          const slugBase = slugify(`${parentCategory.name}-${subNameTrim}`, { lower: true });
          let slug = slugBase;
          let i = 1;
          while (await Category.findOne({ slug }).lean()) {
            i++;
            slug = `${slugBase}-${i}`;
          }
          
          await Category.create({
            name: subNameTrim,
            slug,
            icon_url: null,
            category_type: parentCategory.category_type, // inherit parent category_type
            parent_id: parentCategory._id.toString()
          });
          results.createdSubcategories++;
        }
      }
    } catch (err) {
      results.errors.push(`Row ${index + 2}: Error saving category (${err.message})`);
    }
  }

  // Increment categories cache version to invalidate cached category listings
  await cache.incrCache('categories:version');
  return results;
};

const softDeleteCategory = async (cid) => {
  await Category.updateOne({ _id: cid }, { $set: { is_deleted: true } });
  await cache.incrCache('categories:version');
};

module.exports = {
  seedCategories,
  listCategories,
  getBySlug,
  getById,
  createCategory,
  updateCategory,
  softDeleteCategory,
  bulkUploadCategories,
};
