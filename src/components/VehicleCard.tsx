import { Car, Gauge, Fuel, Cog, Eye } from 'lucide-react';
import type { Vehicle } from '../lib/database.types';
import { useLanguage } from '../contexts/LanguageContext';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
}

type Lang = 'tr' | 'en';

export default function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  const { language, t } = useLanguage() as { language: Lang; t?: (k: string) => string };

  const safeT = (key: string, trFallback: string, enFallback: string) => {
    if (!t) return language === 'tr' ? trFallback : enFallback;
    const out = t(key);
    if (out === key) return language === 'tr' ? trFallback : enFallback;
    return out;
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

  const humanizeEnum = (s?: string | null) => {
    if (!s) return '-';
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Enum label sözlükleri (kart için yeterli)
  const labelFrom = (
    dict: Record<string, { tr: string; en: string }>,
    value?: string | null
  ) => {
    if (!value) return '-';
    return dict[value]?.[language] ?? humanizeEnum(value);
  };

  const TRANSMISSION: Record<string, { tr: string; en: string }> = {
    automatic: { tr: 'Otomatik', en: 'Automatic' },
    manual: { tr: 'Manuel', en: 'Manual' },
    semi_automatic: { tr: 'Yarı Otomatik', en: 'Semi-automatic' },
    tiptronic: { tr: 'Tiptronic', en: 'Tiptronic' },
  };

  const FUEL: Record<string, { tr: string; en: string }> = {
    gasoline: { tr: 'Benzin', en: 'Gasoline' },
    diesel: { tr: 'Dizel', en: 'Diesel' },
    lpg: { tr: 'LPG', en: 'LPG' },
    hybrid: { tr: 'Hibrit', en: 'Hybrid' },
    electric: { tr: 'Elektrik', en: 'Electric' },
  };

  const STATUS: Record<string, { tr: string; en: string }> = {
    for_sale: { tr: 'Satılık', en: 'For Sale' },
    sold: { tr: 'Satıldı', en: 'Sold' },
  };

  const getStatusLabel = (status: string) => labelFrom(STATUS, status);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      for_sale: 'bg-cta',
      sold: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const mainImage =
    vehicle.images && vehicle.images.length > 0
      ? vehicle.images[0]
      : 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=900';

  const transmissionLabel = labelFrom(TRANSMISSION, vehicle.transmission);
  const fuelLabel = labelFrom(FUEL, vehicle.fuel);

  const views = typeof vehicle.views === 'number' ? vehicle.views : 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
    >
      {/* Görseli biraz daha büyük yaptım (h-56) */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={mainImage}
          alt={vehicle.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />

        <div className="absolute top-2 left-2 flex gap-2">
          <span
            className={`${getStatusColor(vehicle.status)} text-white px-3 py-1 rounded-full text-xs font-semibold`}
          >
            {getStatusLabel(vehicle.status)}
          </span>

          {vehicle.featured && (
            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              {safeT('property.featured', 'Öne Çıkan', 'Featured')}
            </span>
          )}
        </div>

        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {views}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {vehicle.brand} {vehicle.model} • {vehicle.year}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-1 mt-1">{vehicle.title}</p>

        <div className="grid grid-cols-3 gap-2 my-3 text-sm text-gray-600">
          <div className="flex items-center min-w-0">
            <Car className="h-4 w-4 mr-1 shrink-0" />
            <span className="truncate">{transmissionLabel}</span>
          </div>

          <div className="flex items-center min-w-0">
            <Fuel className="h-4 w-4 mr-1 shrink-0" />
            <span className="truncate">{fuelLabel}</span>
          </div>

          <div className="flex items-center min-w-0">
            <Gauge className="h-4 w-4 mr-1 shrink-0" />
            <span className="truncate">{formatNumber(vehicle.km)} km</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <div className="flex items-center min-w-0">
            <Cog className="h-4 w-4 mr-1 shrink-0" />
            <span className="truncate">
              {vehicle.city}
              {vehicle.district ? `, ${vehicle.district}` : ''}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <p className="text-2xl font-bold text-brand">{formatPrice(vehicle.price, vehicle.currency)}</p>

          {(vehicle.contact_name || vehicle.contact_phone) && (
            <p className="text-sm text-gray-600 mt-1">
              {vehicle.contact_name ? vehicle.contact_name : ''}
              {vehicle.contact_name && vehicle.contact_phone ? ' • ' : ''}
              {vehicle.contact_phone ? vehicle.contact_phone : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}