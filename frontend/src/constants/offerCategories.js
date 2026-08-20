/**
 * Offer Categories — Frontend mirror of backend category registry.
 * Used by OfferFormModal, OffersTab, and config field components.
 */

export const OFFER_CATEGORIES = {
  discount: { key: 'discount', label: 'Discount', icon: '🏷️', group: 'Discounts', offerNames: ['Flat ₹ Discount', 'Percentage Discount', 'Up to Discount', 'Product Discount', 'Service Discount'] },
  buy_x_get_y: { key: 'buy_x_get_y', label: 'Buy X Get Y', icon: '🎁', group: 'Discounts', offerNames: ['Buy 1 Get 1', 'Buy 2 Get 1', 'Buy 3 Get 1', 'Buy X Get Y'] },
  free_product: { key: 'free_product', label: 'Free Product', icon: '🎀', group: 'Discounts', offerNames: ['Free Product', 'Free Sample', 'Free Gift'] },
  combo: { key: 'combo', label: 'Combo Offer', icon: '📦', group: 'Discounts', offerNames: ['Product Combo', 'Service Combo', 'Family Combo', 'Festival Combo', 'Custom Combo'] },
  coupon: { key: 'coupon', label: 'Coupon Code', icon: '🎟️', group: 'Discounts', offerNames: ['Coupon Code', 'Promotional Coupon', 'First Order Coupon', 'Festival Coupon'] },
  first_order: { key: 'first_order', label: 'First Order', icon: '🆕', group: 'Rewards & Loyalty', offerNames: ['First Order Discount', 'New Customer Offer', 'Welcome Offer'] },
  repeat_customer: { key: 'repeat_customer', label: 'Repeat Customer', icon: '🔄', group: 'Rewards & Loyalty', offerNames: ['Repeat Purchase', 'Returning Customer', 'Loyalty Offer'] },
  festival_seasonal: { key: 'festival_seasonal', label: 'Festival / Seasonal', icon: '🎊', group: 'Marketing & Campaigns', offerNames: ['Diwali', 'Holi', 'Independence Day', 'New Year', 'Seasonal Sale'] },
  flash_sale: { key: 'flash_sale', label: 'Flash Sale', icon: '⚡', group: 'Marketing & Campaigns', offerNames: ['Flash Sale', 'Limited Time Sale', 'Happy Hour'] },
  quantity_based: { key: 'quantity_based', label: 'Quantity Based', icon: '📊', group: 'Discounts', offerNames: ['Buy More Save More', 'Bulk Discount', 'Quantity Discount'] },
  free_delivery: { key: 'free_delivery', label: 'Free Delivery', icon: '🚚', group: 'Service & Package', offerNames: ['Free Delivery', 'Free Shipping', 'Free Home Delivery'] },
  service_offer: { key: 'service_offer', label: 'Service Offer', icon: '🛠️', group: 'Service & Package', offerNames: ['Service Discount', 'Service Package', 'Service Booking Offer', 'First Service Offer'] },
  package_offer: { key: 'package_offer', label: 'Package Offer', icon: '📋', group: 'Service & Package', offerNames: ['Service Package', 'Monthly Package', 'Annual Package', 'Membership Package'] },
  cashback: { key: 'cashback', label: 'Cashback', icon: '💸', group: 'Rewards & Loyalty', offerNames: ['Cashback', 'Wallet Cashback', 'Purchase Cashback'] },
  referral: { key: 'referral', label: 'Referral Offer', icon: '🤝', group: 'Rewards & Loyalty', offerNames: ['Refer & Earn', 'Refer a Friend', 'Customer Referral'] },
  customer_specific: { key: 'customer_specific', label: 'Customer Specific', icon: '👤', group: 'Marketing & Campaigns', offerNames: ['Selected Customer', 'VIP', 'Loyalty Customer Offer'] },
  location_based: { key: 'location_based', label: 'Location Based', icon: '📍', group: 'Marketing & Campaigns', offerNames: ['Nearby', 'Area', 'Local', 'City Offer'] },
  minimum_order: { key: 'minimum_order', label: 'Minimum Order', icon: '💰', group: 'Discounts', offerNames: ['₹500+ Offer', 'Spend & Save', 'Minimum Purchase Discount'] },
  special_price: { key: 'special_price', label: 'Special Price', icon: '⭐', group: 'Discounts', offerNames: ['Special Price', 'Member Price', 'Customer Price', 'Offer Price'] },
};

export const CATEGORY_KEYS = Object.keys(OFFER_CATEGORIES);

export const CATEGORY_GROUPS = [
  { key: 'Discounts', label: 'Discounts & Savings', icon: '💸' },
  { key: 'Rewards & Loyalty', label: 'Rewards & Loyalty', icon: '🏆' },
  { key: 'Service & Package', label: 'Service & Package', icon: '📦' },
  { key: 'Marketing & Campaigns', label: 'Marketing & Campaigns', icon: '📢' },
];

export function getCategoriesByGroup(groupKey) {
  return CATEGORY_KEYS.filter(k => OFFER_CATEGORIES[k].group === groupKey).map(k => OFFER_CATEGORIES[k]);
}
