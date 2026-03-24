// src/components/home/HomeVehiclesShowcase.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Car,
  Copy,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

type HomeVehiclesShowcaseProps = {
  onNavigate?: (page: string, id?: string) => void;
};

type ShowcaseTab = 'featured' | 'latest' | 'warranty';

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

function getVehicleUrl(vehicle: Vehicle) {
  if (vehicle.slug) return `/arac/${vehicle.slug}`;
  return `/vehicles/${vehicle.id}`;
}

function getMainImage(vehicle: Vehicle) {
  return [vehicle.cover_image, ...(vehicle.images || [])].filter(Boolean)[0] || '/placeholder.svg';
}

function formatLocation(vehicle: Vehicle) {
  return [vehicle.location, vehicle.district, vehicle.city].filter(Boolean).join(', ');
}

export default function HomeVehiclesShowcase({
  onNavigate,
}: HomeVehiclesShowcaseProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('featured');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVehicles() {
      setLoading(true);

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .neq('status', 'passive')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(18);

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

  const visibleVehicles = useMemo(() => {
    let result = [...vehicles];

    if (activeTab === 'featured') {
      result = result.filter((vehicle) => vehicle.featured);
    }

    if (activeTab === 'warranty') {
      result = result.filter((vehicle) => vehicle.warranty === true);
    }

    if (activeTab === 'latest') {
      result = [...result].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    if (activeTab === 'featured' && result.length === 0) {
      result = [...vehicles];
    }

    if (activeTab === 'warranty' && result.length === 0) {
      result = [...vehicles];
    }

    return result.slice(0, 6);
  }, [activeTab, vehicles]);

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
    const content = (
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
          {content}
        </button>
      );
    }

    return (
      <Link
        key={vehicle.id}
        to={getVehicleUrl(vehicle)}
        className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
      >
        {content}
      </Link>
    );
  };

  return (
    <section className="bg-gradient-to-b from-slate-100 via-white to-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              <Car className="h-4 w-4" />
              Vitrin Araçlar
            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Öne çıkan araç ilanları
            </h2>

            <p className="mt-4 text-base leading-8 text-slate-600">
              Premium kart yapısı, güçlü görsel sunum ve hızlı detay akışıyla araç vitrini.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { key: 'featured', label: 'Öne Çıkanlar' },
              { key: 'latest', label: 'Yeni İlanlar' },
              { key: 'warranty', label: 'Garantili' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as ShowcaseTab)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
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
        ) : visibleVehicles.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleVehicles.map((vehicle) => renderVehicleCard(vehicle))}
            </div>

            <div className="mt-10 flex justify-center">
              {onNavigate ? (
                <button
                  type="button"
                  onClick={() => onNavigate('vehicles')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Tüm araç ilanlarını gör
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  to="/vehicles"
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Tüm araç ilanlarını gör
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm sm:p-16">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <RefreshCw className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-2xl font-black text-slate-900">Araç vitrini hazırlanıyor</h3>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600">
              Şu anda gösterilecek uygun araç ilanı bulunamadı. Yeni ilanlar eklendiğinde bu alan
              otomatik olarak dolacaktır.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}