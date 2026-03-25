// src/pages/PropertyDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  ArrowLeft,
  Share2,
  Copy,
  Heart,
  ChevronLeft,
  ChevronRight,
  Phone,
  Sparkles,
  TrendingUp,
  Building2,
  Maximize,
  Bath,
  Home,
  Layers3,
  BadgePercent,
} from 'lucide-react';
import { Map, Marker, InfoWindow, APIProvider } from '@vis.gl/react-google-maps';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import type { Property } from '../lib/database.types';
import { useLanguage } from '../contexts/LanguageContext';
import PropertyCard from '../components/PropertyCard';
import {
  getDeedStatusLabel,
  getFrontageLabel,
  getHeatingLabel,
  getPropertyTypeLabel,
  getStatusColor,
  getStatusLabel,
  getUsageStatusLabel,
} from '../lib/propertyTranslations';

interface PropertyDetailPageProps {
  propertyId: string;
  onNavigate: (page: string, propertyId?: string) => void;
}

type PropertyWithCoords = Property & {
  latitude?: number | null;
  longitude?: number | null;
  old_price?: number | null;
};

const FAVORITES_STORAGE_KEY = 'varol_property_favorites';
const VIEWED_STORAGE_KEY = 'varol_viewed_properties';
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

const LAND_PROPERTY_TYPES = new Set([
  'land',
  'arsa',
  'tarla',
  'bag',
  'bahce',
  'zeytinlik',
  'tarim_arazisi',
  'farm',
  'field',
  'plot',
]);

const COMMERCIAL_PROPERTY_TYPES = new Set([
  'office',
  'ofis',
  'shop',
  'dukkan',
  'store',
  'magaza',
  'depo',
  'warehouse',
  'fabrika',
  'factory',
  'plaza',
  'building',
  'bina',
  'hotel',
  'otel',
  'akaryakit_istasyonu',
  'gas_station',
  'ticari',
  'commercial',
]);

