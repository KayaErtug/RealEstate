import { MapPin, Home, Bath, Maximize, Eye } from 'lucide-react';
import type { Property } from '../lib/database.types';
import { useLanguage } from '../contexts/LanguageContext';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
}

export default function PropertyCard({ property, onClick }: PropertyCardProps) {
  const { t, language } = useLanguage();

  const formatPrice = (price: number, currency: string) => {
    const locale = language === 'tr' ? 'tr-TR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyTypeLabel = (type: string) => {
    const key = `type.${type}`;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  const getStatusLabel = (status: string) => {
    const key = `status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      for_sale: 'bg-cta',
      for_rent: 'bg-brand',
      sold: 'bg-gray-500',
      rented: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const mainImage = property.images && property.images.length > 0
    ? property.images[0]
    : 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={mainImage}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <span className={`${getStatusColor(property.status)} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
            {getStatusLabel(property.status)}
          </span>
          {property.featured && (
            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              {t('property.featured')}
            </span>
          )}
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {property.views}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">{property.title}</h3>
        </div>

        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{property.city}, {property.district}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
            {getPropertyTypeLabel(property.property_type)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3 text-sm text-gray-600">
          {property.rooms > 0 && (
            <div className="flex items-center">
              <Home className="h-4 w-4 mr-1" />
              <span>
                {property.rooms} {t('property.rooms')}
              </span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          <div className="flex items-center">
            <Maximize className="h-4 w-4 mr-1" />
            <span>{property.area} m²</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <p className="text-2xl font-bold text-brand">{formatPrice(property.price, property.currency)}</p>
        </div>
      </div>
    </div>
  );
}
