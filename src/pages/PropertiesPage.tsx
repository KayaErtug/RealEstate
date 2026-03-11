// src/pages/PropertiesPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  MapPinned,
  RefreshCw,
  ArrowUpDown,
  Star,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import type { Property } from '../lib/database.types';
import PropertyCard from '../components/PropertyCard';
import PropertyMap from '../components/PropertyMap';
import { useLanguage } from '../contexts/LanguageContext';

interface PropertiesPageProps {
  onNavigate: (page: string, propertyId?: string) => void;
}

type FiltersState = {
  search: string;
  status: string;
  propertyType: string;
  city: string;
  district: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  rooms: string;
  sortBy: string;
  featuredOnly: boolean;
};

type MapBoundsValue = {
  north: number;
  south: number;
  east: number;
  west: number;
};

type PropertyWithMap = Property & {
  latitude?: number | null;
  longitude?: number | null;
};

const FAVORITES_STORAGE_KEY = 'varol_property_favorites';

const DEFAULT_FILTERS: FiltersState = {
  search: '',
  status: 'all',
  propertyType: 'all',
  city: '',
  district: '',
  minPrice: '',
  maxPrice: '',
  minArea: '',
  maxArea: '',
  rooms: 'all',
  sortBy: 'newest',
  featuredOnly: false,
};

