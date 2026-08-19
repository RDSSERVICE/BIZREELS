import React, { createContext, useContext, useState } from 'react';

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
    hero_headline_1: 'PRODUCTS. SERVICES. REAL RESULTS.',
    hero_subtitle: 'Discover local verified vendors, watch product reels, chat directly, and secure fair business deals across India.',
    start_exploring: 'Start Exploring',
    business_cta: 'I\'m a Business',
    social_proof: '12K+ businesses growing on BizReels',

    // Section Titles
    trending_title: 'Trending Products & Services',
    featured_badge: 'Featured',
    top_pick_badge: 'Top Pick Product',
    view_all: 'View All',
    get_quote: 'Get Quote',
    order_now: 'Get Quote / Order Now',

    // Categories
    explore_categories: 'Explore All Categories',
    browse_by_industry: 'Browse marketplace by industry & specialized services',
    view_marketplace_feed: 'View Marketplace Feed →',

    // Stats
    stat_businesses: 'Businesses',
    stat_leads: 'Leads Generated',
    stat_products: 'Products & Services',
    stat_volume: 'Business Volume',

    // Why Choose
    why_choose_title: 'Why Businesses Choose BizReels',
    why_point_1: 'Targeted audience actively looking to buy',
    why_point_2: 'Short reels that explain and sell better',
    why_point_3: 'Quality leads delivered to your dashboard',
    why_point_4: 'Direct chat & fair pricing transparently',
    learn_more: 'Learn More',

    // Customer Portal Specific
    customer_portal: 'Customer Portal',
    welcome_back: 'Welcome back',
    quick_actions: 'Quick Actions',
    post_new_req: 'Post New Requirement',
    browse_vendors: 'Browse Local Vendors',
    explore_reels: 'Explore Reels',
    chat_vendors: 'Chat with Vendors',
    recent_requirements: 'Recent Requirements',
    all_requirements: 'All Requirements',
    active_requirements: 'Active Requirements',
    closed_requirements: 'Closed Requirements',
    received_quotes: 'Received Quotes',
    no_requirements: 'No requirements posted yet.',
    
    // Forms & Inputs
    req_type_select: 'Select Requirement Type',
    prod_req: 'Product Requirement',
    serv_req: 'Service Requirement',
    prod_title_label: 'Product Title',
    serv_title_label: 'Service Brief Title',
    category_label: 'Category',
    subcategory_label: 'Subcategory',
    budget_label: 'Budget Range (₹)',
    quantity_label: 'Quantity Required',
    location_label: 'Location Details',
    delivery_date_label: 'Expected Delivery Date',
    description_label: 'Description & Detailed Specs',
    upload_photos: 'Upload Reference Images',
    upload_video: 'Upload Product Video',
    submit_req: 'Post Requirement Now',
    submitting: 'Publishing Requirement...',

    // Search & Marketplace
    search_placeholder: 'Search products, services, or local businesses...',
    filter_by: 'Filter By',
    all_categories: 'All Categories',
    min_price: 'Min Price',
    max_price: 'Max Price',
    verified_only: 'Verified Vendors Only',
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
    become_creator: 'Become a Creator'
  },
  hi: {
    // Navigation
    home: 'होम (Home)',
    about: 'हमारे बारे में (About)',
    marketplace: 'मार्केटप्लेस (Marketplace)',
    local_reels: 'लोकल रील्स (Local Reels)',
    pricing: 'मूल्य निर्धारण (Pricing)',
    sign_in: 'साइन इन (Sign In)',
    get_started: 'शुरू करें (Get Started)',
    go_to_dashboard: 'डैशबोर्ड पर जाएं (Go to Dashboard)',

    // Hero & Home
    hero_headline_1: 'उत्पाद। सेवाएं। वास्तविक परिणाम।',
    hero_subtitle: 'सत्यापित स्थानीय विक्रेताओं की खोज करें, उत्पाद रील्स देखें, सीधे चैट करें और निष्पक्ष व्यापार सौदे हासिल करें।',
    start_exploring: 'अन्वेषण शुरू करें (Start Exploring)',
    business_cta: 'व्यापार विक्रेता (I\'m a Business)',
    social_proof: '12,000+ व्यवसाय बिजरील्स पर बढ़ रहे हैं',

    // Section Titles
    trending_title: 'ट्रेंडिंग उत्पाद और सेवाएं (Trending)',
    featured_badge: 'विशेष (Featured)',
    top_pick_badge: 'शीर्ष पसंद (Top Pick)',
    view_all: 'सभी देखें (View All)',
    get_quote: 'कोटेशन प्राप्त करें (Get Quote)',
    order_now: 'कोटेशन प्राप्त करें / ऑर्डर करें (Get Quote)',

    // Categories
    explore_categories: 'सभी श्रेणियों का अन्वेषण करें (Explore Categories)',
    browse_by_industry: 'उद्योग और विशेष सेवाओं द्वारा मार्केटप्लेस ब्राउज़ करें',
    view_marketplace_feed: 'मार्केटप्लेस फीड देखें →',

    // Stats
    stat_businesses: 'सत्यापित व्यवसाय (Businesses)',
    stat_leads: 'प्राप्त लीड्स (Leads Generated)',
    stat_products: 'उत्पाद एवं सेवाएं (Products & Services)',
    stat_volume: 'कुल व्यापार मात्रा (Business Volume)',

    // Why Choose
    why_choose_title: 'व्यवसाय बिजरील्स क्यों चुनते हैं',
    why_point_1: 'खरीदने के लिए सक्रिय रूप से लक्षित दर्शक',
    why_point_2: 'छोटे रील्स जो बेहतर समझाते और बेचते हैं',
    why_point_3: 'आपके डैशबोर्ड पर डिलीवर की गई गुणवत्तापूर्ण लीड्स',
    why_point_4: 'पारदर्शी रूप से सीधा चैट और उचित मूल्य निर्धारण',
    learn_more: 'अधिक जानें (Learn More)',

    // Customer Portal Specific
    customer_portal: 'ग्राहक पोर्टल (Customer Portal)',
    welcome_back: 'पुनः स्वागत है (Welcome Back)',
    quick_actions: 'त्वरित कार्य (Quick Actions)',
    post_new_req: 'नई आवश्यकता पोस्ट करें (Post Requirement)',
    browse_vendors: 'स्थानीय विक्रेता खोजें (Browse Vendors)',
    explore_reels: 'रील्स देखें (Explore Reels)',
    chat_vendors: 'विक्रेताओं से चैट करें (Chat Vendors)',
    recent_requirements: 'हाल की आवश्यकताएं (Recent Requirements)',
    all_requirements: 'सभी आवश्यकताएं (All Requirements)',
    active_requirements: 'सक्रिय आवश्यकताएं (Active Requirements)',
    closed_requirements: 'बंद आवश्यकताएं (Closed Requirements)',
    received_quotes: 'प्राप्त कोटेशन्स (Received Quotes)',
    no_requirements: 'अभी तक कोई आवश्यकता पोस्ट नहीं की गई है।',

    // Forms & Inputs
    req_type_select: 'आवश्यकता प्रकार चुनें (Requirement Type)',
    prod_req: 'उत्पाद आवश्यकता (Product Requirement)',
    serv_req: 'सेवा आवश्यकता (Service Requirement)',
    prod_title_label: 'उत्पाद का शीर्षक (Product Title)',
    serv_title_label: 'सेवा विवरण शीर्षक (Service Title)',
    category_label: 'श्रेणी (Category)',
    subcategory_label: 'उपश्रेणी (Subcategory)',
    budget_label: 'बजट सीमा (₹) (Budget Range)',
    quantity_label: 'आवश्यक मात्रा (Quantity)',
    location_label: 'स्थान विवरण (Location Details)',
    delivery_date_label: 'अपेक्षित डिलीवरी तिथि (Delivery Date)',
    description_label: 'विवरण और तकनीकी विवरण (Description)',
    upload_photos: 'संदर्भ चित्र अपलोड करें (Upload Photos)',
    upload_video: 'उत्पाद वीडियो अपलोड करें (Upload Video)',
    submit_req: 'आवश्यकता अभी पोस्ट करें (Post Requirement)',
    submitting: 'आवश्यकता प्रकाशित हो रही है...',

    // Search & Marketplace
    search_placeholder: 'उत्पाद, सेवाएं या स्थानीय व्यवसाय खोजें...',
    filter_by: 'फ़िल्टर करें (Filter By)',
    all_categories: 'सभी श्रेणियां (All Categories)',
    min_price: 'न्यूनतम मूल्य (Min Price)',
    max_price: 'अधिकतम मूल्य (Max Price)',
    verified_only: 'केवल सत्यापित विक्रेता (Verified Only)',
    distance_radius: 'दूरी त्रिज्या (Distance Radius)',

    // Common
    views: 'देखा गया (views)',
    leads: 'लीड्स (leads)',
    post_requirement: 'आवश्यकता पोस्ट करें (Post Requirement)',
    my_requirements: 'मेरी आवश्यकताएं (My Requirements)',
    notifications: 'सूचनाएं (Notifications)',
    settings: 'सेटिंग्स (Settings)',
    chat: 'चैट (Chat)',
    activities: 'गतिविधियां (Activities)',
    vendor_portal: 'विक्रेता पोर्टल (Vendor Portal)',
    creator_portal: 'क्रिएटर पोर्टल (Creator Portal)',
    become_vendor: 'विक्रेता बनें (Become a Vendor)',
    become_creator: 'क्रिएटर बनें (Become a Creator)'
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('bizreels_lang') || 'en';
  });

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem('bizreels_lang', code);
  };

  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
  };

  const t = (key, fallbackEn = '', fallbackHi = '') => {
    if (dictionary[lang] && dictionary[lang][key]) {
      return dictionary[lang][key];
    }
    if (lang === 'hi' && fallbackHi) return fallbackHi;
    return fallbackEn || dictionary.en[key] || key;
  };

  const bi = (enLabel, hiLabel) => {
    if (lang === 'hi') {
      return hiLabel ? `${enLabel} / ${hiLabel}` : enLabel;
    }
    return enLabel;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, bi }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: 'en',
      setLang: () => {},
      toggleLang: () => {},
      t: (key, fallbackEn) => fallbackEn || key,
      bi: (en) => en,
    };
  }
  return ctx;
};
