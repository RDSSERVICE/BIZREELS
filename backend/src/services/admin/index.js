const userService = require('./admin.user.service');
const customerService = require('./admin.customer.service');
const vendorService = require('./admin.vendor.service');
const creatorService = require('./admin.creator.service');
const listingService = require('./admin.listing.service');
const analyticsService = require('./admin.analytics.service');

module.exports = {
  // User Management
  listUsers: userService.listUsers,
  banUser: userService.banUser,
  unbanUser: userService.unbanUser,
  freezeWallet: userService.freezeWallet,
  unfreezeWallet: userService.unfreezeWallet,
  addRole: userService.addRole,
  removeRole: userService.removeRole,
  getUserDetail: userService.getUserDetail,
  updateUser: userService.updateUser,
  suspendUser: userService.suspendUser,
  activateUser: userService.activateUser,
  verifyUser: userService.verifyUser,
  resetUserPassword: userService.resetUserPassword,
  deleteUser: userService.deleteUser,
  getLoginHistory: userService.getLoginHistory,

  // Customer Domain
  listCustomers: customerService.listCustomers,
  getCustomerProfileDetails: customerService.getCustomerProfileDetails,
  getCustomerStats: customerService.getCustomerStats,
  deleteCustomer: customerService.deleteCustomer,

  // Vendor Domain
  listVendors: vendorService.listVendors,
  getVendorProfileDetails: vendorService.getVendorProfileDetails,
  getVendorStats: vendorService.getVendorStats,
  deleteVendor: vendorService.deleteVendor,

  // Creator Domain
  listCreators: creatorService.listCreators,
  getCreatorProfileDetails: creatorService.getCreatorProfileDetails,
  getCreatorStats: creatorService.getCreatorStats,
  deleteCreator: creatorService.deleteCreator,

  // Listing Moderation & Test Data
  listListings: listingService.listListingsAdmin,
  listListingsAdmin: listingService.listListingsAdmin,
  takedownListing: listingService.takedownListing,
  restoreListing: listingService.restoreListing,
  purgeTestData: listingService.purgeTestData,

  // Platform Analytics & Metrics
  analyticsOverview: analyticsService.analyticsOverview,
  clearOverviewCache: analyticsService.clearOverviewCache,
};
