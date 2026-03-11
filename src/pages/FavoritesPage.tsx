// src/pages/FavoritesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Heart, Search, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Property } from "../lib/database.types";
import PropertyCard from "../components/PropertyCard";
import { useLanguage } from "../contexts/LanguageContext";

interface FavoritesPageProps {
  onNavigate: (page: string, propertyId?: string) => void;
}

const FAVORITES_STORAGE_KEY = "varol_property_favorites";

export default function FavoritesPage({ onNavigate }: FavoritesPageProps) {
  const { language } = useLanguage();

  const [properties, setProperties] = useState<Property[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    void loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);

      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);

      if (!saved) {
        setFavoriteIds([]);
        setProperties([]);
        return;
      }

      const parsed: string[] = JSON.parse(saved);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        setFavoriteIds([]);
        setProperties([]);
        return;
      }

      setFavoriteIds(parsed);

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .in("id", parsed)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as Property[];
      const ordered = rows.sort(
        (a, b) => parsed.indexOf(a.id) - parsed.indexOf(b.id)
      );

      setProperties(ordered);
    } catch (error) {
      console.error("Favorites load error:", error);
      setProperties([]);
      setFavoriteIds([]);
    } finally {
      setLoading(false);
    }
  };

  const saveFavoriteIds = (ids: string[]) => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  };

  const handleToggleFavorite = (propertyId: string) => {
    const updatedIds = favoriteIds.filter((id) => id !== propertyId);
    setFavoriteIds(updatedIds);
    saveFavoriteIds(updatedIds);
    setProperties((prev) => prev.filter((property) => property.id !== propertyId));
  };

  const handleCopyLink = async (propertyId: string) => {
    const url = `${window.location.origin}/properties/${propertyId}`;

    try {
      await navigator.clipboard.writeText(url);
      alert(language === "tr" ? "İlan linki kopyalandı." : "Listing link copied.");
    } catch (error) {
      console.error("Clipboard error:", error);
      alert(language === "tr" ? "Link kopyalanamadı." : "Link could not be copied.");
    }
  };

  const handleShareWhatsApp = (property: Property) => {
    const propertyUrl = `${window.location.origin}/properties/${property.id}`;
    const message =
      language === "tr"
        ? `Bu ilanı gördün mü?\n\n${property.title}\n${propertyUrl}`
        : `Have you seen this listing?\n\n${property.title}\n${propertyUrl}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const filteredProperties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q) return properties;

    return properties.filter((property) => {
      const title = property.title?.toLowerCase() || "";
      const city = property.city?.toLowerCase() || "";
      const district = property.district?.toLowerCase() || "";
      const location = property.location?.toLowerCase() || "";
      const description = property.description?.toLowerCase() || "";

      return (
        title.includes(q) ||
        city.includes(q) ||
        district.includes(q) ||
        location.includes(q) ||
        description.includes(q)
      );
    });
  }, [properties, searchQuery]);

  const pageTitle =
    language === "tr" ? "Favori İlanlarım" : "My Favorite Listings";

  const resultText =
    language === "tr"
      ? `${filteredProperties.length} ilan`
      : `${filteredProperties.length} listings`;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                <Heart className="h-7 w-7 fill-current text-red-500" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
                <p className="text-sm text-gray-500">
                  {language === "tr"
                    ? "Kaydettiğin ilanları tek ekranda görüntüle."
                    : "View all your saved listings in one place."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === "tr"
                      ? "Favorilerde ara..."
                      : "Search favorites..."
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {resultText}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={() => onNavigate("property-detail", property.id)}
                isFavorite={favoriteIds.includes(property.id)}
                onToggleFavorite={handleToggleFavorite}
                onShareWhatsApp={handleShareWhatsApp}
                onCopyLink={handleCopyLink}
              />
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
            <Search className="mx-auto mb-4 h-14 w-14 text-gray-300" />
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              {language === "tr" ? "Sonuç bulunamadı" : "No results found"}
            </h2>
            <p className="mb-6 text-gray-500">
              {language === "tr"
                ? "Arama kelimeni değiştirip tekrar deneyebilirsin."
                : "Try changing your search and try again."}
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="rounded-xl bg-cta px-5 py-3 font-medium text-white transition-colors hover:bg-cta-hover"
            >
              {language === "tr" ? "Aramayı Temizle" : "Clear Search"}
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-100 bg-white px-6 py-20 text-center shadow-sm">
            <Heart className="mx-auto mb-6 h-16 w-16 text-gray-300" />
            <h2 className="mb-3 text-2xl font-bold text-gray-900">
              {language === "tr"
                ? "Henüz favori ilan eklenmedi"
                : "No favorite listings yet"}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-gray-500">
              {language === "tr"
                ? "Beğendiğin ilanları kalp ikonuna basarak favorilerine ekleyebilirsin. Böylece daha sonra hızlıca tekrar ulaşabilirsin."
                : "You can save listings by clicking the heart icon. This way you can quickly access them later."}
            </p>

            <button
              onClick={() => onNavigate("properties")}
              className="inline-flex items-center gap-2 rounded-xl bg-cta px-6 py-3 font-medium text-white transition-colors hover:bg-cta-hover"
            >
              {language === "tr" ? "İlanlara Git" : "Browse Listings"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {!loading && filteredProperties.length > 0 && (
          <div className="mt-10 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {language === "tr"
              ? "İpucu: Kartların üzerindeki kalp ile favoriden çıkarabilir, WhatsApp ile paylaşabilir veya linki kopyalayabilirsin."
              : "Tip: You can remove listings from favorites with the heart icon, share via WhatsApp, or copy the link directly from the cards."}
          </div>
        )}
      </div>
    </div>
  );
}