// src/pages/VehiclesPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import type { Vehicle } from '../lib/database.types';
import VehicleCard from '../components/VehicleCard';
import { useLanguage } from '../contexts/LanguageContext';

interface VehiclesPageProps {
  onNavigate: (page: string, vehicleId?: string) => void;
}

type Lang = 'tr' | 'en';

type VehicleFilterState = {
  search: string;
  status: string;
  brand: string;
  model: string;
  fuel: string;
  transmission: string;
  minYear: string;
  maxYear: string;
  minKm: string;
  maxKm: string;
  minPrice: string;
  maxPrice: string;
  city: string;
};

export default function VehiclesPage({ onNavigate }: VehiclesPageProps) {
  const { language, t } = useLanguage() as { language: Lang; t: (k: string) => string };

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  const [filters, setFilters] = useState<VehicleFilterState>({
    search: '',
    status: 'all',
    brand: '',
    model: '',
    fuel: 'all',
    transmission: 'all',
    minYear: '',
    maxYear: '',
    minKm: '',
    maxKm: '',
    minPrice: '',
    maxPrice: '',
    city: '',
  });

  const safeT = (key: string, trFallback: string, enFallback: string) => {
    const out = t(key);
    if (out === key) return language === 'tr' ? trFallback : enFallback;
    return out;
  };

  const dictionaries = useMemo(() => {
    return {
      status: {
        all: { tr: 'Tümü', en: 'All' },
        for_sale: { tr: 'Satılık', en: 'For Sale' },
        sold: { tr: 'Satıldı', en: 'Sold' },
      } as Record<string, { tr: string; en: string }>,
      fuel: {
        all: { tr: 'Tümü', en: 'All' },
        gasoline: { tr: 'Benzin', en: 'Gasoline' },
        diesel: { tr: 'Dizel', en: 'Diesel' },
        hybrid: { tr: 'Hibrit', en: 'Hybrid' },
        electric: { tr: 'Elektrik', en: 'Electric' },
        lpg: { tr: 'LPG', en: 'LPG' },
      } as Record<string, { tr: string; en: string }>,
      transmission: {
        all: { tr: 'Tümü', en: 'All' },
        automatic: { tr: 'Otomatik', en: 'Automatic' },
        manual: { tr: 'Manuel', en: 'Manual' },
        semi_automatic: { tr: 'Yarı Otomatik', en: 'Semi-automatic' },
        tiptronic: { tr: 'Tiptronic', en: 'Tiptronic' },
      } as Record<string, { tr: string; en: string }>,
    };
  }, []);

  const labelFrom = (dict: Record<string, { tr: string; en: string }>, value?: string) => {
    if (!value) return '-';
    return dict[value]?.[language] ?? value;
  };

  useEffect(() => {
    void loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    void loadFilterOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFilterOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('brand, model, city')
        .eq('moderation_status', 'approved');

      if (error) throw error;

      const rows = (data ?? []) as Array<Pick<Vehicle, 'brand' | 'model' | 'city'>>;

      const brands = new Set<string>();
      const models = new Set<string>();
      const cities = new Set<string>();

      rows.forEach((v) => {
        if (v.brand) brands.add(String(v.brand).trim());
        if (v.model) models.add(String(v.model).trim());
        if (v.city) cities.add(String(v.city).trim());
      });

      setBrandOptions(Array.from(brands).sort((a, b) => a.localeCompare(b)));
      setModelOptions(Array.from(models).sort((a, b) => a.localeCompare(b)));
      setCityOptions(Array.from(cities).sort((a, b) => a.localeCompare(b)));
    } catch (err) {
      console.error('Error loading vehicle filter options:', err);
    }
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('vehicles')
        .select('*')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (filters.search) {
        const s = filters.search.trim();
        if (s) {
          query = query.or(
            `title.ilike.%${s}%,brand.ilike.%${s}%,model.ilike.%${s}%,city.ilike.%${s}%,district.ilike.%${s}%`
          );
        }
      }

      if (filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters.brand) query = query.ilike('brand', `%${filters.brand}%`);
      if (filters.model) query = query.ilike('model', `%${filters.model}%`);
      if (filters.city) query = query.ilike('city', `%${filters.city}%`);
      if (filters.fuel !== 'all') query = query.eq('fuel', filters.fuel);
      if (filters.transmission !== 'all') query = query.eq('transmission', filters.transmission);

      if (filters.minYear) query = query.gte('year', parseInt(filters.minYear, 10));
      if (filters.maxYear) query = query.lte('year', parseInt(filters.maxYear, 10));
      if (filters.minKm) query = query.gte('km', parseInt(filters.minKm, 10));
      if (filters.maxKm) query = query.lte('km', parseInt(filters.maxKm, 10));
      if (filters.minPrice) query = query.gte('price', parseFloat(filters.minPrice));
      if (filters.maxPrice) query = query.lte('price', parseFloat(filters.maxPrice));

      const { data, error } = await query;
      if (error) throw error;

      setVehicles((data ?? []) as Vehicle[]);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof VehicleFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      brand: '',
      model: '',
      fuel: 'all',
      transmission: 'all',
      minYear: '',
      maxYear: '',
      minKm: '',
      maxKm: '',
      minPrice: '',
      maxPrice: '',
      city: '',
    });
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => key !== 'search' && value !== '' && value !== 'all'
  );

  const pageTitle = useMemo(() => {
    if (language === 'tr') {
      if (filters.brand.trim()) {
        return `${filters.brand.trim()} Araç İlanları | Varol Gayrimenkul`;
      }
      return 'Araç İlanları | Varol Gayrimenkul';
    }

    if (filters.brand.trim()) {
      return `${filters.brand.trim()} Vehicle Listings | Varol Real Estate`;
    }
    return 'Vehicle Listings | Varol Real Estate';
  }, [language, filters.brand]);

  const pageDescription = useMemo(() => {
    if (language === 'tr') {
      const parts: string[] = [];

      if (filters.brand.trim()) parts.push(`${filters.brand.trim()} marka`);
      if (filters.model.trim()) parts.push(`${filters.model.trim()} model`);
      if (filters.city.trim()) parts.push(`${filters.city.trim()} bölgesindeki`);
      if (filters.status === 'for_sale') parts.push('satılık');
      if (filters.status === 'sold') parts.push('satılmış');

      parts.push('araç ilanlarını inceleyin.');
      parts.push(`Toplam ${vehicles.length} araç ilanı listeleniyor.`);

      return parts.join(' ');
    }

    const parts: string[] = [];

    if (filters.brand.trim()) parts.push(`${filters.brand.trim()} brand`);
    if (filters.model.trim()) parts.push(`${filters.model.trim()} model`);
    if (filters.city.trim()) parts.push(`in ${filters.city.trim()}`);
    if (filters.status === 'for_sale') parts.push('for sale');
    if (filters.status === 'sold') parts.push('sold');

    parts.push('vehicle listings.');
    parts.push(`Total ${vehicles.length} vehicle listings are displayed.`);

    return parts.join(' ');
  }, [language, filters.brand, filters.model, filters.city, filters.status, vehicles.length]);

  const canonicalUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.model) params.set('model', filters.model);
    if (filters.fuel !== 'all') params.set('fuel', filters.fuel);
    if (filters.transmission !== 'all') params.set('transmission', filters.transmission);
    if (filters.minYear) params.set('minYear', filters.minYear);
    if (filters.maxYear) params.set('maxYear', filters.maxYear);
    if (filters.minKm) params.set('minKm', filters.minKm);
    if (filters.maxKm) params.set('maxKm', filters.maxKm);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.city) params.set('city', filters.city);

    const query = params.toString();
    return query
      ? `${window.location.origin}/vehicles?${query}`
      : `${window.location.origin}/vehicles`;
  }, [filters]);

  const pageImage = useMemo(() => {
    const firstWithImage = vehicles.find(
      (vehicle) => Array.isArray(vehicle.images) && vehicle.images.length > 0 && Boolean(vehicle.images[0])
    );

    return firstWithImage?.images?.[0] || `${window.location.origin}/logo_varol.png`;
  }, [vehicles]);

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
          name: language === 'tr' ? 'Araç İlanları' : 'Vehicle Listings',
          item: `${window.location.origin}/vehicles`,
        },
      ],
    });
  }, [language]);

  const collectionPageSchema = useMemo(() => {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      inLanguage: language === 'tr' ? 'tr-TR' : 'en-US',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Varol Gayrimenkul',
        url: window.location.origin,
      },
      about: {
        '@type': 'Thing',
        name: language === 'tr' ? 'Araç İlanları' : 'Vehicle Listings',
      },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: vehicles.length,
      },
    });
  }, [pageTitle, pageDescription, canonicalUrl, language, vehicles.length]);

  const itemListSchema = useMemo(() => {
    const itemListElement = vehicles.slice(0, 50).map((vehicle, index) => {
      const firstImage =
        Array.isArray(vehicle.images) && vehicle.images.length > 0 ? vehicle.images[0] : undefined;

      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `${window.location.origin}/vehicles/${vehicle.id}`,
        name: vehicle.title,
        item: {
          '@type': 'Car',
          name: vehicle.title,
          brand: {
            '@type': 'Brand',
            name: vehicle.brand,
          },
          model: vehicle.model,
          vehicleModelDate: String(vehicle.year),
          image: firstImage ? [firstImage] : undefined,
          description: vehicle.description,
          offers: {
            '@type': 'Offer',
            price: vehicle.price,
            priceCurrency: vehicle.currency,
            availability:
              vehicle.status === 'sold'
                ? 'https://schema.org/SoldOut'
                : 'https://schema.org/InStock',
            url: `${window.location.origin}/vehicles/${vehicle.id}`,
          },
        },
      };
    });

    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: language === 'tr' ? 'Araç İlanları' : 'Vehicle Listings',
      numberOfItems: vehicles.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement,
    });
  }, [vehicles, language]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <html lang={language === 'tr' ? 'tr' : 'en'} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Varol Gayrimenkul" />
        <meta property="og:locale" content={language === 'tr' ? 'tr_TR' : 'en_US'} />
        <meta property="og:image" content={pageImage} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />

        <script type="application/ld+json">{breadcrumbSchema}</script>
        <script type="application/ld+json">{collectionPageSchema}</script>
        <script type="application/ld+json">{itemListSchema}</script>
      </Helmet>

      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            {language === 'tr' ? 'Araç İlanları' : 'Vehicle Listings'}
          </h1>

          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={
                  language === 'tr'
                    ? 'Marka, model, şehir veya ilan ara...'
                    : 'Search brand, model, city or listing...'
                }
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-cta"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
                showFilters || hasActiveFilters
                  ? 'border-brand bg-cta text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span className="hidden sm:inline">{language === 'tr' ? 'Filtrele' : 'Filters'}</span>
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-brand">
                  !
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{language === 'tr' ? 'Filtreler' : 'Filters'}</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-sm text-brand hover:text-brand-hover"
                  >
                    <X className="h-4 w-4" />
                    {language === 'tr' ? 'Filtreleri Temizle' : 'Clear filters'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Durum' : 'Status'}
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                  >
                    <option value="all">{labelFrom(dictionaries.status, 'all')}</option>
                    <option value="for_sale">{labelFrom(dictionaries.status, 'for_sale')}</option>
                    <option value="sold">{labelFrom(dictionaries.status, 'sold')}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Marka' : 'Brand'}
                  </label>
                  <input
                    list="brandOptions"
                    type="text"
                    placeholder={language === 'tr' ? 'Örn: BMW' : 'e.g. BMW'}
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                  />
                  <datalist id="brandOptions">
                    {brandOptions.slice(0, 250).map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Model' : 'Model'}
                  </label>
                  <input
                    list="modelOptions"
                    type="text"
                    placeholder={language === 'tr' ? 'Örn: 3 Serisi' : 'e.g. 3 Series'}
                    value={filters.model}
                    onChange={(e) => handleFilterChange('model', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                  />
                  <datalist id="modelOptions">
                    {modelOptions.slice(0, 300).map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Şehir' : 'City'}
                  </label>
                  <input
                    list="cityOptions"
                    type="text"
                    placeholder={language === 'tr' ? 'Şehir' : 'City'}
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                  />
                  <datalist id="cityOptions">
                    {cityOptions.slice(0, 250).map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Yakıt' : 'Fuel'}
                  </label>
                  <select
                    value={filters.fuel}
                    onChange={(e) => handleFilterChange('fuel', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                  >
                    <option value="all">{labelFrom(dictionaries.fuel, 'all')}</option>
                    <option value="gasoline">{labelFrom(dictionaries.fuel, 'gasoline')}</option>
                    <option value="diesel">{labelFrom(dictionaries.fuel, 'diesel')}</option>
                    <option value="hybrid">{labelFrom(dictionaries.fuel, 'hybrid')}</option>
                    <option value="electric">{labelFrom(dictionaries.fuel, 'electric')}</option>
                    <option value="lpg">{labelFrom(dictionaries.fuel, 'lpg')}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Vites' : 'Transmission'}
                  </label>
                  <select
                    value={filters.transmission}
                    onChange={(e) => handleFilterChange('transmission', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                  >
                    <option value="all">{labelFrom(dictionaries.transmission, 'all')}</option>
                    <option value="automatic">{labelFrom(dictionaries.transmission, 'automatic')}</option>
                    <option value="manual">{labelFrom(dictionaries.transmission, 'manual')}</option>
                    <option value="semi_automatic">
                      {labelFrom(dictionaries.transmission, 'semi_automatic')}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Min Yıl' : 'Min year'}
                  </label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minYear}
                    onChange={(e) => handleFilterChange('minYear', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Max Yıl' : 'Max year'}
                  </label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxYear}
                    onChange={(e) => handleFilterChange('maxYear', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Min KM' : 'Min km'}
                  </label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minKm}
                    onChange={(e) => handleFilterChange('minKm', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Max KM' : 'Max km'}
                  </label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxKm}
                    onChange={(e) => handleFilterChange('maxKm', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Min Fiyat' : 'Min price'}
                  </label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {language === 'tr' ? 'Max Fiyat' : 'Max price'}
                  </label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="py-12 text-center text-gray-600">
            {safeT('common.loading', 'Yükleniyor...', 'Loading...')}
          </div>
        ) : vehicles.length > 0 ? (
          <>
            <div className="mb-6 text-gray-600">
              {language === 'tr' ? (
                <>
                  Toplam <span className="font-semibold">{vehicles.length}</span> araç ilanı bulundu
                </>
              ) : (
                <>
                  Found <span className="font-semibold">{vehicles.length}</span> vehicle listings
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onClick={() => onNavigate('vehicle-detail', vehicle.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <div className="mb-4 text-gray-400">
              <Search className="mx-auto h-16 w-16" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              {language === 'tr' ? 'Araç ilanı bulunamadı' : 'No vehicle listings found'}
            </h3>
            <p className="text-gray-600">
              {language === 'tr' ? 'Filtreleri değiştirerek tekrar deneyin' : 'Try adjusting your filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}