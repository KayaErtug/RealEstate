import { useEffect, useState } from 'react';
import { MapPin, Home, Bath, Maximize, Calendar, CheckCircle, ArrowLeft, Phone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Property } from '../lib/database.types';

interface PropertyDetailPageProps {
  propertyId: string;
  onNavigate: (page: string) => void;
}

export default function PropertyDetailPage({ propertyId, onNavigate }: PropertyDetailPageProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProperty(data);
        await supabase
          .from('properties')
          .update({ views: data.views + 1 })
          .eq('id', propertyId);
      }
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('inquiries')
        .insert({
          property_id: propertyId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          status: 'new',
        });

      if (error) throw error;

      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => {
        setShowInquiryForm(false);
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert('Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">İlan bulunamadı</h2>
          <button
            onClick={() => onNavigate('properties')}
            className="text-brand hover:text-brand-hover"
          >
            İlanlara Dön
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1600'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => onNavigate('properties')}
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
                alt={property.title}
                className="w-full h-96 object-cover rounded-lg"
              />
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${property.title} ${index + 1}`}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">İletişim</h2>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm text-gray-600">Telefon</p>
                    <p className="font-medium">+90 555 123 4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm text-gray-600">E-posta</p>
                    <p className="font-medium">info@varolgayrimenkul.com</p>
                  </div>
                </div>
              </div>

              {!showInquiryForm ? (
                <button
                  onClick={() => setShowInquiryForm(true)}
                  className="w-full bg-cta text-white py-3 rounded-lg hover:bg-cta-hover transition-colors font-medium"
                >
                  Bilgi Al
                </button>
              ) : submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">Mesajınız gönderildi!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Adınız Soyadınız"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta"
                  />
                  <input
                    type="email"
                    placeholder="E-posta"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta"
                  />
                  <textarea
                    placeholder="Mesajınız"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-cta text-white py-2 rounded-lg hover:bg-cta-hover transition-colors disabled:bg-gray-400"
                  >
                    {submitting ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-5 w-5 mr-1" />
                <span>{property.location}, {property.city}</span>
              </div>
              <p className="text-4xl font-bold text-brand">
                {formatPrice(property.price, property.currency)}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
              {property.rooms > 0 && (
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Oda</p>
                    <p className="font-semibold">{property.rooms}</p>
                  </div>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Banyo</p>
                    <p className="font-semibold">{property.bathrooms}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Maximize className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Alan</p>
                  <p className="font-semibold">{property.area} m²</p>
                </div>
              </div>
              {property.building_age !== null && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Bina Yaşı</p>
                    <p className="font-semibold">{property.building_age} Yıl</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Açıklama</h2>
              <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Özellikler</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.furnished && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Eşyalı</span>
                  </div>
                )}
                {property.parking && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Otopark</span>
                  </div>
                )}
                {property.elevator && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Asansör</span>
                  </div>
                )}
                {property.balcony && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Balkon</span>
                  </div>
                )}
                {property.garden && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Bahçe</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}