const requirementRepository = require('../repositories/requirementRepository');
const walletRepository = require('../repositories/walletRepository');
const Notification = require('../models/Notification');
const Requirement = require('../models/Requirement');
const { emitToUser } = require('../sockets');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * RequirementService
 * Manages customer requirements, lead query logic, bid calculations, and wallet settlements.
 */
class RequirementService {
  async createRequirement(
    { customerId, title, description, category, subcategory, requirementType, budget, quantity, deadline, lat, lng, address, city, state, pincode },
    req
  ) {
    const location = {
      type: 'Point',
      coordinates: [0, 0],
      area: address || 'Local',
      city: city || 'Delhi',
      state: state || '',
      pincode: pincode || '110001',
    };
    if (lat && lng) {
      location.coordinates = [parseFloat(lng), parseFloat(lat)];
    }

    const requirement = await requirementRepository.createRequirement({
      customer: customerId,
      title,
      description,
      category,
      subcategory,
      requirementType: requirementType || 'product',
      budget: parseFloat(budget),
      quantity: parseInt(quantity || 1, 10),
      deadline: deadline ? new Date(deadline) : null,
      location,
    });

    // ── Auto Identify Matching Vendors ──
    const User = require('../models/User');
    const notificationService = require('./notification.service');
    const { emitToUser, emitToAdmin } = require('../sockets');

    // Query active and approved vendors
    const vendors = await User.find({
      roles: 'vendor',
      is_active: true,
      is_banned: { $ne: true },
      $or: [
        { kyc_status: 'approved' },
        { 'vendorProfile.verificationStatus': { $in: ['verified_vendor', 'premium_verified', 'approved'] } }
      ]
    });

    const reqCategoryNormalized = (category || '').toLowerCase().trim();
    const reqSubcategoryNormalized = (subcategory || '').toLowerCase().trim();
    const reqCity = (city || location.city || '').toLowerCase().trim();
    const reqState = (state || location.state || '').toLowerCase().trim();
    const reqArea = (address || location.area || '').toLowerCase().trim();

    const matchedVendorIds = [];

    for (const vendor of vendors) {
      // 1. Primary Business Category Check
      const vCategory = (vendor.vendorProfile?.category || '').toLowerCase().trim();
      const vCategory2 = (vendor.vendorProfile?.businessCategory || '').toLowerCase().trim();
      const categoryMatches = (
        vCategory.includes(reqCategoryNormalized) || 
        reqCategoryNormalized.includes(vCategory && vCategory.length > 2 ? vCategory : 'xyz_no_match') ||
        vCategory2.includes(reqCategoryNormalized) || 
        reqCategoryNormalized.includes(vCategory2 && vCategory2.length > 2 ? vCategory2 : 'xyz_no_match')
      );
      
      if (!categoryMatches) continue;

      // 2. Subcategory Check (optional, only check if both have specified)
      const vSubcategory = (vendor.vendorProfile?.subcategory || vendor.vendorProfile?.subCategory || '').toLowerCase().trim();
      if (reqSubcategoryNormalized && vSubcategory) {
        const subcategoryMatches = (
          vSubcategory.includes(reqSubcategoryNormalized) ||
          reqSubcategoryNormalized.includes(vSubcategory && vSubcategory.length > 2 ? vSubcategory : 'xyz_no_match')
        );
        if (!subcategoryMatches) continue;
      }

      // 3. Location Check (City, State, Area)
      const vCity = (vendor.location?.city || vendor.vendorProfile?.location?.city || vendor.vendorProfile?.city || '').toLowerCase().trim();
      const vState = (vendor.location?.state || vendor.vendorProfile?.location?.state || vendor.vendorProfile?.state || '').toLowerCase().trim();
      const vAddress = (vendor.location?.address || vendor.vendorProfile?.location?.address || '').toLowerCase().trim();
      const vServiceArea = (vendor.vendorProfile?.serviceArea || vendor.vendorProfile?.serviceAreas || '').toLowerCase().trim();
      
      let locationMatches = true;
      if (reqCity || reqState || reqArea) {
        locationMatches = (
          (reqCity && (vCity.includes(reqCity) || reqCity.includes(vCity && vCity.length > 2 ? vCity : 'xyz_no_match') || vServiceArea.includes(reqCity) || vAddress.includes(reqCity))) ||
          (reqState && (vState.includes(reqState) || reqState.includes(vState && vState.length > 2 ? vState : 'xyz_no_match') || vServiceArea.includes(reqState) || vAddress.includes(reqState))) ||
          (reqArea && (vServiceArea.includes(reqArea) || vAddress.includes(reqArea) || vCity.includes(reqArea)))
        );
      }

      if (!locationMatches) continue;

      matchedVendorIds.push(vendor._id);
    }

    requirement.assignedVendorIds = matchedVendorIds;
    requirement.totalVendorsMatched = matchedVendorIds.length;
    requirement.totalVendorsNotified = matchedVendorIds.length;
    requirement.status = matchedVendorIds.length > 0 ? 'Sent to Vendors' : 'Pending';
    await requirement.save();

    // Send notifications to all matched vendors
    for (const vendorId of matchedVendorIds) {
      const notifyTitle = 'New Customer Requirement';
      const notifyBody = `Need ${quantity || 1} ${requirement.title} (Budget: ₹${requirement.budget || 0}) in ${city || location.city}`;
      await notificationService.create(
        vendorId,
        'requirement',
        notifyTitle,
        notifyBody,
        { requirementId: requirement._id }
      );

      // Emit Socket.IO events to matched vendor
      emitToUser(vendorId.toString(), 'requirement:assigned', requirement);
      emitToUser(vendorId.toString(), 'vendor_notification:sent', {
        requirementId: requirement._id,
        title: notifyTitle,
        body: notifyBody,
        budget: requirement.budget,
        location: city || location.city
      });
    }

    // Emit socket event to buyer & admin
    emitToUser(customerId.toString(), 'requirement:created', requirement);
    emitToAdmin('requirement:created', requirement);

    await requirementRepository.logAudit({
      userId: customerId,
      action: 'REQUIREMENT_CREATE',
      entityId: requirement._id,
      description: `Posted requirement: ${title}`,
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
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
        city: updateData.city || requirement.location?.city || '',
        state: updateData.state || requirement.location?.state || '',
        pincode: updateData.pincode || requirement.location?.pincode || '',
      };
    } else if (updateData.city || updateData.state || updateData.address || updateData.pincode) {
      updateData.location = {
        type: 'Point',
        coordinates: requirement.location?.coordinates || [0, 0],
        address: updateData.address || requirement.location?.address || '',
        city: updateData.city || requirement.location?.city || '',
        state: updateData.state || requirement.location?.state || '',
        pincode: updateData.pincode || requirement.location?.pincode || '',
      };
    }

    if (updateData.status === 'Closed') {
      updateData.closedAt = new Date();
    }

    const updated = await requirementRepository.updateRequirement(id, customerId, updateData);

    const { emitToUser, emitToAdmin } = require('../sockets');
    emitToUser(customerId.toString(), 'requirement:updated', updated);
    emitToAdmin('requirement:updated', updated);
    if (updated.assignedVendorIds && updated.assignedVendorIds.length > 0) {
      for (const vId of updated.assignedVendorIds) {
        emitToUser(vId.toString(), 'requirement:updated', updated);
      }
    }

    if (updated.status === 'Closed') {
      emitToUser(customerId.toString(), 'requirement:closed', updated);
      emitToAdmin('requirement:closed', updated);
      if (updated.assignedVendorIds && updated.assignedVendorIds.length > 0) {
        for (const vId of updated.assignedVendorIds) {
          emitToUser(vId.toString(), 'requirement:closed', updated);
        }
      }
    }

    await requirementRepository.logAudit({
      userId: customerId,
      action: 'REQUIREMENT_UPDATE',
      entityId: id,
      description: `Updated requirement: ${updated.title}`,
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
    });

    return updated;
  }

