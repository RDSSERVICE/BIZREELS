const mongoose = require('mongoose');

const listingImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  width: { type: Number, default: null },
  height: { type: Number, default: null },
}, { _id: false });

const listingReelSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  thumbnail_url: { type: String, default: null },
  duration: { type: Number, default: null },
}, { _id: false });

const geoPointSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true }, // [lng, lat]
}, { _id: false });

const listingVariantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['size', 'color', 'material', 'tier', 'custom'], default: 'custom' },
  options: { type: [String], default: [] },
  prices: { type: mongoose.Schema.Types.Mixed, default: null },
  price_hint_inr: { type: Number, default: null },
  features: { type: [String], default: [] },
}, { _id: false });

const listingLocationSchema = new mongoose.Schema({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  address: { type: String, default: null },
  area: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: null },
  pincode: { type: String, required: true },
  geo: { type: geoPointSchema, default: null },
}, { _id: false });

const listingSchema = new mongoose.Schema({
  vendor_id: { type: String, required: true, index: true },
  type: { type: String, enum: ['new_product', 'old_product', 'service'], required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: null },
  category_id: { type: String, required: true, index: true },
  sub_category_id: { type: String, default: null, index: true },
  price: { type: Number, required: true },
  offer_price: { type: Number, default: null },
  is_negotiable: { type: Boolean, default: false },
  bulk_price: { type: Number, default: null },
  stock: { type: Number, default: null },
  condition: { type: String, enum: ['new', 'like_new', 'good', 'fair', null], default: null },
  warranty: { type: String, default: null },
  service_charges_type: { type: String, enum: ['fixed', 'hourly', 'per_visit', null], default: null },
  experience_years: { type: Number, default: null },
  service_area_km: { type: Number, default: null },
  images: { type: [listingImageSchema], default: [] },
  reel: { type: listingReelSchema, default: null },
  location: { type: listingLocationSchema, required: true },
  tags: { type: [String], default: [] },
  short_description: { type: String, default: null },
  features: { type: [String], default: [] },
  variants: { type: [listingVariantSchema], default: [] },
  status: { type: String, enum: ['active', 'paused', 'sold', 'expired'], default: 'active', index: true },
  views_count: { type: Number, default: 0 },
  saves_count: { type: Number, default: 0 },
  // Phase 4b
  boost_expires_at: { type: String, default: null },
  boost_duration_days: { type: Number, default: null },
  boost_activated_at: { type: String, default: null },
  is_takendown: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  is_test_data: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Indexes matching the Python database.py
listingSchema.index({ is_deleted: 1 });
listingSchema.index({ 'location.geo': '2dsphere' });
listingSchema.index({ boost_expires_at: 1 });
listingSchema.index({ is_takendown: 1 });
listingSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  { name: 'listings_text' }
);

module.exports = mongoose.model('Listing', listingSchema, 'listings');
