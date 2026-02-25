import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { t } = useLanguage();

  const quickLinks = [
    { id: 'home', label: t('nav.home') },
    { id: 'properties', label: t('nav.properties') },
    { id: 'vehicles', label: t('nav.vehicles') },
    { id: 'contact', label: t('nav.contact') },
    { id: 'admin', label: t('nav.admin') },
  ];

  return (
    <footer className="bg-brand text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo_varol.jpg" alt="Varol İnşaat" className="h-12 w-auto" />
            </div>
            <p className="mt-4 text-white/80 text-sm leading-relaxed">{t('footer.about')}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => onNavigate(l.id)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.contact')}</h3>
            <div className="space-y-2 text-sm text-white/80">
              <p>varol.gayrimenkul.a.s@gmail.com</p>
              <p>info@varolgayrimenkul.com</p>
              <p>talep@varolgayrimenkul.com</p>
              <p>yatirimci@varolgayrimenkul.com</p>
              <p>musteri.iliskileri@varolgayrimenkul.com</p>
              <p className="pt-2">Tel: +90 258 911 07 18</p>
              <p>Adres: İstiklal Mah. Zübeyde Hanım Cad. No:34 A Pamukkale / DENİZLİ</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/70">{t('footer.rights')}</p>
          <div className="flex items-center gap-3">
            <a aria-label="X" href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a aria-label="Facebook" href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Facebook className="h-5 w-5" />
            </a>
            <a aria-label="Instagram" href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
            <a aria-label="YouTube" href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Youtube className="h-5 w-5" />
            </a>
            <a aria-label="LinkedIn" href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
