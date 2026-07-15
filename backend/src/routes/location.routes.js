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
  res.json(result);
}));

router.post('/pincode-lookup', catchAsync(async (req, res) => {
  const { pincode } = req.body;
  if (!pincode) {
    throw ApiError.badRequest('pincode is required');
  }

  const result = await locationService.pincodeLookup(String(pincode).trim());
  res.json(result);
}));

module.exports = router;
