export interface CartItem {
  listing_id: string;
  quantity: number;
  variant_selection?: Record<string, string> | null;
  title: string;
  slug?: string;
  price: number;
  line_total: number;
  image?: string | null;
}

export interface VendorCartGroup {
  vendor_id: string;
  vendor?: {
    id: string;
    name: string;
    profile_pic?: string | null;
  };
  items: CartItem[];
  subtotal: number;
}

export interface CartResponse {
  id: string;
  items: Array<{
    listing_id: string;
    quantity: number;
    variant_selection?: Record<string, string> | null;
    added_at?: string;
  }>;
  groups: VendorCartGroup[];
  total_items: number;
  total_amount: number;
}

export interface AddToCartPayload {
  listing_id: string;
  quantity?: number;
  variant_selection?: Record<string, string>;
}
