import { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('inquiries')
        .insert({
          property_id: null,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          status: 'new',
        });

      if (error) throw error;

      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      alert('Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">İletişim</h1>
          <p className="text-lg text-gray-600">
            Sorularınız için bize ulaşın. Size yardımcı olmaktan mutluluk duyarız.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Bize Ulaşın</h2>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">Mesajınız Gönderildi!</h3>
                <p className="text-green-700">
                  En kısa sürede size geri dönüş yapacağız.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adınız Soyadınız
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mesajınız
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-cta text-white py-3 rounded-lg hover:bg-cta-hover transition-colors font-medium disabled:bg-gray-400"
                >
                  {submitting ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">İletişim Bilgileri</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-brand/10 p-3 rounded-lg">
                    <Phone className="h-6 w-6 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Telefon</h3>
                    <p className="text-gray-600">+90 258 211 07 18</p>
                    <p className="text-gray-600">+90 532 340 20 36</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-brand/10 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">E-posta</h3>
                    <p className="text-gray-600">info@varolgayrimenkul.com</p>
                    <p className="text-gray-600">varol@varolgayrimenkul.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-brand/10 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Adres</h3>
                    <p className="text-gray-600">
                      İstiklal Mah. Zübeyde Hn. Caddesi No:34/A8 Pamukkale/Denizli<br />
                      20150 Türkiye
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Çalışma Saatleri</h2>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium">Pazartesi - Cuma</span>
                  <span>09:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Cumartesi</span>
                  <span>10:00 - 16:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Pazar</span>
                  <span>Kapalı</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}