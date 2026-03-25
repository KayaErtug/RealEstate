// src/components/PropertyCard.tsx
import type { MouseEvent } from 'react';
import {
  MapPin,
  Home,
  Bath,
  Maximize,
  Heart,
  Share2,
  Copy,
  Layers3,
  Sparkles,
  BadgePercent,
} from 'lucide-react';
import type { Property } from '../lib/database.types';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getPropertyTypeLabel,
  getStatusColor,
  getStatusLabel,
} from '../lib/propertyTranslations';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (propertyId: string) => void;
  onShareWhatsApp?: (property: Property) => void;
  onCopyLink?: (propertyId: string) => void;
}

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

type PropertyWithOptionalFields = Property & {
  quality_score?: number | null;
  old_price?: number | null;
};

export default function PropertyCard({
  property,
  onClick,
  isFavorite = false,
  onToggleFavorite,
  onShareWhatsApp,
  onCopyLink,
}: PropertyCardProps) {
  const { language } = useLanguage();

  const propertyWithOptionalFields = property as PropertyWithOptionalFields;

  const formatPrice = (price: number, currency: string) => {
    const locale = language === 'tr' ? 'tr-TR' : 'en-US';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const propertyTypeValue = String(property.property_type ?? '').toLowerCase();
  const isLandLike = LAND_PROPERTY_TYPES.has(propertyTypeValue);
  const isCommercialLike = COMMERCIAL_PROPERTY_TYPES.has(propertyTypeValue);
  const isSoldLike = property.status === 'sold' || property.status === 'rented';

  const mainImage =
    property.images && property.images.length > 0
      ? property.images[0]
      : 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';

  const handleFavoriteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleFavorite?.(property.id);
  };

  const handleWhatsAppClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onShareWhatsApp?.(property);
  };

  const handleCopyClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onCopyLink?.(property.id);
  };

  const detailBadges = (() => {
    if (isLandLike) {
      return [
        {
          key: 'type',
          icon: Layers3,
          value: getPropertyTypeLabel(property.property_type, language),
        },
        {
          key: 'area',
          icon: Maximize,
          value: property.area > 0 ? `${property.area} m²` : '-',
        },
      ];
    }

    if (isCommercialLike) {
      return [
        {
          key: 'type',
          icon: Layers3,
          value: getPropertyTypeLabel(property.property_type, language),
        },
        {
          key: 'area',
          icon: Maximize,
          value: property.area > 0 ? `${property.area} m²` : '-',
        },
      ];
    }

    return [
      {
        key: 'rooms',
        icon: Home,
        value:
          property.rooms && Number(property.rooms) > 0
            ? String(property.rooms)
            : '-',
      },
      {
        key: 'bathrooms',
        icon: Bath,
        value:
          property.bathrooms && Number(property.bathrooms) > 0
            ? String(property.bathrooms)
            : '-',
      },
      {
        key: 'area',
        icon: Maximize,
        value: property.area > 0 ? `${property.area} m²` : '-',
      },
    ];
  })();

  const rawQualityScore = propertyWithOptionalFields.quality_score;
  const hasQualityScore =
    typeof rawQualityScore === 'number' && Number.isFinite(rawQualityScore) && rawQualityScore > 0;

  const qualityScore = hasQualityScore ? Number(rawQualityScore) : 0;

  const qualityLabel =
    qualityScore >= 85
      ? language === 'tr'
        ? 'Yüksek Kalite'
        : 'High Quality'
      : qualityScore >= 65
        ? language === 'tr'
          ? 'İyi Seviye'
          : 'Good Level'
        : language === 'tr'
          ? 'Geliştirilebilir'
          : 'Needs Improvement';

  const qualityBarWidth = Math.max(8, Math.min(100, qualityScore));

  const rawOldPrice = propertyWithOptionalFields.old_price;
  const hasOldPrice =
    typeof rawOldPrice === 'number' &&
    Number.isFinite(rawOldPrice) &&
    rawOldPrice > property.price;

  const discountPercent = hasOldPrice
    ? Math.round(((rawOldPrice - property.price) / rawOldPrice) * 100)
    : 0;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-stretch">
        <div className="relative h-[108px] w-[126px] shrink-0 overflow-hidden bg-slate-200 sm:h-[118px] sm:w-[150px]">
          <img
            src={mainImage}
            alt={property.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute left-2 top-2 flex max-w-[90%] flex-wrap gap-1">
            <span
              className={`${getStatusColor(property.status)} rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow`}
            >
              {getStatusLabel(property.status, language)}
            </span>

            {property.featured ? (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white shadow">
                {language === 'tr' ? 'Öne Çıkan' : 'Featured'}
              </span>
            ) : null}

            {hasOldPrice ? (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white shadow">
                {language === 'tr' ? 'İndirimli' : 'Discount'}
              </span>
            ) : null}
          </div>

          {isSoldLike ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="rotate-[-12deg] rounded-md border border-white/90 bg-red-600/90 px-2 py-1 text-[9px] font-extrabold tracking-wide text-white shadow">
                {property.status === 'sold'
                  ? language === 'tr'
                    ? 'SATILDI'
                    : 'SOLD'
                  : language === 'tr'
                    ? 'KİRALANDI'
                    : 'RENTED'}
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 p-2.5 sm:p-3">
          <div className="line-clamp-2 text-[13px] font-extrabold leading-4 text-slate-900 sm:text-[14px]">
            {property.title}
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 sm:text-[11px]">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {property.city}
                  {property.district ? `, ${property.district}` : ''}
                </span>
              </div>
            </div>

            {(onToggleFavorite || onShareWhatsApp || onCopyLink) && (
              <div className="flex shrink-0 items-center gap-1">
                {onToggleFavorite ? (
                  <button
                    type="button"
                    onClick={handleFavoriteClick}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
                      isFavorite
                        ? 'border-rose-200 bg-rose-50 text-rose-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                    aria-label={language === 'tr' ? 'Favori' : 'Favorite'}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                ) : null}

                {onShareWhatsApp ? (
                  <button
                    type="button"
                    onClick={handleWhatsAppClick}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                    aria-label="WhatsApp"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}

                {onCopyLink ? (
                  <button
                    type="button"
                    onClick={handleCopyClick}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                    aria-label={language === 'tr' ? 'Kopyala' : 'Copy'}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              {hasOldPrice ? (
                <div className="flex items-center gap-2">
                  <div className="text-[11px] font-semibold text-slate-400 line-through sm:text-[12px]">
                    {formatPrice(rawOldPrice, property.currency)}
                  </div>

                  <div className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    <BadgePercent className="h-3 w-3" />
                    %{discountPercent}
                  </div>
                </div>
              ) : null}

              <div className="mt-0.5 text-[15px] font-extrabold leading-none text-emerald-700 sm:text-[16px]">
                {formatPrice(property.price, property.currency)}
              </div>

              {property.location ? (
                <div className="mt-1 truncate text-[10px] text-slate-500 sm:text-[11px]">
                  {property.location}
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 text-[10px] text-slate-600 sm:text-[11px]">
              {detailBadges.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.key}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-1 text-slate-700"
                  >
                    <Icon className="h-3 w-3 text-slate-500" />
                    <span className="max-w-[72px] truncate">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                {getPropertyTypeLabel(property.property_type, language)}
              </span>

              {hasQualityScore ? (
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <Sparkles className="h-3 w-3" />
                  <span>{qualityLabel}</span>
                </div>
              ) : null}
            </div>

            <div className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white transition group-hover:bg-slate-800 sm:text-[11px]">
              {language === 'tr' ? 'İncele' : 'View'}
            </div>
          </div>

          {hasQualityScore ? (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${qualityBarWidth}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}