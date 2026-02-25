import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Property } from '../lib/database.types';

interface PropertyFormProps {
  property: Property | null;
  onClose: () => void;
}

export default function PropertyForm({ property, onClose }: PropertyFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'apartment',
    status: 'for_sale',
    price: '',
    currency: 'TRY',
    location: '',
    city: '',
    district: '',
    area: '',
    rooms: '',
    bathrooms: '',
    floor: '',
    total_floors: '',
    building_age: '',
    furnished: false,
    parking: false,
    elevator: false,
    balcony: false,
    garden: false,
    images: '',
    featured: false,
  });

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title,
        description: property.description,
        property_type: property.property_type,
        status: property.status,
        price: property.price.toString(),
        currency: property.currency,
        location: property.location,
        city: property.city,
        district: property.district || '',
        area: property.area.toString(),
        rooms: property.rooms.toString(),
        bathrooms: property.bathrooms.toString(),
        floor: property.floor?.toString() || '',
        total_floors: property.total_floors?.toString() || '',
        building_age: property.building_age?.toString() || '',
        furnished: property.furnished,
        parking: property.parking,
        elevator: property.elevator,
        balcony: property.balcony,
        garden: property.garden,
        images: property.images.join('\n'),
        featured: property.featured,
      });
    }
  }, [property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const imageUrls = formData.images
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const propertyData = {
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        status: formData.status,
        price: parseFloat(formData.price),
        currency: formData.currency,
        location: formData.location,
        city: formData.city,
        district: formData.district || null,
        area: parseFloat(formData.area),
        rooms: parseInt(formData.rooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        floor: formData.floor ? parseInt(formData.floor) : null,
        total_floors: formData.total_floors ? parseInt(formData.total_floors) : null,
        building_age: formData.building_age ? parseInt(formData.building_age) : null,
        furnished: formData.furnished,
        parking: formData.parking,
        elevator: formData.elevator,
        balcony: formData.balcony,
        garden: formData.garden,
        images: imageUrls,
        featured: formData.featured,
        user_id: user?.id,
      };

      if (property) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', property.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('properties')
          .insert(propertyData);

        if (error) throw error;
      }

      onClose();
    } catch (error) {
      console.error('Error saving property:', error);
      alert('İlan kaydedilirken bir hata oluştu.');
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
              {property ? 'İlanı Düzenle' : 'Yeni İlan Oluştur'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama *
                </label>
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
                  Emlak Tipi *
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="apartment">Daire</option>
                  <option value="villa">Villa</option>
                  <option value="office">Ofis</option>
                  <option value="land">Arsa</option>
                  <option value="commercial">Ticari</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durum *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="for_sale">Satılık</option>
                  <option value="for_rent">Kiralık</option>
                  <option value="sold">Satıldı</option>
                  <option value="rented">Kiralandı</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiyat *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Para Birimi *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şehir *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İlçe
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alan (m²) *
                </label>
                <input
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Oda Sayısı
                </label>
                <input
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banyo Sayısı
                </label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kat
                </label>
                <input
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toplam Kat
                </label>
                <input
                  type="number"
                  value={formData.total_floors}
                  onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bina Yaşı
                </label>
                <input
                  type="number"
                  value={formData.building_age}
                  onChange={(e) => setFormData({ ...formData, building_age: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resim URL'leri (Her satıra bir URL)
                </label>
                <textarea
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  rows={4}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Özellikler
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.furnished}
                      onChange={(e) => setFormData({ ...formData, furnished: e.target.checked })}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">Eşyalı</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.parking}
                      onChange={(e) => setFormData({ ...formData, parking: e.target.checked })}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">Otopark</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.elevator}
                      onChange={(e) => setFormData({ ...formData, elevator: e.target.checked })}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">Asansör</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.balcony}
                      onChange={(e) => setFormData({ ...formData, balcony: e.target.checked })}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">Balkon</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.garden}
                      onChange={(e) => setFormData({ ...formData, garden: e.target.checked })}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">Bahçe</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">Öne Çıkan</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-cta text-white rounded-lg hover:bg-cta-hover transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Kaydediliyor...' : property ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}