// src/pages/VehiclesPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Car,
  ChevronDown,
  Copy,
  Filter,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Vehicle = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  city: string | null;
  district: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  fuel_type: string | null;
  transmission: string | null;
  engine_power: number | null;
  engine_volume: number | null;
  body_type: string | null;
  color: string | null;
  traction: string | null;
  condition: string | null;
  plate_origin: string | null;
  exchange: boolean | null;
  warranty: boolean | null;
  heavy_damage_record: boolean | null;
  from_who: string | null;
  featured: boolean | null;
  cover_image: string | null;
  images: string[] | null;
  created_at: string;
  slug?: string | null;
};

type VehiclesPageProps = {
  onNavigate?: (page: string, id?: string) => void;
};

type QuickTab = 'all' | 'featured' | 'newest' | 'low-km' | 'warranty' | 'exchange';

type SortOption =
  | 'newest'
  | 'oldest'
  | 'price-desc'
  | 'price-asc'
  | 'km-asc'
  | 'year-desc';

const SITE_URL = 'https://varolgayrimenkul.com';
const PAGE_TITLE = 'Araç İlanları | Varol Gayrimenkul';
const PAGE_DESCRIPTION =
  'Varol Gayrimenkul araç ilanları. Premium araç listeleme deneyimi, detaylı filtreleme, hızlı sekmeler ve modern kullanıcı arayüzü ile güncel ilanları inceleyin.';

function formatPrice(price: number | null, currency: string | null) {
  if (price === null || price === undefined) return 'Fiyat sorunuz';

  const safeCurrency = currency || 'TRY';
  const locale =
    safeCurrency === 'TRY'
      ? 'tr-TR'
      : safeCurrency === 'USD'
      ? 'en-US'
      : safeCurrency === 'EUR'
      ? 'de-DE'
      : 'tr-TR';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: safeCurrency,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('tr-TR').format(value);
}

function formatLocation(vehicle: Vehicle) {
  return [vehicle.location, vehicle.district, vehicle.city].filter(Boolean).join(', ');
}

function getMainImage(vehicle: Vehicle) {
  return [vehicle.cover_image, ...(vehicle.images || [])].filter(Boolean)[0] || '/placeholder.svg';
}

function mapStatus(value: string | null) {
  if (!value) return 'İlanda';

  const map: Record<string, string> = {
    available: 'Satışta',
    active: 'Aktif',
    pending: 'Kapora Alındı',
    passive: 'Pasif',
    sold: 'Satıldı',
  };

  return map[value] || value;
}

function mapFuelType(value: string | null) {
  if (!value) return 'Belirtilmemiş';

  const map: Record<string, string> = {
    gasoline: 'Benzin',
    diesel: 'Dizel',
    lpg: 'LPG',
    hybrid: 'Hibrit',
    electric: 'Elektrikli',
  };

  return map[value] || value;
}

function mapTransmission(value: string | null) {
  if (!value) return 'Belirtilmemiş';

  const map: Record<string, string> = {
    manual: 'Manuel',
    automatic: 'Otomatik',
    semi_automatic: 'Yarı Otomatik',
  };

  return map[value] || value;
}

