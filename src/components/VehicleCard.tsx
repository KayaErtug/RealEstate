import { Car, Gauge, Fuel, Cog, Eye } from 'lucide-react';
import type { Vehicle } from '../lib/database.types';
import { useLanguage } from '../contexts/LanguageContext';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
}

export default function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
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

  const getStatusLabel = (status: string) => {
    if (status === 'for_sale') return language === 'tr' ? 'Satılık' : 'For Sale';
    if (status === 'sold') return language === 'tr' ? 'Satıldı' : 'Sold';
    return status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      for_sale: 'bg-cta',
      sold: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const mainImage = vehicle.images && vehicle.images.length > 0
    ? vehicle.images[0]
    : 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={mainImage}
          alt={vehicle.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <span className={`${getStatusColor(vehicle.status)} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
            {getStatusLabel(vehicle.status)}
          </span>
          {vehicle.featured && (
            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              {language === 'tr' ? 'Öne Çıkan' : 'Featured'}
            </span>
          )}
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {vehicle.views}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {vehicle.brand} {vehicle.model} • {vehicle.year}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-1 mt-1">{vehicle.title}</p>

        <div className="grid grid-cols-3 gap-2 my-3 text-sm text-gray-600">
          <div className="flex items-center">
            <Car className="h-4 w-4 mr-1" />
            <span className="truncate">{vehicle.transmission}</span>
          </div>
          <div className="flex items-center">
            <Fuel className="h-4 w-4 mr-1" />
            <span className="truncate">{vehicle.fuel}</span>
          </div>
          <div className="flex items-center">
            <Gauge className="h-4 w-4 mr-1" />
            <span>{new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US').format(vehicle.km)} km</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <div className="flex items-center">
            <Cog className="h-4 w-4 mr-1" />
            <span>{vehicle.city}{vehicle.district ? `, ${vehicle.district}` : ''}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <p className="text-2xl font-bold text-brand">{formatPrice(vehicle.price, vehicle.currency)}</p>
        </div>
      </div>
    </div>
  );
}
