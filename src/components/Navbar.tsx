import { useMemo, useState } from "react";
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
  Search,
  MessageCircle,
  FolderKanban,
  Info,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { getWhatsAppUrl } from "../lib/contact";

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = useMemo(
    () => [
      { id: "home", label: t("nav.home"), icon: Home },
      { id: "properties", label: t("nav.properties"), icon: Building2 },
      { id: "vehicles", label: t("nav.vehicles"), icon: Car },
      {
        id: "projects",
        label: language === "tr" ? "Projeler" : "Projects",
        icon: FolderKanban,
      },
      {
        id: "guide",
        label: language === "tr" ? "Blog" : "Blog",
        icon: BookOpen,
      },
      {
        id: "about",
        label: language === "tr" ? "Hakkımızda" : "About Us",
        icon: Info,
      },
      { id: "contact", label: t("nav.contact"), icon: Phone },
    ],
    [language, t]
  );

  const bottomNavItems = useMemo(
    () => [
      {
        id: "home",
        label: language === "tr" ? "Ana Sayfa" : "Home",
        icon: Home,
      },
      {
        id: "properties",
        label: language === "tr" ? "İlan Ara" : "Search",
        icon: Search,
      },
      {
        id: "favorites",
        label: language === "tr" ? "Favoriler" : "Favorites",
        icon: Heart,
      },
      {
        id: "assistant",
        label: language === "tr" ? "Asistan" : "Assistant",
        icon: MessageCircle,
      },
      {
        id: user ? "admin" : "contact",
        label: language === "tr" ? "Hesap" : "Account",
        icon: User,
      },
    ],
    [language, user]
  );

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const openWhatsAppAssistant = () => {
    window.open(getWhatsAppUrl(language), "_blank", "noopener,noreferrer");
    setMobileMenuOpen(false);
  };

  const isBottomNavActive = (itemId: string) => {
    if (itemId === "properties") {
      return currentPage === "properties" || currentPage === "property-detail";
    }

    if (itemId === "contact") {
      return currentPage === "contact";
    }

    if (itemId === "admin") {
      return currentPage === "admin";
    }

    if (itemId === "assistant") {
      return false;
    }

    return currentPage === itemId;
  };

  const LangToggle = (
    <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setLanguage("tr")}
        className={`px-3 py-2 text-xs font-semibold transition-colors ${
          language === "tr"
            ? "bg-brand text-white"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        TR
      </button>
      <div className="h-5 w-px bg-gray-200" />
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-3 py-2 text-xs font-semibold transition-colors ${
          language === "en"
            ? "bg-brand text-white"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        EN
      </button>
    </div>
  );

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[72px] items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="flex shrink-0 items-center"
              aria-label="Varol İnşaat & Gayrimenkul ana sayfa"
            >
              <img
                src="/logo_varol.png"
                alt="Varol İnşaat & Gayrimenkul"
                className="h-10 w-auto object-contain sm:h-12 lg:h-14"
              />
            </button>

            <div className="hidden flex-1 items-center justify-center lg:flex">
              <div className="flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <Search className="h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => onNavigate("properties")}
                  className="w-full text-left text-sm text-gray-500"
                >
                  {language === "tr"
                    ? 'Satılık, kiralık, araç ilanı ara...'
                    : "Search sale, rent or vehicle listings..."}
                </button>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex lg:gap-3">
              <button
                type="button"
                onClick={() => onNavigate("favorites")}
                className={`rounded-xl p-3 transition ${
                  currentPage === "favorites"
                    ? "bg-brand/10 text-brand"
                    : "text-gray-600 hover:bg-gray-100 hover:text-brand"
                }`}
                aria-label={language === "tr" ? "Favoriler" : "Favorites"}
              >
                <Heart className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={openWhatsAppAssistant}
                className="hidden rounded-xl border border-brand px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/5 xl:inline-flex"
              >
                {language === "tr" ? "WhatsApp + YZ Asistan" : "WhatsApp + AI Assistant"}
              </button>

              {user ? (
                <button
                  type="button"
                  onClick={() => onNavigate("admin")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    currentPage === "admin"
                      ? "bg-brand text-white"
                      : "bg-cta text-white hover:bg-cta-hover"
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>{language === "tr" ? "Hesap" : "Account"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate("contact")}
                  className="inline-flex items-center gap-2 rounded-xl bg-cta px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cta-hover"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{language === "tr" ? "İletişim" : "Contact"}</span>
                </button>
              )}

              {LangToggle}
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="rounded-xl border border-gray-200 p-2.5 text-gray-700 transition hover:bg-gray-100 md:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          <div className="hidden border-t border-gray-100 py-3 md:block">
            <div className="flex flex-wrap items-center gap-2">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      currentPage === item.id
                        ? "bg-brand/10 text-brand"
                        : "text-gray-700 hover:bg-gray-100 hover:text-brand"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {user && (
                <button
                  type="button"
                  onClick={signOut}
                  className="ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t("nav.logout")}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white md:hidden">
            <div className="space-y-3 px-4 pb-24 pt-4">
              <button
                type="button"
                onClick={() => handleNavigate("properties")}
                className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left"
              >
                <Search className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {language === "tr"
                    ? 'Satılık, kiralık, araç ilanı ara...'
                    : "Search sale, rent or vehicle listings..."}
                </span>
              </button>

              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">Dil / Language</span>
                {LangToggle}
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isLast = index === menuItems.length - 1;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                        currentPage === item.id
                          ? "bg-brand/5 text-brand"
                          : "text-gray-700 hover:bg-gray-50"
                      } ${!isLast ? "border-b border-gray-100" : ""}`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => handleNavigate("favorites")}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-gray-700"
                >
                  <Heart className="h-5 w-5 text-brand" />
                  <span className="font-medium">
                    {language === "tr" ? "Favoriler" : "Favorites"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openWhatsAppAssistant}
                  className="flex items-center gap-3 rounded-2xl border border-brand bg-brand/5 px-4 py-3 text-left text-brand"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {language === "tr" ? "WhatsApp + YZ Asistan" : "WhatsApp + AI Assistant"}
                  </span>
                </button>

                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleNavigate("admin")}
                      className="flex items-center gap-3 rounded-2xl bg-cta px-4 py-3 text-left text-white"
                    >
                      <User className="h-5 w-5" />
                      <span className="font-medium">
                        {language === "tr" ? "Hesap Paneli" : "Account Panel"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-red-600"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">{t("nav.logout")}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleNavigate("login")}
                    className="flex items-center gap-3 rounded-2xl bg-cta px-4 py-3 text-left text-white"
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">{t("nav.login")}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden">
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-5">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const active = isBottomNavActive(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    item.id === "assistant" ? openWhatsAppAssistant() : onNavigate(item.id)
                  }
                  className={`flex min-h-[68px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition ${
                    active ? "text-brand" : "text-gray-500 hover:text-brand"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-brand" : "text-gray-400"}`} />
                  <span className="text-center leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}