function getVehicleUrl(vehicle: Vehicle) {
  if (vehicle.slug) return `/arac/${vehicle.slug}`;
  return `/vehicles/${vehicle.id}`;
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export default function VehiclesPage({ onNavigate }: VehiclesPageProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuickTab, setActiveQuickTab] = useState<QuickTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedFuel, setSelectedFuel] = useState('all');
  const [selectedTransmission, setSelectedTransmission] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    async function fetchVehicles() {
      setLoading(true);

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error || !data) {
        setVehicles([]);
        setLoading(false);
        return;
      }

      setVehicles((data as Vehicle[]) || []);
      setLoading(false);
    }

    fetchVehicles();
  }, []);

  useEffect(() => {
    const nextFavorites: Record<string, boolean> = {};

    vehicles.forEach((vehicle) => {
      nextFavorites[vehicle.id] = localStorage.getItem(`favorite_vehicle_${vehicle.id}`) === 'true';
    });

    setFavorites(nextFavorites);
  }, [vehicles]);

  const brandOptions = useMemo(() => {
    return ['all', ...Array.from(new Set(vehicles.map((v) => v.brand).filter(Boolean) as string[]))];
  }, [vehicles]);

  const fuelOptions = useMemo(() => {
    return [
      'all',
      ...Array.from(new Set(vehicles.map((v) => v.fuel_type).filter(Boolean) as string[])),
    ];
  }, [vehicles]);

  const transmissionOptions = useMemo(() => {
    return [
      'all',
      ...Array.from(new Set(vehicles.map((v) => v.transmission).filter(Boolean) as string[])),
    ];
  }, [vehicles]);

  const cityOptions = useMemo(() => {
    return ['all', ...Array.from(new Set(vehicles.map((v) => v.city).filter(Boolean) as string[]))];
  }, [vehicles]);

  const activeVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => vehicle.status !== 'passive');
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    let result = [...activeVehicles];

    if (activeQuickTab === 'featured') {
      result = result.filter((vehicle) => vehicle.featured);
    }

    if (activeQuickTab === 'low-km') {
      result = result.filter(
        (vehicle) => typeof vehicle.mileage === 'number' && vehicle.mileage <= 100000
      );
    }

    if (activeQuickTab === 'warranty') {
      result = result.filter((vehicle) => vehicle.warranty === true);
    }

    if (activeQuickTab === 'exchange') {
      result = result.filter((vehicle) => vehicle.exchange === true);
    }

    if (activeQuickTab === 'newest') {
      result = result.filter((vehicle) => {
        const createdTime = new Date(vehicle.created_at).getTime();
        const last30Days = Date.now() - 1000 * 60 * 60 * 24 * 30;
        return createdTime >= last30Days;
      });
    }

    if (selectedBrand !== 'all') {
      result = result.filter((vehicle) => vehicle.brand === selectedBrand);
    }

    if (selectedFuel !== 'all') {
      result = result.filter((vehicle) => vehicle.fuel_type === selectedFuel);
    }

    if (selectedTransmission !== 'all') {
      result = result.filter((vehicle) => vehicle.transmission === selectedTransmission);
    }

    if (selectedCity !== 'all') {
      result = result.filter((vehicle) => vehicle.city === selectedCity);
    }

    if (searchTerm.trim()) {
      const normalizedQuery = normalizeText(searchTerm.trim());

      result = result.filter((vehicle) => {
        const haystack = normalizeText(
          [
            vehicle.title,
            vehicle.brand,
            vehicle.model,
            vehicle.city,
            vehicle.district,
            vehicle.location,
            vehicle.body_type,
            vehicle.color,
            vehicle.description || '',
          ]
            .filter(Boolean)
            .join(' ')
        );

        return haystack.includes(normalizedQuery);
      });
    }

    switch (sortBy) {
      case 'oldest':
        result.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'price-desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'price-asc':
        result.sort((a, b) => {
          const aPrice = a.price ?? Number.MAX_SAFE_INTEGER;
          const bPrice = b.price ?? Number.MAX_SAFE_INTEGER;
          return aPrice - bPrice;
        });
        break;
      case 'km-asc':
        result.sort((a, b) => {
          const aMileage = a.mileage ?? Number.MAX_SAFE_INTEGER;
          const bMileage = b.mileage ?? Number.MAX_SAFE_INTEGER;
          return aMileage - bMileage;
        });
        break;
      case 'year-desc':
        result.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case 'newest':
      default:
        result.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    return result;
  }, [
    activeQuickTab,
    activeVehicles,
    searchTerm,
    selectedBrand,
    selectedFuel,
    selectedTransmission,
    selectedCity,
    sortBy,
  ]);

  const stats = useMemo(() => {
    return {
      total: activeVehicles.length,
      featured: activeVehicles.filter((vehicle) => vehicle.featured).length,
      warranty: activeVehicles.filter((vehicle) => vehicle.warranty).length,
      exchange: activeVehicles.filter((vehicle) => vehicle.exchange).length,
    };
  }, [activeVehicles]);

  const activeFilterCount = [
    selectedBrand !== 'all',
    selectedFuel !== 'all',
    selectedTransmission !== 'all',
    selectedCity !== 'all',
    searchTerm.trim() !== '',
    activeQuickTab !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setActiveQuickTab('all');
    setSearchTerm('');
    setSelectedBrand('all');
    setSelectedFuel('all');
    setSelectedTransmission('all');
    setSelectedCity('all');
    setSortBy('newest');
  };

  const toggleFavorite = (vehicleId: string) => {
    const nextValue = !favorites[vehicleId];
    localStorage.setItem(`favorite_vehicle_${vehicleId}`, String(nextValue));
    setFavorites((prev) => ({ ...prev, [vehicleId]: nextValue }));
  };

  const copyVehicleLink = async (vehicle: Vehicle) => {
    try {
      const url = `${window.location.origin}${getVehicleUrl(vehicle)}`;
      await navigator.clipboard.writeText(url);
      setCopiedId(vehicle.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(null);
    }
  };

  const renderVehicleCard = (vehicle: Vehicle) => {
    const cardBody = (
      <>
        <div className="relative overflow-hidden">
          <img
            src={getMainImage(vehicle)}
            alt={vehicle.title}
            className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white shadow">
              {mapStatus(vehicle.status)}
            </span>

            {vehicle.featured && (
              <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold text-slate-900 shadow">
                Öne Çıkan
              </span>
            )}
          </div>

          <div className="absolute right-3 top-3 flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleFavorite(vehicle.id);
              }}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full backdrop-blur transition ${
                favorites[vehicle.id]
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/85 text-slate-700 hover:bg-white'
              }`}
              aria-label="Favori"
            >
              <Heart className={`h-4 w-4 ${favorites[vehicle.id] ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void copyVehicleLink(vehicle);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-slate-700 backdrop-blur transition hover:bg-white"
              aria-label="Bağlantıyı kopyala"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
            <div className="rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
              {vehicle.year || 'Yıl yok'}
            </div>

            {copiedId === vehicle.id && (
              <div className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-900 shadow">
                Link kopyalandı
              </div>
            )}
          </div>
        </div>

        <div className="p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {vehicle.brand && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                {vehicle.brand}
              </span>
            )}
            {vehicle.model && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                {vehicle.model}
              </span>
            )}
          </div>

          <h3 className="line-clamp-2 min-h-[56px] text-lg font-bold leading-7 text-slate-900">
            {vehicle.title}
          </h3>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{formatLocation(vehicle) || 'Konum belirtilmemiş'}</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Gauge className="h-4 w-4" />
                <p className="text-xs">Kilometre</p>
              </div>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {vehicle.mileage ? `${formatNumber(vehicle.mileage)} km` : '-'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Fuel className="h-4 w-4" />
                <p className="text-xs">Yakıt</p>
              </div>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {mapFuelType(vehicle.fuel_type)}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-slate-500">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-xs">Vites</p>
              </div>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {mapTransmission(vehicle.transmission)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs">Durum</p>
              </div>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {vehicle.condition === 'new'
                  ? 'Sıfır'
                  : vehicle.condition === 'used'
                  ? 'İkinci El'
                  : 'Belirtilmemiş'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {vehicle.warranty && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                Garantili
              </span>
            )}
            {vehicle.exchange && (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                Takas Var
              </span>
            )}
            {vehicle.heavy_damage_record === false && (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">
                Ağır Hasar Kaydı Yok
              </span>
            )}
          </div>

          <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Fiyat</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {formatPrice(vehicle.price, vehicle.currency)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-slate-800">
              İncele
            </div>
          </div>
        </div>
      </>
    );

    if (onNavigate) {
      return (
        <button
          key={vehicle.id}
          type="button"
          onClick={() => onNavigate('vehicle-detail', vehicle.id)}
          className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white text-left shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
        >
          {cardBody}
        </button>
      );
    }

    return (
      <Link
        key={vehicle.id}
        to={getVehicleUrl(vehicle)}
        className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
      >
        {cardBody}
      </Link>
    );
  };

  return (
    <>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <link rel="canonical" href={`${SITE_URL}/vehicles`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={`${SITE_URL}/vehicles`} />
        <meta property="og:site_name" content="Varol Gayrimenkul" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50">
        <section className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  <Car className="h-4 w-4" />
                  Premium Araç İlanları
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  Sahibinden kalitesinde
                  <span className="block text-slate-600">araç listeleme deneyimi</span>
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  Güncel araç ilanlarını hızlı filtrelerle, premium kart tasarımıyla ve güçlü
                  detay akışıyla inceleyin.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm text-slate-500">Toplam İlan</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{stats.total}</p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <Star className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm text-slate-500">Öne Çıkan</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{stats.featured}</p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm text-slate-500">Garantili</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{stats.warranty}</p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm text-slate-500">Takaslı</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{stats.exchange}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Marka, model, şehir veya ilan başlığı ara..."
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                />
              </div>

              <div className="hidden flex-wrap items-center gap-3 lg:flex">
                {[
                  { key: 'all', label: 'Tümü' },
                  { key: 'featured', label: 'Öne Çıkanlar' },
                  { key: 'newest', label: 'Yeni İlanlar' },
                  { key: 'low-km', label: 'Düşük KM' },
                  { key: 'warranty', label: 'Garantili' },
                  { key: 'exchange', label: 'Takaslı' },
                ].map((tab) => {
                  const isActive = activeQuickTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveQuickTab(tab.key as QuickTab)}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  <Filter className="h-4 w-4" />
                  Filtreler
                  {activeFilterCount > 0 && (
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-900 px-2 text-xs text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div className="relative flex-1">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortOption)}
                    className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none"
                  >
                    <option value="newest">En Yeni</option>
                    <option value="oldest">En Eski</option>
                    <option value="price-desc">Fiyat Azalan</option>
                    <option value="price-asc">Fiyat Artan</option>
                    <option value="km-asc">KM Azalan</option>
                    <option value="year-desc">Model Yılı</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="mt-4 hidden grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid md:grid-cols-2 xl:grid-cols-5">
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(event) => setSelectedBrand(event.target.value)}
                  className="h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none"
                >
                  <option value="all">Tüm Markalar</option>
                  {brandOptions
                    .filter((item) => item !== 'all')
                    .map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="relative">
                <select
                  value={selectedFuel}
                  onChange={(event) => setSelectedFuel(event.target.value)}
                  className="h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none"
                >
                  <option value="all">Tüm Yakıtlar</option>
                  {fuelOptions
                    .filter((item) => item !== 'all')
                    .map((fuel) => (
                      <option key={fuel} value={fuel}>
                        {mapFuelType(fuel)}
                      </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="relative">
                <select
                  value={selectedTransmission}
                  onChange={(event) => setSelectedTransmission(event.target.value)}
                  className="h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none"
                >
                  <option value="all">Tüm Vitesler</option>
                  {transmissionOptions
                    .filter((item) => item !== 'all')
                    .map((transmission) => (
                      <option key={transmission} value={transmission}>
                        {mapTransmission(transmission)}
                      </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(event) => setSelectedCity(event.target.value)}
                  className="h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none"
                >
                  <option value="all">Tüm Şehirler</option>
                  {cityOptions
                    .filter((item) => item !== 'all')
                    .map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortOption)}
                    className="h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none"
                  >
                    <option value="newest">En Yeni</option>
                    <option value="oldest">En Eski</option>
                    <option value="price-desc">Fiyat Azalan</option>
                    <option value="price-asc">Fiyat Artan</option>
                    <option value="km-asc">KM Azalan</option>
                    <option value="year-desc">Model Yılı</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Sıfırla
                </button>
              </div>
            </div>

            {mobileFiltersOpen && (
              <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:hidden">
                <div className="grid gap-3">
                  {[
                    { key: 'all', label: 'Tümü' },
                    { key: 'featured', label: 'Öne Çıkanlar' },
                    { key: 'newest', label: 'Yeni İlanlar' },
                    { key: 'low-km', label: 'Düşük KM' },
                    { key: 'warranty', label: 'Garantili' },
                    { key: 'exchange', label: 'Takaslı' },
                  ].map((tab) => {
                    const isActive = activeQuickTab === tab.key;

                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveQuickTab(tab.key as QuickTab)}
                        className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                          isActive
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-3">
                  <div className="relative">
                    <select
                      value={selectedBrand}
                      onChange={(event) => setSelectedBrand(event.target.value)}
                      className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700"
                    >
                      <option value="all">Tüm Markalar</option>
                      {brandOptions
                        .filter((item) => item !== 'all')
                        .map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>

                  <div className="relative">
                    <select
                      value={selectedFuel}
                      onChange={(event) => setSelectedFuel(event.target.value)}
                      className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700"
                    >
                      <option value="all">Tüm Yakıtlar</option>
                      {fuelOptions
                        .filter((item) => item !== 'all')
                        .map((fuel) => (
                          <option key={fuel} value={fuel}>
                            {mapFuelType(fuel)}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>

                  <div className="relative">
                    <select
                      value={selectedTransmission}
                      onChange={(event) => setSelectedTransmission(event.target.value)}
                      className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700"
                    >
                      <option value="all">Tüm Vitesler</option>
                      {transmissionOptions
                        .filter((item) => item !== 'all')
                        .map((transmission) => (
                          <option key={transmission} value={transmission}>
                            {mapTransmission(transmission)}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>

                  <div className="relative">
                    <select
                      value={selectedCity}
                      onChange={(event) => setSelectedCity(event.target.value)}
                      className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700"
                    >
                      <option value="all">Tüm Şehirler</option>
                      {cityOptions
                        .filter((item) => item !== 'all')
                        .map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  <X className="h-4 w-4" />
                  Filtreleri sıfırla
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Sonuçlar</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                {filteredVehicles.length} araç bulundu
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount} aktif filtre
              </div>

              {activeQuickTab !== 'all' && (
                <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  Hızlı Sekme: {activeQuickTab}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
                >
                  <div className="h-56 animate-pulse bg-slate-200" />
                  <div className="space-y-4 p-5">
                    <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                    <div className="h-6 w-4/5 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-16 animate-pulse rounded-2xl bg-slate-200" />
                      <div className="h-16 animate-pulse rounded-2xl bg-slate-200" />
                    </div>
                    <div className="h-12 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVehicles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredVehicles.map((vehicle) => renderVehicleCard(vehicle))}
            </div>
          ) : (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm sm:p-16">
              <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-2xl font-black text-slate-900">Sonuç bulunamadı</h3>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600">
                Seçtiğiniz filtrelere uygun araç ilanı bulunamadı. Filtreleri sıfırlayıp tekrar
                deneyin.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
                Filtreleri temizle
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}