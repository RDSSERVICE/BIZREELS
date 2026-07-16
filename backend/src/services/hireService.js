const hireRepository = require('../repositories/hireRepository');
const walletRepository = require('../repositories/walletRepository');
const Notification = require('../models/Notification');
const { emitToUser } = require('../sockets');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const User = require('../models/User');

/**
 * HireService
 * Manages creator job offers, escrow wallet holds, and final payouts.
 */
class HireService {
  async createRequest({ vendorId, creatorId, title, description, budget, deliveryDays }, req) {
    const creator = await User.findById(creatorId);
    if (!creator || !creator.roles.includes('creator')) {
      throw ApiError.badRequest('Target profile is not a registered creator.');
    }

    const vendor = await User.findById(vendorId);
    if (vendor.walletBalance < budget) {
      throw ApiError.badRequest('Insufficient wallet balance to propose campaign budget.');
    }

    const request = await hireRepository.createRequest({
      vendor: vendorId,
      creator: creatorId,
      title,
      description,
      budget: parseFloat(budget),
      deliveryDays: parseInt(deliveryDays, 10),
    });

    // Notify Creator
    const notifyRecord = await Notification.create({
      recipient: creatorId,
      sender: vendorId,
      type: 'hire',
      title: 'New Collaboration Proposed',
      message: `${vendor.vendorProfile?.businessName || vendor.name} has offered you ₹${budget} for campaign: "${title}"`,
      data: { hireRequestId: request._id },
    });
    emitToUser(creatorId.toString(), 'notification', notifyRecord);

    logger.info(`Hire request created: ${request._id}`, { service: 'hires' });
    return request;
  }

  async getCreatorRequests(creatorId) {
    return hireRepository.getRequestsForCreator(creatorId);
  }

  async getVendorRequests(vendorId) {
    return hireRepository.getRequestsForVendor(vendorId);
  }

  async updateRequestStatus(id, status, userId) {
    const request = await hireRepository.findRequestById(id);
    if (!request) {
      throw ApiError.notFound('Hire request not found.');
    }

    const isCreator = request.creator._id.toString() === userId.toString();
    const isVendor = request.vendor._id.toString() === userId.toString();

    if (status === 'accepted' || status === 'rejected') {
      if (!isCreator) throw ApiError.forbidden('Only the creator can accept or reject.');
      const updated = await hireRepository.updateRequestStatus(id, status);

      // Notify vendor
      const notifyRecord = await Notification.create({
        recipient: request.vendor._id,
        sender: userId,
        type: 'hire',
        title: `Collaboration proposal ${status}`,
        message: `Creator ${request.creator.name} has ${status} your hire request proposal: "${request.title}"`,
        data: { hireRequestId: id },
      });
      emitToUser(request.vendor._id.toString(), 'notification', notifyRecord);

      return updated;
    }

    if (status === 'completed') {
      if (!isVendor) throw ApiError.forbidden('Only the vendor can release budget on completion.');
      if (request.status !== 'accepted') {
        throw ApiError.badRequest('Request must be accepted first.');
      }

      // Execute Escrow-like payment release
      logger.info(`Releasing escrow payment ₹${request.budget} to Creator: ${request.creator._id}`, { service: 'wallet' });
      
      // Debit Vendor
      await walletRepository.updateWalletBalance(
        request.vendor._id,
        -request.budget,
        'payment',
        id,
        `Released payout to creator ${request.creator.name} for campaign "${request.title}"`
      );

      // Credit Creator
      await walletRepository.updateWalletBalance(
        request.creator._id,
        request.budget,
        'deposit',
        id,
        `Received payout for campaign "${request.title}"`
      );

      await hireRepository.setPaymentStatus(id, 'paid');
      const updated = await hireRepository.updateRequestStatus(id, 'completed');

      // Notify creator
      const notifyRecord = await Notification.create({
        recipient: request.creator._id,
        sender: userId,
        type: 'payment',
        title: 'Payout Released',
        message: `Vendor released campaign funds of ₹${request.budget} to your wallet balance for: "${request.title}"`,
        data: { hireRequestId: id },
      });
      emitToUser(request.creator._id.toString(), 'notification', notifyRecord);

      return updated;
    }

    throw ApiError.badRequest('Invalid status update request.');
  }
}

module.exports = new HireService();
