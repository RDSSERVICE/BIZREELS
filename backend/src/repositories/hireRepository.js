const HireRequest = require('../models/HireRequest');

/**
 * HireRepository
 * Access layer for Vendor-Creator hire contracts.
 */
class HireRepository {
  async createRequest(data) {
    return HireRequest.create(data);
  }

  async findRequestById(id) {
    return HireRequest.findById(id)
      .populate('vendor', 'name avatarUrl vendorProfile')
      .populate('creator', 'name avatarUrl creatorProfile');
  }

  async getRequestsForCreator(creatorId) {
    return HireRequest.find({ creator: creatorId })
      .populate('vendor', 'name avatarUrl vendorProfile')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getRequestsForVendor(vendorId) {
    return HireRequest.find({ vendor: vendorId })
      .populate('creator', 'name avatarUrl creatorProfile')
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateRequestStatus(id, status) {
    return HireRequest.findByIdAndUpdate(id, { status }, { new: true });
  }

  async setPaymentStatus(id, paymentStatus) {
    return HireRequest.findByIdAndUpdate(id, { paymentStatus }, { new: true });
  }
}

module.exports = new HireRepository();