  async deleteRequirement(id, customerId, req) {
    const Requirement = require('../models/Requirement');
    const requirement = await Requirement.findOneAndUpdate(
      { _id: id, customer: customerId },
      { is_deleted: true, isDeleted: true, is_active: false, status: 'Cancelled' },
      { returnDocument: 'after' }
    );
    if (!requirement) {
      throw ApiError.forbidden('Requirement not found or unauthorized.');
    }

    const { emitToUser, emitToAdmin } = require('../sockets');
    emitToUser(customerId.toString(), 'requirement:deleted', { id });
    emitToAdmin('requirement:deleted', { id });
    if (requirement.assignedVendorIds && requirement.assignedVendorIds.length > 0) {
      for (const vId of requirement.assignedVendorIds) {
        emitToUser(vId.toString(), 'requirement:deleted', { id });
      }
    }

    await requirementRepository.logAudit({
      userId: customerId,
      action: 'REQUIREMENT_DELETE',
      entityId: id,
      description: `Soft deleted requirement: ${requirement.title}`,
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
    });

    return { message: 'Requirement deleted successfully.' };
  }

  async queryRequirements({ customerId, vendorId, category, requirementType, status, lat, lng, distance, search, sortBy, page, limit }) {
    const coordinates = lat && lng ? [parseFloat(lng), parseFloat(lat)] : null;
    return requirementRepository.queryRequirements({
      customerId,
      vendorId,
      category,
      requirementType,
      status,
      coordinates,
      distanceKm: distance ? parseFloat(distance) : undefined,
      search,
      sortBy,
      page: parseInt(page || 1, 10),
      limit: parseInt(limit || 10, 10),
    });
  }

