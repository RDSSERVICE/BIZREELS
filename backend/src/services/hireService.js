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

    const numBudget = parseFloat(budget);
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.walletBalance < numBudget) {
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

    // Calculate Platform Commission & Net Creator Amount
    const commissionService = require('./commission.service');
    let platformFeeRate = 0.05;
    try {
      platformFeeRate = await commissionService.resolveRate(category);
    } catch {
      platformFeeRate = 0.05;
    }
    const platformFee = Math.round(numBudget * platformFeeRate * 100) / 100;
    const netCreatorAmount = Math.round((numBudget - platformFee) * 100) / 100;

    // True Escrow Hold: debit vendor wallet immediately with role isolation
    await walletRepository.updateWalletBalance(
      vendorId,
      -numBudget,
      'payment',
      `escrow_hold_${Date.now()}`,
      `Escrow hold for campaign proposal: "${title}"`,
      null,
      { targetRole: 'vendor' }
    );

    // Create HireRequest (Legacy compatibility)
    const request = await hireRepository.createRequest({
      vendor: vendorId,
      creator: creatorId,
      title,
      description,
      budget: numBudget,
      deliveryDays: parseInt(deliveryDays, 10),
      status: 'pending',
      escrowStatus: 'held',
      platformFeeRate,
      platformFee,
      netCreatorAmount,
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
      deliverables: (deliverables || []).map((d, index) => ({
        id: `m_${Date.now()}_${index}`,
        _id: `m_${Date.now()}_${index}`,
        title: typeof d === 'string' ? d : d.title,
        status: 'pending',
        submissionUrl: null,
        submittedAt: null
      })),
      numReels: parseInt(numReels, 10) || 0,
      numPosts: parseInt(numPosts, 10) || 0,
      budget: numBudget,
      escrowStatus: 'held',
      platformFeeRate,
      platformFee,
      netCreatorAmount,
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
      message: `${vendor.vendorProfile?.businessName || vendor.name || 'Vendor'} has offered you ₹${numBudget} (Net: ₹${netCreatorAmount}) for campaign: "${title}"`,
      data: { hireRequestId: request._id, campaignId: campaign._id },
    });
    emitToUser(creatorId.toString(), 'notification', notifyRecord);
    emitToUser(creatorId.toString(), 'hire_request:created', { hireRequestId: request._id, campaignId: campaign._id });

    logger.info(`Hire request & Campaign created with Escrow held: ${request._id} / ${campaign._id} (₹${numBudget})`, { service: 'hires' });
    return campaign;
  }

  async _releaseEscrowPayout(campaign, request) {
    if (!campaign || !request) return;
    if (request.escrowStatus === 'released' && request.status === 'completed') return;

    const budget = request.budget || campaign.budget || 0;
    const rate = request.platformFeeRate || campaign.platformFeeRate || 0.05;
    const fee = request.platformFee !== undefined ? request.platformFee : (campaign.platformFee !== undefined ? campaign.platformFee : Math.round(budget * rate * 100) / 100);
    const netAmount = request.netCreatorAmount !== undefined ? request.netCreatorAmount : (campaign.netCreatorAmount !== undefined ? campaign.netCreatorAmount : Math.round((budget - fee) * 100) / 100);

    // If this was a legacy campaign created before escrow holding ('not_held'), debit the vendor now
    if (request.escrowStatus === 'not_held') {
      try {
        await walletRepository.updateWalletBalance(
          request.vendor._id || request.vendor,
          -budget,
          'payment',
          `legacy_payout_${request._id}`,
          `Released payout to creator for campaign "${request.title}"`,
          null,
          { targetRole: 'vendor' }
        );
      } catch (err) {
        logger.warn(`Legacy vendor debit failed during escrow release: ${err.message}`, { service: 'hires' });
      }
    }

    // Credit Creator Isolated Wallet with net payout
    await walletRepository.updateWalletBalance(
      request.creator._id || request.creator,
      netAmount,
      'deposit',
      `escrow_release_${campaign._id}`,
      `Received net payout (₹${netAmount}, platform fee: ₹${fee}) for campaign "${request.title || campaign.title}"`,
      null,
      { targetRole: 'creator' }
    );

    // Record Platform Commission
    try {
      const Commission = require('../models/CommissionConfig.model').Commission || require('mongoose').model('Commission');
      await Commission.create({
        deal_id: campaign._id.toString(),
        vendor_id: (request.vendor._id || request.vendor).toString(),
        buyer_id: (request.creator._id || request.creator).toString(),
        listing_id: null,
        category_id: campaign.category || 'General',
        deal_amount_inr: budget,
        amount_paise: Math.round(fee * 100),
        rate: rate * 100,
        status: 'accrued',
      });
    } catch (commErr) {
      logger.error('Failed to record platform commission on escrow release:', commErr);
    }

    request.escrowStatus = 'released';
    request.paymentStatus = 'paid';
    request.status = 'completed';
    await request.save();

    campaign.escrowStatus = 'released';
    campaign.status = 'completed';
    campaign.progress = 100;
    await campaign.save();

    logger.info(`Escrow released: Net ₹${netAmount} to Creator, Fee ₹${fee} to Platform for Campaign ${campaign._id}`, { service: 'hires' });
  }

  async _refundEscrow(campaign, request, reason = 'cancelled') {
    if (!request) return;
    if (request.escrowStatus === 'held') {
      const budget = request.budget || campaign?.budget || 0;
      await walletRepository.updateWalletBalance(
        request.vendor._id || request.vendor,
        budget,
        'refund',
        `escrow_refund_${request._id}_${Date.now()}`,
        `Escrow refund for ${reason} campaign proposal: "${request.title}"`,
        null,
        { targetRole: 'vendor' }
      );
      request.escrowStatus = 'refunded';
      await request.save();
      if (campaign) {
        campaign.escrowStatus = 'refunded';
        await campaign.save();
      }
      logger.info(`Escrow refunded: ₹${budget} back to Vendor (${reason}) for Request ${request._id}`, { service: 'hires' });
    }
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

    const campaign = await Campaign.findOne({ hireRequest: id });

    // Handle budget adjustment in escrow
    if (data.budget !== undefined && parseFloat(data.budget) !== request.budget) {
      const newBudget = parseFloat(data.budget);
      const budgetDiff = newBudget - request.budget;
      if (budgetDiff > 0) {
        const vendor = await User.findById(userId);
        if (!vendor || vendor.walletBalance < budgetDiff) {
          throw ApiError.badRequest('Insufficient wallet balance to increase campaign budget.');
        }
        await walletRepository.updateWalletBalance(
          userId,
          -budgetDiff,
          'payment',
          `escrow_adjust_${Date.now()}`,
          `Escrow hold adjustment for campaign proposal: "${request.title}"`,
          null,
          { targetRole: 'vendor' }
        );
      } else if (budgetDiff < 0) {
        await walletRepository.updateWalletBalance(
          userId,
          Math.abs(budgetDiff),
          'refund',
          `escrow_refund_${Date.now()}`,
          `Escrow hold adjustment refund for campaign proposal: "${request.title}"`,
          null,
          { targetRole: 'vendor' }
        );
      }
      request.budget = newBudget;
      const rate = request.platformFeeRate || 0.05;
      request.platformFee = Math.round(newBudget * rate * 100) / 100;
      request.netCreatorAmount = Math.round((newBudget - request.platformFee) * 100) / 100;
      if (campaign) {
        campaign.budget = newBudget;
        campaign.platformFeeRate = rate;
        campaign.platformFee = request.platformFee;
        campaign.netCreatorAmount = request.netCreatorAmount;
      }
    }

    // Update HireRequest
    request.title = data.title || request.title;
    request.description = data.description || request.description;
    request.deliveryDays = parseInt(data.deliveryDays, 10) || request.deliveryDays;
    await request.save();

    // Update Campaign
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
      if (data.deliverables !== undefined) {
        campaign.deliverables = (data.deliverables || []).map((d, index) => {
          if (d && typeof d === 'object' && d.title) {
            return {
              id: d.id || d._id?.toString() || `m_${Date.now()}_${index}`,
              _id: d._id?.toString() || d.id || `m_${Date.now()}_${index}`,
              title: d.title,
              status: d.status || 'pending',
              submissionUrl: d.submissionUrl || null,
              submittedAt: d.submittedAt || null
            };
          }
          return {
            id: `m_${Date.now()}_${index}`,
            _id: `m_${Date.now()}_${index}`,
            title: d,
            status: 'pending',
            submissionUrl: null,
            submittedAt: null
          };
        });
      }
      if (data.numReels !== undefined) campaign.numReels = parseInt(data.numReels, 10);
      if (data.numPosts !== undefined) campaign.numPosts = parseInt(data.numPosts, 10);
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

    const campaign = await Campaign.findOne({ hireRequest: id });

    // Refund escrow if held
    await this._refundEscrow(campaign, request, 'cancelled');

    const updatedRequest = await hireRepository.updateRequestStatus(id, 'cancelled');
    if (campaign) {
      campaign.status = 'cancelled';
      await campaign.save();
    }

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

      const campaign = await Campaign.findOne({ hireRequest: id });

      if (status === 'rejected') {
        // Refund escrow back to vendor
        await this._refundEscrow(campaign, request, 'rejected');
      }

      const updated = await hireRepository.updateRequestStatus(id, status);

      // Update Campaign
      if (campaign) {
        campaign.status = status;
        await campaign.save();
      }

      // Notify vendor
      const notifyRecord = await Notification.create({
        recipient: request.vendor._id,
        sender: userId,
        type: 'hire',
        title: `Collaboration proposal ${status}`,
        message: status === 'rejected'
          ? `Creator ${request.creator.name || 'Creator'} has rejected your proposal: "${request.title}". Held escrow funds have been refunded to your wallet.`
          : `Creator ${request.creator.name || 'Creator'} has accepted your proposal: "${request.title}"`,
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

      const campaign = await Campaign.findOne({ hireRequest: id });
      await this._releaseEscrowPayout(campaign, request);

      const netAmount = request.netCreatorAmount || request.budget;

      // Notify creator
      const notifyRecord = await Notification.create({
        recipient: request.creator._id,
        sender: userId,
        type: 'payment',
        title: 'Payout Released',
        message: `Vendor released campaign funds of ₹${netAmount} to your wallet balance for: "${request.title}"`,
        data: { hireRequestId: id, campaignId: campaign?._id },
      });
      emitToUser(request.creator._id.toString(), 'notification', notifyRecord);
      emitToUser(request.creator._id.toString(), 'hire_request:status_changed', { hireRequestId: id, status: 'completed' });

      return campaign;
    }

    throw ApiError.badRequest('Invalid status update request.');
  }

  async submitDeliverable(campaignId, fileUrl, type = 'reel', caption = '', userId, milestoneId = null) {
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

    // If milestoneId is provided, mark that specific deliverable milestone as submitted!
    if (milestoneId && campaign.deliverables && campaign.deliverables.length > 0) {
      campaign.deliverables = campaign.deliverables.map((d, index) => {
        const idStr = d._id?.toString() || d.id || String(index);
        if (idStr === milestoneId.toString()) {
          return {
            ...d,
            status: 'submitted',
            submissionUrl: fileUrl,
            submittedAt: new Date()
          };
        }
        return d;
      });
      campaign.markModified('deliverables');
    }

    // Recalculate progress based on deliverables status
    if (campaign.deliverables && campaign.deliverables.length > 0) {
      const totalCount = campaign.deliverables.length;
      const doneCount = campaign.deliverables.filter(d => d.status === 'submitted' || d.status === 'approved').length;
      campaign.progress = Math.min(95, Math.round((doneCount / totalCount) * 100));
    } else {
      const totalExpected = (campaign.numReels || 0) + (campaign.numPosts || 0) || 1;
      const submittedCount = campaign.submissionUrls.length;
      campaign.progress = Math.min(95, Math.round((submittedCount / totalExpected) * 100));
    }

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

  async approveMilestone(campaignId, milestoneId, userId) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw ApiError.notFound('Campaign not found.');
    }
    if (campaign.vendor.toString() !== userId.toString()) {
      throw ApiError.forbidden('Only the campaign owner can approve milestones.');
    }

    let updated = false;
    campaign.deliverables = (campaign.deliverables || []).map((d, index) => {
      const idStr = d._id?.toString() || d.id || String(index);
      if (idStr === milestoneId.toString()) {
        updated = true;
        return {
          ...d,
          status: 'approved'
        };
      }
      return d;
    });

    if (!updated) {
      throw ApiError.notFound('Milestone not found in this campaign.');
    }

    campaign.markModified('deliverables');

    // Recalculate progress
    const totalCount = campaign.deliverables.length;
    const approvedCount = campaign.deliverables.filter(d => d.status === 'approved').length;
    campaign.progress = Math.round((approvedCount / totalCount) * 100);

    // If progress is 100%, transition the campaign to completed and release escrow!
    if (campaign.progress === 100) {
      const request = await require('../models/HireRequest').findById(campaign.hireRequest);
      if (request) {
        await this._releaseEscrowPayout(campaign, request);
      } else {
        campaign.status = 'completed';
        await campaign.save();
      }
    } else {
      await campaign.save();
    }

    // Notify creator
    const notifyRecord = await Notification.create({
      recipient: campaign.creator,
      sender: userId,
      type: 'campaign',
      title: campaign.progress === 100 ? 'Campaign Completed & Payout Released' : 'Milestone Approved by Vendor',
      message: campaign.progress === 100
        ? `Campaign "${campaign.title}" has been completed and ₹${campaign.netCreatorAmount || campaign.budget} payout released to your wallet.`
        : `Milestone has been approved for campaign: "${campaign.title}"`,
      data: { campaignId },
    });
    emitToUser(campaign.creator.toString(), 'notification', notifyRecord);
    emitToUser(campaign.creator.toString(), 'campaign:updated', { campaignId });

    return campaign;
  }
}

module.exports = new HireService();
