// src/pages/VehicleDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Car,
  Gauge,
  Fuel,
  Cog,
  MapPin,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Share2,
  Copy,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import type { Vehicle } from '../lib/database.types';
import { useLanguage } from '../contexts/LanguageContext';

const WHATSAPP_NUMBER = '+44 7355 612852';

interface VehicleDetailPageProps {
  vehicleId: string;
  onNavigate: (page: string) => void;
}

type Lang = 'tr' | 'en';

export default function VehicleDetailPage({ vehicleId, onNavigate }: VehicleDetailPageProps) {
  const { language, t } = useLanguage() as { language: Lang; t: (k: string) => string };

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [shareOpen, setShareOpen] = useState(false);

  const safeT = (key: string, trFallback: string, enFallback: string) => {
    const out = t(key);
    if (out === key) return language === 'tr' ? trFallback : enFallback;
    return out;
  };

  useEffect(() => {
    void loadVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const img = sp.get('img');
    const lb = sp.get('lb');

    if (img && !Number.isNaN(Number(img))) {
      setSelectedImage(Math.max(0, Number(img)));
    }

    if (lb === '1') {
      setIsLightboxOpen(true);
    }
  }, []);

  const setQuery = (patch: Record<string, string | null>, push = false) => {
    const url = new URL(window.location.href);

    Object.entries(patch).forEach(([k, v]) => {
      if (v === null) url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    });

    if (push) window.history.pushState({}, '', url.toString());
    else window.history.replaceState({}, '', url.toString());
  };

  const loadVehicle = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const vehicleRow = data as Vehicle;
        setVehicle(vehicleRow);

        const currentViews = typeof vehicleRow.views === 'number' ? vehicleRow.views : 0;
        await supabase.from('vehicles').update({ views: currentViews + 1 }).eq('id', vehicleId);
      } else {
        setVehicle(null);
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  };

  const humanizeEnum = (s?: string | null) => {
    if (!s) return '-';
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const dictionaries = useMemo(() => {
    return {
      transmission: {
        manual: { tr: 'Manuel', en: 'Manual' },
        automatic: { tr: 'Otomatik', en: 'Automatic' },
        semi_automatic: { tr: 'Yarı Otomatik', en: 'Semi-automatic' },
        tiptronic: { tr: 'Tiptronic', en: 'Tiptronic' },
      } as Record<string, { tr: string; en: string }>,

      fuel: {
        gasoline: { tr: 'Benzin', en: 'Gasoline' },
        diesel: { tr: 'Dizel', en: 'Diesel' },
        lpg: { tr: 'LPG', en: 'LPG' },
        hybrid: { tr: 'Hibrit', en: 'Hybrid' },
        electric: { tr: 'Elektrik', en: 'Electric' },
      } as Record<string, { tr: string; en: string }>,

      status: {
        for_sale: { tr: 'Satılık', en: 'For sale' },
        sold: { tr: 'Satıldı', en: 'Sold' },
      } as Record<string, { tr: string; en: string }>,

      drive_type: {
        fwd: { tr: 'Önden Çekiş', en: 'FWD' },
        rwd: { tr: 'Arkadan İtiş', en: 'RWD' },
        awd: { tr: '4 Çeker', en: 'AWD/4WD' },
        '4x4': { tr: '4x4', en: '4x4' },
      } as Record<string, { tr: string; en: string }>,

      damage_status: {
        none: { tr: 'Hasarsız', en: 'No damage' },
        minor: { tr: 'Boyalı/Minör', en: 'Minor' },
        medium: { tr: 'Orta', en: 'Medium' },
        heavy: { tr: 'Ağır Hasarlı', en: 'Heavily damaged' },
      } as Record<string, { tr: string; en: string }>,
    };
  }, []);

  const labelFrom = (dict: Record<string, { tr: string; en: string }>, value?: string | null) => {
    if (!value) return '-';
    return dict[value]?.[language] ?? humanizeEnum(value);
  };

  const formatPrice = (price: number, currency: string) => {
    const locale = language === 'tr' ? 'tr-TR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatNumber = (n: number) => {
    const locale = language === 'tr' ? 'tr-TR' : 'en-US';
    return new Intl.NumberFormat(locale).format(n);
  };

  const openLightbox = () => {
    setIsLightboxOpen(true);
    setZoom(1);
    setQuery({ lb: '1', img: String(selectedImage) }, false);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setZoom(1);
    setQuery({ lb: null }, false);
  };

  const getShareUrl = () => window.location.href;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      alert(safeT('share.copied', 'Link kopyalandı!', 'Link copied!'));
    } catch {
      alert(getShareUrl());
    }
  };

  const shareNative = async () => {
    const url = getShareUrl();
    const title = vehicle?.title || 'Varol Gayrimenkul';

    if ((navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title,
          text: title,
          url,
        });
      } catch {
        // kullanıcı iptal edebilir
      }
    } else {
      setShareOpen((s) => !s);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-600">
          {safeT('common.loading', 'Yükleniyor...', 'Loading...')}
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            {language === 'tr' ? 'Araç ilanı bulunamadı' : 'Vehicle listing not found'}
          </h2>
          <button
            onClick={() => onNavigate('vehicles')}
            className="text-brand hover:text-brand-hover"
          >
            {language === 'tr' ? 'Araç İlanlarına Dön' : 'Back to vehicle listings'}
          </button>
        </div>
      </div>
    );
  }

  const images =
    vehicle.images && vehicle.images.length > 0
      ? vehicle.images.slice(0, 20)
      : [
          'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=1600',
        ];

  const nextImage = () => {
    setSelectedImage((i) => {
      const ni = (i + 1) % images.length;
      setQuery({ img: String(ni) }, false);
      return ni;
    });
  };

  const prevImage = () => {
    setSelectedImage((i) => {
      const ni = (i - 1 + images.length) % images.length;
      setQuery({ img: String(ni) }, false);
      return ni;
    });
  };

  useEffect(() => {
    if (!isLightboxOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === '+') setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)));
      if (e.key === '-') setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)));
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen, images.length]);

  const waText = encodeURIComponent(
    language === 'tr'
      ? `Merhaba, ${vehicle.brand} ${vehicle.model} (${vehicle.year}) araç ilanı hakkında bilgi almak istiyorum. (İlan: ${vehicle.title})`
      : `Hello, I would like to get information about ${vehicle.brand} ${vehicle.model} (${vehicle.year}). (Listing: ${vehicle.title})`
  );

  const contactDigits = (vehicle.contact_phone || '').replace(/\D/g, '');
  const waNumber = contactDigits.length >= 10 ? contactDigits.replace(/^0/, '9') : WHATSAPP_NUMBER;
  const waLink = `https://wa.me/${waNumber}?text=${waText}`;

  const waShareLink = `https://wa.me/?text=${encodeURIComponent(`${vehicle.title}\n${getShareUrl()}`)}`;
  const fbShareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`;

  const transmissionLabel = labelFrom(dictionaries.transmission, vehicle.transmission);
  const fuelLabel = labelFrom(dictionaries.fuel, vehicle.fuel);
  const statusLabel = labelFrom(dictionaries.status, vehicle.status);
  const driveLabel = vehicle.drive_type ? labelFrom(dictionaries.drive_type, vehicle.drive_type) : null;
  const damageLabel = vehicle.damage_status
    ? labelFrom(dictionaries.damage_status, vehicle.damage_status)
    : null;

  const canonicalUrl = `${window.location.origin}/vehicles/${vehicle.id}`;
  const pageTitle =
    language === 'tr'
      ? `${vehicle.brand} ${vehicle.model} ${vehicle.year} | Araç İlanı | Varol Gayrimenkul`
      : `${vehicle.brand} ${vehicle.model} ${vehicle.year} | Vehicle Listing | Varol Real Estate`;

  const pageDescription =
    language === 'tr'
      ? `${vehicle.brand} ${vehicle.model} ${vehicle.year} model araç ilanı. ${formatNumber(
          vehicle.km
        )} km, ${formatPrice(vehicle.price, vehicle.currency)} fiyat, ${vehicle.city}${
          vehicle.district ? ` / ${vehicle.district}` : ''
        } konum.`
      : `${vehicle.brand} ${vehicle.model} ${vehicle.year} vehicle listing. ${formatNumber(
          vehicle.km
        )} km, ${formatPrice(vehicle.price, vehicle.currency)}, located in ${vehicle.city}${
          vehicle.district ? ` / ${vehicle.district}` : ''
        }.`;

  const pageImage = images[0];

  const breadcrumbSchema = JSON.stringify({
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
      {
        '@type': 'ListItem',
        position: 3,
        name: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
        item: canonicalUrl,
      },
    ],
  });

  const vehicleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: vehicle.title,
    brand: {
      '@type': 'Brand',
      name: vehicle.brand,
    },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: vehicle.km,
      unitCode: 'KMT',
    },
    fuelType: fuelLabel,
    vehicleTransmission: transmissionLabel,
    color: vehicle.color || undefined,
    vehicleEngine: vehicle.engine
      ? {
          '@type': 'EngineSpecification',
          name: vehicle.engine,
          enginePower: vehicle.engine_power_hp
            ? {
                '@type': 'QuantitativeValue',
                value: vehicle.engine_power_hp,
                unitCode: 'H75',
              }
            : undefined,
        }
      : undefined,
    bodyType: vehicle.body_type || undefined,
    driveWheelConfiguration: driveLabel || undefined,
    description: vehicle.description,
    image: images,
    url: canonicalUrl,
    offers: {
      '@type': 'Offer',
      price: vehicle.price,
      priceCurrency: vehicle.currency,
      availability:
        vehicle.status === 'sold'
          ? 'https://schema.org/SoldOut'
          : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
      url: canonicalUrl,
      seller: {
        '@type': 'LocalBusiness',
        name: vehicle.contact_name || 'Varol Gayrimenkul',
        telephone: vehicle.contact_phone || undefined,
        address: {
          '@type': 'PostalAddress',
          addressLocality: vehicle.city,
          addressRegion: vehicle.district || undefined,
          addressCountry: 'TR',
        },
      },
    },
  });

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
        <script type="application/ld+json">{vehicleSchema}</script>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('vehicles')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          {safeT('common.back', 'Geri Dön', 'Back')}
        </button>

        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="grid grid-cols-1 gap-2 p-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="relative">
                <img
                  src={images[selectedImage]}
                  alt={vehicle.title}
                  className="h-[520px] w-full cursor-zoom-in rounded-lg object-cover md:h-[620px]"
                  onClick={openLightbox}
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/55"
                      aria-label="Prev"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/55"
                      aria-label="Next"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-2 grid grid-cols-4 gap-2 md:grid-cols-6">
                  {images.slice(0, 20).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${vehicle.title} ${index + 1}`}
                      onClick={() => {
                        setSelectedImage(index);
                        setQuery({ img: String(index) }, false);
                      }}
                      className={`h-20 w-full cursor-pointer rounded-lg object-cover md:h-24 ${
                        selectedImage === index ? 'ring-2 ring-brand' : 'opacity-70 hover:opacity-100'
                      }`}
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-gray-50 p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  {vehicle.brand} {vehicle.model}
                </h2>

                <div className="relative">
                  <button
                    type="button"
                    onClick={shareNative}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <Share2 className="h-4 w-4" />
                    {safeT('share.button', 'Paylaş', 'Share')}
                  </button>

                  {shareOpen && (
                    <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                      <a
                        href={waShareLink}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {safeT('share.whatsapp', 'WhatsApp', 'WhatsApp')}
                      </a>
                      <a
                        href={fbShareLink}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {safeT('share.facebook', 'Facebook', 'Facebook')}
                      </a>
                      <button
                        type="button"
                        onClick={shareNative}
                        className="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-50"
                        title="Mobilde Web Share ile Instagram dahil seçenekler çıkar"
                      >
                        {safeT('share.instagram', 'Instagram', 'Instagram')}
                      </button>
                      <button
                        type="button"
                        onClick={copyLink}
                        className="inline-flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        <Copy className="h-4 w-4" />
                        {safeT('share.copyLink', 'Linki Kopyala', 'Copy link')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="mb-4 text-gray-600">
                {vehicle.year} • {formatNumber(vehicle.km)} km
              </p>

              <p className="mb-6 text-3xl font-bold text-brand">
                {formatPrice(vehicle.price, vehicle.currency)}
              </p>

              {(vehicle.contact_name || vehicle.contact_phone) && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
                  <div className="font-medium">
                    {vehicle.contact_name || (language === 'tr' ? 'İlan Yetkilisi' : 'Listing contact')}
                  </div>
                  <div className="text-gray-600">{vehicle.contact_phone || '+90 507 318 22 22'}</div>
                </div>
              )}

              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-lg bg-cta py-3 text-center font-semibold text-white transition-colors hover:bg-cta-hover"
              >
                {language === 'tr' ? 'WhatsApp ile İletişime Geç' : 'Contact on WhatsApp'}
              </a>

              <div className="mt-6 space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-gray-500" />
                  <span>
                    <b>{language === 'tr' ? 'Vites:' : 'Transmission:'}</b> {transmissionLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-gray-500" />
                  <span>
                    <b>{language === 'tr' ? 'Yakıt:' : 'Fuel:'}</b> {fuelLabel}
                  </span>
                </div>

                {driveLabel && (
                  <div className="flex items-center gap-2">
                    <Cog className="h-4 w-4 text-gray-500" />
                    <span>
                      <b>{language === 'tr' ? 'Çekiş:' : 'Drive:'}</b> {driveLabel}
                    </span>
                  </div>
                )}

                {damageLabel && (
                  <div className="flex items-center gap-2">
                    <Cog className="h-4 w-4 text-gray-500" />
                    <span>
                      <b>{language === 'tr' ? 'Hasar Durumu:' : 'Damage status:'}</b> {damageLabel}
                    </span>
                  </div>
                )}

                {vehicle.swap_available && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>
                      <b>{language === 'tr' ? 'Takas:' : 'Swap:'}</b>{' '}
                      {language === 'tr' ? 'Uygun' : 'Available'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-gray-500" />
                  <span>
                    <b>{language === 'tr' ? 'Kilometre:' : 'Mileage:'}</b> {formatNumber(vehicle.km)} km
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>
                    <b>{language === 'tr' ? 'Konum:' : 'Location:'}</b> {vehicle.location}, {vehicle.city}
                    {vehicle.district ? ` / ${vehicle.district}` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Cog className="h-4 w-4 text-gray-500" />
                  <span>
                    <b>{language === 'tr' ? 'Durum:' : 'Status:'}</b> {statusLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h1 className="mb-3 text-2xl font-bold text-gray-900">{vehicle.title}</h1>
            <p className="whitespace-pre-line text-gray-700">{vehicle.description}</p>
          </div>
        </div>

        {isLightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={closeLightbox}
          >
            <div
              className="relative w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => {
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoom((z) => Math.min(3, Math.max(1, +(z + delta).toFixed(2))));
              }}
            >
              <div className="absolute left-3 top-3 flex gap-2">
                <button
                  className="rounded-lg bg-white/90 px-3 py-2 hover:bg-white"
                  onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}
                  type="button"
                >
                  +
                </button>
                <button
                  className="rounded-lg bg-white/90 px-3 py-2 hover:bg-white"
                  onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))}
                  type="button"
                >
                  −
                </button>
              </div>

              <div className="absolute right-3 top-3 flex gap-2">
                <button
                  className="rounded-lg bg-white/90 px-3 py-2 hover:bg-white"
                  onClick={prevImage}
                  type="button"
                >
                  ‹
                </button>
                <button
                  className="rounded-lg bg-white/90 px-3 py-2 hover:bg-white"
                  onClick={nextImage}
                  type="button"
                >
                  ›
                </button>
                <button
                  className="rounded-lg bg-white/90 px-3 py-2 hover:bg-white"
                  onClick={closeLightbox}
                  type="button"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-hidden rounded-xl bg-black">
                <img
                  src={images[selectedImage]}
                  alt={vehicle.title}
                  className="h-[80vh] w-full select-none object-contain"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                  draggable={false}
                />
              </div>

              <p className="mt-2 text-center text-sm text-white/80">
                {language === 'tr' ? 'Mouse tekerleği ile zoom' : 'Zoom with mouse wheel'} • {zoom}x
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}