const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth.middleware');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Deal = require('../models/Deal');
const identityService = require('../services/identity.service');
const chatService = require('../services/chat.service');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const getCartCollection = () => mongoose.connection.db.collection('carts');

const getCart = async (userId) => {
  const coll = getCartCollection();
  let doc = await coll.findOne({ user_id: userId });
  if (!doc) {
    const now = new Date().toISOString();
    doc = { user_id: userId, items: [], created_at: now, updated_at: now };
    const res = await coll.insertOne(doc);
    doc._id = res.insertedId;
  }
  return doc;
};

const hydrateCart = async (cart) => {
  const listingIds = (cart.items || [])
    .map(i => i.listing_id)
    .filter(id => mongoose.Types.ObjectId.isValid(id));

  const listings = listingIds.length > 0 ? await Listing.find({ _id: { $in: listingIds }, is_deleted: { $ne: true } }) : [];
  const lookup = {};
  for (const l of listings) {
    lookup[l._id.toString()] = l;
  }

  const missingIds = listingIds.filter(id => !lookup[id.toString()]);
  if (missingIds.length > 0) {
    const Reel = require('../models/Reel');
    const reels = await Reel.find({ _id: { $in: missingIds }, isDeleted: { $ne: true } }).populate('creator');
    for (const r of reels) {
      lookup[r._id.toString()] = {
        _id: r._id,
        vendor_id: r.creator?._id || r.creator,
        vendor: r.creator?._id || r.creator,
        title: r.caption || 'Reel Product',
        salePrice: Number(r.targetListing?.salePrice || r.salePrice || r.price || 0),
        price: Number(r.targetListing?.price || r.price || 0),
        images: [{ url: r.thumbnailUrl || (r.mediaUrls && r.mediaUrls[0]) || '' }],
      };
    }
  }

  const groups = {};
  let total = 0;

  for (const it of cart.items || []) {
    const li = lookup[it.listing_id];
    if (!li) continue;

    const vendorId = (li.vendor_id || li.vendor).toString();
    const priceCandidates = [
      li.sellingPrice,
      li.salePrice,
      li.offer_price,
      li.price,
      li.rate,
      li.cost,
      li.actualPrice,
      li.regularPrice,
      li.originalPrice,
      li.pricing?.amount,
      li.pricing?.price,
    ];
    const validPrice = priceCandidates.map(p => Number(p)).find(p => !isNaN(p) && p > 0);
    const price = validPrice || 0;
    const quantity = parseInt(it.quantity || 1, 10);
    const line = price * quantity;
    total += line;

    const itemOut = {
      listing_id: it.listing_id,
      quantity,
      variant_selection: it.variant_selection || null,
      title: li.title,
      slug: li.slug,
      price,
      line_total: line,
      image: li.images && li.images.length > 0 ? li.images[0].url : null,
    };

    if (!groups[vendorId]) {
      groups[vendorId] = { vendor_id: vendorId, items: [], subtotal: 0.0 };
    }
    groups[vendorId].items.push(itemOut);
    groups[vendorId].subtotal += line;
  }

  const vendorIds = Object.keys(groups);
  if (vendorIds.length > 0) {
    const users = await User.find({ _id: { $in: vendorIds } }).select('name profile_pic');
    for (const u of users) {
      const vid = u._id.toString();
      if (groups[vid]) {
        groups[vid].vendor = {
          id: vid,
          name: u.name,
          profile_pic: u.profile_pic || null,
        };
      }
    }
  }

  return {
    id: cart._id.toString(),
    items: cart.items || [],
    groups: Object.values(groups),
    total_items: (cart.items || []).reduce((sum, i) => sum + parseInt(i.quantity || 1, 10), 0),
    total_amount: total,
  };
};

router.get(['/', '/me'], requireAuth, catchAsync(async (req, res) => {
  const cart = await getCart(req.user._id.toString());
  const result = await hydrateCart(cart);
  res.json(result);
}));

router.post(['/add', '/me/add'], requireAuth, catchAsync(async (req, res) => {
  const listing_id = req.body.listing_id || req.body.listingId;
  const { quantity = 1, variant_selection } = req.body;
  if (!listing_id || !mongoose.Types.ObjectId.isValid(listing_id)) {
    throw ApiError.badRequest('Invalid listing id');
  }

  const li = await Listing.findOne({ _id: listing_id, is_deleted: { $ne: true } });
  if (!li) {
    const Reel = require('../models/Reel');
    const reel = await Reel.findOne({ _id: listing_id, isDeleted: { $ne: true } });
    if (!reel) {
      throw ApiError.notFound('Listing or product not found');
    }
  }

  const now = new Date().toISOString();
  const cart = await getCart(req.user._id.toString());
  const items = cart.items || [];
  let found = false;

  for (const it of items) {
    if (it.listing_id === listing_id) {
      it.quantity = Math.min(99, parseInt(it.quantity || 1, 10) + parseInt(quantity, 10));
      if (variant_selection) {
        it.variant_selection = variant_selection;
      }
      found = true;
      break;
    }
  }

  if (!found) {
    items.push({
      listing_id,
      quantity: parseInt(quantity, 10),
      variant_selection: variant_selection || null,
      added_at: now,
    });
  }

  const coll = getCartCollection();
  await coll.updateOne(
    { _id: cart._id },
    { $set: { items, updated_at: now } }
  );

  cart.items = items;
  const result = await hydrateCart(cart);
  res.json(result);
}));

