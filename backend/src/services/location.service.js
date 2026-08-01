const axios = require('axios');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Define PincodeCache Schema & Model inline to avoid bloating models folder
const pincodeCacheSchema = new mongoose.Schema({
  _id: String,
  pincode: String,
  area: String,
  city: String,
  state: String,
  country: String,
}, { versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: false } });

let PincodeCache;
try {
  PincodeCache = mongoose.model('PincodeCache');
} catch {
  PincodeCache = mongoose.model('PincodeCache', pincodeCacheSchema, 'pincode_cache');
}

const PINCODE_API = 'https://api.postalpincode.in/pincode/{pincode}';

const pincodeLookup = async (pincode) => {
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    throw ApiError.badRequest('Pincode must be 6 digits');
  }

  // Check cache
  const cached = await PincodeCache.findById(pincode);
  if (cached) {
    const obj = cached.toObject();
    delete obj._id;
    return obj;
  }

  try {
    const res = await axios.get(PINCODE_API.replace('{pincode}', pincode), { timeout: 6000 });
    const data = res.data;
    const entry = Array.isArray(data) ? data[0] : data;

    if (entry.Status !== 'Success' || !entry.PostOffice || entry.PostOffice.length === 0) {
      throw ApiError.notFound('Pincode not found');
    }

    const po = entry.PostOffice[0];
    const result = {
      pincode,
      area: po.Name,
      city: po.District,
      state: po.State,
      country: po.Country || 'India',
    };

    // Cache it
    try {
      await PincodeCache.updateOne(
        { _id: pincode },
        { $set: result },
        { upsert: true }
      );
    } catch {}

    return result;
  } catch (err) {
    if (err.statusCode) throw err;
    logger.warn(`Pincode API failure: ${err.message}`);
    throw new ApiError(503, 'Pincode service temporarily unavailable');
  }
};

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
      headers: {
        'User-Agent': 'BizReels/1.0 (contact@bizreels.com)'
      },
      timeout: 5000
    });

    if (res.data && res.data.address) {
      const addr = res.data.address;
      const pincode = addr.postcode || null;
      const state = addr.state || addr.region || null;
      const district = addr.state_district || addr.county || addr.city_district || null;
      const city = addr.city || addr.town || addr.village || addr.municipality || null;
      const area = addr.suburb || addr.neighbourhood || addr.road || null;
      const fullAddress = res.data.display_name || '';

      return {
        area,
        city: city || district,
        state,
        district: district || city,
        pincode,
        country: addr.country || 'India',
        fullAddress,
        source: 'nominatim',
      };
    }
  } catch (err) {
    logger.warn(`Nominatim reverse geocode failure: ${err.message}. Falling back to metro default.`);
  }

  // Fallback to closest metro
  const metros = [
    { lat: 12.97, lng: 77.59, city: 'Bengaluru', state: 'Karnataka' },
    { lat: 28.61, lng: 77.20, city: 'New Delhi', state: 'Delhi' },
    { lat: 19.07, lng: 72.87, city: 'Mumbai', state: 'Maharashtra' },
    { lat: 17.38, lng: 78.48, city: 'Hyderabad', state: 'Telangana' },
    { lat: 13.08, lng: 80.27, city: 'Chennai', state: 'Tamil Nadu' },
    { lat: 22.57, lng: 88.36, city: 'Kolkata', state: 'West Bengal' },
    { lat: 18.52, lng: 73.85, city: 'Pune', state: 'Maharashtra' },
    { lat: 26.91, lng: 75.78, city: 'Jaipur', state: 'Rajasthan' },
  ];

  let best = metros[0];
  let minDist = Infinity;
  for (const m of metros) {
    const dist = Math.pow(m.lat - lat, 2) + Math.pow(m.lng - lng, 2);
    if (dist < minDist) {
      minDist = dist;
      best = m;
    }
  }

  return {
    area: null,
    city: best.city,
    state: best.state,
    pincode: null,
    country: 'India',
    fullAddress: `${best.city}, ${best.state}, India`,
    source: 'mock',
  };
};

module.exports = {
  pincodeLookup,
  reverseGeocode,
};
