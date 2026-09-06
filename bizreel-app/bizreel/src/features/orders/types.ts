export type PaymentMethod = 'wallet' | 'cod' | 'vendor_upi' | 'razorpay';

export interface CreateOrderPayload {
  listingId: string;
  quantity: number;
  address: string;
  pincode?: string;
  paymentMethod?: PaymentMethod;
  bookingDate?: string;
  bookingTime?: string;
  scheduledVisitTime?: string;
  bookingNotes?: string;
}

export interface OrderItem {
  _id: string;
  title: string;
  price: number;
  quantity: number;
  images?: Array<{ url: string }>;
  type?: 'product' | 'service';
}

export interface Order {
  _id: string;
  id?: string;
  customer?: {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  };
  vendor?: {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    businessName?: string;
    avatarUrl?: string;
  };
  listing?: {
    _id?: string;
    id?: string;
    title?: string;
    images?: Array<{ url: string }>;
    type?: string;
    postType?: string;
    category?: string;
    price?: number;
    salePrice?: number;
    sellingPrice?: number;
  };
  itemSnapshot?: {
    title?: string;
    listingType?: string;
    price?: number;
  };
  quantity?: number;
  price?: number;
  status: string;
  paymentStatus?: string;
  paymentMethod?: PaymentMethod | string;
  address?: string;
  pincode?: string;
  bookingDate?: string;
  bookingTime?: string;
  scheduledVisitTime?: string;
  trackingNumber?: string;
  shippingDetails?: {
    courierName?: string;
    trackingNumber?: string;
  };
  refundAmount?: number;
  refundPercentage?: number;
  cancellationReason?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}
