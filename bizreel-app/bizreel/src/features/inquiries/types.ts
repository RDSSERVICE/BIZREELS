export interface Inquiry {
  _id: string;
  id?: string;
  vendor: {
    _id: string;
    name: string;
    avatarUrl?: string;
    vendorProfile?: {
      businessName?: string;
      shopName?: string;
    };
  };
  customer: {
    _id: string;
    name: string;
  };
  listing?: {
    _id: string;
    title: string;
    images?: string[];
    price?: number;
  };
  subject?: string;
  message: string;
  status: 'pending' | 'replied' | 'closed';
  replies?: Array<{
    sender: 'customer' | 'vendor';
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export interface CreateInquiryInput {
  vendor_id?: string;
  vendorId?: string;
  listing_id?: string;
  listingId?: string;
  subject?: string;
  message: string;
}

export interface ReplyInquiryInput {
  inquiry_id: string;
  message: string;
}
