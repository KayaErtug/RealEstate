// src/components/Footer.tsx
import { Facebook, Instagram, Linkedin, Twitter, Youtube, MapPin, Mail, Phone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const { t, language } = useLanguage();

  const primaryLinks = [
    { id: 'home', label: t('nav.home') },
    { id: 'properties', label: t('nav.properties') },
    { id: 'vehicles', label: t('nav.vehicles') },
    { id: 'guide', label: language === 'tr' ? 'Gayrimenkul Rehberi' : 'Real Estate Guide' },
    { id: 'contact', label: t('nav.contact') },
  ];

  const secondaryLinks = [
    { id: 'favorites', label: language === 'tr' ? 'Favoriler' : 'Favorites' },
  ];

  return (
    <footer className="mt-12 bg-brand text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
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
              {t('footer.about')}
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">
              {language === 'tr' ? 'Öne Çıkan Sayfalar' : 'Featured Pages'}
            </h2>

            <ul className="space-y-2">
              {primaryLinks.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(link.id)}
                    className="text-left text-white/80 transition-colors hover:text-white"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/90">
                {language === 'tr' ? 'Diğer' : 'Other'}
              </h3>

              <ul className="space-y-2">
                {secondaryLinks.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(link.id)}
                      className="text-left text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
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
                    +90 258 211 0718
                  </a>
                  <a href="tel:+905323402036" className="block transition-colors hover:text-white">
                    +90 532 340 20 36
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  İstiklal Mah. Zübeyde Hn. Caddesi No:34/A8 Pamukkale/Denizli 20150 Türkiye
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-sm text-white/70">{t('footer.rights')}</p>

          <div className="flex items-center gap-3">
            <a aria-label="X" href="#" className="rounded-lg p-2 transition-colors hover:bg-white/10">
              <Twitter className="h-5 w-5" />
            </a>
            <a aria-label="Facebook" href="#" className="rounded-lg p-2 transition-colors hover:bg-white/10">
              <Facebook className="h-5 w-5" />
            </a>
            <a aria-label="Instagram" href="#" className="rounded-lg p-2 transition-colors hover:bg-white/10">
              <Instagram className="h-5 w-5" />
            </a>
            <a aria-label="YouTube" href="#" className="rounded-lg p-2 transition-colors hover:bg-white/10">
              <Youtube className="h-5 w-5" />
            </a>
            <a aria-label="LinkedIn" href="#" className="rounded-lg p-2 transition-colors hover:bg-white/10">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}