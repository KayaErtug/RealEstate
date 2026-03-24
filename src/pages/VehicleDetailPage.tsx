// src/pages/VehicleDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Cog,
  Copy,
  ExternalLink,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
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

type VehicleDetailPageProps = {
  vehicleId?: string;
  onNavigate?: (page: string, id?: string) => void;
};

const SITE_URL = 'https://varolgayrimenkul.com';
const COMPANY_NAME = 'Varol Gayrimenkul';
const WHATSAPP_NUMBER = '905323402036';
const PHONE_PRIMARY = '+90 532 340 20 36';
const PHONE_SECONDARY = '+90 258 211 07 18';

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
  if (value === null || value === undefined) return 'Belirtilmemiş';
  return new Intl.NumberFormat('tr-TR').format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function buildVehicleLocation(vehicle: Vehicle | null) {
  if (!vehicle) return '';
  return [vehicle.location, vehicle.district, vehicle.city].filter(Boolean).join(', ');
}

function getVehicleImages(vehicle: Vehicle | null) {
  if (!vehicle) return [];
  const list = [vehicle.cover_image, ...(vehicle.images || [])].filter(Boolean) as string[];
  return Array.from(new Set(list));
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

function mapCondition(value: string | null) {
  if (!value) return 'Belirtilmemiş';

  const map: Record<string, string> = {
    new: 'Sıfır',
    used: 'İkinci El',
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

function mapHeavyDamage(value: boolean | null) {
  if (value === null) return 'Belirtilmemiş';
  return value ? 'Var' : 'Yok';
}

function getPublicVehicleUrl(vehicle: Vehicle | null, id?: string) {
  if (vehicle?.slug) return `${SITE_URL}/arac/${vehicle.slug}`;
  return `${SITE_URL}/vehicles/${id || ''}`;
}

export default function VehicleDetailPage({
  vehicleId,
  onNavigate,
}: VehicleDetailPageProps) {
  const params = useParams();
  const id = vehicleId || params.id;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [similarVehicles, setSimilarVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsFavorite(localStorage.getItem(`favorite_vehicle_${id}`) === 'true');
  }, [id]);

  useEffect(() => {
    async function fetchVehicle() {
      if (!id) {
        setVehicle(null);
        setSimilarVehicles([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).single();

      if (error || !data) {
        setVehicle(null);
        setSimilarVehicles([]);
        setLoading(false);
        return;
      }

      const currentVehicle = data as Vehicle;
      setVehicle(currentVehicle);

      const similarFilters = [
        currentVehicle.brand ? `brand.eq.${currentVehicle.brand}` : '',
        currentVehicle.city ? `city.eq.${currentVehicle.city}` : '',
      ].filter(Boolean);

      if (similarFilters.length > 0) {
        const { data: similarData } = await supabase
          .from('vehicles')
          .select('*')
          .neq('id', currentVehicle.id)
          .eq('status', 'available')
          .or(similarFilters.join(','))
          .limit(6);

        setSimilarVehicles((similarData as Vehicle[]) || []);
      } else {
        const { data: similarData } = await supabase
          .from('vehicles')
          .select('*')
          .neq('id', currentVehicle.id)
          .eq('status', 'available')
          .limit(6);

        setSimilarVehicles((similarData as Vehicle[]) || []);
      }

      setLoading(false);
    }

    fetchVehicle();
  }, [id]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [vehicle?.id]);

  const images = useMemo(() => getVehicleImages(vehicle), [vehicle]);
  const activeImage = images[activeImageIndex] || '/placeholder.svg';
  const vehicleLocation = buildVehicleLocation(vehicle);
  const canonicalUrl = getPublicVehicleUrl(vehicle, id);

  const seoTitle = vehicle ? `${vehicle.title} | ${COMPANY_NAME}` : `Araç Detayı | ${COMPANY_NAME}`;
  const seoDescription = vehicle
    ? `${vehicle.title}. ${vehicle.brand || ''} ${vehicle.model || ''} ${
        vehicle.year || ''
      } model araç ilanı, fiyat, teknik bilgiler, açıklama ve iletişim detayları ${COMPANY_NAME}’da.`
    : `${COMPANY_NAME} araç detay sayfası.`;

  const quickSpecs = [
    {
      label: 'Yıl',
      value: vehicle?.year ? String(vehicle.year) : 'Belirtilmemiş',
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      label: 'Kilometre',
      value: vehicle?.mileage ? `${formatNumber(vehicle.mileage)} km` : 'Belirtilmemiş',
      icon: <Gauge className="h-5 w-5" />,
    },
    {
      label: 'Yakıt',
      value: mapFuelType(vehicle?.fuel_type || null),
      icon: <Fuel className="h-5 w-5" />,
    },
    {
      label: 'Vites',
      value: mapTransmission(vehicle?.transmission || null),
      icon: <Cog className="h-5 w-5" />,
    },
  ];

  const detailedSpecs = [
    {
      label: 'Marka',
      value: vehicle?.brand || 'Belirtilmemiş',
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      label: 'Model',
      value: vehicle?.model || 'Belirtilmemiş',
      icon: <Car className="h-5 w-5" />,
    },
    {
      label: 'Kasa Tipi',
      value: vehicle?.body_type || 'Belirtilmemiş',
      icon: <Car className="h-5 w-5" />,
    },
    {
      label: 'Renk',
      value: vehicle?.color || 'Belirtilmemiş',
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      label: 'Çekiş',
      value: vehicle?.traction || 'Belirtilmemiş',
      icon: <Zap className="h-5 w-5" />,
    },
    {
      label: 'Motor Gücü',
      value: vehicle?.engine_power ? `${vehicle.engine_power} hp` : 'Belirtilmemiş',
      icon: <Gauge className="h-5 w-5" />,
    },
    {
      label: 'Motor Hacmi',
      value: vehicle?.engine_volume ? `${vehicle.engine_volume} cc` : 'Belirtilmemiş',
      icon: <Gauge className="h-5 w-5" />,
    },
    {
      label: 'Durum',
      value: mapCondition(vehicle?.condition || null),
      icon: <Check className="h-5 w-5" />,
    },
    {
      label: 'Kimden',
      value: vehicle?.from_who || 'Belirtilmemiş',
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      label: 'Plaka / Kayıt',
      value: vehicle?.plate_origin || 'Belirtilmemiş',
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      label: 'Ağır Hasar Kaydı',
      value: mapHeavyDamage(vehicle?.heavy_damage_record ?? null),
      icon: <AlertCircle className="h-5 w-5" />,
    },
    {
      label: 'Takas',
      value:
        vehicle?.exchange === null
          ? 'Belirtilmemiş'
          : vehicle?.exchange
          ? 'Evet'
          : 'Hayır',
      icon: <Star className="h-5 w-5" />,
    },
  ];

  const badges = [
    vehicle?.featured ? 'Öne Çıkan İlan' : null,
    vehicle?.warranty ? 'Garantili' : null,
    vehicle?.exchange ? 'Takas Değerlendirilir' : null,
    vehicle?.heavy_damage_record === false ? 'Ağır Hasar Kaydı Yok' : null,
  ].filter(Boolean) as string[];

  const toggleFavorite = () => {
    if (!id) return;
    const next = !isFavorite;
    setIsFavorite(next);
    localStorage.setItem(`favorite_vehicle_${id}`, String(next));
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handlePrevImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const whatsappMessage = encodeURIComponent(
    `Merhaba, ${vehicle?.title || 'araç ilanı'} hakkında bilgi almak istiyorum.`
  );

  const productSchema = vehicle
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: vehicle.title,
        description: vehicle.description || vehicle.title,
        image: images.length > 0 ? images : vehicle.cover_image ? [vehicle.cover_image] : [],
        brand: {
          '@type': 'Brand',
          name: vehicle.brand || 'Belirtilmemiş',
        },
        category: 'Vehicle',
        offers: {
          '@type': 'Offer',
          priceCurrency: vehicle.currency || 'TRY',
          price: vehicle.price || 0,
          availability:
            vehicle.status === 'sold'
              ? 'https://schema.org/SoldOut'
              : 'https://schema.org/InStock',
          url: canonicalUrl,
        },
      }
    : null;

  const BackButton = () => {
    if (onNavigate) {
      return (
        <button
          type="button"
          onClick={() => onNavigate('vehicles')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Araç ilanlarına dön
        </button>
      );
    }

    return (
      <Link
        to="/vehicles"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Araç ilanlarına dön
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-48 rounded-2xl bg-slate-200" />
            <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-5">
                <div className="h-[480px] rounded-[28px] bg-slate-200" />
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-24 rounded-2xl bg-slate-200" />
                  ))}
                </div>
                <div className="h-60 rounded-[28px] bg-slate-200" />
                <div className="h-80 rounded-[28px] bg-slate-200" />
              </div>
              <div className="space-y-5">
                <div className="h-72 rounded-[28px] bg-slate-200" />
                <div className="h-80 rounded-[28px] bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="rounded-full bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <Car className="h-10 w-10 text-slate-500" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-slate-900">Araç ilanı bulunamadı</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
            Bu ilan kaldırılmış olabilir veya bağlantı geçersiz olabilir.
          </p>

          {onNavigate ? (
            <button
              type="button"
              onClick={() => onNavigate('vehicles')}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Araç ilanlarına dön
            </button>
          ) : (
            <Link
              to="/vehicles"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Araç ilanlarına dön
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={activeImage} />
        <meta property="og:site_name" content={COMPANY_NAME} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={activeImage} />
        {productSchema && (
          <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
        )}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50">
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <BackButton />

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  isFavorite
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                Favori
              </button>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Kopyalandı' : 'Link Kopyala'}
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-7">
              <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
                <div className="relative">
                  <img
                    src={activeImage}
                    alt={vehicle.title}
                    className="h-[280px] w-full object-cover sm:h-[420px] lg:h-[560px]"
                  />

                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow">
                      {mapStatus(vehicle.status)}
                    </span>
                    {vehicle.featured && (
                      <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-900 shadow">
                        Öne Çıkan
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-white drop-shadow sm:text-4xl">
                        {vehicle.title}
                      </h1>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/90">
                        <div className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {vehicleLocation || 'Konum belirtilmemiş'}
                        </div>
                        <div className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(vehicle.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="hidden rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur sm:block">
                      {activeImageIndex + 1} / {Math.max(images.length, 1)}
                    </div>
                  </div>

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/60"
                        aria-label="Önceki görsel"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/60"
                        aria-label="Sonraki görsel"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3 p-4 sm:grid-cols-5 lg:grid-cols-6">
                    {images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        onClick={() => setActiveImageIndex(index)}
                        className={`overflow-hidden rounded-2xl ring-2 ring-offset-2 ring-offset-white transition ${
                          activeImageIndex === index
                            ? 'ring-slate-900'
                            : 'ring-transparent hover:ring-slate-300'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${vehicle.title} ${index + 1}`}
                          className="h-20 w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-8">
                <div className="flex flex-wrap gap-2">
                  {badges.length > 0 ? (
                    badges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                      >
                        {badge}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      Premium sunumlu araç ilanı
                    </span>
                  )}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {quickSpecs.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200">
                        {item.icon}
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Araç Açıklaması</h2>
                    <p className="mt-2 text-sm text-slate-500">İlan hakkında detaylı bilgi</p>
                  </div>
                </div>

                <div className="mt-6 whitespace-pre-line text-[15px] leading-8 text-slate-700">
                  {vehicle.description?.trim()
                    ? vehicle.description
                    : 'Bu araç için henüz açıklama eklenmemiştir.'}
                </div>
              </section>

              <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-8">
                <h2 className="text-2xl font-bold text-slate-900">Teknik ve Ek Bilgiler</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Araçla ilgili öne çıkan teknik detaylar
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {detailedSpecs.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200">
                        {item.icon}
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
                <div className="border-b border-slate-100 p-6 sm:p-8">
                  <h2 className="text-2xl font-bold text-slate-900">Konum</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {vehicleLocation || 'Konum bilgisi belirtilmemiş.'}
                  </p>
                </div>

                <div className="h-[360px] w-full">
                  <iframe
                    title="Araç konumu"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      vehicleLocation || 'Denizli'
                    )}&z=14&output=embed`}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </section>

              {similarVehicles.length > 0 && (
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Benzer Araçlar</h2>
                      <p className="mt-2 text-sm text-slate-500">
                        Aynı şehir veya markaya yakın diğer ilanlar
                      </p>
                    </div>

                    {onNavigate ? (
                      <button
                        type="button"
                        onClick={() => onNavigate('vehicles')}
                        className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
                      >
                        Tüm ilanlar
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    ) : (
                      <Link
                        to="/vehicles"
                        className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
                      >
                        Tüm ilanlar
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {similarVehicles.map((item) => {
                      const itemImage =
                        [item.cover_image, ...(item.images || [])].filter(Boolean)[0] ||
                        '/placeholder.svg';

                      const cardContent = (
                        <>
                          <div className="relative overflow-hidden">
                            <img
                              src={itemImage}
                              alt={item.title}
                              className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                            <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 backdrop-blur">
                              {mapStatus(item.status)}
                            </div>
                          </div>

                          <div className="p-5">
                            <h3 className="line-clamp-2 text-base font-bold text-slate-900">
                              {item.title}
                            </h3>

                            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                              <MapPin className="h-4 w-4" />
                              {buildVehicleLocation(item) || 'Konum belirtilmemiş'}
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <div className="rounded-2xl bg-slate-50 p-3">
                                <p className="text-xs text-slate-500">Yıl</p>
                                <p className="mt-1 font-bold text-slate-900">
                                  {item.year || '-'}
                                </p>
                              </div>
                              <div className="rounded-2xl bg-slate-50 p-3">
                                <p className="text-xs text-slate-500">KM</p>
                                <p className="mt-1 font-bold text-slate-900">
                                  {item.mileage ? `${formatNumber(item.mileage)} km` : '-'}
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 text-xl font-extrabold text-slate-900">
                              {formatPrice(item.price, item.currency)}
                            </div>
                          </div>
                        </>
                      );

                      if (onNavigate) {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onNavigate('vehicle-detail', item.id)}
                            className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                          >
                            {cardContent}
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={item.id}
                          to={`/vehicles/${item.id}`}
                          className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                          {cardContent}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-6">
              <div className="lg:sticky lg:top-6">
                <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.10)]">
                  <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                      Satış Fiyatı
                    </p>
                    <div className="mt-3 text-3xl font-extrabold sm:text-4xl">
                      {formatPrice(vehicle.price, vehicle.currency)}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      Güncel fiyat, ekspertiz durumu ve detaylı bilgi için hemen iletişime geçin.
                    </p>
                  </div>

                  <div className="space-y-4 p-6">
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-bold text-white transition hover:bg-emerald-600"
                    >
                      <MessageCircle className="h-5 w-5" />
                      WhatsApp ile bilgi al
                    </a>

                    <a
                      href={`tel:${PHONE_PRIMARY.replace(/\s/g, '')}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                    >
                      <Phone className="h-5 w-5" />
                      {PHONE_PRIMARY}
                    </a>

                    <a
                      href={`tel:${PHONE_SECONDARY.replace(/\s/g, '')}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                    >
                      <Phone className="h-5 w-5" />
                      {PHONE_SECONDARY}
                    </a>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{COMPANY_NAME}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Güven veren ilan sunumu, hızlı iletişim ve premium kullanıcı deneyimi.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          İlan Durumu
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {mapStatus(vehicle.status)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Garanti
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {vehicle.warranty === null
                            ? 'Belirtilmemiş'
                            : vehicle.warranty
                            ? 'Var'
                            : 'Yok'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}