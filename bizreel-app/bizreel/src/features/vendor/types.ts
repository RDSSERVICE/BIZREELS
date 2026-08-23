export interface VendorSettings {
  category: string;
  subcategory: string;
  categories: string[];
  subCategories: string[];
  isTemporaryClosed: boolean;
  closeScheduleReason?: string;
  businessName: string;
  shopName: string;
  address: string;
  autoResponseNote?: string;
  notificationsEnabled: boolean;
  mobileNumber: string;
  whatsappNumber?: string;
  email?: string;
}

export interface VerificationStatus {
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  contactVerified: boolean;
  documentVerified: boolean;
  paymentVerified: boolean;
  panVerified?: boolean;
  gstinVerified?: boolean;
  bankVerified?: boolean;
  stepsCompleted?: number;
  totalSteps?: number;
}
