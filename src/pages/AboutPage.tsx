// src/pages/AboutPage.tsx
import {
  Building2,
  Users,
  Target,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  Phone,
  MapPin,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  const values = [
    {
      title: 'Güven',
      description:
        'Müşterilerimizle kurduğumuz ilişkide şeffaflık, doğruluk ve sürdürülebilir güven temel önceliğimizdir.',
      icon: ShieldCheck,
    },
    {
      title: 'Doğru Yönlendirme',
      description:
        'Gayrimenkul seçiminde yalnızca bugünü değil, uzun vadeli değer ve kullanım dengesini de dikkate alıyoruz.',
      icon: Target,
    },
    {
      title: 'Kurumsal Yaklaşım',
      description:
        'İnşaat ve gayrimenkul tecrübemizi düzenli, profesyonel ve sonuç odaklı bir hizmet anlayışıyla birleştiriyoruz.',
      icon: BadgeCheck,
    },
  ];

  const serviceAreas = [
    'İnşaat projeleri',
    'Gayrimenkul portföy yönetimi',
    'Satılık konut ve arsa portföyü',
    'Kiralık portföy yönetimi',
    'Yatırım odaklı gayrimenkul yaklaşımı',
    'Müşteri odaklı hızlı iletişim',
  ];

  return (
    <>
      <Helmet>
        <html lang="tr" />
        <title>Hakkımızda | Varol Gayrimenkul</title>
        <meta
          name="description"
          content="Varol Gayrimenkul hakkında bilgi edinin. İnşaat ve gayrimenkul alanındaki yaklaşımımızı, hizmet anlayışımızı ve vizyonumuzu inceleyin."
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={`${window.location.origin}/about`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-20">
        <section className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                  <Building2 className="h-4 w-4" />
                  Hakkımızda
                </div>

                <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
                  İnşaat ve gayrimenkulde güven veren yaklaşım
                </h1>

                <p className="mt-4 text-lg leading-8 text-gray-600">
                  Varol Gayrimenkul; inşaat ve gayrimenkul alanında, doğru portföy, güçlü lokasyon ve
                  güvenilir iletişim anlayışıyla hareket eden kurumsal bir yapıdır.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onNavigate('properties')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
                  >
                    İlanları İncele
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    İletişime Geç
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] border border-gray-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="text-sm text-gray-500">Odak Alanı</div>
                    <div className="mt-2 text-lg font-bold text-gray-900">İnşaat + Gayrimenkul</div>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="text-sm text-gray-500">Yaklaşım</div>
                    <div className="mt-2 text-lg font-bold text-gray-900">Güven + Değer</div>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="text-sm text-gray-500">Bölge</div>
                    <div className="mt-2 text-lg font-bold text-gray-900">Denizli Odaklı</div>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="text-sm text-gray-500">Hedef</div>
                    <div className="mt-2 text-lg font-bold text-gray-900">Uzun Vadeli Güven</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h2 className="text-xl font-bold text-gray-900">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-700" />
                <h2 className="text-2xl font-bold text-gray-900">Biz Kimiz?</h2>
              </div>

              <p className="text-gray-600 leading-7">
                Varol Gayrimenkul, yalnızca portföy sunan bir yapı değil; aynı zamanda inşaat ve
                proje bakış açısını gayrimenkul tarafına taşıyan bir hizmet anlayışına sahiptir.
                Bu sayede müşterilerimize sadece ilan değil, daha sağlıklı değerlendirme zemini
                sunmayı hedefliyoruz.
              </p>

              <p className="mt-4 text-gray-600 leading-7">
                Özellikle Denizli ve çevresinde, konut, arsa ve yatırım değeri taşıyan portföylerde
                güçlü, sade ve güven veren bir yapı kurmayı amaçlıyoruz.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-700" />
                <h2 className="text-2xl font-bold text-gray-900">Misyon & Vizyon</h2>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="font-semibold text-gray-900">Misyonumuz</div>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Müşterilerimize güvenilir, değer odaklı ve doğru yönlendirilmiş gayrimenkul
                    seçenekleri sunmak.
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="font-semibold text-gray-900">Vizyonumuz</div>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Bölgesinde güven, kalite ve kurumsal yaklaşım denildiğinde akla gelen güçlü
                    bir gayrimenkul markası olmak.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Hizmet Alanlarımız</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {serviceAreas.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Güvenilir bir görüşme ile başlayalım
                </h2>
                <p className="mt-4 leading-7 text-gray-600">
                  Doğru ilan, doğru yatırım ya da doğru yönlendirme için bizimle iletişime
                  geçebilirsiniz. Sade, net ve hızlı iletişim yaklaşımını önemsiyoruz.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Phone className="h-4 w-4" />
                  İletişim Sayfası
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('properties')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <MapPin className="h-4 w-4" />
                  Portföyü İncele
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}