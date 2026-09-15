const express = require('express');
const locationService = require('../services/location.service');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');

const router = express.Router();

router.post('/reverse-geocode', catchAsync(async (req, res) => {
  const { lat, lng } = req.body;
  if (lat === undefined || lng === undefined) {
    throw ApiError.badRequest('lat and lng are required');
  }

  const result = await locationService.reverseGeocode(parseFloat(lat), parseFloat(lng));
  res.json({
    success: true,
    ...result,
    data: result
  });
}));

// Handle POST for /pincode-lookup, /pincode, /lookup
router.post(['/pincode-lookup', '/pincode', '/lookup'], catchAsync(async (req, res) => {
  const pincode = req.body.pincode || req.body.code || req.body.pin;
  if (!pincode) {
    throw ApiError.badRequest('pincode parameter is required');
  }

  const result = await locationService.pincodeLookup(String(pincode).trim());
  res.json({
    success: true,
    ...result,
    data: result
  });
}));

// Handle GET for /pincode/:pincode, /pincode-lookup/:pincode, /lookup/:pincode
router.get(['/pincode/:pincode', '/pincode-lookup/:pincode', '/lookup/:pincode'], catchAsync(async (req, res) => {
  const pincode = req.params.pincode || req.query.pincode;
  if (!pincode) {
    throw ApiError.badRequest('pincode is required');
  }

  const result = await locationService.pincodeLookup(String(pincode).trim());
  res.json({
    success: true,
    ...result,
    data: result
  });
}));

router.get('/states', catchAsync(async (req, res) => {
  const result = await locationService.getStates();
  res.json({ success: true, states: result, data: result });
}));

router.get('/districts', catchAsync(async (req, res) => {
  const { state } = req.query;
  if (!state) {
    throw ApiError.badRequest('state query parameter is required');
  }
  const result = await locationService.getDistricts(state);
  res.json({ success: true, districts: result, data: result });
}));

module.exports = router;

