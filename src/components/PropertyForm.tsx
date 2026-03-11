import { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Property } from '../lib/database.types';
import LocationPickerMap from './LocationPickerMap';

interface PropertyFormProps {
  property: Property | null;
  onClose: () => void;
}

export default function PropertyForm({ property, onClose }: PropertyFormProps) {
  const { user, profile, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(false);

  const PROPERTY_TYPES: Array<{ value: string; label: string }> = [
    { value: 'apartment', label: 'Daire' },
    { value: 'residence', label: 'Rezidans' },
    { value: 'duplex', label: 'Dubleks' },
    { value: 'penthouse', label: 'Çatı Dubleksi / Penthouse' },
    { value: 'villa', label: 'Villa' },
    { value: 'detached_house', label: 'Müstakil Ev' },
    { value: 'bungalow', label: 'Bungalov' },
    { value: 'mansion', label: 'Köşk / Konak' },
    { value: 'land', label: 'Arsa' },
    { value: 'field', label: 'Tarla' },
    { value: 'farm', label: 'Çiftlik' },
    { value: 'commercial', label: 'Ticari' },
    { value: 'shop', label: 'Dükkan / Mağaza' },
    { value: 'office', label: 'Ofis' },
    { value: 'plaza', label: 'Plaza / İş Merkezi' },
    { value: 'warehouse', label: 'Depo / Antrepo' },
    { value: 'factory', label: 'Fabrika / Üretim Tesisi' },
    { value: 'building', label: 'Bina' },
    { value: 'hotel', label: 'Otel' },
    { value: 'hostel', label: 'Pansiyon / Hostel' },
    { value: 'touristic_facility', label: 'Turistik Tesis' },
    { value: 'gas_station', label: 'Akaryakıt İstasyonu' },
    { value: 'restaurant', label: 'Restoran' },
    { value: 'cafe', label: 'Kafe' },
    { value: 'clinic', label: 'Muayenehane / Klinik' },
    { value: 'hospital', label: 'Hastane' },
    { value: 'school', label: 'Okul / Eğitim Kurumu' },
    { value: 'dormitory', label: 'Yurt' },
    { value: 'parking_lot', label: 'Otopark' },
  ];

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
    net_area: '',
    gross_area: '',
    rooms: '',
    bathrooms: '',
    floor: '',
    total_floors: '',
    building_age: '',
    heating: '',
    dues: '',
    frontage: '',
    deed_status: '',
    usage_status: '',
    in_site: false,
    site_name: '',
    balcony_count: '',
    pool: false,
    security: false,
    furnished: false,
    parking: false,
    elevator: false,
    balcony: false,
    garden: false,
    images: '',
    featured: false,
    contact_name: '',
    contact_phone: '',
    latitude: '',
    longitude: '',
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
        net_area: property.net_area?.toString() || '',
        gross_area: property.gross_area?.toString() || '',
        rooms: property.rooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        floor: property.floor?.toString() || '',
        total_floors: property.total_floors?.toString() || '',
        building_age: property.building_age?.toString() || '',
        heating: property.heating || '',
        dues: property.dues?.toString() || '',
        frontage: property.frontage || '',
        deed_status: property.deed_status || '',
        usage_status: property.usage_status || '',
        in_site: property.in_site,
        site_name: property.site_name || '',
        balcony_count: property.balcony_count?.toString() || '',
        pool: property.pool,
        security: property.security,
        furnished: property.furnished,
        parking: property.parking,
        elevator: property.elevator,
        balcony: property.balcony,
        garden: property.garden,
        images: property.images.join('\n'),
        featured: property.featured,
        contact_name: property.contact_name || '',
        contact_phone: property.contact_phone || '',
        latitude: ((property as any).latitude ?? '').toString(),
        longitude: ((property as any).longitude ?? '').toString(),
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        contact_name: prev.contact_name || profile?.display_name || '',
        contact_phone: prev.contact_phone || profile?.phone || '',
        latitude: '',
        longitude: '',
      }));
    }
  }, [property, profile]);

  const isLandLike = ['land', 'field', 'farm'].includes(formData.property_type);
  const isHospitality = ['hotel', 'hostel', 'touristic_facility'].includes(formData.property_type);

  const parsedLatitude =
    formData.latitude.trim() !== '' && !Number.isNaN(Number(formData.latitude))
      ? Number(formData.latitude)
      : null;

  const parsedLongitude =
    formData.longitude.trim() !== '' && !Number.isNaN(Number(formData.longitude))
      ? Number(formData.longitude)
      : null;

  const handleMapLocationChange = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const imageUrls = formData.images
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

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
        net_area: formData.net_area ? parseFloat(formData.net_area) : null,
        gross_area: formData.gross_area ? parseFloat(formData.gross_area) : null,
        rooms: isLandLike ? 0 : (parseInt(formData.rooms) || 0),
        bathrooms: isLandLike ? 0 : (parseInt(formData.bathrooms) || 0),
        floor: isLandLike ? null : (formData.floor ? parseInt(formData.floor) : null),
        total_floors: isLandLike ? null : (formData.total_floors ? parseInt(formData.total_floors) : null),
        building_age: formData.building_age ? parseInt(formData.building_age) : null,
        heating: formData.heating || null,
        dues: formData.dues ? parseFloat(formData.dues) : null,
        frontage: formData.frontage || null,
        deed_status: formData.deed_status || null,
        usage_status: formData.usage_status || null,
        in_site: formData.in_site,
        site_name: formData.site_name || null,
        balcony_count: formData.balcony_count ? parseInt(formData.balcony_count) : null,
        pool: formData.pool,
        security: formData.security,
        furnished: formData.furnished,
        parking: formData.parking,
        elevator: formData.elevator,
        balcony: formData.balcony,
        garden: formData.garden,
        images: imageUrls,
        featured: formData.featured,
        contact_name: formData.contact_name || null,
        contact_phone: formData.contact_phone || null,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        moderation_status: isSuperAdmin ? (property?.moderation_status || 'approved') : 'pending',
        approved_at: isSuperAdmin ? (property?.approved_at || new Date().toISOString()) : null,
        approved_by: isSuperAdmin ? (property?.approved_by || user?.id || null) : null,
        user_id: user?.id,
      };

      if (property) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData as any)
          .eq('id', property.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('properties')
          .insert([propertyData as any]);

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
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emlak Tipi *
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
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
                  Net Alan (m²)
                </label>
                <input
                  type="number"
                  value={formData.net_area}
                  onChange={(e) => setFormData({ ...formData, net_area: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brüt Alan (m²)
                </label>
                <input
                  type="number"
                  value={formData.gross_area}
                  onChange={(e) => setFormData({ ...formData, gross_area: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              {!isLandLike && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isHospitality ? 'Oda Sayısı (Tesis)' : 'Oda Sayısı'}
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
                      Bulunduğu Kat
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
                      Binadaki Kat Sayısı
                    </label>
                    <input
                      type="number"
                      value={formData.total_floors}
                      onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                    />
                  </div>
                </>
              )}

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Isıtma
                </label>
                <select
                  value={formData.heating}
                  onChange={(e) => setFormData({ ...formData, heating: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="">Seçiniz</option>
                  <option value="natural_gas">Doğalgaz (Kombi)</option>
                  <option value="central">Merkezi</option>
                  <option value="floor_heating">Yerden Isıtma</option>
                  <option value="air_conditioner">Klima</option>
                  <option value="stove">Soba</option>
                  <option value="none">Yok</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aidat (₺)
                </label>
                <input
                  type="number"
                  value={formData.dues}
                  onChange={(e) => setFormData({ ...formData, dues: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cephe
                </label>
                <select
                  value={formData.frontage}
                  onChange={(e) => setFormData({ ...formData, frontage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="">Seçiniz</option>
                  <option value="north">Kuzey</option>
                  <option value="south">Güney</option>
                  <option value="east">Doğu</option>
                  <option value="west">Batı</option>
                  <option value="north_south">Kuzey-Güney</option>
                  <option value="east_west">Doğu-Batı</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tapu Durumu
                </label>
                <select
                  value={formData.deed_status}
                  onChange={(e) => setFormData({ ...formData, deed_status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="">Seçiniz</option>
                  <option value="condominium">Kat Mülkiyeti</option>
                  <option value="easement">Kat İrtifakı</option>
                  <option value="shared">Hisseli Tapu</option>
                  <option value="land">Arsa Tapulu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanım Durumu
                </label>
                <select
                  value={formData.usage_status}
                  onChange={(e) => setFormData({ ...formData, usage_status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="">Seçiniz</option>
                  <option value="empty">Boş</option>
                  <option value="tenant">Kiracılı</option>
                  <option value="owner">Mülk Sahibi Oturuyor</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <label className="block text-sm font-medium text-gray-700">
                    Konum Bilgisi
                  </label>
                </div>

                <LocationPickerMap
                  latitude={parsedLatitude}
                  longitude={parsedLongitude}
                  onChange={handleMapLocationChange}
                  height={380}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="37.7765"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="29.0864"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Haritada uygun noktaya tıklayarak ilan konumunu seçebilirsin. İstersen latitude ve longitude alanlarını elle de doldurabilirsin.
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resim URL'leri (Her satıra bir URL)
                </label>
                <textarea
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  rows={4}
                  placeholder={'https://example.com/image1.jpg\nhttps://example.com/image2.jpg'}
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
                      checked={formData.in_site}
                      onChange={(e) => setFormData({ ...formData, in_site: e.target.checked })}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">Site İçinde</span>
                  </label>

                  {formData.in_site && (
                    <label className="flex items-center md:col-span-2">
                      <span className="mr-2 text-gray-700 whitespace-nowrap">Site Adı</span>
                      <input
                        type="text"
                        value={formData.site_name}
                        onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                      />
                    </label>
                  )}

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

                  {formData.balcony && (
                    <label className="flex items-center">
                      <span className="mr-2 text-gray-700 whitespace-nowrap">Balkon Adedi</span>
                      <input
                        type="number"
                        value={formData.balcony_count}
                        onChange={(e) => setFormData({ ...formData, balcony_count: e.target.value })}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                      />
                    </label>
                  )}

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
                      checked={formData.pool}
                      onChange={(e) => setFormData({ ...formData, pool: e.target.checked })}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">Havuz</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.security}
                      onChange={(e) => setFormData({ ...formData, security: e.target.checked })}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">Güvenlik</span>
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