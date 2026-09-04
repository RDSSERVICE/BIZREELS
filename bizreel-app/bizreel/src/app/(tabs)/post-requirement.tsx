import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/utils/image';

type SubTab = 'create' | 'my-requirements' | 'quotes';

interface SubCategoryItem {
  _id?: string;
  id?: string;
  name: string;
}

interface CategoryItem {
  _id?: string;
  id?: string;
  name: string;
  icon_url?: string | null;
  category_type?: string;
  parent_id?: string | null;
  children?: any[];
  subcategories?: SubCategoryItem[];
  items?: SubCategoryItem[];
}

const DEFAULT_PRODUCT_CATEGORIES: CategoryItem[] = [
  {
    _id: 'cat_prod_1',
    name: 'Electronics',
    category_type: 'product',
    subcategories: [
      { _id: 'sub_1_1', name: 'Mobile' },
      { _id: 'sub_1_2', name: 'Laptop & Computers' },
      { _id: 'sub_1_3', name: 'TV & Audio' },
      { _id: 'sub_1_4', name: 'Home Appliances' },
      { _id: 'sub_1_5', name: 'Cameras & Accessories' },
    ],
  },
  {
    _id: 'cat_prod_2',
    name: 'Fashion & Apparel',
    category_type: 'product',
    subcategories: [
      { _id: 'sub_2_1', name: 'Men Clothing' },
      { _id: 'sub_2_2', name: 'Women Clothing' },
      { _id: 'sub_2_3', name: 'Kids Wear' },
      { _id: 'sub_2_4', name: 'Footwear' },
      { _id: 'sub_2_5', name: 'Jewelry & Watches' },
    ],
  },
  {
    _id: 'cat_prod_3',
    name: 'Home & Furniture',
    category_type: 'product',
    subcategories: [
      { _id: 'sub_3_1', name: 'Living Room Furniture' },
      { _id: 'sub_3_2', name: 'Bedroom Furniture' },
      { _id: 'sub_3_3', name: 'Kitchen & Dining' },
      { _id: 'sub_3_4', name: 'Home Decor' },
      { _id: 'sub_3_5', name: 'Bedding & Furnishings' },
    ],
  },
  {
    _id: 'cat_prod_4',
    name: 'Vehicles & Automotive',
    category_type: 'product',
    subcategories: [
      { _id: 'sub_4_1', name: 'Cars' },
      { _id: 'sub_4_2', name: 'Bikes & Scooters' },
      { _id: 'sub_4_3', name: 'Commercial Vehicles' },
      { _id: 'sub_4_4', name: 'Auto Parts & Accessories' },
    ],
  },
  {
    _id: 'cat_prod_5',
    name: 'Food & Grocery',
    category_type: 'product',
    subcategories: [
      { _id: 'sub_5_1', name: 'Fresh Fruits & Vegetables' },
      { _id: 'sub_5_2', name: 'Staples & Spices' },
      { _id: 'sub_5_3', name: 'Dairy & Bakery' },
      { _id: 'sub_5_4', name: 'Beverages & Snacks' },
      { _id: 'sub_5_5', name: 'Packaged Foods' },
    ],
  },
  {
    _id: 'cat_prod_6',
    name: 'Industrial & Machinery',
    category_type: 'product',
    subcategories: [
      { _id: 'sub_6_1', name: 'Industrial Tools' },
      { _id: 'sub_6_2', name: 'Heavy Machinery' },
      { _id: 'sub_6_3', name: 'Electrical & Automation' },
      { _id: 'sub_6_4', name: 'Safety Equipment' },
      { _id: 'sub_6_5', name: 'Packaging Materials' },
    ],
  },
  {
    _id: 'cat_prod_7',
    name: 'Health & Personal Care',
    category_type: 'product',
    subcategories: [
      { _id: 'sub_7_1', name: 'Medicines & Wellness' },
      { _id: 'sub_7_2', name: 'Medical Devices' },
      { _id: 'sub_7_3', name: 'Fitness Supplements' },
      { _id: 'sub_7_4', name: 'Personal Hygiene' },
    ],
  },
];

const DEFAULT_SERVICE_CATEGORIES: CategoryItem[] = [
  {
    _id: 'cat_serv_1',
    name: 'Repair & Maintenance',
    category_type: 'service',
    subcategories: [
      { _id: 'sub_s1_1', name: 'AC & Appliance Repair' },
      { _id: 'sub_s1_2', name: 'Plumbing Services' },
      { _id: 'sub_s1_3', name: 'Electrical Repair' },
      { _id: 'sub_s1_4', name: 'Carpentry & Woodwork' },
      { _id: 'sub_s1_5', name: 'Painting & Waterproofing' },
      { _id: 'sub_s1_6', name: 'House Cleaning & Pest Control' },
    ],
  },
  {
    _id: 'cat_serv_2',
    name: 'Real Estate & Housing',
    category_type: 'service',
    subcategories: [
      { _id: 'sub_s2_1', name: 'Property for Rent' },
      { _id: 'sub_s2_2', name: 'Property for Sale' },
      { _id: 'sub_s2_3', name: 'PG & Shared Hostels' },
      { _id: 'sub_s2_4', name: 'Commercial Spaces' },
    ],
  },
  {
    _id: 'cat_serv_3',
    name: 'Beauty & Salon Services',
    category_type: 'service',
    subcategories: [
      { _id: 'sub_s3_1', name: 'Men Salon & Grooming' },
      { _id: 'sub_s3_2', name: 'Women Beauty & Makeup' },
      { _id: 'sub_s3_3', name: 'Bridal Packages' },
      { _id: 'sub_s3_4', name: 'Spa & Wellness' },
    ],
  },
  {
    _id: 'cat_serv_4',
    name: 'Event & Wedding Services',
    category_type: 'service',
    subcategories: [
      { _id: 'sub_s4_1', name: 'Catering & Food Counter' },
      { _id: 'sub_s4_2', name: 'Event Photography & Videography' },
      { _id: 'sub_s4_3', name: 'Decoration & Stage Setup' },
      { _id: 'sub_s4_4', name: 'DJ & Sound System' },
    ],
  },
  {
    _id: 'cat_serv_ai',
    name: 'AI & Technology Services',
    category_type: 'service',
    subcategories: [
      { _id: 'sub_ai_1', name: 'AI Video Generation & Editing' },
      { _id: 'sub_ai_2', name: 'AI Content Writing & Copywriting' },
      { _id: 'sub_ai_3', name: 'AI Graphic Design & Logos' },
      { _id: 'sub_ai_4', name: 'AI Chatbot & Automation Setup' },
      { _id: 'sub_ai_5', name: 'AI Voiceover & Audio Synthesis' },
      { _id: 'sub_ai_6', name: 'AI Prompt Engineering & Consulting' },
    ],
  },
  {
    _id: 'cat_serv_5',
    name: 'IT, Design & Marketing',
    category_type: 'service',
    subcategories: [
      { _id: 'sub_s5_1', name: 'Website & App Development' },
      { _id: 'sub_s5_2', name: 'Graphic & Logo Design' },
      { _id: 'sub_s5_3', name: 'Social Media & Digital Marketing' },
      { _id: 'sub_s5_4', name: 'Reels & Video Content Shoot' },
    ],
  },
  {
    _id: 'cat_serv_6',
    name: 'Education & Tutors',
    category_type: 'service',
    subcategories: [
      { _id: 'sub_s6_1', name: 'School & College Tuitions' },
      { _id: 'sub_s6_2', name: 'Competitive Exam Coaching' },
      { _id: 'sub_s6_3', name: 'Language & Communication' },
      { _id: 'sub_s6_4', name: 'Music, Dance & Arts' },
    ],
  },
  {
    _id: 'cat_serv_7',
    name: 'Logistics & Transport',
    category_type: 'service',
    subcategories: [
      { _id: 'sub_s7_1', name: 'Packers & Movers' },
      { _id: 'sub_s7_2', name: 'Local Goods Transport' },
      { _id: 'sub_s7_3', name: 'Courier & Freight' },
      { _id: 'sub_s7_4', name: 'Taxi & Vehicle Rental' },
    ],
  },
];

