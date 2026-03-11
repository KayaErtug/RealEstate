// src/pages/PropertyDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Home,
  Bath,
  Maximize,
  ArrowLeft,
  Share2,
  Copy,
  Heart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Map, Marker, InfoWindow, APIProvider } from '@vis.gl/react-google-maps';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import type { Property } from '../lib/database.types';
import { useLanguage } from '../contexts/LanguageContext';
import PropertyCard from '../components/PropertyCard';

interface PropertyDetailPageProps {
  propertyId: string;
  onNavigate: (page: string, propertyId?: string) => void;
}

type PropertyWithMap = Property & {
  latitude?: number | null;
  longitude?: number | null;
};

const FAVORITES_STORAGE_KEY = 'varol_property_favorites';
const VIEWED_STORAGE_KEY = 'varol_viewed_properties';
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

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
        currentRow && typeof (currentRow as { views?: number }).views === 'number'
          ? (currentRow as { views: number }).views
          : 0;

      const { error: updateError } = await supabase
        .from('properties')
        .update({ views: currentViews + 1 })
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
      setProperty(null);
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

  const getStatusLabel = (status: string) => {
    const map: Record<string, { tr: string; en: string }> = {
      for_sale: { tr: 'Satılık', en: 'For Sale' },
      for_rent: { tr: 'Kiralık', en: 'For Rent' },
      sold: { tr: 'Satıldı', en: 'Sold' },
      rented: { tr: 'Kiralandı', en: 'Rented' },
    };

    return map[status]?.[language] ?? status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      for_sale: 'bg-emerald-600',
      for_rent: 'bg-sky-600',
      sold: 'bg-gray-600',
      rented: 'bg-zinc-600',
    };

    return colors[status] || 'bg-gray-600';
  };

  const getPropertyTypeLabel = (type: string) => {
    const map: Record<string, { tr: string; en: string }> = {
      apartment: { tr: 'Daire', en: 'Apartment' },
      residence: { tr: 'Rezidans', en: 'Residence' },
      duplex: { tr: 'Dubleks', en: 'Duplex' },
      villa: { tr: 'Villa', en: 'Villa' },
      detached_house: { tr: 'Müstakil Ev', en: 'Detached House' },
      land: { tr: 'Arsa', en: 'Land' },
      field: { tr: 'Tarla', en: 'Field' },
      farm: { tr: 'Çiftlik', en: 'Farm' },
      office: { tr: 'Ofis', en: 'Office' },
      shop: { tr: 'Dükkan', en: 'Shop' },
      building: { tr: 'Bina', en: 'Building' },
      commercial: { tr: 'Ticari', en: 'Commercial' },
    };

    return map[type]?.[language] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
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
    const map: Record<string, string> = {
      for_sale: language === 'tr' ? 'Satılık' : 'For Sale',
      for_rent: language === 'tr' ? 'Kiralık' : 'For Rent',
      sold: language === 'tr' ? 'Satıldı' : 'Sold',
      rented: language === 'tr' ? 'Kiralandı' : 'Rented',
    };

    return map[status] || getStatusLabel(status);
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

    return `${property.city}${property.district ? `, ${property.district}` : ''} bölgesinde ${
      property.area
    } m² ${getStatusLabel(property.status)} ${getPropertyTypeLabel(property.property_type)} ilanı.`;
  }, [property, language]);

  const canonicalUrl = useMemo(() => {
    if (!property) return buildAbsoluteUrl('/properties');
    return buildAbsoluteUrl(`/properties/${property.id}`);
  }, [property]);

  const pageImage = useMemo(() => {
    if (!property || !Array.isArray(property.images) || property.images.length === 0) return undefined;
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

    const row = property as PropertyWithMap;
    const latitude = row.latitude;
    const longitude = row.longitude;
    const images = Array.isArray(property.images) ? property.images.filter(Boolean) : [];
    const firstImage = images.length > 0 ? images[0] : undefined;
    const propertyUrl = `${window.location.origin}/properties/${property.id}`;
    const schemaType = getSchemaType(property.property_type);
    const addressLocality = property.district ? `${property.district}, ${property.city}` : property.city;

    const floorSizeValue =
      typeof property.net_area === 'number' && property.net_area > 0
        ? property.net_area
        : property.area;

    const mainEntity: Record<string, any> = {
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
      numberOfRooms:
        typeof property.rooms === 'number' && property.rooms > 0 ? property.rooms : undefined,
      numberOfBathroomsTotal:
        typeof property.bathrooms === 'number' && property.bathrooms > 0
          ? property.bathrooms
          : undefined,
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: language === 'tr' ? 'İlan Durumu' : 'Listing Status',
          value: getStatusLabel(property.status),
        },
        {
          '@type': 'PropertyValue',
          name: language === 'tr' ? 'Emlak Türü' : 'Property Type',
          value: getPropertyTypeLabel(property.property_type),
        },
        {
          '@type': 'PropertyValue',
          name: language === 'tr' ? 'Brüt Alan' : 'Gross Area',
          value: `${property.area} m²`,
        },
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
      ],
    };

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      mainEntity.geo = {
        '@type': 'GeoCoordinates',
        latitude,
        longitude,
      };

      mainEntity.hasMap = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }

    if (firstImage) {
      mainEntity.primaryImageOfPage = {
        '@type': 'ImageObject',
        url: firstImage,
      };
    }

    const offer: Record<string, any> = {
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

    const listing: Record<string, any> = {
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
  }, [property, language]);

  if (loading) {
    return <div className="pt-32 text-center">{t('common.loading')}</div>;
  }

  if (!property) {
    return <div className="pt-32 text-center">{t('common.noResults')}</div>;
  }

  const images = property.images || [];
  const hasImages = images.length > 0;
  const row = property as PropertyWithMap;
  const latitude = row.latitude;
  const longitude = row.longitude;
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

      <div className="min-h-screen bg-gray-50 pb-12 pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => onNavigate('properties')}
            className="mb-6 flex items-center text-gray-600 transition-colors hover:text-cta"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {t('common.back')}
          </button>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-gray-200 shadow-sm">
                {hasImages ? (
                  <>
                    <img
                      src={images[selectedImage]}
                      alt={property.title}
                      className="h-full w-full object-cover"
                    />

                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={goPrevImage}
                          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>

                        <button
                          type="button"
                          onClick={goNextImage}
                          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    <div className="absolute left-3 top-3 flex gap-2">
                      <span
                        className={`${getStatusColor(property.status)} rounded-full px-3 py-1 text-xs font-semibold text-white`}
                      >
                        {getStatusLabel(property.status)}
                      </span>

                      {property.featured && (
                        <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                          {language === 'tr' ? 'Öne Çıkan' : 'Featured'}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl text-gray-400">
                    🏠
                  </div>
                )}
              </div>

              {hasImages && (
                <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
                        selectedImage === idx ? 'border-cta' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleFavorite}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
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
                    className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    <Share2 className="h-4 w-4" />
                    WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={copyPropertyLink}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    <Copy className="h-4 w-4" />
                    {language === 'tr' ? 'Linki Kopyala' : 'Copy Link'}
                  </button>
                </div>

                <h1 className="mb-2 text-3xl font-bold text-gray-900">{property.title}</h1>

                <p className="text-2xl font-semibold text-cta">
                  {formatPrice(property.price, property.currency)}
                </p>

                <div className="mt-3 flex items-center text-gray-500">
                  <MapPin className="mr-1 h-5 w-5" />
                  <span>
                    {property.city}
                    {property.district ? `, ${property.district}` : ''}
                  </span>
                </div>

                {property.location && (
                  <div className="mt-2 text-sm text-gray-500">{property.location}</div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div className="flex items-center text-gray-700">
                    <Home className="mr-3 h-5 w-5 text-cta" />
                    <span>{getPropertyTypeLabel(property.property_type)}</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Maximize className="mr-3 h-5 w-5 text-cta" />
                    <span>{property.area} m²</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Bath className="mr-3 h-5 w-5 text-cta" />
                    <span>{property.bathrooms > 0 ? property.bathrooms : '-'}</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Home className="mr-3 h-5 w-5 text-cta" />
                    <span>{property.rooms > 0 ? property.rooms : '-'}</span>
                  </div>

                  {property.net_area ? (
                    <div className="flex items-center text-gray-700">
                      <Maximize className="mr-3 h-5 w-5 text-cta" />
                      <span>
                        {language === 'tr' ? 'Net' : 'Net'} {property.net_area} m²
                      </span>
                    </div>
                  ) : null}

                  {property.gross_area ? (
                    <div className="flex items-center text-gray-700">
                      <Maximize className="mr-3 h-5 w-5 text-cta" />
                      <span>
                        {language === 'tr' ? 'Brüt' : 'Gross'} {property.gross_area} m²
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-xl font-bold">{t('detail.description')}</h2>
                <p className="whitespace-pre-line text-gray-600">{property.description}</p>
              </div>

              {hasMap && GOOGLE_MAPS_API_KEY && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">
                    {language === 'tr' ? 'Konum' : 'Location'}
                  </h2>

                  <div className="overflow-hidden rounded-2xl border border-gray-200">
                    <div className="h-[320px] w-full">
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

              {(property.contact_name || property.contact_phone) && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">
                    {language === 'tr' ? 'İletişim Bilgileri' : 'Contact Information'}
                  </h2>

                  {property.contact_name && (
                    <div className="mb-2 text-gray-700">
                      <span className="font-medium">
                        {language === 'tr' ? 'Yetkili: ' : 'Contact: '}
                      </span>
                      {property.contact_name}
                    </div>
                  )}

                  {property.contact_phone && (
                    <a
                      href={`tel:${property.contact_phone}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                    >
                      <span>{property.contact_phone}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-12">
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
      </div>
    </>
  );
}