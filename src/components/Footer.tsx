// src/components/Footer.tsx
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const { t } = useLanguage();

  const quickLinks = [
    { id: 'home', label: t('nav.home') },
    { id: 'properties', label: t('nav.properties') },
    { id: 'vehicles', label: t('nav.vehicles') },
    { id: 'guide', label: 'Gayrimenkul Rehberi' },
    { id: 'favorites', label: 'Favoriler' },
    { id: 'contact', label: t('nav.contact') },
    { id: 'admin', label: t('nav.admin') },
  ];

  return (
    <footer className="mt-12 bg-brand text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <div className="inline-flex items-center rounded-2xl bg-white px-4 py-3 shadow-sm">
              <img
                src="/logo_varol.png"
                alt="Varol İnşaat & Gayrimenkul"
                className="h-16 w-auto"
              />
            </div>

            <p className="mt-4 text-sm leading-relaxed text-white/80">
              {t('footer.about')}
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">{t('footer.quickLinks')}</h3>

            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => onNavigate(l.id)}
                    className="text-white/80 transition-colors hover:text-white"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">{t('footer.contact')}</h3>

            <div className="space-y-2 text-sm text-white/80">
              <p>info@varolgayrimenkul.com</p>
              <p>varol@varolgayrimenkul.com</p>
              <p className="pt-2">Tel: +90 258 211 0718   +90 532 340 20 36</p>
              <p>Adres: İstiklal Mah. Zübeyde Hn. Caddesi No:34/A8 Pamukkale/Denizli 20150 Türkiye</p>
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