interface RequirementItem {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  detailedSpecifications?: string;
  category?: string;
  subcategory?: string;
  type?: string;
  requirementType?: string;
  productCondition?: string;
  customProductCondition?: string;
  serviceModel?: string;
  customServiceModel?: string;
  budget?: number;
  budget_min?: number;
  budget_max?: number;
  quantity?: number;
  urgency?: string;
  status?: string;
  approvalStatus?: string;
  adminRejectionReason?: string;
  created_at?: string;
  createdAt?: string;
  quotesCount?: number;
  proposals_count?: number;
  views_count?: number;
  totalVendorsMatched?: number;
  totalVendorsNotified?: number;
  address?: string;
  expectedDeliveryDate?: string;
  expectedDeliveryTime?: string;
  otherConditions?: string;
  photos?: string[];
  video?: string;
  location?: { city?: string; area?: string; pincode?: string; state?: string };
}

interface QuoteItem {
  _id: string;
  id?: string;
  requirement?: { _id?: string; id?: string; title?: string };
  vendor?: {
    _id?: string;
    id?: string;
    name?: string;
    avatarUrl?: string;
    profile_pic?: string;
    businessName?: string;
    shopName?: string;
    rating_avg?: number;
    phone?: string;
    vendorProfile?: { shopName?: string; businessName?: string; rating?: number };
  };
  amount?: number;
  price?: number;
  message?: string;
  notes?: string;
  status?: string;
  estimatedDelivery?: string;
  created_at?: string;
  createdAt?: string;
  attachments?: any[];
}

const PRODUCT_CONDITIONS = [
  { id: 'new', label: 'Brand New' },
  { id: 'used', label: 'Used / Pre-owned' },
  { id: 'refurbished', label: 'Refurbished' },
  { id: 'other', label: 'Other' },
];

const SERVICE_MODELS = [
  { id: 'onsite', label: 'Onsite / At Location' },
  { id: 'remote', label: 'Remote / Online' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'other', label: 'Other' },
];

const RADIUS_OPTIONS = [
  { label: '5 km', value: '5' },
  { label: '10 km', value: '10' },
  { label: '25 km', value: '25' },
  { label: 'City Wide', value: '50' },
  { label: 'Pan India', value: '0' },
];

