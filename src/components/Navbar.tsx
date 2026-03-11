// src/components/Navbar.tsx
import { useState } from 'react';
import {
  Home,
  Building2,
  Car,
  Phone,
  User,
  LogOut,
  Menu,
  X,
  Heart,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'properties', label: t('nav.properties'), icon: Building2 },
    { id: 'vehicles', label: t('nav.vehicles'), icon: Car },
    { id: 'guide', label: 'Gayrimenkul Rehberi', icon: BookOpen },
    { id: 'favorites', label: 'Favoriler', icon: Heart },
    { id: 'contact', label: t('nav.contact'), icon: Phone },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const LangToggle = (
    <div className="flex items-center overflow-hidden rounded-lg border border-gray-200">
      <button
        onClick={() => setLanguage('tr')}
        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
          language === 'tr' ? 'bg-brand text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        TR
      </button>
      <div className="w-px bg-gray-200" />
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
          language === 'en' ? 'bg-brand text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        EN
      </button>
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex shrink-0 items-center"
            aria-label="Varol İnşaat & Gayrimenkul ana sayfa"
          >
            <img
              src="/logo_varol.png"
              alt="Varol İnşaat & Gayrimenkul"
              className="h-10 w-auto object-contain sm:h-12 lg:h-14"
            />
          </button>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === item.id
                        ? 'bg-gray-50 text-brand'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-brand'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {user ? (
                <>
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === 'admin'
                        ? 'bg-gray-50 text-brand'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-brand'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>{t('nav.admin')}</span>
                  </button>

                  <button
                    onClick={signOut}
                    className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onNavigate('login')}
                  className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-brand"
                >
                  <User className="h-4 w-4" />
                  <span>{t('nav.login')}</span>
                </button>
              )}
            </div>

            {LangToggle}

            <div className="ml-1 hidden items-center gap-2 xl:flex">
              <button
                onClick={() => onNavigate('contact')}
                className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/5"
              >
                {t('nav.suggestProperty')}
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="rounded-lg bg-cta px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cta-hover"
              >
                {t('nav.beInvestor')}
              </button>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
            aria-label="Menu"
            type="button"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="space-y-2 px-3 pb-4 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Dil / Language</span>
              {LangToggle}
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-base font-medium ${
                    currentPage === item.id
                      ? 'bg-gray-50 text-brand'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-brand'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleNavigate('contact')}
                className="w-full rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/5"
              >
                {t('nav.suggestProperty')}
              </button>

              <button
                onClick={() => handleNavigate('contact')}
                className="w-full rounded-lg bg-cta px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cta-hover"
              >
                {t('nav.beInvestor')}
              </button>

              {user ? (
                <>
                  <button
                    onClick={() => handleNavigate('admin')}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-brand"
                  >
                    <User className="h-5 w-5" />
                    <span>{t('nav.admin')}</span>
                  </button>

                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleNavigate('login')}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-brand"
                >
                  <User className="h-5 w-5" />
                  <span>{t('nav.login')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}