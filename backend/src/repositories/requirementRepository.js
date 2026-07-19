const mongoose = require('mongoose');
const Requirement = require('../models/Requirement');
const Quote = require('../models/Quote');
const AuditLog = require('../models/AuditLog');

/**
 * RequirementRepository
 * Manages database states for custom customer requirements and corresponding vendor bids.
 */
class RequirementRepository {
  // ── Requirement operations ────────────────────────────────
  async createRequirement(data) {
    const custId = (data.customer || data.customer_id || '').toString();
    const docData = {
      customer_id: custId,
      customer: custId && mongoose.Types.ObjectId.isValid(custId) ? new mongoose.Types.ObjectId(custId) : null,
      title: data.title,
      description: data.description,
      category_id: data.category_id || data.category || 'General',
      category: data.category || data.category_id || 'General',
      requirementType: data.requirementType || data.type || 'product',
      type: data.requirementType || data.type || 'product',
      budget: data.budget || data.budget_max || 0,
      budget_max: data.budget || data.budget_max || 0,
      budget_min: data.budget_min || 0,
      deadline: data.deadline || null,
      location: data.location || { area: 'Local', city: 'Delhi', pincode: '110001' },
      status: 'open',
      is_active: true,
      is_deleted: false,
      isDeleted: false,
    };
    return Requirement.create(docData);
  }

  async findRequirementById(id) {
    return Requirement.findById(id).populate('customer', 'name avatarUrl phone email');
  }

  async updateRequirement(id, customerId, updateData) {
    return Requirement.findOneAndUpdate(
      { _id: id, $or: [{ customer_id: customerId.toString() }, { customer: customerId }] },
      updateData,
      { returnDocument: 'after' }
    );
  }

  async softDeleteRequirement(id, customerId) {
    return Requirement.findOneAndUpdate(
      { _id: id, $or: [{ customer_id: customerId.toString() }, { customer: customerId }] },
      { is_deleted: true, isDeleted: true, is_active: false },
      { returnDocument: 'after' }
    );
  }

  /**
   * Proximity query mapping customer requirements (leads) matching vendor service range.
   */
  async queryRequirements({
    customerId,
    category,
    requirementType,
    status,
    coordinates,
    distanceKm = 15,
    page = 1,
    limit = 10,
  }) {
    const skip = (page - 1) * limit;
    const match = { is_deleted: { $ne: true }, isDeleted: { $ne: true } };

    if (customerId) {
      const custStr = customerId.toString();
      const orConditions = [{ customer_id: custStr }];
      if (mongoose.Types.ObjectId.isValid(custStr)) {
        orConditions.push({ customer: new mongoose.Types.ObjectId(custStr) });
      }
      match.$or = orConditions;
    }
    if (category) match.$or = [{ category }, { category_id: category }];
    if (requirementType) match.$or = [{ requirementType }, { type: requirementType }];
    if (status) match.status = status;

    const pipeline = [];

    // GeoNear is active if querying leads for nearby vendors
    if (coordinates && coordinates.length === 2) {
      pipeline.push({
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])] },
          distanceField: 'distance',
          maxDistance: distanceKm * 1000,
          query: match,
          spherical: true,
        },
      });
    } else {
      pipeline.push({ $match: match });
      pipeline.push({ $sort: { _id: -1 } });
    }

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit, 10) });

    // Populate customer info
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'customer',
        foreignField: '_id',
        as: 'customerDetails',
      },
    });

    pipeline.push({ $unwind: '$customerDetails' });

    pipeline.push({
      $project: {
        title: 1,
        description: 1,
        category: 1,
        requirementType: 1,
        budget: 1,
        deadline: 1,
        location: 1,
        status: 1,
        quotesCount: 1,
        createdAt: 1,
        distance: 1,
        customer: {
          _id: '$customerDetails._id',
          name: '$customerDetails.name',
          avatarUrl: '$customerDetails.avatarUrl',
        },
      },
    });

    const requirements = await Requirement.aggregate(pipeline);
    const total = await Requirement.countDocuments(match);

    return { requirements, total };
  }

  // ── Quotations / Bids ─────────────────────────────────────
  async createQuote(quoteData) {
    const quote = await Quote.create(quoteData);
    // Increment quote count on requirement
    await Requirement.findByIdAndUpdate(quoteData.requirement, { $inc: { quotesCount: 1 } });
    return quote;
  }

  async findQuoteById(id) {
    return Quote.findById(id)
      .populate('requirement')
      .populate('vendor', 'name avatarUrl phone email vendorProfile');
  }

  async getQuotesForRequirement(requirementId) {
    return Quote.find({ requirement: requirementId })
      .populate('vendor', 'name avatarUrl vendorProfile')
      .sort({ price: 1 })
      .lean();
  }

  async getQuotesForVendor(vendorId) {
    return Quote.find({ vendor: vendorId })
      .populate('requirement')
      .sort({ createdAt: -1 })
      .lean();
  }

  async checkVendorHasQuoted(requirementId, vendorId) {
    const quote = await Quote.findOne({ requirement: requirementId, vendor: vendorId });
    return !!quote;
  }

  async updateQuoteStatus(quoteId, status) {
    return Quote.findByIdAndUpdate(quoteId, { status }, { new: true });
  }

  async setQuotePaymentStatus(quoteId, paymentStatus) {
    return Quote.findByIdAndUpdate(quoteId, { paymentStatus }, { new: true });
  }

  async logAudit({ userId, action, entityId, description, ip, agent }) {
    try {
      await AuditLog.create({
        userId,
        action,
        entity: 'Requirement',
        entityId,
        description,
        ipAddress: ip,
        userAgent: agent,
      });
    } catch (e) {}
  }
}

module.exports = new RequirementRepository();
