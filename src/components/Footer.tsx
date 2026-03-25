// src/components/Footer.tsx
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  FolderKanban,
  Info,
  BookOpen,
  Building2,
  Car,
  Heart,
  Home,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const { t, language } = useLanguage();

  const primaryLinks = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'properties', label: t('nav.properties'), icon: Building2 },
    { id: 'vehicles', label: t('nav.vehicles'), icon: Car },
    {
      id: 'projects',
      label: language === 'tr' ? 'Projeler' : 'Projects',
      icon: FolderKanban,
    },
    {
      id: 'guide',
      label: language === 'tr' ? 'Gayrimenkul Rehberi' : 'Real Estate Guide',
      icon: BookOpen,
    },
    {
      id: 'about',
      label: language === 'tr' ? 'Hakkımızda' : 'About Us',
      icon: Info,
    },
    { id: 'contact', label: t('nav.contact'), icon: Phone },
  ];

  const secondaryLinks = [
    { id: 'favorites', label: language === 'tr' ? 'Favoriler' : 'Favorites', icon: Heart },
  ];

  const whatsappUrl = 'https://wa.me/905323402036';

  return (
    <footer className="mt-12 bg-brand text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center rounded-2xl bg-white px-4 py-3 shadow-sm"
              aria-label="Varol İnşaat & Gayrimenkul ana sayfa"
            >
              <img
                src="/logo_varol.png"
                alt="Varol İnşaat & Gayrimenkul"
                className="h-16 w-auto"
              />
            </button>

            <p className="mt-4 text-sm leading-relaxed text-white/80">
              {language === 'tr'
                ? 'Varol Gayrimenkul; inşaat, proje geliştirme ve gayrimenkul portföy yönetimi alanlarında güven odaklı yaklaşımıyla hizmet sunar.'
                : 'Varol Real Estate provides trust-focused service in construction, project development, and real estate portfolio management.'}
            </p>

            <div className="mt-5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <MessageCircle className="h-4 w-4" />
                {language === 'tr' ? 'WhatsApp ile Ulaş' : 'Reach via WhatsApp'}
              </a>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">
              {language === 'tr' ? 'Öne Çıkan Sayfalar' : 'Featured Pages'}
            </h2>

            <ul className="space-y-2.5">
              {primaryLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(link.id)}
                      className="inline-flex items-center gap-2 text-left text-sm text-white/80 transition-colors hover:text-white"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{link.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">
              {language === 'tr' ? 'Ekstra Bağlantılar' : 'Extra Links'}
            </h2>

            <ul className="space-y-2.5">
              {secondaryLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(link.id)}
                      className="inline-flex items-center gap-2 text-left text-sm text-white/70 transition-colors hover:text-white"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{link.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/90">
                {language === 'tr' ? 'Kurumsal Not' : 'Corporate Note'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {language === 'tr'
                  ? 'Projeler, rehber içerikleri ve güncel portföy yapısıyla bölgesel güven oluşturmaya odaklanıyoruz.'
                  : 'We focus on building regional trust through projects, guide content, and an up-to-date portfolio structure.'}
              </p>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">{t('footer.contact')}</h2>

            <div className="space-y-3 text-sm text-white/80">
              <a
                href="mailto:info@varolgayrimenkul.com"
                className="flex items-start gap-2 transition-colors hover:text-white"
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <span>info@varolgayrimenkul.com</span>
              </a>

              <a
                href="mailto:varol@varolgayrimenkul.com"
                className="flex items-start gap-2 transition-colors hover:text-white"
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <span>varol@varolgayrimenkul.com</span>
              </a>

              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <a href="tel:+902582110718" className="block transition-colors hover:text-white">
                    +90 258 211 07 18
                  </a>
                  <a href="tel:+905323402036" className="block transition-colors hover:text-white">
                    +90 532 340 20 36
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  İstiklal Mah. Zübeyde Hn. Caddesi No:34/A8
                  <br />
                  Pamukkale / Denizli 20150 Türkiye
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-sm text-white/70">{t('footer.rights')}</p>

          <div className="flex items-center gap-3">
            <a
              aria-label="X"
              href="#"
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              aria-label="Facebook"
              href="#"
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              aria-label="Instagram"
              href="#"
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              aria-label="YouTube"
              href="#"
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <Youtube className="h-5 w-5" />
            </a>
            <a
              aria-label="LinkedIn"
              href="#"
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}