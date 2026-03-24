// src/components/PropertyCard.tsx
import { MapPin, Home, Bath, Maximize, Heart, Share2, Copy } from 'lucide-react';
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

export default function PropertyCard({
  property,
  onClick,
  isFavorite = false,
  onToggleFavorite,
  onShareWhatsApp,
  onCopyLink,
}: PropertyCardProps) {
  const { language } = useLanguage();

  const formatPrice = (price: number, currency: string) => {
    const locale = language === 'tr' ? 'tr-TR' : 'en-US';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const mainImage =
    property.images && property.images.length > 0
      ? property.images[0]
      : 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';

  const handleFavoriteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleFavorite?.(property.id);
  };

  const handleWhatsAppClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onShareWhatsApp?.(property);
  };

  const handleCopyClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onCopyLink?.(property.id);
  };

  const isSoldLike = property.status === 'sold' || property.status === 'rented';

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-stretch">
        <div className="relative h-[108px] w-[130px] shrink-0 overflow-hidden bg-slate-200 sm:h-[116px] sm:w-[148px]">
          <img
            src={mainImage}
            alt={property.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            <span
              className={`${getStatusColor(property.status)} rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow`}
            >
              {getStatusLabel(property.status, language)}
            </span>
          </div>

          {isSoldLike && (
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
          )}
        </div>

        <div className="min-w-0 flex-1 p-2.5">
          <div className="line-clamp-2 text-[13px] font-extrabold leading-4 text-slate-900 sm:text-[14px]">
            {property.title}
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1 text-[10px] text-slate-500 sm:text-[11px]">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {property.city}
                {property.district ? `, ${property.district}` : ''}
              </span>
            </div>

            {(onToggleFavorite || onShareWhatsApp || onCopyLink) && (
              <div className="flex shrink-0 items-center gap-1">
                {onToggleFavorite && (
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
                )}

                {onShareWhatsApp && (
                  <button
                    type="button"
                    onClick={handleWhatsAppClick}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                    aria-label="WhatsApp"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                )}

                {onCopyLink && (
                  <button
                    type="button"
                    onClick={handleCopyClick}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                    aria-label={language === 'tr' ? 'Kopyala' : 'Copy'}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="text-[15px] font-extrabold leading-none text-emerald-700 sm:text-[16px]">
              {formatPrice(property.price, property.currency)}
            </div>

            <div className="flex shrink-0 items-center gap-1 text-[10px] text-slate-600 sm:text-[11px]">
              <div className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-1">
                <Home className="h-3 w-3 text-slate-500" />
                <span>{property.rooms > 0 ? property.rooms : '-'}</span>
              </div>

              <div className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-1">
                <Bath className="h-3 w-3 text-slate-500" />
                <span>{property.bathrooms > 0 ? property.bathrooms : '-'}</span>
              </div>

              <div className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-1">
                <Maximize className="h-3 w-3 text-slate-500" />
                <span>{property.area}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                {getPropertyTypeLabel(property.property_type, language)}
              </span>

              {property.location ? (
                <span className="max-w-[110px] truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  {property.location}
                </span>
              ) : null}
            </div>

            <div className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white transition group-hover:bg-slate-800 sm:text-[11px]">
              {language === 'tr' ? 'İncele' : 'View'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}