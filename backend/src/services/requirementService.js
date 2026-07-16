const requirementRepository = require('../repositories/requirementRepository');
const walletRepository = require('../repositories/walletRepository');
const Notification = require('../models/Notification');
const { emitToUser } = require('../sockets');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * RequirementService
 * Manages customer requirements, lead query logic, bid calculations, and wallet settlements.
 */
class RequirementService {
  async createRequirement(
    { customerId, title, description, category, budget, deadline, lat, lng, address },
    req
  ) {
    const location = {
      type: 'Point',
      coordinates: [0, 0],
    };
    if (lat && lng) {
      location.coordinates = [parseFloat(lng), parseFloat(lat)];
      location.address = address || '';
    }

    const requirement = await requirementRepository.createRequirement({
      customer: customerId,
      title,
      description,
      category,
      budget: parseFloat(budget),
      deadline: new Date(deadline),
      location,
    });

    await requirementRepository.logAudit({
      userId: customerId,
      action: 'REQUIREMENT_CREATE',
      entityId: requirement._id,
      description: `Posted requirement: ${title}`,
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    logger.info(`Requirement posted: ${requirement._id}`, { service: 'requirements' });
    return requirement;
  }

  async updateRequirement(id, customerId, updateData, req) {
    const requirement = await requirementRepository.findRequirementById(id);
    if (!requirement) {
      throw ApiError.notFound('Requirement not found.');
    }

    if (requirement.customer._id.toString() !== customerId.toString()) {
      throw ApiError.forbidden('Unauthorized action.');
    }

    if (updateData.lat && updateData.lng) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(updateData.lng), parseFloat(updateData.lat)],
        address: updateData.address || requirement.location?.address || '',
      };
    }

    const updated = await requirementRepository.updateRequirement(id, customerId, updateData);

