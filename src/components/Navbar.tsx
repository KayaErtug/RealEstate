import { useState } from 'react';
import { Home, Building2, Car, Phone, User, LogOut, Menu, X } from 'lucide-react';
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
    { id: 'contact', label: t('nav.contact'), icon: Phone },
  ];

  const LangToggle = (
    <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
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
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <img src="/logo_varol.jpg" alt="Varol İnşaat" className="h-10 w-auto" />
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center space-x-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === item.id
                        ? 'text-brand bg-gray-50'
                        : 'text-gray-700 hover:text-brand hover:bg-gray-50'
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
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === 'admin'
                        ? 'text-brand bg-gray-50'
                        : 'text-gray-700 hover:text-brand hover:bg-gray-50'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>{t('nav.admin')}</span>
                  </button>
                  <button
                    onClick={signOut}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onNavigate('login')}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-brand hover:bg-gray-50 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>{t('nav.login')}</span>
                </button>
              )}
            </div>

            {LangToggle}

            <div className="hidden lg:flex items-center gap-2 ml-1">
              <button
                onClick={() => onNavigate('contact')}
                className="px-4 py-2 rounded-lg border border-brand text-brand hover:bg-brand/5 transition-colors text-sm font-semibold"
              >
                {t('nav.suggestProperty')}
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="px-4 py-2 rounded-lg bg-cta text-white hover:bg-cta-hover transition-colors text-sm font-semibold"
              >
                {t('nav.beInvestor')}
              </button>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-3 pt-3 pb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Dil / Language</span>
              {LangToggle}
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                    currentPage === item.id
                      ? 'text-brand bg-gray-50'
                      : 'text-gray-700 hover:text-brand hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  onNavigate('contact');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2 rounded-lg border border-brand text-brand hover:bg-brand/5 transition-colors text-sm font-semibold"
              >
                {t('nav.suggestProperty')}
              </button>
              <button
                onClick={() => {
                  onNavigate('contact');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2 rounded-lg bg-cta text-white hover:bg-cta-hover transition-colors text-sm font-semibold"
              >
                {t('nav.beInvestor')}
              </button>

              {user ? (
                <>
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand hover:bg-gray-50"
                  >
                    <User className="h-5 w-5" />
                    <span>{t('nav.admin')}</span>
                  </button>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand hover:bg-gray-50"
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
