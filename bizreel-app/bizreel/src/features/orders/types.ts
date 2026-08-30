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
  customer: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  };
  vendor: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    businessName?: string;
    avatarUrl?: string;
  };
  listing: {
    _id: string;
    title: string;
    images?: Array<{ url: string }>;
    type?: string;
    category?: string;
    price: number;
    salePrice?: number;
    sellingPrice?: number;
  };
  quantity: number;
  price: number;
  status: 'pending' | 'active' | 'accepted' | 'completed' | 'delivered' | 'cancelled' | 'rejected';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  paymentMethod: PaymentMethod;
  address: string;
  bookingDate?: string;
  bookingTime?: string;
  scheduledVisitTime?: string;
  refundAmount?: number;
  refundPercentage?: number;
  cancellationReason?: string;
  createdAt: string;
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