export default function PropertiesPage({ onNavigate }: PropertiesPageProps) {
  const { language, t } = useLanguage();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [mapFilterEnabled, setMapFilterEnabled] = useState(true);
  const [mapBounds, setMapBounds] = useState<MapBoundsValue | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);

  const hasInitializedFromUrl = useRef(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    const urlFilters = getFiltersFromUrl();

    setFilters((prev) => ({
      ...prev,
      ...urlFilters,
    }));

    hasInitializedFromUrl.current = true;

    const handlePopState = () => {
      const nextFilters = getFiltersFromUrl();
      setFilters({
        ...DEFAULT_FILTERS,
        ...nextFilters,
      });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!hasInitializedFromUrl.current) return;
    updateUrlFromFilters(filters);
    void loadProperties();
  }, [filters]);

  const getFiltersFromUrl = (): Partial<FiltersState> => {
    const params = new URLSearchParams(window.location.search);

    return {
      search: params.get('search') || '',
      status: params.get('status') || 'all',
      propertyType: params.get('propertyType') || 'all',
      city: params.get('city') || '',
      district: params.get('district') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      minArea: params.get('minArea') || '',
      maxArea: params.get('maxArea') || '',
      rooms: params.get('rooms') || 'all',
      sortBy: params.get('sortBy') || 'newest',
      featuredOnly: params.get('featuredOnly') === 'true',
    };
  };

  const updateUrlFromFilters = (nextFilters: FiltersState) => {
    const params = new URLSearchParams();

    if (nextFilters.search) params.set('search', nextFilters.search);
    if (nextFilters.status !== 'all') params.set('status', nextFilters.status);
    if (nextFilters.propertyType !== 'all') params.set('propertyType', nextFilters.propertyType);
    if (nextFilters.city) params.set('city', nextFilters.city);
    if (nextFilters.district) params.set('district', nextFilters.district);
    if (nextFilters.minPrice) params.set('minPrice', nextFilters.minPrice);
    if (nextFilters.maxPrice) params.set('maxPrice', nextFilters.maxPrice);
    if (nextFilters.minArea) params.set('minArea', nextFilters.minArea);
    if (nextFilters.maxArea) params.set('maxArea', nextFilters.maxArea);
    if (nextFilters.rooms !== 'all') params.set('rooms', nextFilters.rooms);
    if (nextFilters.sortBy !== 'newest') params.set('sortBy', nextFilters.sortBy);
    if (nextFilters.featuredOnly) params.set('featuredOnly', 'true');

    const queryString = params.toString();
    const newUrl = queryString ? `/properties?${queryString}` : '/properties';

    window.history.replaceState({}, '', newUrl);
  };

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFavoriteIds(parsed as string[]);
        }
      }
    } catch (error) {
      console.error('Favorite load error:', error);
    }
  };

  const saveFavorites = (ids: string[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error('Favorite save error:', error);
    }
  };

  const toggleFavorite = (propertyId: string) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(propertyId);
      const updated = exists
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId];

      saveFavorites(updated);
      return updated;
    });
  };

  const loadProperties = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('properties')
        .select('*')
        .eq('moderation_status', 'approved');

      if (filters.search.trim()) {
        const searchValue = filters.search.trim();
        query = query.or(
          `title.ilike.%${searchValue}%,description.ilike.%${searchValue}%,city.ilike.%${searchValue}%,district.ilike.%${searchValue}%,location.ilike.%${searchValue}%`
        );
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }

      if (filters.city.trim()) {
        query = query.ilike('city', `%${filters.city.trim()}%`);
      }

      if (filters.district.trim()) {
        query = query.ilike('district', `%${filters.district.trim()}%`);
      }

      if (filters.minPrice) {
        query = query.gte('price', Number(filters.minPrice));
      }

      if (filters.maxPrice) {
        query = query.lte('price', Number(filters.maxPrice));
      }

      if (filters.minArea) {
        query = query.gte('area', Number(filters.minArea));
      }

      if (filters.maxArea) {
        query = query.lte('area', Number(filters.maxArea));
      }

      if (filters.rooms !== 'all') {
        query = query.eq('rooms', Number(filters.rooms));
      }

      if (filters.featuredOnly) {
        query = query.eq('featured', true);
      }

      if (filters.sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (filters.sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (filters.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (filters.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (filters.sortBy === 'area_asc') {
        query = query.order('area', { ascending: true });
      } else if (filters.sortBy === 'area_desc') {
        query = query.order('area', { ascending: false });
      } else if (filters.sortBy === 'most_viewed') {
        query = query
          .order('views', { ascending: false })
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      setProperties((data ?? []) as Property[]);
    } catch (error) {
      console.error('Error loading properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FiltersState, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setMapBounds(null);
    setMapFilterEnabled(true);
  };

  const mappedProperties = useMemo(() => {
    return properties.filter((property) => {
      const row = property as PropertyWithMap;
      return typeof row.latitude === 'number' && typeof row.longitude === 'number';
    });
  }, [properties]);

  const visibleProperties = useMemo(() => {
    if (!showMap || !mapFilterEnabled || !mapBounds) {
      return properties;
    }

    return properties.filter((property) => {
      const row = property as PropertyWithMap;

      if (typeof row.latitude !== 'number' || typeof row.longitude !== 'number') {
        return false;
      }

      return (
        row.latitude <= mapBounds.north &&
        row.latitude >= mapBounds.south &&
        row.longitude <= mapBounds.east &&
        row.longitude >= mapBounds.west
      );
    });
  }, [properties, showMap, mapFilterEnabled, mapBounds]);

  const copyPropertyLink = async (propertyId: string) => {
    const url = `${window.location.origin}/properties/${propertyId}`;

    try {
      await navigator.clipboard.writeText(url);
      alert(language === 'tr' ? 'İlan linki kopyalandı.' : 'Listing link copied.');
    } catch (error) {
      console.error('Clipboard error:', error);
      alert(language === 'tr' ? 'Link kopyalanamadı.' : 'Link could not be copied.');
    }
  };

  const shareOnWhatsApp = (property: Property) => {
    const propertyUrl = `${window.location.origin}/properties/${property.id}`;
    const message =
      language === 'tr'
        ? `Bu ilanı gördün mü?\n\n${property.title}\n${propertyUrl}`
        : `Have you seen this listing?\n\n${property.title}\n${propertyUrl}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const resultText =
    language === 'tr'
      ? `${visibleProperties.length} ilan bulundu`
      : `${visibleProperties.length} listings found`;

  const canonicalUrl = useMemo(() => {
    const queryString = window.location.search;
    return `${window.location.origin}/properties${queryString}`;
  }, [filters]);

  const seoTitle = useMemo(() => {
    if (language === 'tr') {
      if (filters.city.trim()) {
        return `${filters.city.trim()} Gayrimenkul İlanları | Varol Gayrimenkul`;
      }
      return 'Gayrimenkul İlanları | Varol Gayrimenkul';
    }

    if (filters.city.trim()) {
      return `${filters.city.trim()} Real Estate Listings | Varol Gayrimenkul`;
    }
    return 'Real Estate Listings | Varol Gayrimenkul';
  }, [language, filters.city]);

  const seoDescription = useMemo(() => {
    const parts: string[] = [];

    if (language === 'tr') {
      if (filters.city.trim()) parts.push(`${filters.city.trim()} bölgesindeki`);
      if (filters.district.trim()) parts.push(`${filters.district.trim()} ilçesindeki`);
      if (filters.status === 'for_sale') parts.push('satılık');
      if (filters.status === 'for_rent') parts.push('kiralık');
      parts.push('gayrimenkul ilanlarını inceleyin.');
      parts.push(`Toplam ${visibleProperties.length} ilan listeleniyor.`);
      return parts.join(' ');
    }

    if (filters.city.trim()) parts.push(`Browse listings in ${filters.city.trim()}.`);
    if (filters.district.trim()) parts.push(`District: ${filters.district.trim()}.`);
    if (filters.status === 'for_sale') parts.push('For sale properties.');
    if (filters.status === 'for_rent') parts.push('For rent properties.');
    parts.push(`Total ${visibleProperties.length} listings are displayed.`);
    return parts.join(' ');
  }, [language, filters.city, filters.district, filters.status, visibleProperties.length]);

  const pageImage = useMemo(() => {
    const firstWithImage = visibleProperties.find(
      (property) =>
        Array.isArray(property.images) && property.images.length > 0 && Boolean(property.images[0])
    );
    return firstWithImage?.images?.[0];
  }, [visibleProperties]);

  const itemListSchema = useMemo(() => {
    const itemListElement = visibleProperties.slice(0, 50).map((property, index) => {
      const firstImage =
        Array.isArray(property.images) && property.images.length > 0 ? property.images[0] : undefined;

      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `${window.location.origin}/properties/${property.id}`,
        name: property.title,
        item: {
          '@type': 'RealEstateListing',
          name: property.title,
          url: `${window.location.origin}/properties/${property.id}`,
          image: firstImage ? [firstImage] : undefined,
          description: property.description,
        },
      };
    });

    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: language === 'tr' ? 'Gayrimenkul İlanları' : 'Real Estate Listings',
      numberOfItems: visibleProperties.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement,
    });
  }, [visibleProperties, language]);

  const breadcrumbSchema = useMemo(() => {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: language === 'tr' ? 'Ana Sayfa' : 'Home',
          item: `${window.location.origin}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: language === 'tr' ? 'Gayrimenkul İlanları' : 'Real Estate Listings',
          item: `${window.location.origin}/properties`,
        },
      ],
    });
  }, [language]);

  const collectionPageSchema = useMemo(() => {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      inLanguage: language === 'tr' ? 'tr-TR' : 'en-US',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Varol Gayrimenkul',
        url: window.location.origin,
      },
      about: {
        '@type': 'Thing',
        name: language === 'tr' ? 'Gayrimenkul İlanları' : 'Real Estate Listings',
      },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: visibleProperties.length,
      },
    });
  }, [seoTitle, seoDescription, canonicalUrl, language, visibleProperties.length]);

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
        <script type="application/ld+json">{collectionPageSchema}</script>
        <script type="application/ld+json">{breadcrumbSchema}</script>
        <script type="application/ld+json">{itemListSchema}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="sticky top-16 z-30 border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('home.searchPlaceholder')}
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-5 py-3 text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <MapPinned className="h-5 w-5" />
                  {showMap
                    ? language === 'tr'
                      ? 'Haritayı Gizle'
                      : 'Hide Map'
                    : language === 'tr'
                      ? 'Haritayı Göster'
                      : 'Show Map'}
                </button>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-5 py-3 transition-colors hover:bg-gray-200"
                >
                  {showFilters ? <X className="h-5 w-5" /> : <SlidersHorizontal className="h-5 w-5" />}
                  {showFilters ? t('filter.hideFilters') : t('filter.showFilters')}
                </button>

                <button
                  onClick={resetFilters}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 transition-colors hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  {language === 'tr' ? 'Sıfırla' : 'Reset'}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('filter.status')}
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5"
                  >
                    <option value="all">{language === 'tr' ? 'Tümü' : 'All'}</option>
                    <option value="for_sale">{language === 'tr' ? 'Satılık' : 'For Sale'}</option>
                    <option value="for_rent">{language === 'tr' ? 'Kiralık' : 'For Rent'}</option>
                    <option value="sold">{language === 'tr' ? 'Satıldı' : 'Sold'}</option>
                    <option value="rented">{language === 'tr' ? 'Kiralandı' : 'Rented'}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Emlak Türü' : 'Property Type'}
                  </label>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5"
                  >
                    <option value="all">{language === 'tr' ? 'Tümü' : 'All'}</option>
                    <option value="apartment">{language === 'tr' ? 'Daire' : 'Apartment'}</option>
                    <option value="residence">{language === 'tr' ? 'Rezidans' : 'Residence'}</option>
                    <option value="duplex">{language === 'tr' ? 'Dubleks' : 'Duplex'}</option>
                    <option value="villa">{language === 'tr' ? 'Villa' : 'Villa'}</option>
                    <option value="detached_house">
                      {language === 'tr' ? 'Müstakil Ev' : 'Detached House'}
                    </option>
                    <option value="land">{language === 'tr' ? 'Arsa' : 'Land'}</option>
                    <option value="field">{language === 'tr' ? 'Tarla' : 'Field'}</option>
                    <option value="farm">{language === 'tr' ? 'Çiftlik' : 'Farm'}</option>
                    <option value="office">{language === 'tr' ? 'Ofis' : 'Office'}</option>
                    <option value="shop">{language === 'tr' ? 'Dükkan' : 'Shop'}</option>
                    <option value="building">{language === 'tr' ? 'Bina' : 'Building'}</option>
                    <option value="commercial">{language === 'tr' ? 'Ticari' : 'Commercial'}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Şehir' : 'City'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'tr' ? 'Örn: Denizli' : 'Ex: Denizli'}
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'İlçe' : 'District'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'tr' ? 'Örn: Merkezefendi' : 'Ex: Merkezefendi'}
                    value={filters.district}
                    onChange={(e) => handleFilterChange('district', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Oda Sayısı' : 'Rooms'}
                  </label>
                  <select
                    value={filters.rooms}
                    onChange={(e) => handleFilterChange('rooms', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5"
                  >
                    <option value="all">{language === 'tr' ? 'Tümü' : 'All'}</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6+</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('filter.priceRange')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-1/2 rounded-xl border border-gray-300 bg-white px-3 py-2.5"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-1/2 rounded-xl border border-gray-300 bg-white px-3 py-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Min m²' : 'Min m²'}
                  </label>
                  <input
                    type="number"
                    placeholder="Min m²"
                    value={filters.minArea}
                    onChange={(e) => handleFilterChange('minArea', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Max m²' : 'Max m²'}
                  </label>
                  <input
                    type="number"
                    placeholder="Max m²"
                    value={filters.maxArea}
                    onChange={(e) => handleFilterChange('maxArea', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Sıralama' : 'Sort By'}
                  </label>
                  <div className="relative">
                    <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-3 py-2.5 pr-10"
                    >
                      <option value="newest">{language === 'tr' ? 'En Yeni' : 'Newest'}</option>
                      <option value="oldest">{language === 'tr' ? 'En Eski' : 'Oldest'}</option>
                      <option value="price_asc">
                        {language === 'tr' ? 'Fiyat Artan' : 'Price Low to High'}
                      </option>
                      <option value="price_desc">
                        {language === 'tr' ? 'Fiyat Azalan' : 'Price High to Low'}
                      </option>
                      <option value="area_asc">{language === 'tr' ? 'm² Artan' : 'Area Low to High'}</option>
                      <option value="area_desc">{language === 'tr' ? 'm² Azalan' : 'Area High to Low'}</option>
                      <option value="most_viewed">
                        {language === 'tr' ? 'En Çok Görüntülenen' : 'Most Viewed'}
                      </option>
                    </select>
                  </div>
                </div>

                <div className="flex items-end">
                  <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3">
                    <input
                      type="checkbox"
                      checked={filters.featuredOnly}
                      onChange={(e) => handleFilterChange('featuredOnly', e.target.checked)}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-gray-700">
                      {language === 'tr' ? 'Sadece öne çıkanlar' : 'Featured only'}
                    </span>
                  </label>
                </div>

                <div className="flex items-end xl:col-span-2">
                  <div className="w-full rounded-xl border border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-600">
                    {resultText}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showMap && (
          <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3 px-2 pb-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {language === 'tr' ? 'Haritalı İlan Görünümü' : 'Map View'}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {language === 'tr'
                      ? `${mappedProperties.length} konumlu ilan`
                      : `${mappedProperties.length} mapped listings`}
                  </span>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={mapFilterEnabled}
                    onChange={(e) => setMapFilterEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-brand focus:ring-cta"
                  />
                  <span>
                    {language === 'tr'
                      ? 'Haritadaki alanı sonuçlara uygula'
                      : 'Apply visible map area to results'}
                  </span>
                </label>
              </div>

              {mappedProperties.length > 0 ? (
                <PropertyMap
                  properties={mappedProperties}
                  onSelect={(id) => onNavigate('property-detail', id)}
                  onBoundsChange={setMapBounds}
                />
              ) : (
                <div className="flex h-[220px] items-center justify-center px-6 text-center text-gray-500">
                  {language === 'tr'
                    ? 'Haritada gösterebilmek için ilanlara latitude ve longitude bilgisi eklenmelidir.'
                    : 'Latitude and longitude must be added to listings to display them on the map.'}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loading ? (
            <div className="py-16 text-center text-gray-600">{t('common.loading')}</div>
          ) : visibleProperties.length > 0 ? (
            <>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {language === 'tr' ? 'Tüm İlanlar' : 'All Listings'}
                </h2>
                <div className="text-sm text-gray-500">{resultText}</div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visibleProperties.map((property) => {
                  const isFavorite = favoriteIds.includes(property.id);

                  return (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onClick={() => onNavigate('property-detail', property.id)}
                      isFavorite={isFavorite}
                      onToggleFavorite={toggleFavorite}
                      onShareWhatsApp={shareOnWhatsApp}
                      onCopyLink={copyPropertyLink}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-gray-500">{t('common.noResults')}</div>
          )}
        </div>
      </div>
    </>
  );
}