// src/pages/ProjectsPage.tsx
import {
  FolderKanban,
  MapPin,
  Building2,
  ArrowRight,
  CheckCircle2,
  Hammer,
  CalendarDays,
  BadgeCheck,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface ProjectsPageProps {
  onNavigate: (page: string) => void;
}

type ProjectItem = {
  id: string;
  title: string;
  location: string;
  status: 'completed' | 'ongoing' | 'planned';
  category: string;
  summary: string;
  stats: string[];
  image: string;
};

export default function ProjectsPage({ onNavigate }: ProjectsPageProps) {
  const projects: ProjectItem[] = [
    {
      id: 'project-1',
      title: 'Modern Konut Projesi',
      location: 'Denizli / Pamukkale',
      status: 'completed',
      category: 'Konut Projesi',
      summary:
        'Modern mimari, işlevsel yaşam alanları ve yatırım değeri odaklı örnek konut projesi.',
      stats: ['24 Bağımsız Bölüm', 'Modern Mimari', 'Yatırım Uygunluğu'],
      image:
        'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      id: 'project-2',
      title: 'Yeni Nesil Yaşam Alanı',
      location: 'Denizli / Merkezefendi',
      status: 'ongoing',
      category: 'Yaşam Alanı',
      summary:
        'Gelişen bölge içinde konumlanan, aile yaşamına ve uzun vadeli değer artışına uygun proje yaklaşımı.',
      stats: ['Gelişen Bölge', 'Aile Uygunluğu', 'Güçlü Lokasyon'],
      image:
        'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      id: 'project-3',
      title: 'Planlanan Yatırım Projesi',
      location: 'Denizli / Pamukkale',
      status: 'planned',
      category: 'Yatırım Projesi',
      summary:
        'Doğru lokasyon, güçlü proje kurgusu ve bölgesel ihtiyaçlara göre şekillenen planlı yatırım yaklaşımı.',
      stats: ['Planlama Aşaması', 'Doğru Lokasyon', 'Değer Odaklı'],
      image:
        'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
  ];

  const statusMap: Record<ProjectItem['status'], { label: string; className: string; icon: typeof CheckCircle2 }> =
    {
      completed: {
        label: 'Tamamlandı',
        className: 'bg-emerald-600 text-white',
        icon: CheckCircle2,
      },
      ongoing: {
        label: 'Devam Ediyor',
        className: 'bg-amber-500 text-white',
        icon: Hammer,
      },
      planned: {
        label: 'Planlama',
        className: 'bg-slate-800 text-white',
        icon: CalendarDays,
      },
    };

  const highlightItems = [
    {
      title: 'Kurumsal Yaklaşım',
      description: 'Projelerde işlevsellik, görünüm ve değer dengesini ön planda tutuyoruz.',
    },
    {
      title: 'Doğru Lokasyon Seçimi',
      description: 'Bölgesel gelişim potansiyeli yüksek alanlarda ilerlemeyi hedefliyoruz.',
    },
    {
      title: 'Uzun Vadeli Değer',
      description: 'Yalnızca bugünü değil, gelecekteki değer artışını da dikkate alıyoruz.',
    },
  ];

  return (
    <>
      <Helmet>
        <html lang="tr" />
        <title>Projeler | Varol Gayrimenkul</title>
        <meta
          name="description"
          content="Varol Gayrimenkul tarafından geliştirilen, tamamlanan ve planlanan projeleri inceleyin."
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={`${window.location.origin}/projects`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-20">
        <section className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                <FolderKanban className="h-4 w-4" />
                Projelerimiz
              </div>

              <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
                Tamamlanan, Devam Eden ve Planlanan Projeler
              </h1>

              <p className="mt-4 text-lg text-gray-600">
                İnşaat ve gayrimenkul tarafındaki proje yaklaşımımızı, geliştirdiğimiz örnek işleri ve
                gelecek vizyonumuzu burada inceleyebilirsiniz.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {highlightItems.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <BadgeCheck className="h-5 w-5" />
                </div>

                <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Proje Vitrini</h2>
            <div className="text-sm text-gray-500">{projects.length} proje</div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {projects.map((project) => {
              const status = statusMap[project.status];
              const StatusIcon = status.icon;

              return (
                <article
                  key={project.id}
                  className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-56 overflow-hidden bg-gray-200">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                    <div className="absolute left-4 top-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-800 backdrop-blur-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        {project.location}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="text-sm font-medium text-emerald-700">{project.category}</div>

                    <h3 className="mt-2 text-xl font-bold leading-7 text-gray-900">
                      {project.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-gray-600">{project.summary}</p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {project.stats.map((stat) => (
                        <span
                          key={stat}
                          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                        >
                          {stat}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <button
                        type="button"
                        onClick={() => onNavigate('contact')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                      >
                        Proje Hakkında Bilgi Al
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Projelerde yaklaşımımız net:
                </h2>
                <p className="mt-4 leading-7 text-gray-600">
                  Doğru lokasyon, güçlü planlama, uygulanabilir mimari ve uzun vadeli değer üretimi.
                  Varol Gayrimenkul olarak projeleri sadece yapı olarak değil, yatırım ve yaşam
                  bütünlüğü olarak ele alıyoruz.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <Building2 className="h-6 w-6 text-emerald-700" />
                  <h3 className="mt-3 text-lg font-bold text-gray-900">Yaşam Odaklı</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Konfor, kullanışlı plan ve sürdürülebilir yaşam yaklaşımı önceliğimizdir.
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                  <CheckCircle2 className="h-6 w-6 text-emerald-700" />
                  <h3 className="mt-3 text-lg font-bold text-gray-900">Değer Odaklı</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Bugünkü kullanım kadar yarının yatırım karşılığını da gözetiyoruz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}