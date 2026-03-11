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

  // Home
  'home.heroTitle': { tr: 'Hayalinizdeki Evi veya Arsayı Bulun', en: 'Find Your Dream Home or Land' },
  'home.heroSubtitle': { tr: 'Binlerce ilan arasından size en uygun olanı seçin', en: 'Choose the perfect one among thousands of listings' },
  'home.searchPlaceholder': { tr: 'Şehir, ilçe veya mahalle ara...', en: 'Search city, district or neighborhood...' },
  'home.search': { tr: 'İlan Ara', en: 'Search' },
  'home.searchButton': { tr: 'İlan Ara', en: 'Search' },

  'home.feature1.title': { tr: 'Geniş Portföy', en: 'Wide Portfolio' },
  'home.feature1.desc': { tr: 'Satılık ve kiralık birçok gayrimenkul seçeneğini tek yerde inceleyin.', en: 'Browse many sale and rental property options in one place.' },

  'home.feature2.title': { tr: 'Güvenilir Hizmet', en: 'Reliable Service' },
  'home.feature2.desc': { tr: 'Doğru bilgi ve profesyonel destekle kararınızı güvenle verin.', en: 'Make your decision confidently with accurate information and professional support.' },

  'home.feature3.title': { tr: 'Uzman Danışmanlık', en: 'Expert Consultancy' },
  'home.feature3.desc': { tr: 'Bölgeye hâkim ekibimizle ihtiyaçlarınıza uygun çözümler sunuyoruz.', en: 'Our local expert team provides solutions tailored to your needs.' },

  'home.featuredTitle': { tr: 'Öne Çıkan Gayrimenkuller', en: 'Featured Properties' },
  'home.featuredProperties': { tr: 'Öne Çıkan Gayrimenkuller', en: 'Featured Properties' },
  'home.featuredVehicles': { tr: 'Öne Çıkan Araçlar', en: 'Featured Vehicles' },
  'home.viewAll': { tr: 'Tümünü Gör', en: 'View All' },
  'home.noFeatured': { tr: 'Şu anda öne çıkan ilan bulunmuyor.', en: 'There are no featured listings at the moment.' },

  'home.ctaTitle': { tr: 'Size Uygun Gayrimenkulü Hemen Keşfedin', en: 'Discover the Right Property for You' },
  'home.ctaSubtitle': { tr: 'Portföyümüzdeki ilanları inceleyin, size en uygun seçeneği kolayca bulun.', en: 'Browse our listings and easily find the option that suits you best.' },
  'home.ctaButton': { tr: 'İlanları Görüntüle', en: 'View Listings' },

  // Filters
  'filter.showFilters': { tr: 'Filtreleri Göster', en: 'Show Filters' },
  'filter.hideFilters': { tr: 'Filtreleri Gizle', en: 'Hide Filters' },
  'filter.status': { tr: 'Durum', en: 'Status' },
  'filter.priceRange': { tr: 'Fiyat Aralığı', en: 'Price Range' },

  // Common
  'common.loading': { tr: 'Yükleniyor...', en: 'Loading...' },
  'common.noResults': { tr: 'Sonuç bulunamadı.', en: 'No results found.' },
  'common.back': { tr: 'Geri Dön', en: 'Back' },

  // Detail
  'detail.description': { tr: 'Açıklama', en: 'Description' },

  // Cookie
  'cookie.text': {
    tr: 'Sitemizde deneyiminizi geliştirmek için çerezler kullanıyoruz. Devam ederek çerez kullanımını kabul edebilir veya reddedebilirsiniz.',
    en: 'We use cookies to improve your experience on our website. You can accept or reject cookie usage.',
  },
  'cookie.reject': { tr: 'Reddet', en: 'Reject' },
  'cookie.accept': { tr: 'Kabul Et', en: 'Accept' },

  // Footer
  'footer.about': {
    tr: 'Varol Gayrimenkul olarak Denizli ve çevresinde güvenilir, hızlı ve profesyonel emlak danışmanlığı sunuyoruz.',
    en: 'As Varol Real Estate, we provide reliable, fast, and professional real estate consultancy in Denizli and surrounding areas.',
  },
  'footer.quickLinks': { tr: 'Hızlı Bağlantılar', en: 'Quick Links' },
  'footer.contact': { tr: 'İletişim', en: 'Contact' },
  'footer.rights': { tr: '© 2026 Varol Gayrimenkul. Tüm hakları saklıdır.', en: '© 2026 Varol Real Estate. All rights reserved.' },

  // Share
  'share.title': { tr: 'İlanı Paylaş', en: 'Share Listing' },
  'share.whatsapp': { tr: 'WhatsApp', en: 'WhatsApp' },
  'share.facebook': { tr: 'Facebook', en: 'Facebook' },
  'share.instagram': { tr: 'Instagram', en: 'Instagram' },
  'share.copyLink': { tr: 'Linki Kopyala', en: 'Copy Link' },
  'share.copied': { tr: 'Link kopyalandı!', en: 'Link copied!' },

  // AI
  'ai.greeting': {
    tr: 'Merhaba! Ben Varol Gayrimenkul AI asistanıyım. Size nasıl yardımcı olabilirim?',
    en: 'Hello! I am the Varol Real Estate AI assistant. How can I help you?',
  },
  'ai.inactive': {
    tr: 'AI özelliği şu anda aktif değil. Yönetim panelinden API anahtarı eklendiğinde kullanılabilir.',
    en: 'The AI feature is not active right now. It will work after an API key is added.',
  },
  'ai.placeholder': { tr: 'Mesajınızı yazın...', en: 'Type your message...' },
  'ai.send': { tr: 'Gönder', en: 'Send' },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'varol_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('tr');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'tr' || saved === 'en') {
        setLanguageState(saved);
      }
    } catch (e) {
      console.error('Storage error', e);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.error('Storage set error', e);
    }
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
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}