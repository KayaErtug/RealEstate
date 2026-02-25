import { useEffect, useState } from 'react';
import { ArrowLeft, Car, Gauge, Fuel, Cog, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Vehicle } from '../lib/database.types';

const WHATSAPP_NUMBER = '902589110718';

interface VehicleDetailPageProps {
  vehicleId: string;
  onNavigate: (page: string) => void;
}

export default function VehicleDetailPage({ vehicleId, onNavigate }: VehicleDetailPageProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  const loadVehicle = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setVehicle(data);
        await supabase.from('vehicles').update({ views: data.views + 1 }).eq('id', vehicleId);
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Araç ilanı bulunamadı</h2>
          <button onClick={() => onNavigate('vehicles')} className="text-brand hover:text-brand-hover">
            Araç İlanlarına Dön
          </button>
        </div>
      </div>
    );
  }

  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : ['https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=1600'];

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const waText = encodeURIComponent(
    `Merhaba, ${vehicle.brand} ${vehicle.model} (${vehicle.year}) araç ilanı hakkında bilgi almak istiyorum. (İlan: ${vehicle.title})`
  );
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => onNavigate('vehicles')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Geri Dön
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 p-2">
            <div className="lg:col-span-2">
              <img
                src={images[selectedImage]}
                alt={vehicle.title}
                className="w-full h-96 object-cover rounded-lg"
              />
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {images.slice(0, 8).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${vehicle.title} ${index + 1}`}
                      onClick={() => setSelectedImage(index)}
                      className={`w-full h-24 object-cover rounded-lg cursor-pointer ${
                        selectedImage === index ? 'ring-2 ring-brand' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {vehicle.brand} {vehicle.model}
              </h2>
              <p className="text-gray-600 mb-4">{vehicle.year} • {new Intl.NumberFormat('tr-TR').format(vehicle.km)} km</p>

              <p className="text-3xl font-bold text-brand mb-6">{formatPrice(vehicle.price, vehicle.currency)}</p>

              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center bg-cta text-white py-3 rounded-lg hover:bg-cta-hover transition-colors font-semibold"
              >
                WhatsApp ile İletişime Geç
              </a>

              <div className="mt-6 space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-gray-500" />
                  <span><b>Vites:</b> {vehicle.transmission}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-gray-500" />
                  <span><b>Yakıt:</b> {vehicle.fuel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-gray-500" />
                  <span><b>Kilometre:</b> {new Intl.NumberFormat('tr-TR').format(vehicle.km)} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span><b>Konum:</b> {vehicle.location}, {vehicle.city}{vehicle.district ? ` / ${vehicle.district}` : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cog className="h-4 w-4 text-gray-500" />
                  <span><b>Durum:</b> {vehicle.status === 'for_sale' ? 'Satılık' : 'Satıldı'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{vehicle.title}</h1>
            <p className="text-gray-700 whitespace-pre-line">{vehicle.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
