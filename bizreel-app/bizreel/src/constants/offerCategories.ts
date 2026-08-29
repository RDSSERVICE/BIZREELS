/**
 * Offer Categories — Mobile mirror of web frontend & backend offer registry.
 * Defines 19 dynamic offer types across 4 groups.
 */

export interface OfferCategoryMeta {
  key: string;
  label: string;
  icon: string;
  group: 'Discounts' | 'Rewards & Loyalty' | 'Service & Package' | 'Marketing & Campaigns';
  offerNames: string[];
  description: string;
}

export const OFFER_CATEGORIES: Record<string, OfferCategoryMeta> = {
  discount: {
    key: 'discount',
    label: 'Discount',
    icon: '🏷️',
    group: 'Discounts',
    offerNames: ['Flat ₹ Discount', 'Percentage Discount', 'Up to Discount', 'Product Discount', 'Service Discount'],
    description: 'Flat ₹ or % discount off product/service price.',
  },
  buy_x_get_y: {
    key: 'buy_x_get_y',
    label: 'Buy X Get Y',
    icon: '🎁',
    group: 'Discounts',
    offerNames: ['Buy 1 Get 1 (BOGO)', 'Buy 2 Get 1', 'Buy 3 Get 1', 'Buy X Get Y Free'],
    description: 'Buy X items and get Y items free or discounted.',
  },
  free_product: {
    key: 'free_product',
    label: 'Free Product',
    icon: '🎀',
    group: 'Discounts',
    offerNames: ['Free Gift with Purchase', 'Free Sample Gift', 'Free Bonus Item'],
    description: 'Complimentary free product gift on orders.',
  },
  combo: {
    key: 'combo',
    label: 'Combo Bundle',
    icon: '📦',
    group: 'Discounts',
    offerNames: ['Product Combo', 'Service Combo', 'Family Pack', 'Festival Bundle'],
    description: 'Special discounted price for combined product bundles.',
  },
  coupon: {
    key: 'coupon',
    label: 'Coupon Code',
    icon: '🎟️',
    group: 'Discounts',
    offerNames: ['Promo Coupon Code', 'Exclusive Voucher', 'First Order Coupon'],
    description: 'Custom promo code entered at checkout.',
  },
  first_order: {
    key: 'first_order',
    label: 'First Order',
    icon: '🆕',
    group: 'Rewards & Loyalty',
    offerNames: ['First Order Discount', 'New Customer Offer', 'Welcome Deal'],
    description: 'Exclusive discount for first-time buyers.',
  },
  repeat_customer: {
    key: 'repeat_customer',
    label: 'Repeat Customer',
    icon: '🔄',
    group: 'Rewards & Loyalty',
    offerNames: ['Repeat Order Special', 'Returning Customer Deal', 'Loyalty Perk'],
    description: 'Reward repeat customers for frequent shopping.',
  },
  festival_seasonal: {
    key: 'festival_seasonal',
    label: 'Festival / Seasonal',
    icon: '🎊',
    group: 'Marketing & Campaigns',
    offerNames: ['Diwali Special', 'Holi Festival Deal', 'New Year Sale', 'Seasonal Clearance'],
    description: 'Special festive sales & seasonal promotions.',
  },
  flash_sale: {
    key: 'flash_sale',
    label: 'Flash Sale',
    icon: '⚡',
    group: 'Marketing & Campaigns',
    offerNames: ['Flash Deal 24H', 'Limited Time Price Drop', 'Happy Hour Sale'],
    description: 'Time-bounded urgent flash price drops.',
  },
  quantity_based: {
    key: 'quantity_based',
    label: 'Quantity Based',
    icon: '📊',
    group: 'Discounts',
    offerNames: ['Buy More Save More', 'Bulk Order Discount', 'Tiered Quantity Deal'],
    description: 'Higher discounts for buying higher quantities.',
  },
  free_delivery: {
    key: 'free_delivery',
    label: 'Free Delivery',
    icon: '🚚',
    group: 'Service & Package',
    offerNames: ['Free Home Delivery', 'Free Express Shipping', 'Zero Delivery Fee'],
    description: 'Waive delivery & shipping fees on eligible orders.',
  },
  service_offer: {
    key: 'service_offer',
    label: 'Service Discount',
    icon: '🛠️',
    group: 'Service & Package',
    offerNames: ['Service Hour Discount', 'First Service Deal', 'Service Booking Off'],
    description: 'Discounted service hourly or booking fees.',
  },
  package_offer: {
    key: 'package_offer',
    label: 'Package Offer',
    icon: '📋',
    group: 'Service & Package',
    offerNames: ['Monthly Membership', 'Service Package Deal', 'Annual Pass'],
    description: 'Bundled recurring membership & package deals.',
  },
  cashback: {
    key: 'cashback',
    label: 'Cashback',
    icon: '💸',
    group: 'Rewards & Loyalty',
    offerNames: ['Wallet Cashback', 'Instant Cashback Credit', 'Purchase Cashback'],
    description: 'Earn back store wallet credit on purchases.',
  },
  referral: {
    key: 'referral',
    label: 'Referral Offer',
    icon: '🤝',
    group: 'Rewards & Loyalty',
    offerNames: ['Refer & Earn', 'Invite a Friend Bonus', 'Friend Referral Deal'],
    description: 'Reward customers who refer new buyers.',
  },
  customer_specific: {
    key: 'customer_specific',
    label: 'Customer Specific',
    icon: '👤',
    group: 'Marketing & Campaigns',
    offerNames: ['VIP Club Offer', 'Selected User Deal', 'Private Promo'],
    description: 'Targeted exclusive deals for selected customer tiers.',
  },
  location_based: {
    key: 'location_based',
    label: 'Location Based',
    icon: '📍',
    group: 'Marketing & Campaigns',
    offerNames: ['Nearby City Special', 'Local Store Deal', 'Area Customer Offer'],
    description: 'Deals tailored to customer geographic location.',
  },
  minimum_order: {
    key: 'minimum_order',
    label: 'Minimum Order',
    icon: '💰',
    group: 'Discounts',
    offerNames: ['Spend & Save ₹500+', 'Minimum Cart Purchase Deal', 'Tiered Cart Saver'],
    description: 'Discount unlocks when cart reaches min order value.',
  },
  special_price: {
    key: 'special_price',
    label: 'Special Price',
    icon: '⭐',
    group: 'Discounts',
    offerNames: ['Member Price', 'Special Offer Price', 'Exclusive Deal Price'],
    description: 'Special fixed promotional price point.',
  },
};

export const CATEGORY_KEYS = Object.keys(OFFER_CATEGORIES);

export const CATEGORY_GROUPS = [
  { key: 'ALL', label: 'All Offers', icon: '✨' },
  { key: 'Discounts', label: 'Discounts', icon: '💸' },
  { key: 'Rewards & Loyalty', label: 'Rewards', icon: '🏆' },
  { key: 'Service & Package', label: 'Services', icon: '📦' },
  { key: 'Marketing & Campaigns', label: 'Campaigns', icon: '📢' },
];

export function getCategoriesByGroup(groupKey: string): OfferCategoryMeta[] {
  if (groupKey === 'ALL') return CATEGORY_KEYS.map((k) => OFFER_CATEGORIES[k]);
  return CATEGORY_KEYS.filter((k) => OFFER_CATEGORIES[k].group === groupKey).map((k) => OFFER_CATEGORIES[k]);
}
