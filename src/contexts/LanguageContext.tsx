import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'tr' | 'en';

type Dictionary = Record<string, { tr: string; en: string }>;

const dictionary: Dictionary = {
  // Navbar
  'nav.home': { tr: 'Ana Sayfa', en: 'Home' },
  'nav.properties': { tr: 'Gayrimenkul İlanları', en: 'Real Estate Listings' },
  'nav.vehicles': { tr: 'Araç İlanları', en: 'Vehicle Listings' },
  'nav.contact': { tr: 'İletişim', en: 'Contact' },
  'nav.admin': { tr: 'Admin Panel', en: 'Admin Panel' },
  'nav.login': { tr: 'Giriş', en: 'Login' },
  'nav.logout': { tr: 'Çıkış', en: 'Logout' },
  'nav.beInvestor': { tr: 'YATIRIMCIMIZ OL', en: 'BECOME AN INVESTOR' },
  'nav.suggestProperty': { tr: 'GAYRİMENKUL ÖNER', en: 'SUGGEST A PROPERTY' },

  // Home hero
  'home.heroTitle': { tr: 'Hayalinizdeki Evi veya Arsayı Bulun', en: 'Find Your Dream Home or Land' },
  'home.heroSubtitle': { tr: 'Onlarca ilan arasından size en uygun olanı seçin', en: 'Choose the perfect one among dozens of listings' },
  'home.searchPlaceholder': { tr: 'Şehir, ilçe veya mahalle ara...', en: 'Search city, district or neighborhood...' },
  'home.search': { tr: 'Ara', en: 'Search' },

  // Home features
  'home.feature1.title': { tr: 'Geniş İlan Portföyü', en: 'Wide Listing Portfolio' },
  'home.feature1.desc': { tr: 'Satılık ve kiralık onlarca gayrimenkul ilanı', en: 'Dozens of properties for sale and rent' },
  'home.feature2.title': { tr: 'Profesyonel Hizmet', en: 'Professional Service' },
  'home.feature2.desc': { tr: 'Uzman ekibimizle güvenli alışveriş', en: 'Secure experience with our expert team' },
  'home.feature3.title': { tr: 'Güvenilir Platform', en: 'Trusted Platform' },
  'home.feature3.desc': { tr: 'Yıllara dayanan tecrübe ve güven', en: 'Years of experience and trust' },

  // Home listings
  'home.featuredTitle': { tr: 'Öne Çıkan İlanlar', en: 'Featured Listings' },
  'home.viewAll': { tr: 'Tümünü Gör →', en: 'View all →' },
  'home.noFeatured': { tr: 'Henüz öne çıkan ilan bulunmamaktadır.', en: 'No featured listings yet.' },

  // Home CTA
  'home.ctaTitle': { tr: 'Hayalinizdeki Evi veya Arsayı Bulmaya Hazır Mısınız?', en: 'Ready to Find Your Dream Home or Land?' },
  'home.ctaSubtitle': { tr: 'İhtiyacınıza en uygun gayrimenkulleri keşfedin', en: 'Discover the best properties for your needs' },
  'home.ctaButton': { tr: 'İlanları İncele', en: 'Browse Listings' },

  // Property card
  'property.featured': { tr: 'Öne Çıkan', en: 'Featured' },
  'property.rooms': { tr: 'Oda', en: 'Rooms' },

  // Status labels
  'status.for_sale': { tr: 'Satılık', en: 'For Sale' },
  'status.for_rent': { tr: 'Kiralık', en: 'For Rent' },
  'status.sold': { tr: 'Satıldı', en: 'Sold' },
  'status.rented': { tr: 'Kiralandı', en: 'Rented' },

  // Property type labels
  'type.apartment': { tr: 'Daire', en: 'Apartment' },
  'type.villa': { tr: 'Villa', en: 'Villa' },
  'type.office': { tr: 'Ofis', en: 'Office' },
  'type.land': { tr: 'Arsa', en: 'Land' },
  'type.commercial': { tr: 'Ticari', en: 'Commercial' },

  // Footer
  'footer.about': {
    tr: 'Varol Gayrimenkul A.Ş. ile güvenli alım-satım ve yatırım fırsatlarını keşfedin.',
    en: 'Discover secure buying, selling, and investment opportunities with Varol Real Estate Inc.',
  },
  'footer.quickLinks': { tr: 'Hızlı Linkler', en: 'Quick Links' },
  'footer.contact': { tr: 'İletişim', en: 'Contact' },
  'footer.rights': { tr: '© 2025 Varol Gayrimenkul A.Ş. Tüm hakları saklıdır.', en: '© 2025 Varol Real Estate Inc. All rights reserved.' },

  // Cookie
  'cookie.text': {
    tr: 'Gizliliğinize değer veriyoruz. Tarama deneyiminizi geliştirmek için çerezleri kullanıyoruz.',
    en: 'We value your privacy. We use cookies to improve your browsing experience.',
  },
  'cookie.accept': { tr: 'Tümünü Kabul Et', en: 'Accept All' },
  'cookie.reject': { tr: 'Reddet', en: 'Reject' },

  // AI
  'ai.greeting': {
    tr: 'Merhaba! Ben Varol Gayrimenkul AI asistanıyım. Size nasıl yardımcı olabilirim?',
    en: 'Hi! I am the Varol Real Estate AI assistant. How can I help you?'
  },
  'ai.inactive': { tr: 'AI asistan şu an aktif değil', en: 'AI assistant is currently unavailable' },
  'ai.placeholder': { tr: 'Mesajınızı yazın...', en: 'Type your message...' },
  'ai.send': { tr: 'Gönder', en: 'Send' },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'varol_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('tr');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'tr' || saved === 'en') setLanguageState(saved);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: string) => {
    const entry = dictionary[key];
    if (!entry) return key;
    return entry[language];
  };

  const value = useMemo(() => ({ language, setLanguage, t }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
