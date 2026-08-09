const hireRepository = require('../repositories/hireRepository');
const walletRepository = require('../repositories/walletRepository');
const Notification = require('../models/Notification');
const { emitToUser } = require('../sockets');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const User = require('../models/User');
const Campaign = require('../models/Campaign');

/**
 * HireService
 * Manages creator job offers, escrow wallet holds, and final payouts.
 */
class HireService {
  async createRequest(data, req) {
    const {
      vendorId,
      creatorId,
      title,
      description,
      budget,
      deliveryDays,
      productService = '',
      category = 'General',
      deliverables = [],
      numReels = 0,
      numPosts = 0,
      startDate = null,
      endDate = null,
      deadline = null,
      attachments = [],
      specialInstructions = '',
    } = data;

    const creator = await User.findById(creatorId);
    if (!creator || !creator.roles.includes('creator')) {
      throw ApiError.badRequest('Target profile is not a registered creator.');
    }

    const vendor = await User.findById(vendorId);
    if (vendor.walletBalance < budget) {
      throw ApiError.badRequest('Insufficient wallet balance to propose campaign budget.');
    }

    // Business logic: validate dates
    if (startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      if (start < today) {
        throw ApiError.badRequest('Start date cannot be in the past.');
      }
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        throw ApiError.badRequest('End date must be after the start date.');
      }
    }
    if (startDate && deadline) {
      const start = new Date(startDate);
      const dead = new Date(deadline);
      if (dead <= start) {
        throw ApiError.badRequest('Final deadline must be after the start date.');
      }
    }

    // Create HireRequest (Legacy compatibility)
    const request = await hireRepository.createRequest({
      vendor: vendorId,
      creator: creatorId,
      title,
      description,
      budget: parseFloat(budget),
      deliveryDays: parseInt(deliveryDays, 10),
      status: 'pending',
    });

    // Create Campaign Record
    const campaign = await Campaign.create({
      vendor: vendorId,
      creator: creatorId,
      hireRequest: request._id,
      title,
      description,
      productService,
      category,
      deliverables,
      numReels: parseInt(numReels, 10) || 0,
      numPosts: parseInt(numPosts, 10) || 0,
      budget: parseFloat(budget),
      startDate,
      endDate,
      deadline,
      attachments,
      specialInstructions,
      status: 'pending',
      progress: 0,
    });

    // Notify Creator
    const notifyRecord = await Notification.create({
      recipient: creatorId,
      sender: vendorId,
      type: 'hire',
      title: 'New Collaboration Proposed',
      message: `${vendor.vendorProfile?.businessName || vendor.name || 'Vendor'} has offered you ₹${budget} for campaign: "${title}"`,
      data: { hireRequestId: request._id, campaignId: campaign._id },
    });
    emitToUser(creatorId.toString(), 'notification', notifyRecord);
    emitToUser(creatorId.toString(), 'hire_request:created', { hireRequestId: request._id, campaignId: campaign._id });