export default function PropertyDetailPage({ propertyId, onNavigate }: PropertyDetailPageProps) {
  const { language, t } = useLanguage();
  const [property, setProperty] = useState<Property | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    void loadProperty();
  }, [propertyId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!saved) {
        setIsFavorite(false);
        return;
      }

      const parsed = JSON.parse(saved);
      setIsFavorite(Array.isArray(parsed) && parsed.includes(propertyId));
    } catch (error) {
      console.error('Favorite load error:', error);
      setIsFavorite(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (property) {
      void loadSimilarProperties(property);
    }
  }, [property]);

  const saveRecentlyViewedProperty = () => {
    try {
      const saved = localStorage.getItem(VIEWED_STORAGE_KEY);
      const viewedIds: string[] = saved ? JSON.parse(saved) : [];
      const normalizedIds = Array.isArray(viewedIds) ? viewedIds : [];

      const updatedIds = [...normalizedIds.filter((id) => id !== propertyId), propertyId].slice(-12);

      localStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify(updatedIds));
    } catch (error) {
      console.error('Recently viewed save error:', error);
    }
  };

  const increaseViewCountOnce = async () => {
    try {
      const sessionKey = `viewed_once_${propertyId}`;
      const hasViewedInSession = sessionStorage.getItem(sessionKey);

      if (hasViewedInSession === 'true') {
        saveRecentlyViewedProperty();
        return;
      }

      const { data: currentRow, error: readError } = await supabase
        .from('properties')
        .select('views')
        .eq('id', propertyId)
        .single();

      if (readError) throw readError;

      const currentViews =
        currentRow && typeof (currentRow as { views?: unknown }).views === 'number'
          ? ((currentRow as { views?: number }).views ?? 0)
          : 0;

      const { error: updateError } = await supabase
        .from('properties')
        .update({ views: currentViews + 1 } as never)
        .eq('id', propertyId);

      if (updateError) throw updateError;

      sessionStorage.setItem(sessionKey, 'true');
      saveRecentlyViewedProperty();

      setProperty((prev) =>
        prev
          ? {
              ...prev,
              views: currentViews + 1,
            }
          : prev
      );
    } catch (error) {
      console.error('View count update error:', error);
      saveRecentlyViewedProperty();
    }
  };

  const loadProperty = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) throw error;

      setProperty(data as Property);
      setSelectedImage(0);

      await increaseViewCountOnce();
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSimilarProperties = async (currentProperty: Property) => {
    try {
      setSimilarLoading(true);

      const minPrice = Math.max(0, currentProperty.price * 0.7);
      const maxPrice = currentProperty.price * 1.3;

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('moderation_status', 'approved')
        .neq('id', currentProperty.id)
        .eq('city', currentProperty.city)
        .eq('property_type', currentProperty.property_type)
        .gte('price', minPrice)
        .lte('price', maxPrice)
        .order('views', { ascending: false })
        .limit(3);

      if (error) throw error;

      if (data && data.length > 0) {
        setSimilarProperties(data as Property[]);
        return;
      }

      const fallbackResponse = await supabase
        .from('properties')
        .select('*')
        .eq('moderation_status', 'approved')
        .neq('id', currentProperty.id)
        .eq('city', currentProperty.city)
        .order('created_at', { ascending: false })
        .limit(3);

      if (fallbackResponse.error) throw fallbackResponse.error;

      setSimilarProperties((fallbackResponse.data ?? []) as Property[]);
    } catch (error) {
      console.error('Error loading similar properties:', error);
      setSimilarProperties([]);
    } finally {
      setSimilarLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getSchemaType = (type: string) => {
    const map: Record<string, string> = {
      apartment: 'Apartment',
      residence: 'Residence',
      duplex: 'Residence',
      villa: 'SingleFamilyResidence',
      detached_house: 'SingleFamilyResidence',
      office: 'Office',
      shop: 'Store',
      building: 'Residence',
      hotel: 'Hotel',
      hostel: 'Hostel',
      land: 'Place',
      field: 'Place',
      farm: 'Place',
      commercial: 'Place',
    };

    return map[type] || 'Place';
  };

  const getPropertyCategoryForSchema = (type: string) => {
    const map: Record<string, string> = {
      apartment: 'Apartment',
      residence: 'Residence',
      duplex: 'Duplex',
      villa: 'Villa',
      detached_house: 'Detached House',
      land: 'Land',
      field: 'Field',
      farm: 'Farm',
      office: 'Office',
      shop: 'Store',
      building: 'Building',
      commercial: 'Commercial Property',
    };

    return map[type] || 'Real Estate';
  };

  const getAvailabilityForSchema = (status: string) => {
    const map: Record<string, string> = {
      for_sale: 'https://schema.org/InStock',
      for_rent: 'https://schema.org/InStock',
      sold: 'https://schema.org/SoldOut',
      rented: 'https://schema.org/SoldOut',
    };

    return map[status] || 'https://schema.org/InStock';
  };

  const getOfferCategoryForSchema = (status: string) => {
    return getStatusLabel(status, language);
  };

  const buildAbsoluteUrl = (path: string) => `${window.location.origin}${path}`;

  const toggleFavorite = () => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      const favoriteIds = Array.isArray(parsed) ? parsed : [];

      const updated = favoriteIds.includes(propertyId)
        ? favoriteIds.filter((id: string) => id !== propertyId)
        : [...favoriteIds, propertyId];

      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      setIsFavorite(updated.includes(propertyId));
    } catch (error) {
      console.error('Favorite save error:', error);
    }
  };

  const copyPropertyLink = async () => {
    const url = `${window.location.origin}/properties/${propertyId}`;

    try {
      await navigator.clipboard.writeText(url);
      alert(language === 'tr' ? 'İlan linki kopyalandı.' : 'Listing link copied.');
    } catch (error) {
      console.error('Clipboard error:', error);
      alert(language === 'tr' ? 'Link kopyalanamadı.' : 'Link could not be copied.');
    }
  };

  const shareOnWhatsApp = () => {
    if (!property) return;

    const propertyUrl = `${window.location.origin}/properties/${property.id}`;
    const message =
      language === 'tr'
        ? `Bu ilanı gördün mü?\n\n${property.title}\n${propertyUrl}`
        : `Have you seen this listing?\n\n${property.title}\n${propertyUrl}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const goPrevImage = () => {
    if (!property || !property.images || property.images.length === 0) return;
    setSelectedImage((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
  };

  const goNextImage = () => {
    if (!property || !property.images || property.images.length === 0) return;
    setSelectedImage((prev) => (prev === property.images.length - 1 ? 0 : prev + 1));
  };

  const propertyTypeValue = String(property?.property_type ?? '').toLowerCase();
  const isLandLike = LAND_PROPERTY_TYPES.has(propertyTypeValue);
  const isCommercialLike = COMMERCIAL_PROPERTY_TYPES.has(propertyTypeValue);

  const oldPrice = (property as PropertyWithCoords | null)?.old_price ?? null;
  const hasDiscount =
    typeof oldPrice === 'number' &&
    oldPrice > (property?.price ?? 0);

  const discountPercent =
    hasDiscount && property
      ? Math.round(((oldPrice - property.price) / oldPrice) * 100)
      : 0;

  const quickFacts = useMemo(() => {
    if (!property) return [];

    const facts: string[] = [];
    facts.push(`${property.area} m²`);
    facts.push(getPropertyTypeLabel(property.property_type, language));

    if (!isLandLike && !isCommercialLike && property.rooms > 0) {
      facts.push(language === 'tr' ? `${property.rooms} Oda` : `${property.rooms} Rooms`);
    }

    if (!isLandLike && !isCommercialLike && property.bathrooms > 0) {
      facts.push(language === 'tr' ? `${property.bathrooms} Banyo` : `${property.bathrooms} Bathrooms`);
    }

    if (property.city) {
      facts.push(property.district ? `${property.city}, ${property.district}` : property.city);
    }

    return facts.slice(0, 5);
  }, [property, language, isLandLike, isCommercialLike]);

  const topInfoItems = useMemo(() => {
    if (!property) return [];

    if (isLandLike || isCommercialLike) {
      return [
        {
          key: 'type',
          icon: Layers3,
          label: language === 'tr' ? 'Tür' : 'Type',
          value: getPropertyTypeLabel(property.property_type, language),
        },
        {
          key: 'area',
          icon: Maximize,
          label: language === 'tr' ? 'Alan' : 'Area',
          value: `${property.area} m²`,
        },
      ];
    }

    return [
      {
        key: 'rooms',
        icon: Home,
        label: language === 'tr' ? 'Oda' : 'Rooms',
        value: property.rooms > 0 ? String(property.rooms) : '-',
      },
      {
        key: 'bathrooms',
        icon: Bath,
        label: language === 'tr' ? 'Banyo' : 'Bath',
        value: property.bathrooms > 0 ? String(property.bathrooms) : '-',
      },
      {
        key: 'area',
        icon: Maximize,
        label: language === 'tr' ? 'Alan' : 'Area',
        value: `${property.area} m²`,
      },
    ];
  }, [property, language, isLandLike, isCommercialLike]);

  const highlightFeatures = useMemo(() => {
    if (!property) return [];

    const features: string[] = [];

    if (property.area >= 120) {
      features.push(language === 'tr' ? 'Geniş metrekare avantajı' : 'Spacious floor area');
    }

    if (!isLandLike && !isCommercialLike && property.rooms >= 3) {
      features.push(language === 'tr' ? 'Aile yaşamına uygun plan' : 'Suitable layout for family living');
    }

    if (property.parking) {
      features.push(language === 'tr' ? 'Otopark imkanı' : 'Parking available');
    }

    if (property.elevator) {
      features.push(language === 'tr' ? 'Asansörlü yapı' : 'Elevator access');
    }

    if (property.in_site) {
      features.push(language === 'tr' ? 'Site içerisinde' : 'Located in a residential complex');
    }

    if (property.pool) {
      features.push(language === 'tr' ? 'Havuz avantajı' : 'Pool feature');
    }

    if (property.security) {
      features.push(language === 'tr' ? 'Güvenlik desteği' : 'Security support');
    }

    if (property.garden) {
      features.push(language === 'tr' ? 'Bahçe kullanımı' : 'Garden usage');
    }

    if (property.balcony) {
      features.push(language === 'tr' ? 'Balkonlu yaşam alanı' : 'Balcony living space');
    }

    if (property.frontage) {
      features.push(
        language === 'tr'
          ? `${getFrontageLabel(property.frontage, language)} cephe`
          : `${getFrontageLabel(property.frontage, language)} frontage`
      );
    }

    if (property.heating) {
      features.push(
        language === 'tr'
          ? `${getHeatingLabel(property.heating, language)} ısıtma`
          : `${getHeatingLabel(property.heating, language)} heating`
      );
    }

    return features.slice(0, 4);
  }, [property, language, isLandLike, isCommercialLike]);

  const investmentNote = useMemo(() => {
    if (!property) return '';

    const notes: string[] = [];

    if (language === 'tr') {
      if (property.status === 'for_sale') {
        notes.push('Satılık portföyde yer alması nedeniyle oturum ve yatırım açısından değerlendirilebilir.');
      }

      if (property.status === 'for_rent') {
        notes.push('Kiralık portföyde yer alması nedeniyle kullanım kolaylığı ve lokasyon avantajı öne çıkabilir.');
      }

      if (property.city) {
        notes.push(
          `${property.city}${property.district ? ` / ${property.district}` : ''} lokasyonu ilan değerini destekler.`
        );
      }

      if (property.featured) {
        notes.push('Öne çıkan ilan olarak vitrine alınmıştır.');
      }

      if (typeof property.views === 'number' && property.views > 50) {
        notes.push('İlan yüksek görüntülenme alarak dikkat çekmektedir.');
      }

      if (hasDiscount) {
        notes.push(`Önceki fiyat üzerinden indirim uygulanmış fırsat portföyüdür.`);
      }
    } else {
      if (property.status === 'for_sale') {
        notes.push('Being listed for sale makes it worth evaluating for both living and investment purposes.');
      }

      if (property.status === 'for_rent') {
        notes.push('Being listed for rent may offer practical usage and location advantages.');
      }

      if (property.city) {
        notes.push(
          `${property.city}${property.district ? ` / ${property.district}` : ''} location supports listing value.`
        );
      }

      if (property.featured) {
        notes.push('This listing is highlighted as a featured portfolio item.');
      }

      if (typeof property.views === 'number' && property.views > 50) {
        notes.push('The listing is attracting strong attention with higher view counts.');
      }

      if (hasDiscount) {
        notes.push('This portfolio has a discounted opportunity price compared to its previous listing price.');
      }
    }

    return notes.join(' ');
  }, [property, language, hasDiscount]);

  const seoTitle = useMemo(() => {
    if (!property) {
      return 'Varol Gayrimenkul';
    }

    return `${property.title} | Varol Gayrimenkul`;
  }, [property]);

  const seoDescription = useMemo(() => {
    if (!property) {
      return 'Varol Gayrimenkul satılık ve kiralık ilanları.';
    }

    const parts: string[] = [];

    if (language === 'tr') {
      parts.push(`${property.city}${property.district ? `, ${property.district}` : ''} bölgesinde`);
      parts.push(`${property.area} m²`);
      parts.push(getStatusLabel(property.status, language));
      parts.push(getPropertyTypeLabel(property.property_type, language));
      if (!isLandLike && !isCommercialLike && property.rooms > 0) parts.push(`${property.rooms} oda`);
      if (!isLandLike && !isCommercialLike && property.bathrooms > 0) parts.push(`${property.bathrooms} banyo`);
      if (hasDiscount && typeof oldPrice === 'number') {
        parts.push(`indirimli fiyat ${formatPrice(property.price, property.currency)}`);
      }
      if (property.featured) parts.push('öne çıkan ilan');
      parts.push('detaylarını inceleyin.');
    } else {
      parts.push(
        `Explore this ${property.area} m² ${getStatusLabel(property.status, language).toLowerCase()} ${getPropertyTypeLabel(
          property.property_type,
          language
        ).toLowerCase()}`
      );
      if (property.city) {
        parts.push(`in ${property.city}${property.district ? `, ${property.district}` : ''}.`);
      }
      if (!isLandLike && !isCommercialLike && property.rooms > 0) parts.push(`${property.rooms} rooms.`);
      if (!isLandLike && !isCommercialLike && property.bathrooms > 0) parts.push(`${property.bathrooms} bathrooms.`);
      if (hasDiscount && typeof oldPrice === 'number') {
        parts.push(`Discounted price ${formatPrice(property.price, property.currency)}.`);
      }
      if (property.featured) parts.push('Featured portfolio listing.');
    }

    return parts.join(' ');
  }, [property, language, isLandLike, isCommercialLike, hasDiscount, oldPrice]);

  const canonicalUrl = useMemo(() => {
    if (!property) return buildAbsoluteUrl('/properties');
    return buildAbsoluteUrl(`/properties/${property.id}`);
  }, [property]);

  const pageImage = useMemo(() => {
    if (!property || !Array.isArray(property.images) || property.images.length === 0) {
      return undefined;
    }

    return property.images[0];
  }, [property]);

  const breadcrumbSchemaJson = useMemo(() => {
    if (!property) return null;

    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: language === 'tr' ? 'Ana Sayfa' : 'Home',
          item: buildAbsoluteUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: language === 'tr' ? 'Gayrimenkul İlanları' : 'Real Estate Listings',
          item: buildAbsoluteUrl('/properties'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: property.title,
          item: buildAbsoluteUrl(`/properties/${property.id}`),
        },
      ],
    };

    return JSON.stringify(breadcrumb);
  }, [property, language]);

  const realEstateSchemaJson = useMemo(() => {
    if (!property) return null;

    const latitude = (property as PropertyWithCoords).latitude;
    const longitude = (property as PropertyWithCoords).longitude;
    const images = Array.isArray(property.images) ? property.images.filter(Boolean) : [];
    const firstImage = images.length > 0 ? images[0] : undefined;
    const propertyUrl = `${window.location.origin}/properties/${property.id}`;
    const schemaType = getSchemaType(property.property_type);
    const addressLocality = property.district ? `${property.district}, ${property.city}` : property.city;

    const floorSizeValue =
      typeof property.net_area === 'number' && property.net_area > 0 ? property.net_area : property.area;

    const mainEntity: Record<string, unknown> = {
      '@type': schemaType,
      name: property.title,
      description: property.description,
      url: propertyUrl,
      image: images,
      category: getPropertyCategoryForSchema(property.property_type),
      address: {
        '@type': 'PostalAddress',
        streetAddress: property.location || undefined,
        addressLocality,
        addressRegion: property.city,
        addressCountry: 'TR',
      },
      floorSize: {
        '@type': 'QuantitativeValue',
        value: floorSizeValue,
        unitCode: 'MTK',
      },
      numberOfRooms: typeof property.rooms === 'number' && property.rooms > 0 ? property.rooms : undefined,
      numberOfBathroomsTotal:
        typeof property.bathrooms === 'number' && property.bathrooms > 0 ? property.bathrooms : undefined,
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: language === 'tr' ? 'İlan Durumu' : 'Listing Status',
          value: getStatusLabel(property.status, language),
        },
        {
          '@type': 'PropertyValue',
          name: language === 'tr' ? 'Emlak Türü' : 'Property Type',
          value: getPropertyTypeLabel(property.property_type, language),
        },
        {
          '@type': 'PropertyValue',
          name: language === 'tr' ? 'Brüt Alan' : 'Gross Area',
          value: `${property.area} m²`,
        },
        ...(hasDiscount && typeof oldPrice === 'number'
          ? [
              {
                '@type': 'PropertyValue',
                name: language === 'tr' ? 'Eski Fiyat' : 'Old Price',
                value: formatPrice(oldPrice, property.currency),
              },
            ]
          : []),
        ...(typeof property.net_area === 'number' && property.net_area > 0
          ? [
              {
                '@type': 'PropertyValue',
                name: language === 'tr' ? 'Net Alan' : 'Net Area',
                value: `${property.net_area} m²`,
              },
            ]
          : []),
        ...(typeof property.gross_area === 'number' && property.gross_area > 0
          ? [
              {
                '@type': 'PropertyValue',
                name: language === 'tr' ? 'Brüt Kullanım Alanı' : 'Gross Usable Area',
                value: `${property.gross_area} m²`,
              },
            ]
          : []),
        ...(property.heating
          ? [
              {
                '@type': 'PropertyValue',
                name: language === 'tr' ? 'Isıtma' : 'Heating',
                value: getHeatingLabel(property.heating, language),
              },
            ]
          : []),
        ...(property.frontage
          ? [
              {
                '@type': 'PropertyValue',
                name: language === 'tr' ? 'Cephe' : 'Frontage',
                value: getFrontageLabel(property.frontage, language),
              },
            ]
          : []),
        ...(property.deed_status
          ? [
              {
                '@type': 'PropertyValue',
                name: language === 'tr' ? 'Tapu Durumu' : 'Title Deed Status',
                value: getDeedStatusLabel(property.deed_status, language),
              },
            ]
          : []),
        ...(property.usage_status
          ? [
              {
                '@type': 'PropertyValue',
                name: language === 'tr' ? 'Kullanım Durumu' : 'Usage Status',
                value: getUsageStatusLabel(property.usage_status, language),
              },
            ]
          : []),
      ],
    };

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      (mainEntity as Record<string, unknown>).geo = {
        '@type': 'GeoCoordinates',
        latitude,
        longitude,
      };

      (mainEntity as Record<string, unknown>).hasMap = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }

    if (firstImage) {
      (mainEntity as Record<string, unknown>).primaryImageOfPage = {
        '@type': 'ImageObject',
        url: firstImage,
      };
    }

    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      url: propertyUrl,
      price: property.price,
      priceCurrency: property.currency,
      availability: getAvailabilityForSchema(property.status),
      itemCondition: 'https://schema.org/UsedCondition',
      category: getOfferCategoryForSchema(property.status),
      seller: {
        '@type': 'RealEstateAgent',
        name: property.contact_name || 'Varol Gayrimenkul',
        telephone: property.contact_phone || undefined,
        areaServed: {
          '@type': 'City',
          name: property.city,
        },
      },
    };

    const listing: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: property.title,
      description: property.description,
      url: propertyUrl,
      image: images,
      datePosted: property.created_at || undefined,
      mainEntity,
      offers: offer,
      provider: {
        '@type': 'RealEstateAgent',
        name: 'Varol Gayrimenkul',
        url: window.location.origin,
      },
      inLanguage: language === 'tr' ? 'tr-TR' : 'en-US',
      about: mainEntity,
    };

    return JSON.stringify(listing);
  }, [property, language, hasDiscount, oldPrice]);

  const details = useMemo(() => {
    if (!property) return [];

    const baseItems = [
      {
        label: language === 'tr' ? 'İlan Durumu' : 'Listing Status',
        value: getStatusLabel(property.status, language),
      },
      {
        label: language === 'tr' ? 'Emlak Türü' : 'Property Type',
        value: getPropertyTypeLabel(property.property_type, language),
      },
      {
        label: language === 'tr' ? 'Alan' : 'Area',
        value: `${property.area} m²`,
      },
      {
        label: language === 'tr' ? 'Net Alan' : 'Net Area',
        value: property.net_area ? `${property.net_area} m²` : '-',
      },
      {
        label: language === 'tr' ? 'Brüt Alan' : 'Gross Area',
        value: property.gross_area ? `${property.gross_area} m²` : '-',
      },
      {
        label: language === 'tr' ? 'Cephe' : 'Frontage',
        value: getFrontageLabel(property.frontage, language),
      },
      {
        label: language === 'tr' ? 'Tapu Durumu' : 'Title Deed Status',
        value: getDeedStatusLabel(property.deed_status, language),
      },
      {
        label: language === 'tr' ? 'Kullanım Durumu' : 'Usage Status',
        value: getUsageStatusLabel(property.usage_status, language),
      },
    ];

    if (hasDiscount && typeof oldPrice === 'number') {
      baseItems.unshift({
        label: language === 'tr' ? 'Eski Fiyat' : 'Old Price',
        value: formatPrice(oldPrice, property.currency),
      });
    }

    if (isLandLike) {
      return baseItems;
    }

    const extendedItems = [
      {
        label: language === 'tr' ? 'Oda Sayısı' : 'Rooms',
        value: property.rooms > 0 ? String(property.rooms) : '-',
      },
      {
        label: language === 'tr' ? 'Banyo Sayısı' : 'Bathrooms',
        value: property.bathrooms > 0 ? String(property.bathrooms) : '-',
      },
      {
        label: language === 'tr' ? 'Kat' : 'Floor',
        value: typeof property.floor === 'number' && property.floor >= 0 ? String(property.floor) : '-',
      },
      {
        label: language === 'tr' ? 'Toplam Kat' : 'Total Floors',
        value:
          typeof property.total_floors === 'number' && property.total_floors >= 0
            ? String(property.total_floors)
            : '-',
      },
      {
        label: language === 'tr' ? 'Bina Yaşı' : 'Building Age',
        value:
          typeof property.building_age === 'number' && property.building_age >= 0
            ? String(property.building_age)
            : '-',
      },
      {
        label: language === 'tr' ? 'Isıtma' : 'Heating',
        value: getHeatingLabel(property.heating, language),
      },
      {
        label: language === 'tr' ? 'Aidat' : 'Dues',
        value:
          typeof property.dues === 'number' && property.dues > 0
            ? formatPrice(property.dues, property.currency)
            : '-',
      },
      {
        label: language === 'tr' ? 'Site İçinde' : 'In Complex',
        value:
          language === 'tr'
            ? property.in_site
              ? 'Evet'
              : 'Hayır'
            : property.in_site
            ? 'Yes'
            : 'No',
      },
      {
        label: language === 'tr' ? 'Site Adı' : 'Site Name',
        value: property.site_name || '-',
      },
      {
        label: language === 'tr' ? 'Balkon' : 'Balcony',
        value:
          language === 'tr'
            ? property.balcony
              ? 'Var'
              : 'Yok'
            : property.balcony
            ? 'Yes'
            : 'No',
      },
      {
        label: language === 'tr' ? 'Balkon Sayısı' : 'Balcony Count',
        value:
          typeof property.balcony_count === 'number' && property.balcony_count > 0
            ? String(property.balcony_count)
            : '-',
      },
      {
        label: language === 'tr' ? 'Asansör' : 'Elevator',
        value:
          language === 'tr'
            ? property.elevator
              ? 'Var'
              : 'Yok'
            : property.elevator
            ? 'Yes'
            : 'No',
      },
      {
        label: language === 'tr' ? 'Otopark' : 'Parking',
        value:
          language === 'tr'
            ? property.parking
              ? 'Var'
              : 'Yok'
            : property.parking
            ? 'Yes'
            : 'No',
      },
      {
        label: language === 'tr' ? 'Eşyalı' : 'Furnished',
        value:
          language === 'tr'
            ? property.furnished
              ? 'Evet'
              : 'Hayır'
            : property.furnished
            ? 'Yes'
            : 'No',
      },
      {
        label: language === 'tr' ? 'Havuz' : 'Pool',
        value:
          language === 'tr'
            ? property.pool
              ? 'Var'
              : 'Yok'
            : property.pool
            ? 'Yes'
            : 'No',
      },
      {
        label: language === 'tr' ? 'Güvenlik' : 'Security',
        value:
          language === 'tr'
            ? property.security
              ? 'Var'
              : 'Yok'
            : property.security
            ? 'Yes'
            : 'No',
      },
      {
        label: language === 'tr' ? 'Bahçe' : 'Garden',
        value:
          language === 'tr'
            ? property.garden
              ? 'Var'
              : 'Yok'
            : property.garden
            ? 'Yes'
            : 'No',
      },
    ];

    return [...baseItems, ...extendedItems];
  }, [property, language, isLandLike, hasDiscount, oldPrice]);

  if (loading) {
    return <div className="pt-32 text-center">{t('common.loading')}</div>;
  }

  if (!property) {
    return <div className="pt-32 text-center">{t('common.noResults')}</div>;
  }

  const images = property.images || [];
  const hasImages = images.length > 0;
  const latitude = (property as PropertyWithCoords).latitude;
  const longitude = (property as PropertyWithCoords).longitude;
  const hasMap = typeof latitude === 'number' && typeof longitude === 'number';

  return (
    <>
      <Helmet>
        <html lang={language === 'tr' ? 'tr' : 'en'} />
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Varol Gayrimenkul" />
        <meta property="og:locale" content={language === 'tr' ? 'tr_TR' : 'en_US'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {pageImage ? <meta property="og:image" content={pageImage} /> : null}
        {pageImage ? <meta name="twitter:image" content={pageImage} /> : null}
        {realEstateSchemaJson ? <script type="application/ld+json">{realEstateSchemaJson}</script> : null}
        {breadcrumbSchemaJson ? <script type="application/ld+json">{breadcrumbSchemaJson}</script> : null}
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-20 pb-32 lg:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => onNavigate('properties')}
            className="mb-4 flex items-center text-gray-600 transition-colors hover:text-cta"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {t('common.back')}
          </button>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-200">
                  {hasImages ? (
                    <>
                      <img
                        src={images[selectedImage]}
                        alt={property.title}
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                      <div className="absolute left-3 top-3 flex flex-wrap gap-2 sm:left-4 sm:top-4">
                        <span
                          className={`${getStatusColor(property.status)} rounded-full px-3 py-1 text-[11px] font-semibold text-white`}
                        >
                          {getStatusLabel(property.status, language)}
                        </span>

                        {property.featured && (
                          <span className="rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white">
                            {language === 'tr' ? 'Öne Çıkan' : 'Featured'}
                          </span>
                        )}

                        {hasDiscount ? (
                          <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold text-white">
                            {language === 'tr' ? 'İndirimli' : 'Discount'}
                          </span>
                        ) : null}

                        <span className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                          {selectedImage + 1} / {images.length}
                        </span>
                      </div>

                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={goPrevImage}
                            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white sm:left-4 sm:h-11 sm:w-11"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>

                          <button
                            type="button"
                            onClick={goNextImage}
                            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white sm:right-4 sm:h-11 sm:w-11"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-6xl text-gray-400">
                      🏠
                    </div>
                  )}
                </div>

                {hasImages && (
                  <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-5 lg:grid-cols-6">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImage(idx)}
                        className={`aspect-square overflow-hidden rounded-xl border-2 transition ${
                          selectedImage === idx
                            ? 'border-cta shadow-sm'
                            : 'border-transparent hover:border-gray-200'
                        }`}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleFavorite}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                      isFavorite
                        ? 'border-red-200 bg-red-50 text-red-600'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                    {language === 'tr'
                      ? isFavorite
                        ? 'Favorilerde'
                        : 'Favorilere Ekle'
                      : isFavorite
                      ? 'Saved'
                      : 'Save'}
                  </button>

                  <button
                    type="button"
                    onClick={shareOnWhatsApp}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Share2 className="h-4 w-4" />
                    WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={copyPropertyLink}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    <Copy className="h-4 w-4" />
                    {language === 'tr' ? 'Linki Kopyala' : 'Copy Link'}
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                      {property.title}
                    </h1>

                    {hasDiscount && typeof oldPrice === 'number' ? (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="text-lg font-semibold text-gray-400 line-through sm:text-xl">
                          {formatPrice(oldPrice, property.currency)}
                        </div>

                        <div className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
                          <BadgePercent className="h-4 w-4" />
                          %{discountPercent}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-2 text-3xl font-extrabold leading-none text-cta sm:text-4xl">
                      {formatPrice(property.price, property.currency)}
                    </div>

                    <div className="mt-3 flex items-start gap-2 text-sm text-gray-500 sm:text-base">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                      <div className="min-w-0">
                        <div>
                          {property.city}
                          {property.district ? `, ${property.district}` : ''}
                        </div>
                        {property.location ? (
                          <div className="mt-1 text-xs text-gray-400 sm:text-sm">{property.location}</div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {topInfoItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div key={item.key} className="rounded-2xl bg-gray-50 px-3 py-3 sm:px-4">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Icon className="h-4 w-4" />
                            <span className="text-[11px] sm:text-xs">{item.label}</span>
                          </div>
                          <div className="mt-1 text-sm font-semibold text-gray-800 sm:text-base">
                            {item.value}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {quickFacts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {quickFacts.map((fact) => (
                        <span
                          key={fact}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 sm:text-xs"
                        >
                          {fact}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {(highlightFeatures.length > 0 || investmentNote) && (
                <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                      {language === 'tr' ? 'Öne Çıkan Notlar' : 'Highlighted Notes'}
                    </h2>
                  </div>

                  {highlightFeatures.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {highlightFeatures.map((feature) => (
                        <div
                          key={feature}
                          className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
                        >
                          {feature}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {investmentNote ? (
                    <div className={highlightFeatures.length > 0 ? 'mt-4 rounded-2xl bg-amber-50 px-4 py-4' : ''}>
                      <div className="mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {language === 'tr' ? 'Yatırım / Değer Notu' : 'Investment / Value Note'}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-gray-600">{investmentNote}</p>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">{t('detail.description')}</h2>
                <p className="whitespace-pre-line leading-7 text-gray-600">{property.description}</p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">
                  {language === 'tr' ? 'Temel Özellikler' : 'Key Features'}
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {details.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3"
                    >
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-right text-sm font-medium text-gray-800 sm:text-base">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {hasMap && GOOGLE_MAPS_API_KEY && (
                <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                  <h2 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">
                    {language === 'tr' ? 'Konum' : 'Location'}
                  </h2>

                  <div className="overflow-hidden rounded-2xl border border-gray-200">
                    <div className="h-[320px] w-full sm:h-[340px]">
                      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="tr" region="TR">
                        <Map
                          defaultCenter={{ lat: latitude, lng: longitude }}
                          defaultZoom={15}
                          gestureHandling="greedy"
                          streetViewControl={false}
                          mapTypeControl={true}
                          zoomControl={true}
                          fullscreenControl={true}
                          className="h-full w-full"
                        >
                          <Marker position={{ lat: latitude, lng: longitude }} />
                          <InfoWindow position={{ lat: latitude, lng: longitude }}>
                            <div className="text-sm font-medium">{property.title}</div>
                          </InfoWindow>
                        </Map>
                      </APIProvider>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gradient-to-br from-white to-emerald-50 p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-gray-500">
                      {language === 'tr' ? 'Satış Paneli' : 'Sales Panel'}
                    </div>

                    <div
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold text-white ${getStatusColor(
                        property.status
                      )}`}
                    >
                      {getStatusLabel(property.status, language)}
                    </div>
                  </div>

                  {hasDiscount && typeof oldPrice === 'number' ? (
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <div className="text-base font-semibold text-gray-400 line-through">
                        {formatPrice(oldPrice, property.currency)}
                      </div>

                      <div className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
                        <BadgePercent className="h-4 w-4" />
                        %{discountPercent}
                      </div>
                    </div>
                  ) : null}

                  <div className="text-3xl font-extrabold text-cta">
                    {formatPrice(property.price, property.currency)}
                  </div>

                  <div className="mt-3 text-sm text-gray-500">
                    {property.city}
                    {property.district ? `, ${property.district}` : ''}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={shareOnWhatsApp}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <Share2 className="h-4 w-4" />
                      {language === 'tr' ? 'WhatsApp’tan Bilgi Al' : 'Get Info on WhatsApp'}
                    </button>

                    {property.contact_phone ? (
                      <a
                        href={`tel:${property.contact_phone}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
                      >
                        <Phone className="h-4 w-4" />
                        {language === 'tr' ? 'Hemen Ara' : 'Call Now'}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={copyPropertyLink}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
                      >
                        <Copy className="h-4 w-4" />
                        {language === 'tr' ? 'Link Kopyala' : 'Copy Link'}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={copyPropertyLink}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    <Copy className="h-4 w-4" />
                    {language === 'tr' ? 'İlan Linkini Kopyala' : 'Copy Listing Link'}
                  </button>
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-slate-700" />
                    <h2 className="text-lg font-bold text-gray-900">
                      {language === 'tr' ? 'Hızlı Bilgi' : 'Quick Info'}
                    </h2>
                  </div>

                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-500">{language === 'tr' ? 'Tür' : 'Type'}</span>
                      <span className="text-right font-medium">
                        {getPropertyTypeLabel(property.property_type, language)}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-500">{language === 'tr' ? 'Alan' : 'Area'}</span>
                      <span className="text-right font-medium">{property.area} m²</span>
                    </div>

                    {!isLandLike && !isCommercialLike ? (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-gray-500">{language === 'tr' ? 'Oda' : 'Rooms'}</span>
                          <span className="text-right font-medium">
                            {property.rooms > 0 ? property.rooms : '-'}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <span className="text-gray-500">{language === 'tr' ? 'Banyo' : 'Bath'}</span>
                          <span className="text-right font-medium">
                            {property.bathrooms > 0 ? property.bathrooms : '-'}
                          </span>
                        </div>
                      </>
                    ) : null}

                    {hasDiscount && typeof oldPrice === 'number' ? (
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gray-500">{language === 'tr' ? 'Eski Fiyat' : 'Old Price'}</span>
                        <span className="text-right font-medium line-through text-gray-400">
                          {formatPrice(oldPrice, property.currency)}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-500">{language === 'tr' ? 'Konum' : 'Location'}</span>
                      <span className="text-right font-medium">
                        {property.city}
                        {property.district ? `, ${property.district}` : ''}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-500">{language === 'tr' ? 'Görsel' : 'Photos'}</span>
                      <span className="text-right font-medium">{images.length}</span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-500">{language === 'tr' ? 'Görüntülenme' : 'Views'}</span>
                      <span className="text-right font-medium">
                        {typeof property.views === 'number' ? property.views : 0}
                      </span>
                    </div>

                    {(property.contact_name || property.contact_phone) && (
                      <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-4">
                        <div className="mb-2 text-sm font-semibold text-gray-900">
                          {language === 'tr' ? 'İletişim Bilgileri' : 'Contact Information'}
                        </div>

                        {property.contact_name ? (
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">{language === 'tr' ? 'Yetkili: ' : 'Contact: '}</span>
                            {property.contact_name}
                          </div>
                        ) : null}

                        {property.contact_phone ? (
                          <div className="mt-1 text-sm text-gray-700">
                            <span className="font-medium">{language === 'tr' ? 'Telefon: ' : 'Phone: '}</span>
                            {property.contact_phone}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {language === 'tr' ? 'Benzer İlanlar' : 'Similar Listings'}
              </h2>
            </div>

            {similarLoading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-200" />
                ))}
              </div>
            ) : similarProperties.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {similarProperties.map((item) => (
                  <PropertyCard
                    key={item.id}
                    property={item}
                    onClick={() => onNavigate('property-detail', item.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
                {language === 'tr'
                  ? 'Bu ilana benzer başka ilan bulunamadı.'
                  : 'No similar listings found for this property.'}
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 p-3 shadow-2xl backdrop-blur lg:hidden">
          <div className="mx-auto max-w-7xl">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-gray-500">
                  {getPropertyTypeLabel(property.property_type, language)}
                </div>

                {hasDiscount && typeof oldPrice === 'number' ? (
                  <div className="truncate text-xs font-semibold text-gray-400 line-through">
                    {formatPrice(oldPrice, property.currency)}
                  </div>
                ) : null}

                <div className="truncate text-base font-extrabold text-cta">
                  {formatPrice(property.price, property.currency)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasDiscount ? (
                  <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600">
                    %{discountPercent}
                  </div>
                ) : null}

                <div
                  className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold text-white ${getStatusColor(
                    property.status
                  )}`}
                >
                  {getStatusLabel(property.status, language)}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={shareOnWhatsApp}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                {language === 'tr' ? 'WhatsApp’tan Bilgi Al' : 'WhatsApp Info'}
              </button>

              {property.contact_phone ? (
                <a
                  href={`tel:${property.contact_phone}`}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  {language === 'tr' ? 'Hemen Ara' : 'Call Now'}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={copyPropertyLink}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  {language === 'tr' ? 'Link Kopyala' : 'Copy Link'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}