router.patch(['/items/:listing_id', '/me/items/:listing_id'], requireAuth, catchAsync(async (req, res) => {
  const { listing_id } = req.params;
  const { quantity } = req.body;
  if (quantity === undefined || quantity < 1 || quantity > 99) {
    throw ApiError.badRequest('quantity must be between 1 and 99');
  }

  const cart = await getCart(req.user._id.toString());
  const items = cart.items || [];
  let found = false;

  for (const it of items) {
    if (it.listing_id === listing_id) {
      it.quantity = parseInt(quantity, 10);
      found = true;
      break;
    }
  }

  if (!found) {
    throw ApiError.notFound('Item not in cart');
  }

  const now = new Date().toISOString();
  const coll = getCartCollection();
  await coll.updateOne(
    { _id: cart._id },
    { $set: { items, updated_at: now } }
  );

  cart.items = items;
  const result = await hydrateCart(cart);
  res.json(result);
}));

router.delete(['/items/:listing_id', '/me/items/:listing_id'], requireAuth, catchAsync(async (req, res) => {
  const { listing_id } = req.params;
  const cart = await getCart(req.user._id.toString());
  const items = (cart.items || []).filter(i => i.listing_id !== listing_id);

  const now = new Date().toISOString();
  const coll = getCartCollection();
  await coll.updateOne(
    { _id: cart._id },
    { $set: { items, updated_at: now } }
  );

  cart.items = items;
  const result = await hydrateCart(cart);
  res.json(result);
}));

router.post(['/checkout', '/me/checkout'], requireAuth, catchAsync(async (req, res) => {
  const { couponCode, couponDiscount = 0, shippingCharges = 0, address, pincode } = req.body || {};
  const cart = await getCart(req.user._id.toString());
  const hydrated = await hydrateCart(cart);
  if (hydrated.groups.length === 0) {
    throw ApiError.badRequest('Cart is empty');
  }

  // Block checkout if any vendor is unverified
  const unverifiedVendorIds = [];
  const unverifiedVendorNames = [];
  for (const group of hydrated.groups) {
    const vid = group.vendor_id;
    const verified = await identityService.hasVerifiedIdentity(vid);
    if (!verified) {
      unverifiedVendorIds.push(vid);
      const vname = group.vendor ? group.vendor.name : `Vendor ${vid.slice(-4)}`;
      unverifiedVendorNames.push(vname);
    }
  }

  if (unverifiedVendorIds.length > 0) {
    return res.status(403).json({
      code: 'vendor_unverified',
      message: `Cannot place this order — ${unverifiedVendorIds.length} vendor(s) haven't verified their identity yet. Please ask them to verify to accept orders.`,
      vendor_ids: unverifiedVendorIds,
      vendor_names: unverifiedVendorNames,
    });
  }

  const now = new Date().toISOString();
  const created = [];
  const totalSubtotal = hydrated.total_amount || 0;
  const numGroups = hydrated.groups.length;

  for (let idx = 0; idx < hydrated.groups.length; idx++) {
    const group = hydrated.groups[idx];
    const vendorId = group.vendor_id;
    const subtotal = group.subtotal;
    const groupRatio = totalSubtotal > 0 ? subtotal / totalSubtotal : 1 / numGroups;
    const allocatedDiscount = Math.round((Number(couponDiscount) || 0) * groupRatio);
    const allocatedShipping = Math.round((Number(shippingCharges) || 0) * groupRatio);
    const groupFinalAmount = Math.max(0, subtotal - allocatedDiscount + allocatedShipping);

    const itemsSnapshot = group.items.map(i => ({
      listing_id: i.listing_id,
      title: i.title,
      quantity: i.quantity,
      price: i.price,
      line_total: i.line_total,
    }));

    const deal = await Deal.create({
      buyer_id: req.user._id.toString(),
      vendor_id: vendorId,
      seller_id: vendorId,
      items: itemsSnapshot,
      amount_paise: Math.round(groupFinalAmount * 100),
      item_total: subtotal,
      coupon_code: couponCode || null,
      coupon_discount: allocatedDiscount,
      shipping_charges: allocatedShipping,
      delivery_address: address || null,
      pincode: pincode || null,
      status: 'negotiating',
      source: 'cart_checkout',
      created_at: now,
      updated_at: now,
      is_deleted: false,
    });

    // Send summary chat message
    try {
      const thread = await chatService.getOrCreateThread(
        req.user._id.toString(),
        vendorId,
        itemsSnapshot[0].listing_id
      );
      const summaryLines = [`🛒 Order request — ${itemsSnapshot.length} item(s)`];
      for (const i of itemsSnapshot) {
        summaryLines.push(`  • ${i.title} x ${i.quantity} = ₹${Math.round(i.line_total)}`);
      }
      summaryLines.push(`Subtotal: ₹${Math.round(subtotal)}`);
      if (allocatedDiscount > 0) {
        summaryLines.push(`🏷️ Coupon Discount (${couponCode || 'PROMO'}): -₹${allocatedDiscount}`);
      }
      if (allocatedShipping > 0) {
        summaryLines.push(`🚚 Shipping Charges: ₹${allocatedShipping}`);
      } else {
        summaryLines.push(`🚚 Delivery: FREE`);
      }
      summaryLines.push(`Total Amount: ₹${Math.round(groupFinalAmount)}`);
      if (address) {
        summaryLines.push(`📍 Deliver to: ${address}`);
      }

      await chatService.sendMessage(
        thread._id.toString(),
        req.user._id.toString(),
        summaryLines.join('\n')
      );
    } catch (err) {
      // Non-fatal fallback
    }

    created.push({
      deal_id: deal._id.toString(),
      vendor_id: vendorId,
      amount_paise: deal.amount_paise,
      item_count: itemsSnapshot.length,
    });
  }

  // Clear cart
  const coll = getCartCollection();
  await coll.updateOne({ _id: cart._id }, { $set: { items: [], updated_at: now } });

  res.json({ ok: true, deals: created });
}));

module.exports = router;
