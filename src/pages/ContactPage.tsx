// src/pages/ContactPage.tsx
import { useMemo, useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  MessageCircle,
  ArrowRight,
  Clock3,
  Building2,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

export default function ContactPage() {
  const { language } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const contactInfo = useMemo(
    () => ({
      primaryPhone: '+90 258 211 07 18',
      secondaryPhone: '+90 532 340 20 36',
      primaryPhoneHref: 'tel:+902582110718',
      secondaryPhoneHref: 'tel:+905323402036',
      whatsappHref: 'https://wa.me/905323402036',
      primaryEmail: 'info@varolgayrimenkul.com',
      secondaryEmail: 'varol@varolgayrimenkul.com',
      addressLine1: 'İstiklal Mah. Zübeyde Hn. Caddesi No:34/A8',
      addressLine2: 'Pamukkale / Denizli 20150 Türkiye',
      googleMapsHref:
        'https://www.google.com/maps/search/?api=1&query=İstiklal+Mah.+Zübeyde+Hn.+Caddesi+No:34/A8+Pamukkale+Denizli+20150+Türkiye',
    }),
    []
  );

  const seoTitle = useMemo(
    () =>
      language === 'tr'
        ? 'İletişim | Varol Gayrimenkul'
        : 'Contact | Varol Gayrimenkul',
    [language]
  );

  const seoDescription = useMemo(
    () =>
      language === 'tr'
        ? 'Varol Gayrimenkul iletişim bilgileri, telefon numaraları, e-posta adresleri, adres ve hızlı iletişim formu.'
        : 'Varol Gayrimenkul contact details, phone numbers, email addresses, address, and quick contact form.',
    [language]
  );

  const canonicalUrl = useMemo(() => `${window.location.origin}/contact`, []);

  const pageImage = useMemo(() => `${window.location.origin}/logo_varol.png`, []);

  const localBusinessSchema = useMemo(() => {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      '@id': `${window.location.origin}/#realestateagent`,
      name: 'Varol Gayrimenkul',
      url: window.location.origin,
      image: pageImage,
      logo: pageImage,
      email: contactInfo.primaryEmail,
      telephone: contactInfo.secondaryPhone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: contactInfo.addressLine1,
        addressLocality: 'Pamukkale',
        addressRegion: 'Denizli',
        postalCode: '20150',
        addressCountry: 'TR',
      },
      areaServed: [
        {
          '@type': 'City',
          name: 'Denizli',
        },
        {
          '@type': 'AdministrativeArea',
          name: 'Türkiye',
        },
      ],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+90 258 211 07 18',
          contactType: language === 'tr' ? 'müşteri hizmetleri' : 'customer service',
          areaServed: 'TR',
          availableLanguage: ['tr', 'en'],
        },
        {
          '@type': 'ContactPoint',
          telephone: '+90 532 340 20 36',
          contactType: language === 'tr' ? 'satış' : 'sales',
          areaServed: 'TR',
          availableLanguage: ['tr', 'en'],
        },
      ],
      sameAs: [],
    });
  }, [contactInfo, language, pageImage]);

  const breadcrumbSchema = useMemo(() => {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: language === 'tr' ? 'Ana Sayfa' : 'Home',
          item: `${window.location.origin}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: language === 'tr' ? 'İletişim' : 'Contact',
          item: canonicalUrl,
        },
      ],
    });
  }, [canonicalUrl, language]);

  const contactPageSchema = useMemo(() => {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      mainEntity: {
        '@id': `${window.location.origin}/#realestateagent`,
      },
      inLanguage: language === 'tr' ? 'tr-TR' : 'en-US',
    });
  }, [canonicalUrl, language, seoDescription, seoTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('inquiries').insert({
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
      alert(
        language === 'tr'
          ? 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.'
          : 'An error occurred while sending your message. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <html lang={language === 'tr' ? 'tr' : 'en'} />
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Varol Gayrimenkul" />
        <meta property="og:locale" content={language === 'tr' ? 'tr_TR' : 'en_US'} />
        <meta property="og:image" content={pageImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={pageImage} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{localBusinessSchema}</script>
        <script type="application/ld+json">{breadcrumbSchema}</script>
        <script type="application/ld+json">{contactPageSchema}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <Building2 className="h-4 w-4" />
              {language === 'tr' ? 'İletişim' : 'Contact'}
            </div>

            <h1 className="text-4xl font-bold text-gray-900">
              {language === 'tr' ? 'İletişim' : 'Contact'}
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-gray-600">
              {language === 'tr'
                ? 'Sorularınız, portföy talepleriniz ve iş birliği görüşmeleriniz için bize hızlıca ulaşabilirsiniz.'
                : 'You can quickly reach us for your questions, portfolio requests, and collaboration inquiries.'}
            </p>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <a
              href={contactInfo.primaryPhoneHref}
              className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {language === 'tr' ? 'Ofis Telefonu' : 'Office Phone'}
                  </div>
                  <div className="text-sm text-gray-500">{contactInfo.primaryPhone}</div>
                </div>
              </div>
            </a>

            <a
              href={contactInfo.secondaryPhoneHref}
              className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {language === 'tr' ? 'Hızlı İletişim' : 'Quick Contact'}
                  </div>
                  <div className="text-sm text-gray-500">{contactInfo.secondaryPhone}</div>
                </div>
              </div>
            </a>

            <a
              href={contactInfo.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">WhatsApp</div>
                  <div className="text-sm text-gray-500">
                    {language === 'tr' ? 'Anında mesaj gönderin' : 'Send an instant message'}
                  </div>
                </div>
              </div>
            </a>

            <a
              href={contactInfo.googleMapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {language === 'tr' ? 'Konum' : 'Location'}
                  </div>
                  <div className="text-sm text-gray-500">Denizli / Pamukkale</div>
                </div>
              </div>
            </a>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                {language === 'tr' ? 'Mesaj Gönder' : 'Send a Message'}
              </h2>

              {submitted ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
                  <h3 className="mb-2 text-xl font-semibold text-green-800">
                    {language === 'tr' ? 'Mesajınız Gönderildi' : 'Your Message Has Been Sent'}
                  </h3>
                  <p className="text-green-700">
                    {language === 'tr'
                      ? 'En kısa sürede size geri dönüş yapacağız.'
                      : 'We will get back to you as soon as possible.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {language === 'tr' ? 'Ad Soyad' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {language === 'tr' ? 'E-posta' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {language === 'tr' ? 'Telefon' : 'Phone'}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {language === 'tr' ? 'Mesajınız' : 'Your Message'}
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={5}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-gray-400"
                  >
                    <span>
                      {submitting
                        ? language === 'tr'
                          ? 'Gönderiliyor...'
                          : 'Sending...'
                        : language === 'tr'
                        ? 'Mesaj Gönder'
                        : 'Send Message'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">
                  {language === 'tr' ? 'İletişim Bilgileri' : 'Contact Information'}
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-gray-900">
                        {language === 'tr' ? 'Telefon' : 'Phone'}
                      </h3>
                      <a
                        href={contactInfo.primaryPhoneHref}
                        className="block text-gray-600 transition hover:text-emerald-700"
                      >
                        {contactInfo.primaryPhone}
                      </a>
                      <a
                        href={contactInfo.secondaryPhoneHref}
                        className="block text-gray-600 transition hover:text-emerald-700"
                      >
                        {contactInfo.secondaryPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-gray-900">
                        {language === 'tr' ? 'E-posta' : 'Email'}
                      </h3>
                      <a
                        href={`mailto:${contactInfo.primaryEmail}`}
                        className="block text-gray-600 transition hover:text-emerald-700"
                      >
                        {contactInfo.primaryEmail}
                      </a>
                      <a
                        href={`mailto:${contactInfo.secondaryEmail}`}
                        className="block text-gray-600 transition hover:text-emerald-700"
                      >
                        {contactInfo.secondaryEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-gray-900">
                        {language === 'tr' ? 'Adres' : 'Address'}
                      </h3>
                      <p className="text-gray-600">
                        {contactInfo.addressLine1}
                        <br />
                        {contactInfo.addressLine2}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  {language === 'tr' ? 'Çalışma Saatleri' : 'Working Hours'}
                </h2>

                <div className="space-y-3 text-gray-700">
                  <div className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <div className="w-full text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="font-medium">
                          {language === 'tr' ? 'Pazartesi - Cuma' : 'Monday - Friday'}
                        </span>
                        <span>09:00 - 18:00</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <div className="w-full text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="font-medium">
                          {language === 'tr' ? 'Cumartesi' : 'Saturday'}
                        </span>
                        <span>10:00 - 16:00</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <div className="w-full text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="font-medium">
                          {language === 'tr' ? 'Pazar' : 'Sunday'}
                        </span>
                        <span>{language === 'tr' ? 'Kapalı' : 'Closed'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <a
                  href={contactInfo.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <MessageCircle className="h-4 w-4" />
                  {language === 'tr' ? 'WhatsApp ile Hızlı Ulaş' : 'Quick Reach via WhatsApp'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}