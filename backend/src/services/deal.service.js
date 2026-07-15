const Deal = require('../models/Deal');
const { ChatThread } = require('../models/Chat');
const chatService = require('./chat.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const serializeDeal = (d) => {
  if (!d) return null;
  const out = d.toObject ? d.toObject() : { ...d };
  if (out._id) {
    out.id = out._id.toString();
    delete out._id;
  }
  const idFields = ['thread_id', 'listing_id', 'requirement_id', 'buyer_id', 'seller_id'];
  for (const k of idFields) {
    if (out[k]) {
      out[k] = out[k].toString();
    }
  }
  delete out.__v;
  return out;
};

const createDeal = async (buyerId, body) => {
  const { thread_id, listing_id = null, requirement_id = null, initial_offer, note = null } = body;
  if (!thread_id) {
    throw ApiError.badRequest('thread_id required');
  }
  if (!initial_offer || initial_offer <= 0) {
    throw ApiError.badRequest('initial_offer must be > 0');
  }

  const thread = await ChatThread.findById(thread_id);
  if (!thread || !thread.participants.includes(buyerId)) {
    throw ApiError.notFound('Thread not found');
  }
  const sellerId = thread.participants.find(p => p !== buyerId);

  const now = new Date().toISOString();
  const deal = await Deal.create({
    thread_id,
    listing_id,
    requirement_id,
    buyer_id: buyerId,
    seller_id: sellerId,
    initial_offer: parseFloat(initial_offer),
    current_offer: parseFloat(initial_offer),
    offers_history: [{ by: buyerId, amount: parseFloat(initial_offer), note, at: now }],
  });

  // Send a quote message in the chat thread
  await chatService.sendMessage(thread_id, buyerId, {
    type: 'quote',
    text: note,
    quote: {
      deal_id: deal._id.toString(),
      amount: parseFloat(initial_offer),
      note,
      status: 'pending',
    },
  });

  // Emit event (analytics)
  if (listing_id) {
    try {
      const eventService = require('./event.service');
      await eventService.emit({
        listing_id,
        vendor_id: sellerId,
        event_type: 'deal_start',
        user_id: buyerId,
        meta: { deal_id: deal._id.toString() },
      });
    } catch {}
  }

  return serializeDeal(deal);
};

const getOwnedDeal = async (dealId, userId, isUserAdmin = false) => {
  const d = await Deal.findById(dealId);
  if (!d) {
    throw ApiError.notFound('Deal not found');
  }
  if (!isUserAdmin && d.buyer_id !== userId && d.seller_id !== userId) {
    throw ApiError.forbidden('Not a participant');
  }
  return d;
};

const counter = async (dealId, userId, amount, note = null) => {
  const d = await getOwnedDeal(dealId, userId);
  if (d.status !== 'negotiating') {
    throw ApiError.badRequest('Deal is not negotiating');
  }
  if (amount <= 0) {
    throw ApiError.badRequest('amount must be > 0');
  }

  const now = new Date().toISOString();
  const hist = d.offers_history || [];
  hist.push({ by: userId, amount: parseFloat(amount), note, at: now });

  const updated = await Deal.findOneAndUpdate(
    { _id: dealId },
    { $set: { current_offer: parseFloat(amount), offers_history: hist, updated_at: now } },
    { new: true }
  );

  await chatService.sendMessage(d.thread_id, userId, {
    type: 'quote',
    text: note,
    quote: {
      deal_id: dealId,
      amount: parseFloat(amount),
      note,
      status: 'pending',
    },
  });

  // Emit to user socket
  try {
    const socketService = require('./socket.service');
    const peer = userId === d.buyer_id ? d.seller_id : d.buyer_id;
    socketService.emitToUser(peer, 'deal:updated', serializeDeal(updated));
  } catch {}

  return serializeDeal(updated);
};

const setDealStatus = async (dealId, userId, newStatus, systemText) => {
  const d = await getOwnedDeal(dealId, userId);
  const now = new Date().toISOString();
  const updated = await Deal.findOneAndUpdate(
    { _id: dealId },
    { $set: { status: newStatus, updated_at: now } },
    { new: true }
  );

  await chatService.sendMessage(d.thread_id, userId, {
    type: 'system',
    text: systemText,
  });

  // Emit socket event
  try {
    const socketService = require('./socket.service');
    const peer = userId === d.buyer_id ? d.seller_id : d.buyer_id;
    socketService.emitToUser(peer, 'deal:updated', serializeDeal(updated));
  } catch {}

  return serializeDeal(updated);
};