    await requirementRepository.logAudit({
      userId: customerId,
      action: 'REQUIREMENT_UPDATE',
      entityId: id,
      description: `Updated requirement: ${updated.title}`,
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    return updated;
  }

  async deleteRequirement(id, customerId, req) {
    const deleted = await requirementRepository.softDeleteRequirement(id, customerId);
    if (!deleted) {
      throw ApiError.forbidden('Requirement not found or unauthorized.');
    }

    await requirementRepository.logAudit({
      userId: customerId,
      action: 'REQUIREMENT_DELETE',
      entityId: id,
      description: `Soft deleted requirement: ${deleted.title}`,
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    return { message: 'Requirement deleted successfully.' };
  }

  async queryRequirements({ customerId, category, status, lat, lng, distance, page, limit }) {
    const coordinates = lat && lng ? [parseFloat(lng), parseFloat(lat)] : null;
    return requirementRepository.queryRequirements({
      customerId,
      category,
      status,
      coordinates,
      distanceKm: distance ? parseFloat(distance) : undefined,
      page: parseInt(page || 1, 10),
      limit: parseInt(limit || 10, 10),
    });
  }

  async getRequirementDetails(id) {
    const requirement = await requirementRepository.findRequirementById(id);
    if (!requirement) {
      throw ApiError.notFound('Requirement not found.');
    }
    return requirement;
  }

  // ── Quotation Bids ────────────────────────────────────────
  async createQuote({ requirementId, vendorId, price, notes, estimatedDelivery }, req) {
    const requirement = await requirementRepository.findRequirementById(requirementId);
    if (!requirement) {
      throw ApiError.notFound('Requirement not found.');
    }

    if (requirement.status !== 'open') {
      throw ApiError.badRequest('This requirement is no longer open for bidding.');
    }

    // Prevent duplicate quote bids
    const alreadyQuoted = await requirementRepository.checkVendorHasQuoted(requirementId, vendorId);
    if (alreadyQuoted) {
      throw ApiError.badRequest('You have already submitted a quotation for this requirement.');
    }

    const quote = await requirementRepository.createQuote({
      requirement: requirementId,
      vendor: vendorId,
      price: parseFloat(price),
      notes,
      estimatedDelivery: new Date(estimatedDelivery),
    });

    await requirementRepository.logAudit({
      userId: vendorId,
      action: 'QUOTE_CREATE',
      entityId: quote._id,
      description: `Submitted bid of ₹${price} on requirement "${requirement.title}"`,
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    // Create Notification for the buyer
    const notifyBuyer = await Notification.create({
      recipient: requirement.customer._id,
      sender: vendorId,
      type: 'quote',
      title: 'New Bid Received',
      message: `A vendor has submitted a quote of ₹${price} for your requirement: "${requirement.title}"`,
      data: { requirementId: requirement._id, quoteId: quote._id },
    });

    emitToUser(requirement.customer._id.toString(), 'notification', notifyBuyer);

    return quote;
  }

  async getQuotesForRequirement(requirementId, userId) {
    const requirement = await requirementRepository.findRequirementById(requirementId);
    if (!requirement) {
      throw ApiError.notFound('Requirement not found.');
    }

    // Only creator customer, or bidding vendors can access list
    const isCustomer = requirement.customer._id.toString() === userId.toString();
    
    // Fetch quotes list
    const quotes = await requirementRepository.getQuotesForRequirement(requirementId);

    if (isCustomer) {
      return quotes;
    }

    // If vendor, filter to only return their specific quote bid
    return quotes.filter(q => q.vendor._id.toString() === userId.toString());
  }

  /**
   * Quote Acceptance with Ledger Wallet Settlement
   */
  async updateQuoteStatus(quoteId, status, customerId, req) {
    if (!['accepted', 'rejected'].includes(status)) {
      throw ApiError.badRequest('Invalid status selection.');
    }

    const quote = await requirementRepository.findQuoteById(quoteId);
    if (!quote) {
      throw ApiError.notFound('Quotation not found.');
    }

    const requirement = quote.requirement;
    if (requirement.customer.toString() !== customerId.toString()) {
      throw ApiError.forbidden('You are not authorized to accept bids for this requirement.');
    }

    if (requirement.status !== 'open') {
      throw ApiError.badRequest('Requirement is already completed or closed.');
    }

    if (status === 'rejected') {
      const updatedQuote = await requirementRepository.updateQuoteStatus(quoteId, 'rejected');
      return { quote: updatedQuote };
    }

    // Double Entry Wallet Settlement Transaction
    logger.info(`Settling payment of ₹${quote.price} from customer: ${customerId} to vendor: ${quote.vendor._id}`, { service: 'wallet' });
    
    // Debit Customer Wallet
    await walletRepository.updateWalletBalance(
      customerId,
      -quote.price,
      'payment',
      quoteId,
      `Paid quote acceptance for requirement: "${requirement.title}"`
    );

    // Credit Vendor Wallet
    await walletRepository.updateWalletBalance(
      quote.vendor._id,
      quote.price,
      'deposit',
      quoteId,
      `Received payment for quote acceptance: "${requirement.title}"`
    );

    // Update Quote & Requirement States
    const updatedQuote = await quoteSchemaUpdate(quoteId);
    await Requirement.findByIdAndUpdate(requirement._id, { status: 'completed' });

    // Audit Log
    await requirementRepository.logAudit({
      userId: customerId,
      action: 'QUOTE_ACCEPT',
      entityId: quoteId,
      description: `Accepted quote from vendor ${quote.vendor.name} for ₹${quote.price}`,
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    // Notify Vendor
    const notifyVendor = await Notification.create({
      recipient: quote.vendor._id,
      sender: customerId,
      type: 'payment',
      title: 'Quotation Accepted & Paid',
      message: `Your bid of ₹${quote.price} has been accepted and credited to your wallet for requirement: "${requirement.title}"`,
      data: { requirementId: requirement._id, quoteId },
    });
    emitToUser(quote.vendor._id.toString(), 'notification', notifyVendor);

    return { quote: updatedQuote, message: 'Quote accepted and payment settled.' };
  }
}

// Internal helper to bypass circular schema references
async function quoteSchemaUpdate(quoteId) {
  const Quote = require('../models/Quote');
  return Quote.findByIdAndUpdate(
    quoteId,
    { status: 'accepted', paymentStatus: 'paid' },
    { new: true }
  ).populate('vendor', 'name avatarUrl phone email');
}

module.exports = new RequirementService();
