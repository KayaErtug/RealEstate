// src/components/PropertyCard.tsx
import { MapPin, Home, Bath, Maximize, Eye, Heart, Share2, Copy } from 'lucide-react';
import type { Property } from '../lib/database.types';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t, language } = useLanguage();

  const formatPrice = (price: number, currency: string) => {
    const locale = language === 'tr' ? 'tr-TR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const safeT = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };

  const getPropertyTypeLabel = (type: string) => {
    const key = `type.${type}`;
    const translated = t(key);
    if (translated !== key) return translated;

    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStatusLabel = (status: string) => {
    const key = `status.${status}`;
    const translated = t(key);
    if (translated !== key) return translated;

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

  const mainImage =
    property.images && property.images.length > 0
      ? property.images[0]
      : 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';

  const handleFavoriteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleFavorite?.(property.id);
  };

  const handleWhatsAppClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onShareWhatsApp?.(property);
  };

  const handleCopyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onCopyLink?.(property.id);
  };

  const isSoldLike = property.status === 'sold' || property.status === 'rented';

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-60 overflow-hidden bg-gray-100">
        <img
          src={mainImage}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        {isSoldLike && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rotate-[-12deg] rounded-xl border-4 border-white/90 bg-red-600/90 px-8 py-3 text-2xl font-extrabold tracking-widest text-white shadow-2xl">
              {property.status === 'sold'
                ? (language === 'tr' ? 'SATILDI' : 'SOLD')
                : (language === 'tr' ? 'KİRALANDI' : 'RENTED')}
            </div>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`${getStatusColor(property.status)} rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm`}
          >
            {getStatusLabel(property.status)}
          </span>

          {property.featured && (
            <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              {safeT('property.featured', language === 'tr' ? 'Öne Çıkan' : 'Featured')}
            </span>
          )}
        </div>

        {(onToggleFavorite || onShareWhatsApp || onCopyLink) && (
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={handleFavoriteClick}
                className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm transition-colors ${
                  isFavorite
                    ? 'border-red-200 bg-white/90 text-red-600'
                    : 'border-white/40 bg-white/80 text-gray-700 hover:bg-white'
                }`}
                aria-label={language === 'tr' ? 'Favorilere ekle' : 'Add to favorites'}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}

            {onShareWhatsApp && (
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/80 text-emerald-700 backdrop-blur-sm transition-colors hover:bg-white"
                aria-label="WhatsApp paylaş"
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}

            {onCopyLink && (
              <button
                type="button"
                onClick={handleCopyClick}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/80 text-gray-700 backdrop-blur-sm transition-colors hover:bg-white"
                aria-label={language === 'tr' ? 'Linki kopyala' : 'Copy link'}
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>{property.views ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 flex-1 text-lg font-semibold leading-6 text-gray-900">
            {property.title}
          </h3>
        </div>

        <div className="mb-3 flex items-center text-gray-600">
          <MapPin className="mr-1 h-4 w-4 shrink-0 text-gray-500" />
          <span className="truncate text-sm">
            {property.city}
            {property.district ? `, ${property.district}` : ''}
          </span>
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {getPropertyTypeLabel(property.property_type)}
          </span>

          {property.location ? (
            <span className="truncate text-xs text-gray-500 max-w-[45%]">
              {property.location}
            </span>
          ) : null}
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-gray-50 p-3 text-sm text-gray-700">
          <div className="flex items-center gap-1.5">
            <Home className="h-4 w-4 text-gray-500" />
            <span>
              {property.rooms > 0
                ? `${property.rooms} ${safeT('property.rooms', language === 'tr' ? 'Oda' : 'Rooms')}`
                : '-'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-gray-500" />
            <span>{property.bathrooms > 0 ? property.bathrooms : '-'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Maximize className="h-4 w-4 text-gray-500" />
            <span>{property.area} m²</span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-2xl font-bold tracking-tight text-emerald-700">
            {formatPrice(property.price, property.currency)}
          </p>

          {(property.contact_name || property.contact_phone) && (
            <p className="mt-1 text-sm text-gray-600">
              {property.contact_name ? property.contact_name : ''}
              {property.contact_name && property.contact_phone ? ' • ' : ''}
              {property.contact_phone ? property.contact_phone : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}