const accept = async (dealId, userId) => {
  return await setDealStatus(dealId, userId, 'accepted', 'Deal accepted 🎉');
};

const reject = async (dealId, userId) => {
  return await setDealStatus(dealId, userId, 'rejected', 'Deal rejected');
};

const cancel = async (dealId, userId) => {
  return await setDealStatus(dealId, userId, 'cancelled', 'Deal cancelled');
};

const complete = async (dealId, userId) => {
  const d = await getOwnedDeal(dealId, userId);
  const now = new Date().toISOString();
  const pendingFrom = d.completion_pending_from;

  if (!pendingFrom) {
    // First party requests completion
    const updated = await Deal.findOneAndUpdate(
      { _id: dealId },
      { $set: { completion_pending_from: userId, updated_at: now } },
      { new: true }
    );
    await chatService.sendMessage(d.thread_id, userId, {
      type: 'system',
      text: 'Completion requested. Waiting for other party to confirm.',
    });
    return serializeDeal(updated);
  } else if (pendingFrom !== userId) {
    // Second party confirms
    const updated = await Deal.findOneAndUpdate(
      { _id: dealId },
      { $set: { status: 'completed', updated_at: now } },
      { new: true }
    );
    await chatService.sendMessage(d.thread_id, userId, {
      type: 'system',
      text: 'Deal completed ✅',
    });

    // Analytics: emit event
    if (d.listing_id) {
      try {
        const eventService = require('./event.service');
        await eventService.emit({
          listing_id: d.listing_id,
          vendor_id: d.seller_id,
          event_type: 'deal_complete',
          user_id: userId,
          meta: { deal_id: dealId },
        });
      } catch {}
    }

    // Referral triggers
    try {
      const referralService = require('./referral.service');
      await referralService.maybeAwardOnDealComplete(d.buyer_id);
      await referralService.maybeAwardOnDealComplete(d.seller_id);
    } catch {}

    // Commission accrual
    try {
      const commissionService = require('./commission.service');
      await commissionService.accrueOnDealComplete(updated);
    } catch (e) {
      logger.debug(`commission accrue failed: ${e.message}`);
    }

    return serializeDeal(updated);
  }

  return serializeDeal(d);
};

const myDeals = async (userId, status = null) => {
  const q = { $or: [{ buyer_id: userId }, { seller_id: userId }] };
  if (status) {
    q.status = status;
  }
  const docs = await Deal.find(q).sort({ _id: -1 }).limit(100);
  return { items: docs.map(serializeDeal) };
};

const getById = async (dealId, userId) => {
  const d = await getOwnedDeal(dealId, userId);
  return serializeDeal(d);
};

const checkAndExpireDeals = async () => {
  try {
    const now = new Date().toISOString();
    const res = await Deal.updateMany(
      { status: 'negotiating', expires_at: { $lt: now } },
      { $set: { status: 'expired', updated_at: now } }
    );
    if (res.modifiedCount > 0) {
      logger.info(`Expired ${res.modifiedCount} deals`);
    }
  } catch (err) {
    logger.warn(`expire deals error: ${err.message}`);
  }
};

const runDealFollowups = async () => {
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const cursor = await Deal.find({
      status: 'accepted',
      updated_at: { $lt: cutoff },
      followup_sent: { $ne: true },
    });

    const notificationService = require('./notification.service');

    for (const d of cursor) {
      try {
        await chatService.sendMessage(d.thread_id.toString(), d.buyer_id, {
          type: 'system',
          text: 'Did your deal complete? Tap Complete to earn trust points.',
        });

        for (const uid of [d.buyer_id, d.seller_id]) {
          await notificationService.create(
            uid,
            'deal_update',
            'Confirm your deal',
            '48h passed since acceptance. Confirm completion to earn trust.',
            {},
            `/chat/${d.thread_id.toString()}`
          );
        }

        await Deal.updateOne({ _id: d._id }, { $set: { followup_sent: true } });
      } catch (err) {
        logger.warn(`followup individual err: ${err.message}`);
      }
    }
  } catch (err) {
    logger.warn(`followup loop err: ${err.message}`);
  }
};

module.exports = {
  createDeal,
  counter,
  accept,
  reject,
  cancel,
  complete,
  myDeals,
  getById,
  checkAndExpireDeals,
  runDealFollowups,
};