  async getRequirementDetails(id, userId = null, role = null) {
    const requirement = await requirementRepository.findRequirementById(id);
    if (!requirement) {
      throw ApiError.notFound('Requirement not found.');
    }

    if (role === 'vendor' && userId) {
      const Requirement = require('../models/Requirement');
      const hasViewed = requirement.vendorsViewed && requirement.vendorsViewed.some(
        v => v.toString() === userId.toString()
      );
      if (!hasViewed) {
        const updated = await Requirement.findByIdAndUpdate(
          id,
          {
            $addToSet: { vendorsViewed: userId },
            $inc: { views_count: 1 }
          },
          { new: true }
        );
        
        const { emitToUser } = require('../sockets');
        emitToUser(requirement.customer._id.toString(), 'requirement:viewed', {
          requirementId: id,
          vendorId: userId,
          viewsCount: updated.views_count,
          vendorsViewedCount: updated.vendorsViewed.length
        });

        const populated = await requirementRepository.findRequirementById(id);
        return populated;
      }
    }

    return requirement;
  }

  async createQuote({ requirementId, vendorId, price, notes, estimatedDelivery, attachments = [] }, req) {
    const requirement = await requirementRepository.findRequirementById(requirementId);
    if (!requirement) {
      throw ApiError.notFound('Requirement not found.');
    }

    if (requirement.status === 'Closed' || requirement.status === 'Cancelled' || requirement.status === 'Expired') {
      throw ApiError.badRequest('This requirement is no longer open for bidding.');
    }

    const alreadyQuoted = await requirementRepository.checkVendorHasQuoted(requirementId, vendorId);
    if (alreadyQuoted) {
      throw ApiError.badRequest('You have already submitted a quotation for this requirement.');
    }

    const Quote = require('../models/Quote');
    const quote = await Quote.create({
      requirement: requirementId,
      vendor: vendorId,
      price: parseFloat(price),
      notes,
      estimatedDelivery: new Date(estimatedDelivery),
      attachments: attachments || [],
    });

    const Requirement = require('../models/Requirement');
    const updatedReq = await Requirement.findByIdAndUpdate(
      requirementId,
      {
        $addToSet: { vendorsResponded: vendorId },
        $inc: { quotesCount: 1, proposals_count: 1 },
        status: 'Vendors Responded'
      },
      { new: true }
    );

    await requirementRepository.logAudit({
      userId: vendorId,
      action: 'QUOTE_CREATE',
      entityId: quote._id,
      description: `Submitted bid of ₹${price} on requirement "${requirement.title}"`,
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
    });

    const notificationService = require('./notification.service');
    const notifyBuyer = await notificationService.create(
      requirement.customer._id,
      'quote',
      'New Proposal Received',
      `A vendor has submitted a quote of ₹${price} for your requirement: "${requirement.title}"`,
      { requirementId: requirement._id, quoteId: quote._id }
    );

    const { emitToUser, emitToAdmin } = require('../sockets');
    emitToUser(requirement.customer._id.toString(), 'proposal:submitted', { requirementId, quote });
    emitToAdmin('proposal:submitted', { requirementId, quote });
    emitToUser(vendorId.toString(), 'proposal:submitted', { requirementId, quote });
    emitToUser(requirement.customer._id.toString(), 'requirement:updated', updatedReq);
    emitToAdmin('requirement:updated', updatedReq);
    if (updatedReq.assignedVendorIds && updatedReq.assignedVendorIds.length > 0) {
      for (const vId of updatedReq.assignedVendorIds) {
        emitToUser(vId.toString(), 'requirement:updated', updatedReq);
      }
    }

    return quote;
  }

  async getQuotesForRequirement(requirementId, userId) {
    const requirement = await requirementRepository.findRequirementById(requirementId);
    if (!requirement) {
      throw ApiError.notFound('Requirement not found.');
    }

    const isCustomer = requirement.customer._id.toString() === userId.toString();
    const quotes = await requirementRepository.getQuotesForRequirement(requirementId);

    if (isCustomer) {
      return quotes;
    }

    return quotes.filter(q => q.vendor._id.toString() === userId.toString());
  }

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

    if (requirement.status === 'Closed' || requirement.status === 'Cancelled' || requirement.status === 'Expired') {
      throw ApiError.badRequest('Requirement is already completed or closed.');
    }

