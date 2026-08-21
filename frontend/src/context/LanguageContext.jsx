import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const dictionary = {
  en: {
    // Navigation
    home: 'Home',
    about: 'About',
    marketplace: 'Marketplace',
    local_reels: 'Local Reels',
    pricing: 'Pricing',
    sign_in: 'Sign In',
    get_started: 'Get Started',
    go_to_dashboard: 'Go to Dashboard',

    // Hero & Home
    hero_headline_1: 'Products. Services. Real Results.',
    hero_subtitle: 'Discover verified local vendors, watch product reels, chat directly, and secure fair business deals.',
    start_exploring: 'Start Exploring',
    business_cta: "I'm a Business",
    social_proof: '12,000+ businesses growing on BizReels',

    // Section Titles
    trending_title: 'Trending Products & Services',
    featured_badge: 'Featured',
    top_pick_badge: 'Top Pick',
    view_all: 'View All',
    get_quote: 'Get Quote',
    order_now: 'Get Quote',

    // Categories
    explore_categories: 'Explore All Categories',
    browse_by_industry: 'Browse marketplace by industry and specializations',
    view_marketplace_feed: 'View Marketplace Feed →',

    // Stats
    stat_businesses: 'Verified Businesses',
    stat_leads: 'Leads Generated',
    stat_products: 'Products & Services',
    stat_volume: 'Business Volume',

    // Why Choose
    why_choose_title: 'Why Businesses Choose BizReels',
    why_point_1: 'Targeted buyers actively looking to purchase',
    why_point_2: 'Short reels that explain and sell better',
    why_point_3: 'High-intent leads delivered directly to your dashboard',
    why_point_4: 'Transparent direct chat and fair pricing',
    learn_more: 'Learn More',

    // Customer Portal Specific
    customer_portal: 'Customer Portal',
    welcome_back: 'Welcome Back',
    quick_actions: 'Quick Actions',
    post_new_req: 'Post Requirement',
    browse_vendors: 'Browse Vendors',
    explore_reels: 'Explore Reels',
    chat_vendors: 'Chat Vendors',
    recent_requirements: 'Recent Requirements',
    all_requirements: 'All Requirements',
    active_requirements: 'Active Requirements',
    closed_requirements: 'Closed Requirements',
    received_quotes: 'Received Quotes',
    no_requirements: 'No requirements posted yet.',

    // Forms & Inputs
    req_type_select: 'Requirement Type',
    prod_req: 'Product Requirement',
    serv_req: 'Service Requirement',
    prod_title_label: 'Product Title',
    serv_title_label: 'Service Title',
    category_label: 'Category',
    subcategory_label: 'Subcategory',
    budget_label: 'Budget Range (₹)',
    quantity_label: 'Quantity',
    location_label: 'Location Details',
    delivery_date_label: 'Expected Delivery Date',
    description_label: 'Description',
    upload_photos: 'Upload Photos',
    upload_video: 'Upload Video',
    submit_req: 'Post Requirement',
    submitting: 'Publishing...',

    // Search & Marketplace
    search_placeholder: 'Search products, services, or local businesses...',
    filter_by: 'Filter By',
    all_categories: 'All Categories',
    min_price: 'Min Price',
    max_price: 'Max Price',
    verified_only: 'Verified Only',
    distance_radius: 'Distance Radius',

    // Common
    views: 'views',
    leads: 'leads',
    post_requirement: 'Post Requirement',
    my_requirements: 'My Requirements',
    notifications: 'Notifications',
    settings: 'Settings',
    chat: 'Chat',
    activities: 'Activities',
    vendor_portal: 'Vendor Portal',
    creator_portal: 'Creator Portal',
    become_vendor: 'Become a Vendor',
    become_creator: 'Become a Creator',

    // Vendor Navigation & Section Titles
    vendor_nav_dashboard: 'Dashboard',
    vendor_nav_listings: 'My Listings',
    vendor_nav_reels: 'Reels & AI Ads',
    vendor_nav_leads: 'Leads / Enquiries',
    vendor_nav_orders: 'Order Requests',
    vendor_nav_chat: 'Chat / Inbox',
    vendor_nav_profile: 'Business Profile',
    vendor_nav_verification: 'Verification Center',
    vendor_nav_analytics: 'Analytics',
    vendor_nav_referrals: 'Refer & Earn',
    vendor_nav_hire: 'Hire Creator',
    vendor_nav_reviews: 'Reviews',
    vendor_nav_followers: 'Followers',
    vendor_nav_subscription: 'Subscription',
    vendor_nav_wallet: 'Vendor Wallet',
    vendor_nav_credit_rates: 'Credit Rates',
    vendor_nav_settings: 'Settings',

    // Vendor Status & Actions
    shop_open: 'Shop Open',
    shop_closed: 'Shop Closed',
    verify_now: 'Verify Now',
    verified_vendor: 'Verified Vendor',
    unverified_vendor: 'Unverified Vendor',
    premium_verified: 'Premium Verified',
    total_leads_label: 'Total Leads',
    active_listings_label: 'Active Listings',
    reels_posted_label: 'Reels & Ads',
    wallet_balance_label: 'Wallet Balance',
    add_new_listing: '+ Add New Listing',
    upload_new_reel: '+ Upload New Reel',
    reply_lead: 'Reply Lead',
    view_details: 'View Details',
    switch_role: 'Switch Active Role'
  },
  hi: {
    // Navigation
    home: 'होम',
    about: 'हमारे बारे में',
    marketplace: 'मार्केटप्लेस',
    local_reels: 'लोकल रील्स',
    pricing: 'मूल्य निर्धारण',
    sign_in: 'साइन इन',
    get_started: 'शुरू करें',
    go_to_dashboard: 'डैशबोर्ड पर जाएं',

    // Hero & Home
    hero_headline_1: 'उत्पाद। सेवाएं। वास्तविक परिणाम।',
    hero_subtitle: 'सत्यापित स्थानीय विक्रेताओं की खोज करें, उत्पाद रील्स देखें, सीधे चैट करें और निष्पक्ष व्यापार सौदे हासिल करें।',
    start_exploring: 'अन्वेषण शुरू करें',
    business_cta: 'व्यापार विक्रेता',
    social_proof: '12,000+ व्यवसाय बिजरील्स पर बढ़ रहे हैं',

    // Section Titles
    trending_title: 'ट्रेंडिंग उत्पाद और सेवाएं',
    featured_badge: 'विशेष',
    top_pick_badge: 'शीर्ष पसंद',
    view_all: 'सभी देखें',
    get_quote: 'कोटेशन प्राप्त करें',
    order_now: 'कोटेशन प्राप्त करें / ऑर्डर करें',

    // Categories
    explore_categories: 'सभी श्रेणियों का अन्वेषण करें',
    browse_by_industry: 'उद्योग और विशेष सेवाओं द्वारा मार्केटप्लेस ब्राउज़ करें',
    view_marketplace_feed: 'मार्केटप्लेस फीड देखें →',

    // Stats
    stat_businesses: 'सत्यापित व्यवसाय',
    stat_leads: 'प्राप्त लीड्स',
    stat_products: 'उत्पाद एवं सेवाएं',
    stat_volume: 'कुल व्यापार मात्रा',

    // Why Choose
    why_choose_title: 'व्यवसाय बिजरील्स क्यों चुनते हैं',
    why_point_1: 'खरीदने के लिए सक्रिय रूप से लक्षित दर्शक',
    why_point_2: 'छोटे रील्स जो बेहतर समझाते और बेचते हैं',
    why_point_3: 'आपके डैशबोर्ड पर डिलीवर की गई गुणवत्तापूर्ण लीड्स',
    why_point_4: 'पारदर्शी रूप से सीधा चैट और उचित मूल्य निर्धारण',
    learn_more: 'अधिक जानें',

    // Customer Portal Specific
    customer_portal: 'ग्राहक पोर्टल',
    welcome_back: 'पुनः स्वागत है',
    quick_actions: 'त्वरित कार्य',
    post_new_req: 'नई आवश्यकता पोस्ट करें',
    browse_vendors: 'स्थानीय विक्रेता खोजें',
    explore_reels: 'रील्स देखें',
    chat_vendors: 'विक्रेताओं से चैट करें',
    recent_requirements: 'हाल की आवश्यकताएं',
    all_requirements: 'सभी आवश्यकताएं',
    active_requirements: 'सक्रिय आवश्यकताएं',
    closed_requirements: 'बंद आवश्यकताएं',
    received_quotes: 'प्राप्त कोटेशन्स',
    no_requirements: 'अभी तक कोई आवश्यकता पोस्ट नहीं की गई है।',

    // Forms & Inputs
    req_type_select: 'आवश्यकता प्रकार चुनें',
    prod_req: 'उत्पाद आवश्यकता',
    serv_req: 'सेवा आवश्यकता',
    prod_title_label: 'उत्पाद का शीर्षक',
    serv_title_label: 'सेवा विवरण शीर्षक',
    category_label: 'श्रेणी',
    subcategory_label: 'उपश्रेणी',
    budget_label: 'बजट सीमा (₹)',
    quantity_label: 'आवश्यक मात्रा',
    location_label: 'स्थान विवरण',
    delivery_date_label: 'अपेक्षित डिलीवरी तिथि',
    description_label: 'विवरण और तकनीकी विवरण',
    upload_photos: 'संदर्भ चित्र अपलोड करें',
    upload_video: 'उत्पाद वीडियो अपलोड करें',
    submit_req: 'आवश्यकता अभी पोस्ट करें',
    submitting: 'आवश्यकता प्रकाशित हो रही है...',

    // Search & Marketplace
    search_placeholder: 'उत्पाद, सेवाएं या स्थानीय व्यवसाय खोजें...',
    filter_by: 'फ़िल्टर करें',
    all_categories: 'सभी श्रेणियां',
    min_price: 'न्यूनतम मूल्य',
    max_price: 'अधिकतम मूल्य',
    verified_only: 'केवल सत्यापित विक्रेता',
    distance_radius: 'दूरी त्रिज्या',

    // Common
    views: 'देखा गया',
    leads: 'लीड्स',
    post_requirement: 'आवश्यकता पोस्ट करें',
    my_requirements: 'मेरी आवश्यकताएं',
    notifications: 'सूचनाएं',
    settings: 'सेटिंग्स',
    chat: 'चैट',
    activities: 'गतिविधियां',
    vendor_portal: 'विक्रेता पोर्टल',
    creator_portal: 'क्रिएटर पोर्टल',
    become_vendor: 'विक्रेता बनें',
    become_creator: 'क्रिएटर बनें',

    // Vendor Navigation & Section Titles
    vendor_nav_dashboard: 'डैशबोर्ड',
    vendor_nav_listings: 'मेरी लिस्टिंग्स',
    vendor_nav_reels: 'रील्स व विज्ञापन',
    vendor_nav_leads: 'लीड्स व पूछताछ',
    vendor_nav_orders: 'ऑर्डर अनुरोध',
    vendor_nav_chat: 'चैट इनबॉक्स',
    vendor_nav_profile: 'बिजनेस प्रोफाइल',
    vendor_nav_verification: 'सत्यापन केंद्र',
    vendor_nav_analytics: 'एनालिटिक्स',
    vendor_nav_referrals: 'रेफर करें और कमाएं',
    vendor_nav_hire: 'क्रिएटर हायर करें',
    vendor_nav_reviews: 'समीक्षाएं',
    vendor_nav_followers: 'फॉलोअर्स',
    vendor_nav_subscription: 'सब्सक्रिप्शन',
    vendor_nav_wallet: 'विक्रेता वॉलेट',
    vendor_nav_credit_rates: 'क्रेडिट दरें',
    vendor_nav_settings: 'सेटिंग्स',

    // Vendor Status & Actions
    shop_open: 'दुकान खुली है',
    shop_closed: 'दुकान बंद है',
    verify_now: 'अभी सत्यापित करें',
    verified_vendor: 'सत्यापित विक्रेता',
    unverified_vendor: 'अपुष्ट विक्रेता',
    premium_verified: 'प्रीमियम सत्यापित',
    total_leads_label: 'कुल प्राप्त लीड्स',
    active_listings_label: 'सक्रिय लिस्टिंग्स',
    reels_posted_label: 'रील्स और विज्ञापन',
    wallet_balance_label: 'वॉलेट बैलेंस',
    add_new_listing: '+ नई लिस्टिंग जोड़ें',
    upload_new_reel: '+ नई रील अपलोड करें',
    reply_lead: 'लीड का जवाब दें',
    view_details: 'विवरण देखें',
    switch_role: 'सक्रिय भूमिका बदलें'
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('bizreels_lang') || 'en';
  });

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('bizreels_lang', newLang);
  };

  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
  };

  const t = (key, fallbackEn, fallbackHi) => {
    if (dictionary[lang]?.[key]) {
      return dictionary[lang][key];
    }
    if (lang === 'hi' && fallbackHi) return fallbackHi;
    if (fallbackEn) return fallbackEn;
    return dictionary.en[key] || key;
  };

  const bi = (enLabel, hiLabel) => {
    return lang === 'hi' ? hiLabel : enLabel;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, bi }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