    logger.info(`Hire request and Campaign created: ${request._id} / ${campaign._id}`, { service: 'hires' });
    return campaign;
  }

  async editRequest(id, data, userId) {
    const request = await hireRepository.findRequestById(id);
    if (!request) {
      throw ApiError.notFound('Hire request not found.');
    }
    if (request.vendor._id.toString() !== userId.toString()) {
      throw ApiError.forbidden('Only the vendor who proposed this campaign can edit it.');
    }
    if (request.status !== 'pending') {
      throw ApiError.badRequest('Only pending requests can be modified.');
    }

    // Update HireRequest
    request.title = data.title || request.title;
    request.description = data.description || request.description;
    request.budget = parseFloat(data.budget) || request.budget;
    request.deliveryDays = parseInt(data.deliveryDays, 10) || request.deliveryDays;
    await request.save();

    // Update Campaign
    const campaign = await Campaign.findOne({ hireRequest: id });
    if (campaign) {
      // Validate updated dates
      const reqStartDate = data.startDate !== undefined ? data.startDate : campaign.startDate;
      const reqEndDate = data.endDate !== undefined ? data.endDate : campaign.endDate;
      const reqDeadline = data.deadline !== undefined ? data.deadline : campaign.deadline;

      if (reqStartDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(reqStartDate);
        if (start < today) {
          throw ApiError.badRequest('Start date cannot be in the past.');
        }
      }
      if (reqStartDate && reqEndDate) {
        const start = new Date(reqStartDate);
        const end = new Date(reqEndDate);
        if (end <= start) {
          throw ApiError.badRequest('End date must be after the start date.');
        }
      }
      if (reqStartDate && reqDeadline) {
        const start = new Date(reqStartDate);
        const dead = new Date(reqDeadline);
        if (dead <= start) {
          throw ApiError.badRequest('Final deadline must be after the start date.');
        }
      }

      campaign.title = data.title || campaign.title;
      campaign.description = data.description || campaign.description;
      if (data.productService !== undefined) campaign.productService = data.productService;
      if (data.category !== undefined) campaign.category = data.category;
      if (data.deliverables !== undefined) campaign.deliverables = data.deliverables;
      if (data.numReels !== undefined) campaign.numReels = parseInt(data.numReels, 10);
      if (data.numPosts !== undefined) campaign.numPosts = parseInt(data.numPosts, 10);
      campaign.budget = parseFloat(data.budget) || campaign.budget;
      if (data.startDate !== undefined) campaign.startDate = data.startDate;
      if (data.endDate !== undefined) campaign.endDate = data.endDate;
      if (data.deadline !== undefined) campaign.deadline = data.deadline;
      if (data.attachments !== undefined) campaign.attachments = data.attachments;
      if (data.specialInstructions !== undefined) campaign.specialInstructions = data.specialInstructions;
      await campaign.save();
    }

    // Notify Creator
    const notifyRecord = await Notification.create({
      recipient: request.creator._id,
      sender: userId,
      type: 'hire',
      title: 'Collaboration Proposal Edited',
      message: `Vendor edited details for proposal: "${request.title}"`,
      data: { hireRequestId: id, campaignId: campaign?._id },
    });
    emitToUser(request.creator._id.toString(), 'notification', notifyRecord);
    emitToUser(request.creator._id.toString(), 'hire_request:updated', { hireRequestId: id });

    return campaign;
  }

  async getCreatorRequests(creatorId) {
    // Populate campaign details
    return Campaign.find({ creator: creatorId })
      .populate('vendor', 'name profile_pic avatarUrl vendorProfile email phone')
      .populate('creator', 'name profile_pic avatarUrl creatorProfile email phone')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getVendorRequests(vendorId) {
    // Populate campaign details
    return Campaign.find({ vendor: vendorId })
      .populate('vendor', 'name profile_pic avatarUrl vendorProfile email phone')
      .populate('creator', 'name profile_pic avatarUrl creatorProfile email phone')
      .sort({ createdAt: -1 })
      .lean();
  }

  async cancelRequest(id, userId) {
    const request = await hireRepository.findRequestById(id);
    if (!request) {
      throw ApiError.notFound('Hire request not found.');
    }
    if (request.vendor._id.toString() !== userId.toString()) {
      throw ApiError.forbidden('Only the vendor can cancel this request.');
    }
    if (request.status !== 'pending') {
      throw ApiError.badRequest('Only pending requests can be cancelled.');
    }

    const updatedRequest = await hireRepository.updateRequestStatus(id, 'cancelled');
    const campaign = await Campaign.findOneAndUpdate(
      { hireRequest: id },
      { status: 'cancelled' },
      { returnDocument: 'after' }
    );

    // Notify creator
    const notifyRecord = await Notification.create({
      recipient: request.creator._id,
      sender: userId,
      type: 'hire',
      title: 'Collaboration Proposal Cancelled',
      message: `Vendor cancelled the campaign proposal: "${request.title}"`,
      data: { hireRequestId: id },
    });
    emitToUser(request.creator._id.toString(), 'notification', notifyRecord);
    emitToUser(request.creator._id.toString(), 'hire_request:status_changed', { hireRequestId: id, status: 'cancelled' });

    return campaign;
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

      // Update Campaign
      const campaign = await Campaign.findOneAndUpdate(
        { hireRequest: id },
        { status },
        { returnDocument: 'after' }
      );

      // Notify vendor
      const notifyRecord = await Notification.create({
        recipient: request.vendor._id,
        sender: userId,
        type: 'hire',
        title: `Collaboration proposal ${status}`,
        message: `Creator ${request.creator.name || 'Creator'} has ${status} your hire request proposal: "${request.title}"`,
        data: { hireRequestId: id, campaignId: campaign?._id },
      });
      emitToUser(request.vendor._id.toString(), 'notification', notifyRecord);
      emitToUser(request.vendor._id.toString(), 'hire_request:status_changed', { hireRequestId: id, status });

      // Automatically enable chat between Vendor and Creator
      if (status === 'accepted') {
        try {
          const chatRepository = require('../repositories/chatRepository');
          const conversation = await chatRepository.findOrCreateConversation(request.vendor._id, request.creator._id);
          // Send system greeting message in chat
          await chatRepository.addMessage(
            conversation._id,
            request.creator._id,
            `🟢 Creator accepted the campaign proposal. Chat is now active! Campaign: "${request.title}"`,
            null
          );
          // Emit message alert to vendor
          emitToUser(request.vendor._id.toString(), 'message_alert', {
            conversationId: conversation._id,
            message: { text: 'Chat active!' }
          });
        } catch (chatErr) {
          logger.error('Failed to automatically create chat conversation thread:', chatErr);
        }
      }

      return campaign;
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
        `Released payout to creator ${request.creator.name || 'Creator'} for campaign "${request.title}"`
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

      // Update Campaign
      const campaign = await Campaign.findOneAndUpdate(
        { hireRequest: id },
        { status: 'completed', progress: 100 },
        { returnDocument: 'after' }
      );

      // Notify creator
      const notifyRecord = await Notification.create({
        recipient: request.creator._id,
        sender: userId,
        type: 'payment',
        title: 'Payout Released',
        message: `Vendor released campaign funds of ₹${request.budget} to your wallet balance for: "${request.title}"`,
        data: { hireRequestId: id, campaignId: campaign?._id },
      });
      emitToUser(request.creator._id.toString(), 'notification', notifyRecord);
      emitToUser(request.creator._id.toString(), 'hire_request:status_changed', { hireRequestId: id, status: 'completed' });

      return campaign;
    }

    throw ApiError.badRequest('Invalid status update request.');
  }

  async submitDeliverable(campaignId, fileUrl, type = 'reel', caption = '', userId) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw ApiError.notFound('Campaign not found.');
    }
    if (campaign.creator.toString() !== userId.toString()) {
      throw ApiError.forbidden('Only the assigned creator can submit deliverables.');
    }
    if (campaign.status !== 'accepted') {
      throw ApiError.badRequest('Deliverables can only be submitted for active campaigns.');
    }

    campaign.submissionUrls.push({
      url: fileUrl,
      type,
      caption,
      uploadedAt: new Date(),
    });

    // Update progress based on submissions compared to expected deliverables
    const totalExpected = (campaign.numReels || 0) + (campaign.numPosts || 0) || 1;
    const submittedCount = campaign.submissionUrls.length;
    campaign.progress = Math.min(95, Math.round((submittedCount / totalExpected) * 100)); // cap at 95 until vendor marks completed
    await campaign.save();

    // Notify vendor
    const notifyRecord = await Notification.create({
      recipient: campaign.vendor,
      sender: userId,
      type: 'campaign',
      title: 'New Campaign Deliverable Submitted',
      message: `Creator has uploaded a ${type} for campaign: "${campaign.title}"`,
      data: { campaignId },
    });
    emitToUser(campaign.vendor.toString(), 'notification', notifyRecord);
    emitToUser(campaign.vendor.toString(), 'campaign:updated', { campaignId });

    return campaign;
  }
}

module.exports = new HireService();
