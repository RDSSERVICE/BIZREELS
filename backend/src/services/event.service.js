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
    if (!resolvedVendorId && listing_id) {
      const li = await Listing.findById(listing_id).select('vendor vendor_id');
      if (li) {
        resolvedVendorId = (li.vendor || li.vendor_id)?.toString();
      }
    }
    if (!resolvedVendorId) {
      return;
    }

    const eventDoc = await ListingEvent.create({
      listing_id: listing_id.toString(),
      vendor_id: resolvedVendorId.toString(),
      event_type,
      user_id: user_id ? user_id.toString() : null,
      meta,
    });

    // Notify vendor in real-time over Socket.IO
    try {
      const { emitToUser } = require('../sockets');
      emitToUser(resolvedVendorId.toString(), 'analytics:updated', {
        event_type,
        listing_id: listing_id.toString(),
        timestamp: eventDoc.created_at,
      });
    } catch (socketErr) {
      // Non-fatal socket broadcast
    }
  } catch (err) {
    logger.debug(`event emit err (non-fatal): ${err.message}`);
  }
};

module.exports = {
  emit,
};
