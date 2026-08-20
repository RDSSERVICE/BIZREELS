import React from 'react';
import DiscountConfigFields from './DiscountConfigFields';
import BuyXGetYConfigFields from './BuyXGetYConfigFields';
import FreeProductConfigFields from './FreeProductConfigFields';
import ComboConfigFields from './ComboConfigFields';
import CouponConfigFields from './CouponConfigFields';
import FirstOrderConfigFields from './FirstOrderConfigFields';
import RepeatCustomerConfigFields from './RepeatCustomerConfigFields';
import FestivalSeasonalConfigFields from './FestivalSeasonalConfigFields';
import FlashSaleConfigFields from './FlashSaleConfigFields';
import QuantityBasedConfigFields from './QuantityBasedConfigFields';
import FreeDeliveryConfigFields from './FreeDeliveryConfigFields';
import ServiceOfferConfigFields from './ServiceOfferConfigFields';
import PackageOfferConfigFields from './PackageOfferConfigFields';
import CashbackConfigFields from './CashbackConfigFields';
import ReferralConfigFields from './ReferralConfigFields';
import CustomerSpecificConfigFields from './CustomerSpecificConfigFields';
import LocationBasedConfigFields from './LocationBasedConfigFields';
import MinimumOrderConfigFields from './MinimumOrderConfigFields';
import SpecialPriceConfigFields from './SpecialPriceConfigFields';

const CONFIG_COMPONENTS = {
  discount: DiscountConfigFields,
  buy_x_get_y: BuyXGetYConfigFields,
  free_product: FreeProductConfigFields,
  combo: ComboConfigFields,
  coupon: CouponConfigFields,
  first_order: FirstOrderConfigFields,
  repeat_customer: RepeatCustomerConfigFields,
  festival_seasonal: FestivalSeasonalConfigFields,
  flash_sale: FlashSaleConfigFields,
  quantity_based: QuantityBasedConfigFields,
  free_delivery: FreeDeliveryConfigFields,
  service_offer: ServiceOfferConfigFields,
  package_offer: PackageOfferConfigFields,
  cashback: CashbackConfigFields,
  referral: ReferralConfigFields,
  customer_specific: CustomerSpecificConfigFields,
  location_based: LocationBasedConfigFields,
  minimum_order: MinimumOrderConfigFields,
  special_price: SpecialPriceConfigFields,
};

export default function CategoryConfigFields({ category, config = {}, updateConfig }) {
  const Component = CONFIG_COMPONENTS[category];
  if (!Component) {
    return (
      <div className="p-3 bg-surface border border-border rounded-xl text-xs text-text-secondary">
        No extra configuration fields for this category.
      </div>
    );
  }
  return <Component config={config} updateConfig={updateConfig} />;
}
