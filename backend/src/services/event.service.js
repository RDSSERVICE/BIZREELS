const Listing = require('../models/Listing');
const { ListingEvent } = require('../models/Misc');
const logger = require('../utils/logger');

const VALID_EVENTS = new Set([
  'view',
  'chat_start',
  'deal_start',
  'deal_complete',
  'save',
  'share',
  'watch',
  'wa_click',
]);

const emit = async ({ listing_id, vendor_id = null, event_type, user_id = null, meta = {} } = {}) => {
  if (!VALID_EVENTS.has(event_type)) {
    return;
  }
  if (!listing_id) {
    return;
  }

  try {
    let resolvedVendorId = vendor_id;
    if (!resolvedVendorId) {
      const li = await Listing.findById(listing_id).select('vendor_id');
      if (li && li.vendor_id) {
        resolvedVendorId = li.vendor_id.toString();
      }
    }
    if (!resolvedVendorId) {
      return;
    }

    await ListingEvent.create({
      listing_id: listing_id.toString(),
      vendor_id: resolvedVendorId.toString(),
      event_type,
      user_id: user_id ? user_id.toString() : null,
      meta,
    });
  } catch (err) {
    logger.debug(`event emit err (non-fatal): ${err.message}`);
  }
};

module.exports = {
  emit,
};
