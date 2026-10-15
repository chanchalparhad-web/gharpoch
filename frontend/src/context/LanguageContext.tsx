import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'mr' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, defaultText?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  mr: {
    // Brand
    'brand.name': 'घरपोच',
    'brand.tagline': 'ऑर्डर तुमची, डिलिव्हरी आमची!',
    'nav.home': 'होम',
    'nav.search': 'शोधा',
    'nav.orders': 'ऑर्डर्स',
    'nav.profile': 'प्रोफाइल',
    'nav.admin': 'प्रशासक',
    'nav.restaurant': 'हॉटेल डॅशबोर्ड',
    'nav.delivery': 'डिलिव्हरी पार्टनर',

    // Hero
    'hero.title': 'भूक लागलीये?',
    'hero.subtitle': 'तुमच्या आवडीचे जेवण आता घरपोच!',
    'hero.features': 'स्थानिक हॉटेल्स • सोपी ऑर्डर • जलद डिलिव्हरी',
    'hero.deliveringTo': 'डिलिव्हरी ठिकाण',

    // Discovery & Filter
    'categories.title': 'खाद्यपदार्थ प्रकार',
    'restaurants.nearYou': 'तुमच्या जवळची हॉटेल्स',
    'restaurants.closed': 'सध्या बंद आहे',
    'restaurants.open': 'ऑर्डर चालू आहे',
    'restaurants.prepTime': 'मिनिटे',
    'restaurants.minOrder': 'किमान ऑर्डर',
    'restaurants.deliveryFee': 'डिलिव्हरी शुल्क चेकआउटला दिसेल',
    'filter.all': 'सर्व',
    'filter.veg': 'शुद्ध शाकाहारी',
    'filter.nonveg': 'मांसाहारी',

    // Menu
    'menu.addToCart': '+ जोडा',
    'menu.added': 'जोडले',
    'menu.outOfStock': 'संपले आहे (Out of stock)',
    'menu.specialInstructions': 'काही विशेष सूचना (उदा. कमी तिखट)?',

    // Cart & Checkout
    'cart.title': 'तुमची कार्ट',
    'cart.empty': 'तुमची कार्ट रिकामी आहे',
    'cart.emptySub': 'हॉटेल निवडून तुमच्या आवडीचे जेवण निवडा.',
    'cart.subtotal': 'पदार्थांची रक्कम',
    'cart.deliveryFee': 'गाव डिलिव्हरी शुल्क',
    'cart.platformFee': 'प्लॅटफॉर्म शुल्क',
    'cart.total': 'एकूण देय रक्कम',
    'cart.checkoutBtn': 'ऑर्डर द्या (रोख पैसे / COD)',
    'cart.itemConflictTitle': 'दुसऱ्या हॉटेलमधून ऑर्डर?',
    'cart.itemConflictDesc': 'एका वेळी एकाच हॉटेलमधून ऑर्डर करता येते. नवीन हॉटेल सुरू केल्यास जुनी कार्ट रीसेट होईल.',
    'cart.clearAndAdd': 'हो, नवीन हॉटेल निवडा',
    'cart.keepOld': 'रद्द करा',

    // Checkout Modal
    'checkout.title': 'ऑर्डर निश्चित करा',
    'checkout.customerName': 'तुमचे संपूर्ण नाव',
    'checkout.customerPhone': 'मोबाईल नंबर',
    'checkout.village': 'गाव / विभाग',
    'checkout.addressLine': 'घर क्र. / गल्ली / रस्ता',
    'checkout.landmark': 'जवळची खूण (Landmark)',
    'checkout.paymentMethod': 'पेमेंट पद्धत',
    'checkout.codNotice': 'जेवण घरपोच मिळाल्यावर डिलिव्हरी बॉयला रोख रक्कम द्या.',
    'checkout.placeOrderBtn': 'ऑर्डर पूर्ण करा (Confirm Order)',

    // Order Tracking
    'tracking.title': 'ऑर्डर ट्रॅकिंग',
    'tracking.orderNumber': 'ऑर्डर क्र.',
    'tracking.otpLabel': 'डिलिव्हरी ओटीपी (OTP):',
    'tracking.otpDesc': 'जेवण मिळाल्यावर हा कोड डिलिव्हरी पार्टनरला सांगा.',
    'tracking.step1': 'ऑर्डर नोंदवली',
    'tracking.step2': 'हॉटेलने स्वीकारली',
    'tracking.step3': 'जेवण तयार होत आहे',
    'tracking.step4': 'डिलिव्हरी पार्टनर नियुक्त',
    'tracking.step5': 'डिलिव्हरीसाठी निघाले',
    'tracking.step6': 'घरपोच पोहोचवले',
    'tracking.cancelBtn': 'ऑर्डर रद्द करा',
    'tracking.callHotel': 'हॉटेलला कॉल करा',
    'tracking.callRider': 'डिलिव्हरी पार्टनरला कॉल करा',
  },
  en: {
    // Brand
    'brand.name': 'GharPoch',
    'brand.tagline': 'Your Order, Our Delivery!',
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.orders': 'Orders',
    'nav.profile': 'Profile',
    'nav.admin': 'Admin',
    'nav.restaurant': 'Restaurant KDS',
    'nav.delivery': 'Delivery Partner',

    // Hero
    'hero.title': 'Hungry?',
    'hero.subtitle': 'Your favourite food delivered to your doorstep!',
    'hero.features': 'Local Hotels • Easy Ordering • Fast Village Delivery',
    'hero.deliveringTo': 'Delivering to',

    // Discovery & Filter
    'categories.title': 'Food Categories',
    'restaurants.nearYou': 'Restaurants Near You',
    'restaurants.closed': 'Currently Closed',
    'restaurants.open': 'Accepting Orders',
    'restaurants.prepTime': 'mins',
    'restaurants.minOrder': 'Min. Order',
    'restaurants.deliveryFee': 'Delivery fee calculated at checkout',
    'filter.all': 'All',
    'filter.veg': 'Pure Veg',
    'filter.nonveg': 'Non-Veg',

    // Menu
    'menu.addToCart': '+ Add',
    'menu.added': 'Added',
    'menu.outOfStock': 'Out of Stock',
    'menu.specialInstructions': 'Special cooking instructions (e.g. medium spicy)?',

    // Cart & Checkout
    'cart.title': 'Your Food Cart',
    'cart.empty': 'Your cart is empty',
    'cart.emptySub': 'Browse delicious dishes from local hotels to start.',
    'cart.subtotal': 'Food Subtotal',
    'cart.deliveryFee': 'Village Delivery Fee',
    'cart.platformFee': 'Platform Fee',
    'cart.total': 'Total Payable Amount',
    'cart.checkoutBtn': 'Place Order (Cash on Delivery)',
    'cart.itemConflictTitle': 'Order from different hotel?',
    'cart.itemConflictDesc': 'Orders can only contain items from a single hotel. Changing hotel will reset your current cart.',
    'cart.clearAndAdd': 'Yes, Switch Hotel',
    'cart.keepOld': 'Keep Existing Cart',

    // Checkout Modal
    'checkout.title': 'Confirm Checkout Details',
    'checkout.customerName': 'Full Name',
    'checkout.customerPhone': '10-digit Mobile Number',
    'checkout.village': 'Village / Locality',
    'checkout.addressLine': 'House No. / Lane / Street',
    'checkout.landmark': 'Landmark (Temple, School, etc.)',
    'checkout.paymentMethod': 'Payment Method',
    'checkout.codNotice': 'Pay cash to the delivery partner upon receiving food.',
    'checkout.placeOrderBtn': 'Place Order Now',

    // Order Tracking
    'tracking.title': 'Live Order Tracker',
    'tracking.orderNumber': 'Order #',
    'tracking.otpLabel': 'Delivery OTP:',
    'tracking.otpDesc': 'Share this 4-digit code with the delivery partner upon arrival.',
    'tracking.step1': 'Order Placed',
    'tracking.step2': 'Hotel Confirmed',
    'tracking.step3': 'Preparing Food',
    'tracking.step4': 'Delivery Partner Assigned',
    'tracking.step5': 'Out for Delivery',
    'tracking.step6': 'Delivered',
    'tracking.cancelBtn': 'Cancel Order',
    'tracking.callHotel': 'Call Hotel',
    'tracking.callRider': 'Call Rider',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'mr',
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string, def?: string) => def || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('gharpoch_lang') as Language) || 'mr';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('gharpoch_lang', newLang);
  };

  const toggleLang = () => {
    setLang(lang === 'mr' ? 'en' : 'mr');
  };

  const t = (key: string, defaultText?: string): string => {
    return translations[lang]?.[key] || translations['en']?.[key] || defaultText || key;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