    const Quote = require('../models/Quote');
    const updateData = { status };
    if (status === 'accepted') {
      updateData.paymentStatus = 'paid';
    }
    const updatedQuote = await Quote.findByIdAndUpdate(
      quoteId,
      updateData,
      { new: true }
    ).populate('vendor', 'name avatarUrl phone email vendorProfile');

    const Requirement = require('../models/Requirement');
    let reqStatus = 'Vendors Responded';
    let updateFields = {};

    if (status === 'accepted') {
      reqStatus = 'Closed';
      updateFields = {
        status: reqStatus,
        acceptedProposalId: quoteId,
        closedAt: new Date()
      };
    } else {
      reqStatus = 'Vendors Responded';
      updateFields = {
        status: reqStatus
      };
    }

    const updatedReq = await Requirement.findByIdAndUpdate(
      requirement._id,
      updateFields,
      { new: true }
    );

    if (status === 'accepted') {
      logger.info(`Settling payment of ₹${quote.price} from customer: ${customerId} to vendor: ${quote.vendor._id}`, { service: 'wallet' });
      try {
        await walletRepository.updateWalletBalance(
          customerId,
          -quote.price,
          'payment',
          quoteId,
          `Paid quote acceptance for requirement: "${requirement.title}"`
        );

        await walletRepository.updateWalletBalance(
          quote.vendor._id,
          quote.price,
          'deposit',
          quoteId,
          `Received payment for quote acceptance: "${requirement.title}"`
        );
      } catch (err) {
        logger.error('Wallet payment settlement failed:', err.message);
      }
    }

    await requirementRepository.logAudit({
      userId: customerId,
      action: 'QUOTE_ACCEPT',
      entityId: quoteId,
      description: `Accepted quote from vendor ${quote.vendor.name} for ₹${quote.price}`,
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
    });

    const notificationService = require('./notification.service');
    const notifyVendor = await notificationService.create(
      quote.vendor._id,
      'payment',
      `Proposal ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
      `Your proposal of ₹${quote.price} for requirement "${requirement.title}" has been ${status}.`,
      { requirementId: requirement._id, quoteId }
    );

    const { emitToUser, emitToAdmin } = require('../sockets');
    emitToUser(quote.vendor._id.toString(), `proposal:${status}`, { requirementId: requirement._id, quote: updatedQuote });
    emitToUser(customerId.toString(), `proposal:${status}`, { requirementId: requirement._id, quote: updatedQuote });
    emitToAdmin(`proposal:${status}`, { requirementId: requirement._id, quote: updatedQuote });
    emitToUser(customerId.toString(), 'requirement:updated', updatedReq);
    emitToAdmin('requirement:updated', updatedReq);
    if (updatedReq.assignedVendorIds && updatedReq.assignedVendorIds.length > 0) {
      for (const vId of updatedReq.assignedVendorIds) {
        emitToUser(vId.toString(), 'requirement:updated', updatedReq);
      }
    }

    if (status === 'accepted') {
      emitToUser(customerId.toString(), 'requirement:closed', updatedReq);
      emitToAdmin('requirement:closed', updatedReq);
      if (updatedReq.assignedVendorIds && updatedReq.assignedVendorIds.length > 0) {
        for (const vId of updatedReq.assignedVendorIds) {
          emitToUser(vId.toString(), 'requirement:closed', updatedReq);
        }
      }
    }

    return { quote: updatedQuote, message: `Proposal ${status} successfully.` };
  }

  async postRequirement(reqData, req) {
    return this.createRequirement(reqData, req || { headers: {} });
  }

  async getRequirement(id) {
    return this.getRequirementDetails(id);
  }

  async myRequirements(customerId) {
    const res = await this.queryRequirements({ customerId, page: 1, limit: 100 });
    return res.requirements || res.data || [];
  }

  async searchRequirements(params = {}) {
    return this.queryRequirements(params);
  }

  async submitProposal(proposalData, req) {
    return this.createQuote(proposalData, req || { headers: {} });
  }

  async listProposals(requirementId, userId) {
    return this.getQuotesForRequirement(requirementId, userId);
  }

  async acceptProposal(quoteId, customerId, req) {
    return this.updateQuoteStatus(quoteId, 'accepted', customerId, req || { headers: {} });
  }
}

async function quoteSchemaUpdate(quoteId) {
  const Quote = require('../models/Quote');
  return Quote.findByIdAndUpdate(
    quoteId,
    { status: 'accepted', paymentStatus: 'paid' },
    { returnDocument: 'after' }
  ).populate('vendor', 'name avatarUrl phone email');
}

module.exports = new RequirementService();
