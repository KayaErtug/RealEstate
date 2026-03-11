import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Vehicle } from '../lib/database.types';

interface VehicleFormProps {
  vehicle: Vehicle | null;
  onClose: () => void;
}

export default function VehicleForm({ vehicle, onClose }: VehicleFormProps) {
  const { user, profile, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'for_sale',
    price: '',
    currency: 'TRY',
    location: '',
    city: '',
    district: '',
    brand: '',
    model: '',
    year: '',
    km: '',
    transmission: 'automatic',
    fuel: 'gasoline',
    body_type: '',
    color: '',
    engine: '',
    engine_power_hp: '',
    drive_type: '',
    doors: '',
    seats: '',
    damage_status: '',
    swap_available: false,
    images: '',
    featured: false,
    contact_name: '',
    contact_phone: '',
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        title: vehicle.title,
        description: vehicle.description,
        status: vehicle.status,
        price: vehicle.price.toString(),
        currency: vehicle.currency,
        location: vehicle.location,
        city: vehicle.city,
        district: vehicle.district || '',
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year.toString(),
        km: vehicle.km.toString(),
        transmission: vehicle.transmission,
        fuel: vehicle.fuel,
        body_type: vehicle.body_type || '',
        color: vehicle.color || '',
        engine: vehicle.engine || '',
        engine_power_hp: vehicle.engine_power_hp?.toString() || '',
        drive_type: vehicle.drive_type || '',
        doors: vehicle.doors?.toString() || '',
        seats: vehicle.seats?.toString() || '',
        damage_status: vehicle.damage_status || '',
        swap_available: vehicle.swap_available,
        images: vehicle.images.join('\n'),
        featured: vehicle.featured,
        contact_name: vehicle.contact_name || '',
        contact_phone: vehicle.contact_phone || '',
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        contact_name: prev.contact_name || profile?.display_name || '',
        contact_phone: prev.contact_phone || profile?.phone || '',
      }));
    }
  }, [vehicle, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const imageUrls = formData.images
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const vehicleData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        price: parseFloat(formData.price),
        currency: formData.currency,
        location: formData.location,
        city: formData.city,
        district: formData.district || null,
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        km: parseInt(formData.km),
        transmission: formData.transmission,
        fuel: formData.fuel,
        body_type: formData.body_type || null,
        color: formData.color || null,
        engine: formData.engine || null,
        engine_power_hp: formData.engine_power_hp ? parseInt(formData.engine_power_hp) : null,
        drive_type: formData.drive_type || null,
        doors: formData.doors ? parseInt(formData.doors) : null,
        seats: formData.seats ? parseInt(formData.seats) : null,
        damage_status: formData.damage_status || null,
        swap_available: formData.swap_available,
        images: imageUrls,
        featured: formData.featured,
        contact_name: formData.contact_name || null,
        contact_phone: formData.contact_phone || null,
        moderation_status: isSuperAdmin ? (vehicle?.moderation_status || 'approved') : 'pending',
        approved_at: isSuperAdmin ? (vehicle?.approved_at || new Date().toISOString()) : null,
        approved_by: isSuperAdmin ? (vehicle?.approved_by || user?.id || null) : null,
        user_id: user?.id,
      };

      if (vehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', vehicle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert(vehicleData);
        if (error) throw error;
      }

      onClose();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Araç ilanı kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {vehicle ? 'Araç İlanını Düzenle' : 'Yeni Araç İlanı Oluştur'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İlan Veren (Ad Soyad)
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  placeholder="Ad Soyad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İlan Veren Telefon
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  placeholder="05xx xxx xx xx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="for_sale">Satılık</option>
                  <option value="sold">Satıldı</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi *</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres / Konum *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marka *</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yıl *</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KM *</label>
                <input
                  type="number"
                  value={formData.km}
                  onChange={(e) => setFormData({ ...formData, km: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vites *</label>
                <select
                  value={formData.transmission}
                  onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="automatic">Otomatik</option>
                  <option value="manual">Manuel</option>
                  <option value="semi_automatic">Yarı Otomatik</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yakıt *</label>
                <select
                  value={formData.fuel}
                  onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="gasoline">Benzin</option>
                  <option value="diesel">Dizel</option>
                  <option value="hybrid">Hibrit</option>
                  <option value="electric">Elektrik</option>
                  <option value="lpg">LPG</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kasa Tipi</label>
                <select
                  value={formData.body_type}
                  onChange={(e) => setFormData({ ...formData, body_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="">Seçiniz</option>
                  <option value="sedan">Sedan</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="station_wagon">Station Wagon</option>
                  <option value="suv">SUV</option>
                  <option value="pickup">Pick-up</option>
                  <option value="van">Van / Minivan</option>
                  <option value="coupe">Coupe</option>
                  <option value="cabrio">Cabrio</option>
                  <option value="motorcycle">Motosiklet</option>
                  <option value="commercial">Ticari Araç</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Renk</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  placeholder="Beyaz, Siyah, Gri..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motor</label>
                <input
                  type="text"
                  value={formData.engine}
                  onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  placeholder="1.6, 2.0 TDI, 1.5 Hybrid..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motor Gücü (HP)</label>
                <input
                  type="number"
                  value={formData.engine_power_hp}
                  onChange={(e) => setFormData({ ...formData, engine_power_hp: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Çekiş</label>
                <select
                  value={formData.drive_type}
                  onChange={(e) => setFormData({ ...formData, drive_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="">Seçiniz</option>
                  <option value="fwd">Önden Çekiş</option>
                  <option value="rwd">Arkadan İtiş</option>
                  <option value="awd">4x4 / AWD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapı Sayısı</label>
                <input
                  type="number"
                  value={formData.doors}
                  onChange={(e) => setFormData({ ...formData, doors: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Koltuk Sayısı</label>
                <input
                  type="number"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasar Durumu</label>
                <select
                  value={formData.damage_status}
                  onChange={(e) => setFormData({ ...formData, damage_status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="">Seçiniz</option>
                  <option value="none">Hasarsız</option>
                  <option value="paint">Boyalı</option>
                  <option value="replace">Değişen</option>
                  <option value="damage">Hasarlı</option>
                </select>
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="swap_available"
                  type="checkbox"
                  checked={formData.swap_available}
                  onChange={(e) => setFormData({ ...formData, swap_available: e.target.checked })}
                  className="h-4 w-4 text-cta focus:ring-cta border-gray-300 rounded"
                />
                <label htmlFor="swap_available" className="text-sm font-medium text-gray-700">
                  Takasa uygun
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fotoğraf URL'leri (Her satıra 1 URL) — 7-8 foto önerilir
                </label>
                <textarea
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  placeholder="https://...\nhttps://...\nhttps://..."
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="featured"
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="h-4 w-4 text-cta focus:ring-cta border-gray-300 rounded"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                  Öne çıkan araç ilanı
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-cta text-white rounded-lg hover:bg-cta-hover disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