export default function CustomerPostRequirementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, status: authStatus } = useAuth();
  const [activeTab, setActiveTab] = useState<SubTab>('create');

  // Categories list
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Form State
  const [reqType, setReqType] = useState<'product' | 'service'>('product');
  const [title, setTitle] = useState('');

  // Dropdown States
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubCategoryItem | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [customSubcategory, setCustomSubcategory] = useState('');

  // Dropdown Modal Visibility
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');

  // Product / Service condition
  const [productCondition, setProductCondition] = useState<'new' | 'used' | 'refurbished' | 'other'>('new');
  const [serviceModel, setServiceModel] = useState<'onsite' | 'remote' | 'hybrid' | 'other'>('onsite');

  // Pricing & Quantity
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isNegotiable, setIsNegotiable] = useState(true);

  // Location & Pincode Auto Fetching
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [area, setArea] = useState('');
  const [fetchedAreas, setFetchedAreas] = useState<string[]>([]);
  const [fetchingPincode, setFetchingPincode] = useState(false);
  const [pincodeMessage, setPincodeMessage] = useState<string | null>(null);
  const [targetDistance, setTargetDistance] = useState('50');

  // Timeline & Specs
  const [urgency, setUrgency] = useState<'urgent' | '1week' | 'flexible'>('flexible');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [description, setDescription] = useState('');
  const [otherConditions, setOtherConditions] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [generatingAiSpecs, setGeneratingAiSpecs] = useState(false);

  function safeTruncateText(str: string, maxLen: number): string {
    if (!str) return '';
    const trimmed = str.trim();
    if (trimmed.length <= maxLen) return trimmed;
    const target = maxLen - 3;
    const truncated = trimmed.slice(0, target);
    const lastSpace = truncated.lastIndexOf(' ');
    const lastNewline = truncated.lastIndexOf('\n');
    const cutoff = Math.max(lastSpace, lastNewline);
    if (cutoff > target * 0.7) {
      return truncated.slice(0, cutoff).trim() + '...';
    }
    return truncated.trim() + '...';
  }

  const handleGenerateAiSpecs = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a requirement title first to generate AI specifications.');
      return;
    }

    setGeneratingAiSpecs(true);
    try {
      const res = await api.post('/ai/generate-specifications', {
        title: title.trim(),
        category: selectedCategory?.name || 'General',
        subcategory: selectedSubcategory?.name || 'General',
        requirementType: reqType,
        minBudget,
        maxBudget,
      }).catch(() => null);

      if (res?.data?.specifications || res?.data?.data?.specifications) {
        const rawSpecs = res.data.specifications || res.data.data.specifications;
        const truncated = safeTruncateText(rawSpecs, 1400);
        setDescription(truncated);
        Alert.alert('✨ AI Specs Generated!', 'Professional technical specifications generated by AI (kept within character limits).');
      } else {
        const catName = selectedCategory?.name || 'Product/Service';
        const specs = `• Title: ${title.trim()}\n• Category: ${catName} (${reqType.toUpperCase()})\n• Quality Standard: Verified Commercial Grade\n• Timeline: ${urgency === 'urgent' ? '24-48 Hours Urgent' : 'Within 1 Week'}\n• Payment Terms: ${isNegotiable ? 'Negotiable Quotes Welcome' : 'Fixed Budget'}\n• Requirement Note: Please provide itemised pricing quote, warranty details, and estimated delivery timeframe.`;
        setDescription(safeTruncateText(specs, 1400));
        Alert.alert('✨ AI Specs Generated!', 'Detailed specifications generated based on your requirement title and category.');
      }
    } catch (err) {
      console.warn('Failed to generate AI specs', err);
    } finally {
      setGeneratingAiSpecs(false);
    }
  };

  // Posted Requirements & Quotes List
  const [myRequirements, setMyRequirements] = useState<RequirementItem[]>([]);
  const [vendorQuotes, setVendorQuotes] = useState<QuoteItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Requirement Detail Modal & Quote Management states
  const [selectedReqForDetail, setSelectedReqForDetail] = useState<RequirementItem | null>(null);
  const [selectedReqQuotes, setSelectedReqQuotes] = useState<QuoteItem[]>([]);
  const [loadingReqQuotes, setLoadingReqQuotes] = useState<boolean>(false);
  const [compareQuoteIds, setCompareQuoteIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);

  // Edit requirement modal state
  const [editReqModalOpen, setEditReqModalOpen] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchQuotesForRequirement = async (reqId: string) => {
    setLoadingReqQuotes(true);
    try {
      const { data } = await api.get(`/requirements/${reqId}/quotes`);
      const list = data?.data?.quotes || data?.quotes || (Array.isArray(data?.data) ? data.data : []);
      setSelectedReqQuotes(list);
    } catch (err) {
      console.warn('Failed to load quotes for requirement', err);
    } finally {
      setLoadingReqQuotes(false);
    }
  };

  const handleSelectRequirement = async (req: RequirementItem) => {
    setSelectedReqForDetail(req);
    const targetId = req._id || req.id;
    if (targetId) {
      fetchQuotesForRequirement(targetId);
      api.get(`/requirements/${targetId}`).then(({ data }) => {
        const item = data?.data?.requirement || data?.requirement || data?.data;
        if (item) setSelectedReqForDetail(item);
      }).catch(() => null);
    }
  };

  const handleAcceptQuote = (quoteId: string) => {
    Alert.alert('Accept Proposal', 'Are you sure you want to accept this vendor quotation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept Bid',
        onPress: async () => {
          try {
            await api.patch(`/requirements/quotes/${quoteId}`, { status: 'accepted' });
            Alert.alert('Proposal Accepted', 'Vendor quotation accepted successfully!');
            fetchMyRequirements();
            fetchVendorQuotes();
            if (selectedReqForDetail) {
              const targetId = selectedReqForDetail._id || selectedReqForDetail.id;
              if (targetId) fetchQuotesForRequirement(targetId);
            }
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to accept proposal.');
          }
        },
      },
    ]);
  };

  const handleRejectQuote = (quoteId: string) => {
    Alert.alert('Reject Proposal', 'Are you sure you want to reject this vendor proposal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject Bid',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.patch(`/requirements/quotes/${quoteId}`, { status: 'rejected' });
            Alert.alert('Proposal Rejected', 'Vendor proposal rejected.');
            fetchMyRequirements();
            fetchVendorQuotes();
            if (selectedReqForDetail) {
              const targetId = selectedReqForDetail._id || selectedReqForDetail.id;
              if (targetId) fetchQuotesForRequirement(targetId);
            }
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to reject proposal.');
          }
        },
      },
    ]);
  };

  const handleDeleteQuote = (quoteId: string) => {
    Alert.alert('Remove Proposal', 'Are you sure you want to delete this proposal bid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/requirements/quotes/${quoteId}`);
            Alert.alert('Bid Removed', 'Proposal deleted successfully.');
            fetchMyRequirements();
            fetchVendorQuotes();
            if (selectedReqForDetail) {
              const targetId = selectedReqForDetail._id || selectedReqForDetail.id;
              if (targetId) fetchQuotesForRequirement(targetId);
            }
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to delete bid.');
          }
        },
      },
    ]);
  };

  const handleCloseRequirement = (reqId: string) => {
    Alert.alert('Close Brief', 'Are you sure you want to close this requirement? Vendors will no longer be able to submit proposals.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close Brief',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.put(`/requirements/${reqId}`, { status: 'Closed' });
            Alert.alert('Brief Closed', 'Requirement closed successfully.');
            fetchMyRequirements();
            if (selectedReqForDetail) {
              setSelectedReqForDetail((prev) => (prev ? { ...prev, status: 'Closed' } : null));
            }
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to close requirement.');
          }
        },
      },
    ]);
  };

  const handleRepostRequirement = (reqId: string) => {
    Alert.alert('Repost Brief', 'Extend expiry by 30 days and re-alert local vendors?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Repost',
        onPress: async () => {
          try {
            const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            await api.put(`/requirements/${reqId}`, { status: 'Pending', expires_at: newExpiry });
            Alert.alert('Requirement Reposted', 'Matching vendors have been alerted!');
            fetchMyRequirements();
            if (selectedReqForDetail) {
              setSelectedReqForDetail((prev) => (prev ? { ...prev, status: 'Pending' } : null));
            }
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to repost requirement.');
          }
        },
      },
    ]);
  };

  const handleDeleteRequirement = (reqId: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this requirement post completely?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/requirements/${reqId}`);
            Alert.alert('Deleted', 'Requirement post deleted.');
            setSelectedReqForDetail(null);
            fetchMyRequirements();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to delete requirement.');
          }
        },
      },
    ]);
  };

  const toggleCompareQuote = (quoteId: string) => {
    if (compareQuoteIds.includes(quoteId)) {
      setCompareQuoteIds((prev) => prev.filter((id) => id !== quoteId));
    } else {
      if (compareQuoteIds.length >= 3) {
        Alert.alert('Comparison Limit', 'You can compare at most 3 proposals at a time.');
        return;
      }
      setCompareQuoteIds((prev) => [...prev, quoteId]);
    }
  };

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    fetchMyRequirements();
    fetchVendorQuotes();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data } = await api.get('/categories', { params: { tree: 'true' } });
      const cats = data?.items || data?.data?.categories || data?.categories || data?.data || [];
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
      } else {
        setCategories([...DEFAULT_PRODUCT_CATEGORIES, ...DEFAULT_SERVICE_CATEGORIES]);
      }
    } catch (err) {
      console.warn('Failed to load categories, using default pool', err);
      setCategories([...DEFAULT_PRODUCT_CATEGORIES, ...DEFAULT_SERVICE_CATEGORIES]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchMyRequirements = async () => {
    setLoadingList(true);
    try {
      const { data } = await api.get('/requirements');
      const list = data?.data?.requirements || data?.requirements || data?.data || [];
      setMyRequirements(list);
    } catch (err) {
      console.warn('Failed to load my requirements', err);
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  };

  const fetchVendorQuotes = async () => {
    try {
      const { data } = await api.get('/requirements/quotes');
      const list = data?.data?.quotes || data?.quotes || data?.data || [];
      setVendorQuotes(list);
    } catch (err) {
      console.warn('Failed to load vendor quotes', err);
    }
  };

  // Pincode Auto Lookup Handler
  const handlePincodeChange = async (val: string) => {
    setPincode(val);
    setPincodeMessage(null);

    // When 6 digits entered, auto-fetch city, state, area post offices from backend API
    if (/^\d{6}$/.test(val.trim())) {
      setFetchingPincode(true);
      try {
        const { data } = await api.post('/location/pincode-lookup', { pincode: val.trim() });
        const res = data?.data || data || {};

        if (res.city || res.district) {
          setCity(res.city || res.district || '');
          setState(res.state || '');
          const areas = res.postOffices || (res.area ? [res.area] : []);
          setFetchedAreas(areas);
          if (areas.length > 0) {
            setArea(areas[0]);
          }
          setPincodeMessage(`✓ Auto-filled: ${res.city || res.district}, ${res.state}`);
        } else {
          setPincodeMessage('⚠️ Pincode entered. Please enter city & area manually.');
        }
      } catch (err: any) {
        setPincodeMessage('⚠️ Could not auto-detect location. Please enter manually.');
      } finally {
        setFetchingPincode(false);
      }
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMyRequirements();
    fetchVendorQuotes();
  };

  const handleSubmitRequirement = async () => {
    setFormError(null);

    if (authStatus !== 'authed' || !user) {
      Alert.alert(
        'Login Required',
        'Please sign in to your BizReels account to post requirements for local vendors.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In / Register', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    if (!title.trim()) {
      setFormError('Please enter a requirement title (e.g. Need 50 Custom T-Shirts)');
      return;
    }

    if (!selectedCategory) {
      setFormError('Please select a Category from the dropdown.');
      return;
    }

    if (!description.trim()) {
      setFormError('Please enter detailed specifications or requirement notes.');
      return;
    }

    const minB = minBudget ? parseFloat(minBudget) : 0;
    const maxB = maxBudget ? parseFloat(maxBudget) : minB;
    const qty = quantity ? parseInt(quantity, 10) : 1;

    const catName = selectedCategory.name === 'Other' ? customCategory || 'General' : selectedCategory.name;
    const subCatName = selectedSubcategory?.name === 'Other' ? customSubcategory || 'General' : selectedSubcategory?.name || 'General';

    setSubmitting(true);
    try {
      await api.post('/requirements', {
        title: safeTruncateText(title.trim(), 120),
        description: safeTruncateText(description.trim(), 1400),
        detailedSpecifications: safeTruncateText(description.trim(), 2800),
        category: catName,
        subcategory: subCatName,
        customCategory: selectedCategory.name === 'Other' ? customCategory : undefined,
        customSubcategory: selectedSubcategory?.name === 'Other' ? customSubcategory : undefined,
        type: reqType,
        requirementType: reqType,
        productCondition: reqType === 'product' ? productCondition : undefined,
        serviceModel: reqType === 'service' ? serviceModel : undefined,
        budget: maxB || minB,
        budget_min: minB,
        budget_max: maxB,
        quantity: qty,
        is_negotiable: isNegotiable,
        urgency,
        expectedDeliveryDate: expectedDeliveryDate ? expectedDeliveryDate.trim() : undefined,
        location: {
          city: city.trim() || 'Local',
          area: area.trim() || 'City Wide',
          state: state.trim() || undefined,
          pincode: pincode.trim() || undefined,
        },
        pincode: pincode.trim() || undefined,
        targetDistance: targetDistance ? parseFloat(targetDistance) : undefined,
        otherConditions: otherConditions.trim() || undefined,
      });

      Alert.alert(
        '🎉 Requirement Broadcasted!',
        'Your custom requirement has been posted to verified local sellers & vendors. You will receive quotes directly in your inbox.',
        [{ text: 'View My Requirements', onPress: () => setActiveTab('my-requirements') }]
      );

      // Reset Form
      setTitle('');
      setDescription('');
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setCustomCategory('');
      setCustomSubcategory('');
      setMinBudget('');
      setMaxBudget('');
      setQuantity('1');
      setPincode('');
      setCity('');
      setState('');
      setArea('');
      setFetchedAreas([]);
      setPincodeMessage(null);
      setExpectedDeliveryDate('');
      setOtherConditions('');
      fetchMyRequirements();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Failed to post requirement.');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryPool = categories.length > 0 ? categories : (reqType === 'service' ? DEFAULT_SERVICE_CATEGORIES : DEFAULT_PRODUCT_CATEGORIES);

  const availableCategories = categoryPool.filter((c) => {
    if (c.category_type && c.category_type !== reqType && c.category_type !== 'both') {
      return false;
    }
    if (c.parent_id) {
      return false;
    }
    return true;
  });

  const filteredCategories = availableCategories.filter((c) =>
    (c.name || '').toLowerCase().includes(catSearch.toLowerCase())
  );

  const subcategoriesList =
    selectedCategory?.subcategories ||
    selectedCategory?.children ||
    selectedCategory?.items ||
    categoryPool.filter(
      (c) =>
        !!c.parent_id &&
        (c.parent_id === selectedCategory?.id || c.parent_id === selectedCategory?._id)
    );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>BUYER REQUIREMENT HUB (RFQ)</Text>
          <Text style={styles.headerSubtitle}>
            Post your custom requirement & get instant competitive quotes from verified sellers.
          </Text>
        </View>

        {/* Sub Navigation Tabs */}
        <View style={styles.tabNavRow}>
          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'create' && styles.tabNavBtnActive]}
            onPress={() => setActiveTab('create')}>
            <Ionicons
              name="add-circle-outline"
              size={15}
              color={activeTab === 'create' ? BLACK : YELLOW}
            />
            <Text style={[styles.tabNavText, activeTab === 'create' && styles.tabNavTextActive]}>
              POST REQUIREMENT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'my-requirements' && styles.tabNavBtnActive]}
            onPress={() => setActiveTab('my-requirements')}>
            <Ionicons
              name="list-outline"
              size={15}
              color={activeTab === 'my-requirements' ? BLACK : YELLOW}
            />
            <Text
              style={[
                styles.tabNavText,
                activeTab === 'my-requirements' && styles.tabNavTextActive,
              ]}>
              MY POSTS ({myRequirements.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'quotes' && styles.tabNavBtnActive]}
            onPress={() => setActiveTab('quotes')}>
            <Ionicons
              name="cash-outline"
              size={15}
              color={activeTab === 'quotes' ? BLACK : YELLOW}
            />
            <Text
              style={[
                styles.tabNavText,
                activeTab === 'quotes' && styles.tabNavTextActive,
              ]}>
              QUOTES ({vendorQuotes.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        {activeTab === 'create' ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Error Banner */}
            {!!formError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            )}

            {/* Type Switcher: Product vs Service */}
            <View style={styles.typeSwitchRow}>
              <TouchableOpacity
                style={[styles.typeBtn, reqType === 'product' && styles.typeBtnActive]}
                onPress={() => {
                  setReqType('product');
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                  setCustomCategory('');
                  setCustomSubcategory('');
                }}>
                <Ionicons
                  name="cube-outline"
                  size={18}
                  color={reqType === 'product' ? BLACK : '#fff'}
                />
                <Text style={[styles.typeBtnText, reqType === 'product' && styles.typeBtnTextActive]}>
                  PRODUCT REQUIREMENT
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, reqType === 'service' && styles.typeBtnActive]}
                onPress={() => {
                  setReqType('service');
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                  setCustomCategory('');
                  setCustomSubcategory('');
                }}>
                <Ionicons
                  name="construct-outline"
                  size={18}
                  color={reqType === 'service' ? BLACK : '#fff'}
                />
                <Text style={[styles.typeBtnText, reqType === 'service' && styles.typeBtnTextActive]}>
                  SERVICE REQUIREMENT
                </Text>
              </TouchableOpacity>
            </View>

            {/* SECTION 1: TITLE & CATEGORY DROPDOWNS */}
            <View style={styles.formSection}>
              <Text style={styles.sectionHeader}>1. REQUIREMENT & CATEGORY</Text>

              {/* Requirement Title */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Requirement Title *</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="document-text-outline" size={18} color={YELLOW} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Need 50 Custom Printed Cotton T-Shirts"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={title}
                    onChangeText={(v) => {
                      setTitle(v);
                      setFormError(null);
                    }}
                  />
                </View>
              </View>

              {/* Category Dropdown Picker */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Select Category *</Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => {
                    setCatSearch('');
                    setCategoryModalOpen(true);
                  }}>
                  <Ionicons name="grid-outline" size={18} color={YELLOW} style={styles.icon} />
                  <Text
                    style={[
                      styles.dropdownBtnText,
                      !selectedCategory && styles.dropdownPlaceholder,
                    ]}>
                    {selectedCategory ? selectedCategory.name : 'Choose Category...'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>

              {/* Custom Category Input if "Other" Selected */}
              {selectedCategory?.name === 'Other' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Specify Custom Category</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter custom category..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={customCategory}
                      onChangeText={setCustomCategory}
                    />
                  </View>
                </View>
              )}

              {/* Subcategory Dropdown Picker */}
              {selectedCategory && selectedCategory.name !== 'Other' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Subcategory (Optional)</Text>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setSubcategoryModalOpen(true)}>
                    <Ionicons name="options-outline" size={18} color={YELLOW} style={styles.icon} />
                    <Text
                      style={[
                        styles.dropdownBtnText,
                        !selectedSubcategory && styles.dropdownPlaceholder,
                      ]}>
                      {selectedSubcategory ? selectedSubcategory.name : 'Choose Subcategory...'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Custom Subcategory Input if "Other" Selected */}
              {selectedSubcategory?.name === 'Other' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Specify Custom Subcategory</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter custom subcategory..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={customSubcategory}
                      onChangeText={setCustomSubcategory}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* SECTION 2: PRODUCT CONDITION / SERVICE MODEL */}
            <View style={styles.formSection}>
              <Text style={styles.sectionHeader}>
                2. {reqType === 'product' ? 'PRODUCT CONDITION' : 'SERVICE MODEL'}
              </Text>

              {reqType === 'product' ? (
                <View style={styles.optionsWrap}>
                  {PRODUCT_CONDITIONS.map((cond) => {
                    const active = productCondition === cond.id;
                    return (
                      <TouchableOpacity
                        key={cond.id}
                        style={[styles.optChip, active && styles.optChipActive]}
                        onPress={() => setProductCondition(cond.id as any)}>
                        <Text style={[styles.optChipText, active && styles.optChipTextActive]}>
                          {cond.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.optionsWrap}>
                  {SERVICE_MODELS.map((model) => {
                    const active = serviceModel === model.id;
                    return (
                      <TouchableOpacity
                        key={model.id}
                        style={[styles.optChip, active && styles.optChipActive]}
                        onPress={() => setServiceModel(model.id as any)}>
                        <Text style={[styles.optChipText, active && styles.optChipTextActive]}>
                          {model.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* SECTION 3: PRICING & QUANTITY */}
            <View style={styles.formSection}>
              <Text style={styles.sectionHeader}>3. BUDGET & QUANTITY</Text>
              <View style={styles.rowTwo}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Min Budget (₹)</Text>
                  <View style={styles.inputRow}>
                    <Text style={styles.rupeePrefix}>₹</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1000"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      keyboardType="numeric"
                      value={minBudget}
                      onChangeText={setMinBudget}
                    />
                  </View>
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Max Budget (₹)</Text>
                  <View style={styles.inputRow}>
                    <Text style={styles.rupeePrefix}>₹</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="5000"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      keyboardType="numeric"
                      value={maxBudget}
                      onChangeText={setMaxBudget}
                    />
                  </View>
                </View>

                <View style={[styles.fieldGroup, { width: 85 }]}>
                  <Text style={styles.label}>Quantity</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.input, { textAlign: 'center' }]}
                      placeholder="1"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      keyboardType="numeric"
                      value={quantity}
                      onChangeText={setQuantity}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsNegotiable(!isNegotiable)}>
                <Ionicons
                  name={isNegotiable ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={YELLOW}
                />
                <Text style={styles.checkboxLabel}>Price is Negotiable with Vendors</Text>
              </TouchableOpacity>
            </View>

            {/* SECTION 4: LOCATION & PINCODE AUTO FETCH */}
            <View style={styles.formSection}>
              <Text style={styles.sectionHeader}>4. LOCATION & PINCODE LOOKUP</Text>

              {/* Pincode Input with Auto Fetch */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Enter 6-Digit Pincode (Auto-Fills Location)</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="keypad-outline" size={16} color={YELLOW} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 110001 or 400001"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="numeric"
                    maxLength={6}
                    value={pincode}
                    onChangeText={handlePincodeChange}
                  />
                  {fetchingPincode && <ActivityIndicator size="small" color={YELLOW} />}
                </View>
                {!!pincodeMessage && (
                  <Text
                    style={[
                      styles.pincodeMsg,
                      pincodeMessage.startsWith('✓') ? { color: '#10B981' } : { color: YELLOW },
                    ]}>
                    {pincodeMessage}
                  </Text>
                )}
              </View>

              <View style={styles.rowTwo}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>City / District</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="location-outline" size={16} color={YELLOW} style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Delhi, Mumbai"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>State</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Delhi, Maharashtra"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={state}
                      onChangeText={setState}
                    />
                  </View>
                </View>
              </View>

              {/* Area Selection / Entry */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Locality / Area Name</Text>
                {fetchedAreas.length > 1 ? (
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setAreaModalOpen(true)}>
                    <Ionicons name="navigate-outline" size={16} color={YELLOW} style={styles.icon} />
                    <Text style={styles.dropdownBtnText}>{area || 'Select Area...'}</Text>
                    <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.inputRow}>
                    <Ionicons name="navigate-outline" size={16} color={YELLOW} style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Connaught Place, Andheri East"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={area}
                      onChangeText={setArea}
                    />
                  </View>
                )}
              </View>

              {/* Target Broadcast Radius */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Vendor Broadcast Radius</Text>
                <View style={styles.optionsWrap}>
                  {RADIUS_OPTIONS.map((r) => {
                    const active = targetDistance === r.value;
                    return (
                      <TouchableOpacity
                        key={r.value}
                        style={[styles.optChip, active && styles.optChipActive]}
                        onPress={() => setTargetDistance(r.value)}>
                        <Text style={[styles.optChipText, active && styles.optChipTextActive]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* SECTION 5: TIMELINE & DETAILED SPECS */}
            <View style={styles.formSection}>
              <Text style={styles.sectionHeader}>5. TIMELINE & DETAILED SPECIFICATIONS</Text>

              {/* Urgency */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Urgency / Timeline</Text>
                <View style={styles.urgencyRow}>
                  <TouchableOpacity
                    style={[styles.urgencyBtn, urgency === 'urgent' && styles.urgencyBtnActive]}
                    onPress={() => setUrgency('urgent')}>
                    <Ionicons
                      name="flash"
                      size={14}
                      color={urgency === 'urgent' ? BLACK : '#EF4444'}
                    />
                    <Text style={[styles.urgencyText, urgency === 'urgent' && styles.urgencyTextActive]}>
                      Urgent (24-48h)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.urgencyBtn, urgency === '1week' && styles.urgencyBtnActive]}
                    onPress={() => setUrgency('1week')}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={urgency === '1week' ? BLACK : YELLOW}
                    />
                    <Text style={[styles.urgencyText, urgency === '1week' && styles.urgencyTextActive]}>
                      Within 1 Week
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.urgencyBtn, urgency === 'flexible' && styles.urgencyBtnActive]}
                    onPress={() => setUrgency('flexible')}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={urgency === 'flexible' ? BLACK : '#10B981'}
                    />
                    <Text style={[styles.urgencyText, urgency === 'flexible' && styles.urgencyTextActive]}>
                      Flexible
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Expected Delivery Date */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Expected Required Date (Optional)</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="calendar" size={16} color={YELLOW} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. DD/MM/YYYY or Next Monday"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={expectedDeliveryDate}
                    onChangeText={setExpectedDeliveryDate}
                  />
                </View>
              </View>

              {/* Detailed Description with AI Specs Generator */}
              <View style={styles.fieldGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={styles.label}>Detailed Specifications & Notes *</Text>
                  <TouchableOpacity
                    style={styles.aiSpecsBtn}
                    onPress={handleGenerateAiSpecs}
                    disabled={generatingAiSpecs}>
                    {generatingAiSpecs ? (
                      <ActivityIndicator size="small" color={BLACK} />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={12} color={BLACK} />
                        <Text style={styles.aiSpecsBtnText}>✨ Auto-Generate AI Specs</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputRow, { height: 110, alignItems: 'flex-start', paddingTop: 10 }]}>
                  <TextInput
                    style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                    placeholder="Describe size, brand preference, model number, colors, material, or custom service instructions..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={(v) => {
                      setDescription(v);
                      setFormError(null);
                    }}
                  />
                </View>
              </View>

              {/* Other Conditions */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Special Terms or Payment Conditions</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Cash on delivery, GST Invoice required..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={otherConditions}
                    onChangeText={setOtherConditions}
                  />
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <View style={{ marginTop: Spacing.three, marginBottom: Spacing.seven }}>
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && styles.submitBtnPressed,
                  submitting && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmitRequirement}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={BLACK} />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>POST REQUIREMENT NOW</Text>
                    <Ionicons name="paper-plane" size={18} color={BLACK} />
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        ) : activeTab === 'my-requirements' ? (
          /* MY POSTED REQUIREMENTS LIST */
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={YELLOW} />
            }>
            {loadingList && !refreshing ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={YELLOW} />
                <Text style={styles.loadingText}>Loading your requirement posts...</Text>
              </View>
            ) : myRequirements.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="clipboard-outline" size={48} color="rgba(255,255,255,0.4)" />
                <Text style={styles.emptyTitle}>No requirements posted yet</Text>
                <Text style={styles.emptySub}>
                  Post what you need and local vendors will submit custom quotes directly to you.
                </Text>
                <TouchableOpacity
                  style={styles.createFirstBtn}
                  onPress={() => setActiveTab('create')}>
                  <Text style={styles.createFirstBtnText}>+ POST FIRST REQUIREMENT</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: Spacing.three, paddingBottom: Spacing.seven }}>
                {myRequirements.map((req) => (
                  <TouchableOpacity
                    key={req._id || req.id}
                    style={styles.reqCard}
                    activeOpacity={0.85}
                    onPress={() => handleSelectRequirement(req)}>
                    <View style={styles.reqCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reqTitle} numberOfLines={2}>
                          {req.title}
                        </Text>
                        <Text style={styles.reqMeta}>
                          {req.category} • {req.type?.toUpperCase() || 'PRODUCT'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusChip,
                          req.status === 'Closed' && {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderColor: BORDER,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.statusChipText,
                            req.status === 'Closed' && { color: 'rgba(255,255,255,0.5)' },
                          ]}>
                          {req.status || 'Active'}
                        </Text>
                      </View>
                    </View>

                    {!!req.description && (
                      <Text style={styles.reqDesc} numberOfLines={2}>
                        {req.description}
                      </Text>
                    )}

                    <View style={styles.reqDetailsRow}>
                      {!!req.budget && (
                        <View style={styles.reqDetailPill}>
                          <Text style={styles.reqDetailLabel}>Budget:</Text>
                          <Text style={styles.reqDetailVal}>₹{req.budget}</Text>
                        </View>
                      )}

                      {!!req.quantity && (
                        <View style={styles.reqDetailPill}>
                          <Text style={styles.reqDetailLabel}>Qty:</Text>
                          <Text style={styles.reqDetailVal}>{req.quantity}</Text>
                        </View>
                      )}

                      <View style={styles.reqDetailPill}>
                        <Text style={styles.reqDetailLabel}>Bids Received:</Text>
                        <Text style={[styles.reqDetailVal, { color: YELLOW }]}>
                          {req.quotesCount || req.proposals_count || 0} Bids
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 6,
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: BORDER,
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="eye-outline" size={14} color={YELLOW} />
                        <Text style={{ color: YELLOW, fontSize: 11, fontWeight: '900' }}>
                          View Bids & Full Details
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          /* VENDOR QUOTES LIST */
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={YELLOW} />
            }>
            {vendorQuotes.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="cash-outline" size={48} color="rgba(255,255,255,0.4)" />
                <Text style={styles.emptyTitle}>No vendor quotes received yet</Text>
                <Text style={styles.emptySub}>
                  When local sellers view your requirement post, their custom quotes will appear here.
                </Text>
              </View>
            ) : (
              <View style={{ gap: Spacing.three, paddingBottom: Spacing.seven }}>
                {vendorQuotes.map((q) => {
                  const vendorObj = q.vendor || {};
                  const vendorName = vendorObj.name || 'Vendor Partner';
                  const shopName =
                    vendorObj.shopName ||
                    vendorObj.businessName ||
                    vendorObj.vendorProfile?.shopName ||
                    vendorObj.vendorProfile?.businessName ||
                    'Verified Store';
                  const ratingVal = vendorObj.rating_avg || vendorObj.vendorProfile?.rating || 4.5;
                  const quotePrice = q.amount || q.price || 0;
                  const reqTitle = q.requirement?.title || 'Requirement Post';
                  const isAccepted = q.status === 'accepted';
                  const isRejected = q.status === 'rejected';

                  return (
                    <View key={q._id || q.id} style={styles.reqCard}>
                      <View style={styles.reqCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <View
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 19,
                              backgroundColor: YELLOW,
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                            }}>
                            {vendorObj.avatarUrl || vendorObj.profile_pic ? (
                              <Image
                                source={{ uri: resolveImageUrl(vendorObj.avatarUrl || vendorObj.profile_pic) || '' }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                              />
                            ) : (
                              <Text style={{ color: BLACK, fontWeight: '900', fontSize: 14 }}>
                                {vendorName.charAt(0).toUpperCase()}
                              </Text>
                            )}
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.reqTitle} numberOfLines={1}>
                              {vendorName}
                            </Text>
                            <Text
                              style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' }}
                              numberOfLines={1}>
                              {shopName} • ⭐ {Number(ratingVal).toFixed(1)}
                            </Text>
                            <Text style={styles.reqMeta} numberOfLines={1}>
                              FOR: {reqTitle}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.quotePriceChip}>
                          <Text style={styles.quotePriceText}>₹{quotePrice}</Text>
                        </View>
                      </View>

                      {!!(q.message || q.notes) && (
                        <View style={{ backgroundColor: BLACK, padding: 8, marginTop: 4, borderWidth: 1, borderColor: BORDER }}>
                          <Text style={styles.reqDesc}>{q.message || q.notes}</Text>
                        </View>
                      )}

                      {/* Status Indicator */}
                      {isAccepted && (
                        <View style={{ backgroundColor: 'rgba(16,185,129,0.15)', padding: 6, alignItems: 'center' }}>
                          <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '900' }}>✓ PROPOSAL ACCEPTED & SETTLED</Text>
                        </View>
                      )}
                      {isRejected && (
                        <View style={{ backgroundColor: 'rgba(239,68,68,0.15)', padding: 6, alignItems: 'center' }}>
                          <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '900' }}>✕ PROPOSAL REJECTED</Text>
                        </View>
                      )}

                      {/* Action Row */}
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        {!isAccepted && !isRejected && (
                          <>
                            <TouchableOpacity
                              style={{ backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                              onPress={() => handleAcceptQuote(q._id || q.id || '')}>
                              <Ionicons name="checkmark-circle" size={14} color="#fff" />
                              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>Accept</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={{ backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' }}
                              onPress={() => handleRejectQuote(q._id || q.id || '')}>
                              <Ionicons name="close" size={14} color="#EF4444" />
                            </TouchableOpacity>
                          </>
                        )}

                        <TouchableOpacity
                          style={{ backgroundColor: YELLOW, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          onPress={() => {
                            if (vendorObj._id || vendorObj.id) {
                              router.push({
                                pathname: '/messages/[id]' as any,
                                params: {
                                  id: `direct_${vendorObj._id || vendorObj.id}`,
                                  recipientId: vendorObj._id || vendorObj.id,
                                  name: shopName || vendorName,
                                  avatar: vendorObj.avatarUrl || vendorObj.profile_pic || '',
                                },
                              } as any);
                            }
                          }}>
                          <Ionicons name="chatbubble-ellipses" size={14} color={BLACK} />
                          <Text style={{ color: BLACK, fontSize: 11, fontWeight: '900' }}>Chat</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          onPress={() => {
                            const vId = vendorObj._id || vendorObj.id;
                            if (vId) router.push({ pathname: '/vendor/[id]', params: { id: vId } } as any);
                          }}>
                          <Ionicons name="storefront-outline" size={14} color="#fff" />
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Store</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: BORDER, paddingHorizontal: 8, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' }}
                          onPress={() => handleDeleteQuote(q._id || q.id || '')}>
                          <Ionicons name="trash-outline" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

        {/* ── MODAL 1: CATEGORY DROPDOWN PICKER ── */}
        <Modal visible={categoryModalOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setCategoryModalOpen(false)} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>SELECT CATEGORY</Text>
                <TouchableOpacity onPress={() => setCategoryModalOpen(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.modalSearchRow}>
                <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search category..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={catSearch}
                  onChangeText={setCatSearch}
                />
              </View>

              <ScrollView style={{ maxHeight: 350 }}>
                {filteredCategories.map((c) => {
                  const isSelected = selectedCategory?.name === c.name;
                  return (
                    <TouchableOpacity
                      key={c._id || c.name}
                      style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                      onPress={() => {
                        setSelectedCategory(c);
                        setSelectedSubcategory(null);
                        setCategoryModalOpen(false);
                      }}>
                      <Ionicons name="grid-outline" size={16} color={isSelected ? BLACK : YELLOW} />
                      <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                        {c.name}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={16} color={BLACK} />}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[styles.pickerItem, selectedCategory?.name === 'Other' && styles.pickerItemSelected]}
                  onPress={() => {
                    setSelectedCategory({ name: 'Other' });
                    setSelectedSubcategory(null);
                    setCategoryModalOpen(false);
                  }}>
                  <Ionicons name="add-circle-outline" size={16} color={YELLOW} />
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedCategory?.name === 'Other' && styles.pickerItemTextSelected,
                    ]}>
                    + Other (Specify Custom Category)
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── MODAL 2: SUBCATEGORY DROPDOWN PICKER ── */}
        <Modal visible={subcategoryModalOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSubcategoryModalOpen(false)} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>SELECT SUBCATEGORY</Text>
                <TouchableOpacity onPress={() => setSubcategoryModalOpen(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 350 }}>
                {subcategoriesList.map((sc) => {
                  const isSelected = selectedSubcategory?.name === sc.name;
                  return (
                    <TouchableOpacity
                      key={sc._id || sc.name}
                      style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                      onPress={() => {
                        setSelectedSubcategory(sc);
                        setSubcategoryModalOpen(false);
                      }}>
                      <Ionicons name="options-outline" size={16} color={isSelected ? BLACK : YELLOW} />
                      <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                        {sc.name}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={16} color={BLACK} />}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[styles.pickerItem, selectedSubcategory?.name === 'Other' && styles.pickerItemSelected]}
                  onPress={() => {
                    setSelectedSubcategory({ name: 'Other' });
                    setSubcategoryModalOpen(false);
                  }}>
                  <Ionicons name="add-circle-outline" size={16} color={YELLOW} />
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedSubcategory?.name === 'Other' && styles.pickerItemTextSelected,
                    ]}>
                    + Other (Specify Custom Subcategory)
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── MODAL 3: AREA DROPDOWN PICKER ── */}
        <Modal visible={areaModalOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setAreaModalOpen(false)} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>SELECT LOCAL AREA ({pincode})</Text>
                <TouchableOpacity onPress={() => setAreaModalOpen(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 350 }}>
                {fetchedAreas.map((areaName) => {
                  const isSelected = area === areaName;
                  return (
                    <TouchableOpacity
                      key={areaName}
                      style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                      onPress={() => {
                        setArea(areaName);
                        setAreaModalOpen(false);
                      }}>
                      <Ionicons name="location" size={16} color={isSelected ? BLACK : YELLOW} />
                      <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                        {areaName}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={16} color={BLACK} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── MODAL 4: SELECTED REQUIREMENT DETAIL & BIDS MODAL ── */}
        <Modal visible={!!selectedReqForDetail} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSelectedReqForDetail(null)} />
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              {selectedReqForDetail && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.modalTitle} numberOfLines={1}>
                        {selectedReqForDetail.title}
                      </Text>
                      <Text style={{ color: YELLOW, fontSize: 10, fontWeight: '800' }}>
                        {selectedReqForDetail.category} • STATUS: {selectedReqForDetail.status || 'Active'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedReqForDetail(null)} style={styles.closeBtn}>
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
                    {/* Distribution Metrics Row */}
                    <View style={{ flexDirection: 'row', backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, paddingVertical: 10 }}>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ color: YELLOW, fontSize: 14, fontWeight: '900' }}>
                          {selectedReqForDetail.totalVendorsMatched || 0}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700' }}>MATCHED</Text>
                      </View>
                      <View style={{ width: 1, backgroundColor: BORDER }} />
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>
                          {selectedReqForDetail.totalVendorsNotified || 0}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700' }}>NOTIFIED</Text>
                      </View>
                      <View style={{ width: 1, backgroundColor: BORDER }} />
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ color: '#F59E0B', fontSize: 14, fontWeight: '900' }}>
                          {selectedReqForDetail.views_count || 0}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700' }}>VIEWED</Text>
                      </View>
                      <View style={{ width: 1, backgroundColor: BORDER }} />
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ color: '#10B981', fontSize: 14, fontWeight: '900' }}>
                          {selectedReqQuotes.length}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700' }}>BIDS</Text>
                      </View>
                    </View>

                    {/* Brief Description & Specs */}
                    <View style={{ backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, padding: 10, gap: 6 }}>
                      <Text style={{ color: YELLOW, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>BRIEF DESCRIPTION</Text>
                      <Text style={{ color: '#fff', fontSize: 12, lineHeight: 18 }}>{selectedReqForDetail.description}</Text>

                      {!!selectedReqForDetail.detailedSpecifications && (
                        <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: BORDER }}>
                          <Text style={{ color: YELLOW, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }}>DETAILED SPECIFICATIONS</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, lineHeight: 16 }}>{selectedReqForDetail.detailedSpecifications}</Text>
                        </View>
                      )}
                    </View>

                    {/* Requirement Controls */}
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      {selectedReqForDetail.status !== 'Closed' ? (
                        <TouchableOpacity
                          style={{ backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          onPress={() => handleCloseRequirement(selectedReqForDetail._id || selectedReqForDetail.id || '')}>
                          <Ionicons name="lock-closed" size={14} color="#EF4444" />
                          <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '900' }}>Close Brief</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={{ backgroundColor: YELLOW, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          onPress={() => handleRepostRequirement(selectedReqForDetail._id || selectedReqForDetail.id || '')}>
                          <Ionicons name="refresh" size={14} color={BLACK} />
                          <Text style={{ color: BLACK, fontSize: 11, fontWeight: '900' }}>Repost / Reopen Brief</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        onPress={() => handleDeleteRequirement(selectedReqForDetail._id || selectedReqForDetail.id || '')}>
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                        <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '900' }}>Delete Post</Text>
                      </TouchableOpacity>

                      {compareQuoteIds.length > 0 && (
                        <TouchableOpacity
                          style={{ backgroundColor: YELLOW, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          onPress={() => setCompareModalOpen(true)}>
                          <Ionicons name="git-compare-outline" size={14} color={BLACK} />
                          <Text style={{ color: BLACK, fontSize: 11, fontWeight: '900' }}>Compare ({compareQuoteIds.length})</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Vendor Proposals Header */}
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 6 }}>
                      SUBMITTED QUOTATIONS ({selectedReqQuotes.length})
                    </Text>

                    {loadingReqQuotes ? (
                      <ActivityIndicator size="small" color={YELLOW} style={{ marginVertical: 10 }} />
                    ) : selectedReqQuotes.length === 0 ? (
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', marginVertical: 10 }}>
                        No vendor quotes submitted for this brief yet.
                      </Text>
                    ) : (
                      selectedReqQuotes.map((q) => {
                        const vendorObj = q.vendor || {};
                        const vendorName = vendorObj.name || 'Vendor Partner';
                        const shopName = vendorObj.shopName || vendorObj.businessName || vendorObj.vendorProfile?.shopName || vendorObj.vendorProfile?.businessName || 'Verified Store';
                        const ratingVal = vendorObj.rating_avg || vendorObj.vendorProfile?.rating || 4.5;
                        const quotePrice = q.amount || q.price || 0;
                        const isAccepted = q.status === 'accepted';
                        const isRejected = q.status === 'rejected';
                        const isSelectedForCompare = compareQuoteIds.includes(q._id || q.id || '');

                        return (
                          <View key={q._id || q.id} style={{ backgroundColor: BLACK, borderWidth: 1, borderColor: isAccepted ? '#10B981' : isRejected ? 'rgba(239,68,68,0.4)' : BORDER, padding: 10, gap: 8 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                                onPress={() => toggleCompareQuote(q._id || q.id || '')}>
                                <Ionicons
                                  name={isSelectedForCompare ? 'checkbox' : 'square-outline'}
                                  size={18}
                                  color={YELLOW}
                                />
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700' }}>Compare</Text>
                              </TouchableOpacity>

                              <View style={{ backgroundColor: YELLOW, paddingHorizontal: 8, paddingVertical: 2 }}>
                                <Text style={{ color: BLACK, fontSize: 12, fontWeight: '900' }}>₹{quotePrice}</Text>
                              </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: YELLOW, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                                {vendorObj.avatarUrl || vendorObj.profile_pic ? (
                                  <Image source={{ uri: resolveImageUrl(vendorObj.avatarUrl || vendorObj.profile_pic) || '' }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                ) : (
                                  <Text style={{ color: BLACK, fontWeight: '900', fontSize: 12 }}>{vendorName.charAt(0).toUpperCase()}</Text>
                                )}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>{vendorName}</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{shopName} • ⭐ {Number(ratingVal).toFixed(1)}</Text>
                              </View>
                            </View>

                            {!!(q.message || q.notes) && (
                              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, backgroundColor: DARK_CARD, padding: 6 }}>{q.message || q.notes}</Text>
                            )}

                            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                              {!isAccepted && !isRejected && (
                                <>
                                  <TouchableOpacity
                                    style={{ backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                    onPress={() => handleAcceptQuote(q._id || q.id || '')}>
                                    <Ionicons name="checkmark-circle" size={14} color="#fff" />
                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>Accept</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={{ backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 6 }}
                                    onPress={() => handleRejectQuote(q._id || q.id || '')}>
                                    <Ionicons name="close" size={14} color="#EF4444" />
                                  </TouchableOpacity>
                                </>
                              )}

                              <TouchableOpacity
                                style={{ backgroundColor: YELLOW, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                onPress={() => {
                                  const vId = vendorObj._id || vendorObj.id;
                                  if (vId) {
                                    router.push({
                                      pathname: '/messages/[id]' as any,
                                      params: {
                                        id: `direct_${vId}`,
                                        recipientId: vId,
                                        name: shopName || vendorName,
                                        avatar: vendorObj.avatarUrl || vendorObj.profile_pic || '',
                                      },
                                    } as any);
                                  }
                                }}>
                                <Ionicons name="chatbubble-ellipses" size={14} color={BLACK} />
                                <Text style={{ color: BLACK, fontSize: 10, fontWeight: '900' }}>Chat</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={{ backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 8, paddingVertical: 6 }}
                                onPress={() => {
                                  const vId = vendorObj._id || vendorObj.id;
                                  if (vId) router.push({ pathname: '/vendor/[id]', params: { id: vId } } as any);
                                }}>
                                <Ionicons name="storefront-outline" size={14} color="#fff" />
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: BORDER, paddingHorizontal: 8, paddingVertical: 6 }}
                                onPress={() => handleDeleteQuote(q._id || q.id || '')}>
                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* ── MODAL 5: COMPARE PROPOSALS MODAL ── */}
        <Modal visible={compareModalOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setCompareModalOpen(false)} />
            <View style={[styles.modalContent, { maxHeight: '85%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>COMPARE BIDS ({compareQuoteIds.length})</Text>
                <TouchableOpacity onPress={() => setCompareModalOpen(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView horizontal style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingVertical: 10 }}>
                {selectedReqQuotes
                  .filter((q) => compareQuoteIds.includes(q._id || q.id || ''))
                  .map((q) => {
                    const vendorObj = q.vendor || {};
                    const vendorName = vendorObj.name || 'Vendor Partner';
                    const shopName = vendorObj.shopName || vendorObj.businessName || 'Verified Store';
                    const ratingVal = vendorObj.rating_avg || 4.5;
                    const quotePrice = q.amount || q.price || 0;

                    return (
                      <View key={q._id || q.id} style={{ width: 220, backgroundColor: BLACK, borderWidth: 1, borderColor: YELLOW, padding: 12, gap: 10 }}>
                        <Text style={{ color: YELLOW, fontSize: 16, fontWeight: '900' }}>₹{quotePrice}</Text>
                        <View style={{ borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 6 }}>
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>{vendorName}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{shopName}</Text>
                          <Text style={{ color: YELLOW, fontSize: 10, fontWeight: '800', marginTop: 2 }}>⭐ {Number(ratingVal).toFixed(1)} Rating</Text>
                        </View>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, flex: 1 }} numberOfLines={5}>
                          {q.message || q.notes || 'No message provided.'}
                        </Text>
                        <TouchableOpacity
                          style={{ backgroundColor: '#10B981', paddingVertical: 8, alignItems: 'center' }}
                          onPress={() => {
                            setCompareModalOpen(false);
                            handleAcceptQuote(q._id || q.id || '');
                          }}>
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>ACCEPT THIS BID</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BLACK },
  container: { flex: 1, backgroundColor: BLACK },
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  tabNavRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: Spacing.four,
    gap: 4,
  },
  tabNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabNavBtnActive: {
    backgroundColor: YELLOW,
    borderBottomColor: YELLOW,
  },
  tabNavText: {
    fontSize: 10,
    fontWeight: '900',
    color: YELLOW,
    letterSpacing: 0.5,
  },
  tabNavTextActive: {
    color: BLACK,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    padding: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    color: '#EF4444',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  typeSwitchRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
  },
  typeBtnActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  typeBtnTextActive: {
    color: BLACK,
  },
  formSection: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.four,
    gap: 12,
    marginBottom: Spacing.four,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: YELLOW,
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 6,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: Spacing.three,
    height: 46,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: Spacing.three,
    height: 46,
    gap: 8,
  },
  dropdownBtnText: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  dropdownPlaceholder: {
    color: 'rgba(255,255,255,0.4)',
  },
  pincodeMsg: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  icon: { marginRight: 4 },
  rupeePrefix: {
    color: YELLOW,
    fontWeight: '900',
    marginRight: 6,
    fontSize: FontSize.sm,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optChip: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optChipActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  optChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
  },
  optChipTextActive: {
    color: BLACK,
    fontWeight: '900',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  checkboxLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '700',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  urgencyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 10,
  },
  urgencyBtnActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  urgencyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '800',
  },
  urgencyTextActive: {
    color: BLACK,
    fontWeight: '900',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: YELLOW,
    height: 50,
  },
  submitBtnPressed: { opacity: 0.8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: {
    color: BLACK,
    fontSize: FontSize.sm,
    fontWeight: '900',
    letterSpacing: 1,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    textAlign: 'center',
    maxWidth: 280,
  },
  createFirstBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  createFirstBtnText: {
    color: BLACK,
    fontWeight: '900',
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  reqCard: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.four,
    gap: 8,
  },
  reqCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  reqTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  reqMeta: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statusChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiSpecsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  aiSpecsBtnText: {
    color: BLACK,
    fontSize: 10,
    fontWeight: '900',
  },
  statusChipText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
  },
  quotePriceChip: {
    backgroundColor: YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quotePriceText: {
    color: BLACK,
    fontSize: 12,
    fontWeight: '900',
  },
  reqDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  reqDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  reqDetailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BLACK,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reqDetailLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
  },
  reqDetailVal: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  quoteActionRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  chatVendorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: YELLOW,
    paddingVertical: 8,
  },
  chatVendorBtnText: {
    color: BLACK,
    fontSize: 11,
    fontWeight: '900',
  },

  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderTopWidth: 2,
    borderTopColor: YELLOW,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: Spacing.two,
  },
  modalTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 1 },
  closeBtn: {
    width: 28,
    height: 28,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: Spacing.three,
    height: 40,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.xs,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BLACK,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 6,
  },
  pickerItemSelected: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  pickerItemText: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginLeft: 8,
  },
  pickerItemTextSelected: {
    color: BLACK,
    fontWeight: '900',
  },
});
