// src/pages/HomePage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Building2,
  ArrowRight,
  Home,
  TrendingUp,
  History,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Phone,
  FolderKanban,
  Car,
  ChevronRight as CategoryChevronRight,
  Info,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "../lib/supabase";
import type { Property } from "../lib/database.types";
import PropertyCard from "../components/PropertyCard";
import { useLanguage } from "../contexts/LanguageContext";

interface HomePageProps {
  onNavigate: (page: string, propertyId?: string) => void;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  seo_description?: string | null;
  created_at: string;
}

const RECENTLY_VIEWED_STORAGE_KEY = "varol_viewed_properties";
const FAVORITES_STORAGE_KEY = "varol_property_favorites";
const HOME_SEARCH_STORAGE_KEY = "home_search";
const PROPERTY_STATUS_FILTER_STORAGE_KEY = "property_status_filter";

export default function HomePage({ onNavigate }: HomePageProps) {
  const { t, language } = useLanguage();

  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [popularProperties, setPopularProperties] = useState<Property[]>([]);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [guidePosts, setGuidePosts] = useState<BlogPost[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [popularLoading, setPopularLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [guideLoading, setGuideLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "for_sale" | "for_rent">("all");
  const [featuredSlideIndex, setFeaturedSlideIndex] = useState(0);

  useEffect(() => {
    loadFavorites();
    void loadFeaturedProperties();
    void loadPopularProperties();
    void loadRecentProperties();
    void loadGuidePosts();
  }, []);

  useEffect(() => {
    if (featuredProperties.length <= 1) return;

    const timer = window.setInterval(() => {
      setFeaturedSlideIndex((prev) =>
        prev === featuredProperties.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => window.clearInterval(timer);
  }, [featuredProperties]);

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);

      if (!saved) {
        setFavoriteIds([]);
        return;
      }

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setFavoriteIds(parsed as string[]);
        return;
      }

      setFavoriteIds([]);
    } catch (error) {
      console.error("Favorite load error:", error);
      setFavoriteIds([]);
    }
  };

  const saveFavorites = (ids: string[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error("Favorite save error:", error);
    }
  };

  const toggleFavorite = (propertyId: string) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(propertyId);
      const updated = exists
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId];

      saveFavorites(updated);
      return updated;
    });
  };

  const copyPropertyLink = async (propertyId: string) => {
    const url = `${window.location.origin}/properties/${propertyId}`;

    try {
      await navigator.clipboard.writeText(url);
      alert(language === "tr" ? "İlan linki kopyalandı." : "Listing link copied.");
    } catch (error) {
      console.error("Clipboard error:", error);
      alert(language === "tr" ? "Link kopyalanamadı." : "Link could not be copied.");
    }
  };

  const shareOnWhatsApp = (property: Property) => {
    const propertyUrl = `${window.location.origin}/properties/${property.id}`;
    const message =
      language === "tr"
        ? `Bu ilanı gördün mü?\n\n${property.title}\n${propertyUrl}`
        : `Have you seen this listing?\n\n${property.title}\n${propertyUrl}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const loadFeaturedProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("featured", true)
        .eq("moderation_status", "approved")
        .in("status", ["for_sale", "for_rent", "sold", "rented"])
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      setFeaturedProperties((data ?? []) as Property[]);
      setFeaturedSlideIndex(0);
    } catch (error) {
      console.error("Error loading featured properties:", error);
      setFeaturedProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPopularProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("moderation_status", "approved")
        .in("status", ["for_sale", "for_rent", "sold", "rented"])
        .order("views", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      setPopularProperties((data ?? []) as Property[]);
    } catch (error) {
      console.error("Error loading popular properties:", error);
      setPopularProperties([]);
    } finally {
      setPopularLoading(false);
    }
  };

  const loadRecentProperties = async () => {
    try {
      setRecentLoading(true);

      const saved = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);

      if (!saved) {
        setRecentProperties([]);
        return;
      }

      const parsed: string[] = JSON.parse(saved);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        setRecentProperties([]);
        return;
      }

      const recentIds = [...parsed].reverse().slice(0, 6);

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .in("id", recentIds);

      if (error) throw error;

      const rows = (data ?? []) as Property[];
      const ordered = rows.sort(
        (a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id)
      );

      setRecentProperties(ordered);
    } catch (error) {
      console.error("Error loading recent properties:", error);
      setRecentProperties([]);
    } finally {
      setRecentLoading(false);
    }
  };

  const loadGuidePosts = async () => {
    try {
      setGuideLoading(true);

      const { data, error } = await supabase
        .from("blog_posts")
        .select("id,title,slug,cover_image,seo_description,created_at")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      setGuidePosts((data ?? []) as BlogPost[]);
    } catch (error) {
      console.error("Guide posts load error:", error);
      setGuidePosts([]);
    } finally {
      setGuideLoading(false);
    }
  };

  const handleSearch = () => {
    try {
      localStorage.setItem(HOME_SEARCH_STORAGE_KEY, searchQuery.trim());

      if (searchType === "for_sale" || searchType === "for_rent") {
        localStorage.setItem(PROPERTY_STATUS_FILTER_STORAGE_KEY, searchType);
      } else {
        localStorage.removeItem(PROPERTY_STATUS_FILTER_STORAGE_KEY);
      }
    } catch {
      // ignore localStorage errors
    }

    onNavigate("properties");
  };

  const handleCategoryNavigate = (
    page: string,
    options?: { propertyStatus?: "for_sale" | "for_rent" }
  ) => {
    try {
      localStorage.removeItem(HOME_SEARCH_STORAGE_KEY);

      if (options?.propertyStatus) {
        localStorage.setItem(PROPERTY_STATUS_FILTER_STORAGE_KEY, options.propertyStatus);
      } else {
        localStorage.removeItem(PROPERTY_STATUS_FILTER_STORAGE_KEY);
      }
    } catch {
      // ignore localStorage errors
    }

    onNavigate(page);
  };

  const featuredCards = useMemo(
    () =>
      featuredProperties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onClick={() => onNavigate("property-detail", property.id)}
          isFavorite={favoriteIds.includes(property.id)}
          onToggleFavorite={toggleFavorite}
          onShareWhatsApp={shareOnWhatsApp}
          onCopyLink={copyPropertyLink}
        />
      )),
    [featuredProperties, favoriteIds, onNavigate]
  );

  const popularCards = useMemo(
    () =>
      popularProperties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onClick={() => onNavigate("property-detail", property.id)}
          isFavorite={favoriteIds.includes(property.id)}
          onToggleFavorite={toggleFavorite}
          onShareWhatsApp={shareOnWhatsApp}
          onCopyLink={copyPropertyLink}
        />
      )),
    [popularProperties, favoriteIds, onNavigate]
  );

  const recentCards = useMemo(
    () =>
      recentProperties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onClick={() => onNavigate("property-detail", property.id)}
          isFavorite={favoriteIds.includes(property.id)}
          onToggleFavorite={toggleFavorite}
          onShareWhatsApp={shareOnWhatsApp}
          onCopyLink={copyPropertyLink}
        />
      )),
    [recentProperties, favoriteIds, onNavigate]
  );

  const sliderProperty =
    featuredProperties.length > 0 ? featuredProperties[featuredSlideIndex] : null;

  const sliderImage =
    sliderProperty && sliderProperty.images && sliderProperty.images.length > 0
      ? sliderProperty.images[0]
      : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c";

  const goPrevSlide = () => {
    if (featuredProperties.length <= 1) return;

    setFeaturedSlideIndex((prev) =>
      prev === 0 ? featuredProperties.length - 1 : prev - 1
    );
  };

  const goNextSlide = () => {
    if (featuredProperties.length <= 1) return;

    setFeaturedSlideIndex((prev) =>
      prev === featuredProperties.length - 1 ? 0 : prev + 1
    );
  };

  const canonicalUrl = useMemo(() => {
    return `${window.location.origin}/`;
  }, []);

  const seoTitle = useMemo(() => {
    return language === "tr"
      ? "Varol Gayrimenkul | Denizli Satılık Daire, Arsa ve Araç İlanları"
      : "Varol Real Estate | Property and Vehicle Listings in Denizli";
  }, [language]);

  const seoDescription = useMemo(() => {
    return language === "tr"
      ? "Denizli'de satılık daire, arsa ve araç ilanlarını Varol Gayrimenkul ile keşfedin. Güncel portföy, güvenilir hizmet, profesyonel danışmanlık ve yatırım fırsatları."
      : "Discover apartments, land and vehicle listings in Denizli with Varol Real Estate. Updated portfolio, reliable service, professional consultancy and investment opportunities.";
  }, [language]);

  const pageImage = useMemo(() => {
    if (sliderProperty?.images && sliderProperty.images.length > 0) {
      return sliderProperty.images[0];
    }

    const firstFeaturedProperty = featuredProperties.find((property) => {
      return (
        Array.isArray(property.images) &&
        property.images.length > 0 &&
        Boolean(property.images[0])
      );
    });

    if (
      firstFeaturedProperty &&
      Array.isArray(firstFeaturedProperty.images) &&
      firstFeaturedProperty.images.length > 0
    ) {
      return firstFeaturedProperty.images[0];
    }

    return `${window.location.origin}/logo_varol.png`;
  }, [sliderProperty, featuredProperties]);

  const organizationSchema = useMemo(() => {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      "@id": `${window.location.origin}/#realestateagent`,
      name: "Varol Gayrimenkul",
      url: window.location.origin,
      logo: `${window.location.origin}/logo_varol.png`,
      image: `${window.location.origin}/logo_varol.png`,
      telephone: "+44 7355 612852",
      email: "info@varolgayrimenkul.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "İstiklal Mah. Zübeyde Hn. Caddesi No:34/A8",
        addressLocality: "Pamukkale",
        addressRegion: "Denizli",
        postalCode: "20150",
        addressCountry: "TR",
      },
      areaServed: [
        {
          "@type": "City",
          name: "Denizli",
        },
        {
          "@type": "AdministrativeArea",
          name: "Türkiye",
        },
      ],
      knowsAbout: [
        language === "tr" ? "Gayrimenkul" : "Real Estate",
        language === "tr" ? "Satılık Daire" : "Apartments for Sale",
        language === "tr" ? "Arsa" : "Land Listings",
        language === "tr" ? "Araç İlanları" : "Vehicle Listings",
      ],
      sameAs: [],
    });
  }, [language]);

  const websiteSchema = useMemo(() => {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${window.location.origin}/#website`,
      url: window.location.origin,
      name: "Varol Gayrimenkul",
      alternateName: language === "tr" ? "Varol Emlak" : "Varol Real Estate",
      inLanguage: language === "tr" ? "tr-TR" : "en-US",
      publisher: {
        "@id": `${window.location.origin}/#realestateagent`,
      },
      potentialAction: [
        {
          "@type": "SearchAction",
          target: `${window.location.origin}/properties?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
        {
          "@type": "SearchAction",
          target: `${window.location.origin}/vehicles?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      ],
    });
  }, [language]);

  const homeCollectionSchema = useMemo(() => {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      inLanguage: language === "tr" ? "tr-TR" : "en-US",
      isPartOf: {
        "@id": `${window.location.origin}/#website`,
      },
      about: [
        {
          "@type": "Thing",
          name: language === "tr" ? "Gayrimenkul İlanları" : "Real Estate Listings",
        },
        {
          "@type": "Thing",
          name: language === "tr" ? "Araç İlanları" : "Vehicle Listings",
        },
      ],
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: featuredProperties.length,
      },
    });
  }, [seoTitle, seoDescription, canonicalUrl, language, featuredProperties.length]);

  const featuredItemListSchema = useMemo(() => {
    const itemListElement = featuredProperties.slice(0, 12).map((property, index) => {
      const firstImage =
        Array.isArray(property.images) && property.images.length > 0
          ? property.images[0]
          : undefined;

      return {
        "@type": "ListItem",
        position: index + 1,
        url: `${window.location.origin}/properties/${property.id}`,
        name: property.title,
        item: {
          "@type": "RealEstateListing",
          name: property.title,
          url: `${window.location.origin}/properties/${property.id}`,
          image: firstImage ? [firstImage] : undefined,
          description: property.description,
          offers: {
            "@type": "Offer",
            price: property.price,
            priceCurrency: property.currency,
            availability:
              property.status === "sold" || property.status === "rented"
                ? "https://schema.org/SoldOut"
                : "https://schema.org/InStock",
            url: `${window.location.origin}/properties/${property.id}`,
          },
        },
      };
    });

    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: language === "tr" ? "Öne Çıkan İlanlar" : "Featured Listings",
      numberOfItems: featuredProperties.length,
      itemListElement,
    });
  }, [featuredProperties, language]);

  const popularItemListSchema = useMemo(() => {
    const itemListElement = popularProperties.slice(0, 12).map((property, index) => {
      const firstImage =
        Array.isArray(property.images) && property.images.length > 0
          ? property.images[0]
          : undefined;

      return {
        "@type": "ListItem",
        position: index + 1,
        url: `${window.location.origin}/properties/${property.id}`,
        name: property.title,
        item: {
          "@type": "RealEstateListing",
          name: property.title,
          url: `${window.location.origin}/properties/${property.id}`,
          image: firstImage ? [firstImage] : undefined,
          description: property.description,
        },
      };
    });

    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: language === "tr" ? "Popüler İlanlar" : "Popular Listings",
      numberOfItems: popularProperties.length,
      itemListElement,
    });
  }, [popularProperties, language]);

  const guideItemListSchema = useMemo(() => {
    const itemListElement = guidePosts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${window.location.origin}/rehber/${post.slug}`,
      name: post.title,
      item: {
        "@type": "BlogPosting",
        headline: post.title,
        url: `${window.location.origin}/rehber/${post.slug}`,
        datePublished: post.created_at,
        image: post.cover_image ? [post.cover_image] : undefined,
        description: post.seo_description || undefined,
      },
    }));

    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: language === "tr" ? "Son Rehber Yazıları" : "Latest Guide Articles",
      numberOfItems: guidePosts.length,
      itemListElement,
    });
  }, [guidePosts, language]);

  const faqSchema = useMemo(() => {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name:
            language === "tr"
              ? "Varol Gayrimenkul hangi bölgelerde hizmet veriyor?"
              : "Which regions does Varol Real Estate serve?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              language === "tr"
                ? "Varol Gayrimenkul başta Denizli olmak üzere gayrimenkul ve araç ilanları alanında hizmet vermektedir."
                : "Varol Real Estate primarily serves Denizli in property and vehicle listings.",
          },
        },
        {
          "@type": "Question",
          name:
            language === "tr"
              ? "Sitede satılık ve kiralık ilanlar bulunuyor mu?"
              : "Are both sale and rental listings available on the website?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              language === "tr"
                ? "Evet. Sitede satılık, kiralık, satılmış ve kiralanmış ilanlar yer alabilir."
                : "Yes. The site may include for sale, for rent, sold and rented listings.",
          },
        },
      ],
    });
  }, [language]);

  const formatGuideDate = (dateString: string) => {
    const locale = language === "tr" ? "tr-TR" : "en-US";

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  };

  const categories = [
    {
      id: "for-sale",
      title: language === "tr" ? "Satılık Gayrimenkul" : "Properties for Sale",
      description:
        language === "tr"
          ? "Arsa, daire, müstakil ev ve ticari portföyleri inceleyin."
          : "Browse land, apartments, detached homes and commercial listings.",
      icon: Building2,
      iconWrapperClass: "bg-emerald-100 text-emerald-700",
      onClick: () =>
        handleCategoryNavigate("properties", {
          propertyStatus: "for_sale",
        }),
    },
    {
      id: "for-rent",
      title: language === "tr" ? "Kiralık Gayrimenkul" : "Properties for Rent",
      description:
        language === "tr"
          ? "Kiralık konut, iş yeri ve farklı seçeneklere hızlı erişin."
          : "Quickly access rental homes, workplaces and other options.",
      icon: Home,
      iconWrapperClass: "bg-blue-100 text-blue-700",
      onClick: () =>
        handleCategoryNavigate("properties", {
          propertyStatus: "for_rent",
        }),
    },
    {
      id: "vehicles",
      title: language === "tr" ? "Araç İlanları" : "Vehicle Listings",
      description:
        language === "tr"
          ? "Araç ilanlarını ayrı kategoride inceleyin."
          : "Explore vehicle listings in a dedicated category.",
      icon: Car,
      iconWrapperClass: "bg-amber-100 text-amber-700",
      onClick: () => handleCategoryNavigate("vehicles"),
    },
    {
      id: "projects",
      title: language === "tr" ? "Projeler" : "Projects",
      description:
        language === "tr"
          ? "Devam eden ve planlanan projelerimizi görüntüleyin."
          : "View our ongoing and planned projects.",
      icon: FolderKanban,
      iconWrapperClass: "bg-purple-100 text-purple-700",
      onClick: () => handleCategoryNavigate("projects"),
    },
    {
      id: "about",
      title: language === "tr" ? "Hakkımızda" : "About Us",
      description:
        language === "tr"
          ? "Firma geçmişimiz, vizyonumuz ve çalışma anlayışımız."
          : "Our company background, vision and working approach.",
      icon: Info,
      iconWrapperClass: "bg-slate-100 text-slate-700",
      onClick: () => handleCategoryNavigate("about"),
    },
    {
      id: "guide",
      title: language === "tr" ? "Blog" : "Blog",
      description:
        language === "tr"
          ? "Gayrimenkul rehberi, analizler ve faydalı içerikler."
          : "Real estate guides, insights and useful content.",
      icon: BookOpen,
      iconWrapperClass: "bg-cyan-100 text-cyan-700",
      onClick: () => handleCategoryNavigate("guide"),
    },
    {
      id: "contact",
      title: language === "tr" ? "İletişim" : "Contact",
      description:
        language === "tr"
          ? "Telefon, adres, WhatsApp ve hızlı ulaşım kanalları."
          : "Phone, address, WhatsApp and quick contact channels.",
      icon: Phone,
      iconWrapperClass: "bg-rose-100 text-rose-700",
      onClick: () => handleCategoryNavigate("contact"),
    },
  ];

  return (
    <>
      <Helmet>
        <html lang={language === "tr" ? "tr" : "en"} />
        <title>{seoTitle}</title>

        <meta name="description" content={seoDescription} />
        <meta
          name="keywords"
          content="Denizli emlak, Denizli satılık daire, Denizli arsa, Denizli gayrimenkul, Denizli araç ilanları, Varol Gayrimenkul"
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />

        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Varol Gayrimenkul" />
        <meta property="og:locale" content={language === "tr" ? "tr_TR" : "en_US"} />
        <meta property="og:image" content={pageImage} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={pageImage} />

        <link rel="canonical" href={canonicalUrl} />

        <script type="application/ld+json">{organizationSchema}</script>
        <script type="application/ld+json">{websiteSchema}</script>
        <script type="application/ld+json">{homeCollectionSchema}</script>
        <script type="application/ld+json">{featuredItemListSchema}</script>
        <script type="application/ld+json">{popularItemListSchema}</script>
        <script type="application/ld+json">{guideItemListSchema}</script>
        <script type="application/ld+json">{faqSchema}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <section className="relative overflow-hidden border-b border-gray-200 bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-white to-emerald-50" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-4 inline-flex w-fit items-center rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand">
                  {language === "tr"
                    ? "Denizli ve çevresinde güncel portföy"
                    : "Updated portfolio in Denizli and nearby"}
                </div>

                <h1 className="max-w-3xl text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                  {language === "tr"
                    ? "Gayrimenkul ve araç ilanlarına hızlıca ulaşın"
                    : "Quickly access property and vehicle listings"}
                </h1>

                <p className="mt-4 max-w-2xl text-center text-base leading-7 text-gray-600 sm:text-lg">
                  {language === "tr"
                    ? "Satılık, kiralık, araç ilanları, projeler ve iletişim kanallarına tek sayfadan hızlı erişin."
                    : "Get fast access to sale listings, rentals, vehicle ads, projects and contact channels from one page."}
                </p>

                <div className="mt-6 w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex overflow-hidden rounded-xl border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setSearchType("all")}
                        className={`px-4 py-2 text-sm font-semibold transition ${
                          searchType === "all"
                            ? "bg-brand text-white"
                            : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {language === "tr" ? "Tümü" : "All"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSearchType("for_sale")}
                        className={`px-4 py-2 text-sm font-semibold transition ${
                          searchType === "for_sale"
                            ? "bg-brand text-white"
                            : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {language === "tr" ? "Satılık" : "For Sale"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSearchType("for_rent")}
                        className={`px-4 py-2 text-sm font-semibold transition ${
                          searchType === "for_rent"
                            ? "bg-brand text-white"
                            : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {language === "tr" ? "Kiralık" : "For Rent"}
                      </button>
                    </div>

                    <div className="flex flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <Search className="h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t("home.searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-gray-800 outline-none placeholder:text-gray-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSearch}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:opacity-95"
                    >
                      <Search size={18} />
                      {t("home.search")}
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm text-gray-500">
                  <span className="rounded-full bg-gray-100 px-3 py-1.5">
                    {language === "tr" ? "Satılık ilanlar" : "For sale listings"}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1.5">
                    {language === "tr" ? "Kiralık portföy" : "Rental portfolio"}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1.5">
                    {language === "tr" ? "Araç ilanları" : "Vehicle listings"}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4 text-center">
                  <h2 className="text-lg font-bold text-gray-900">
                    {language === "tr" ? "Hızlı Kategoriler" : "Quick Categories"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {language === "tr"
                      ? "Sahibinden benzeri hızlı giriş mantığıyla en çok kullanılan alanlar"
                      : "Most-used sections with a fast-entry structure"}
                  </p>
                </div>

                <div className="divide-y divide-gray-100">
                  {categories.map((category) => {
                    const Icon = category.icon;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={category.onClick}
                        className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-gray-50 sm:px-5"
                      >
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${category.iconWrapperClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-base font-semibold text-gray-900">
                            {category.title}
                          </div>
                          <div className="mt-1 line-clamp-1 text-sm text-gray-500">
                            {category.description}
                          </div>
                        </div>

                        <CategoryChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {language === "tr" ? "Öne Çıkan Gayrimenkuller" : "Featured Properties"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {language === "tr"
                ? "Seçili portföyleri büyük slider alanında keşfet."
                : "Discover selected listings in the featured slider."}
            </p>

            <div className="mt-4 flex justify-center">
              <button
                onClick={() => onNavigate("properties")}
                className="flex items-center gap-2 text-green-600"
              >
                {t("home.viewAll")}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="h-[470px] animate-pulse rounded-3xl bg-gray-200" />
          ) : sliderProperty ? (
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative h-[280px] lg:h-[470px]">
                  <img
                    src={sliderImage}
                    alt={sliderProperty.title}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                  <div className="absolute left-4 top-4 flex gap-2">
                    <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                      {sliderProperty.status === "for_sale"
                        ? language === "tr"
                          ? "Satılık"
                          : "For Sale"
                        : sliderProperty.status === "for_rent"
                          ? language === "tr"
                            ? "Kiralık"
                            : "For Rent"
                          : sliderProperty.status === "sold"
                            ? language === "tr"
                              ? "Satıldı"
                              : "Sold"
                            : language === "tr"
                              ? "Kiralandı"
                              : "Rented"}
                    </span>

                    {sliderProperty.featured && (
                      <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                        {language === "tr" ? "Öne Çıkan" : "Featured"}
                      </span>
                    )}
                  </div>

                  {featuredProperties.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goPrevSlide}
                        className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-md transition hover:bg-white"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <button
                        type="button"
                        onClick={goNextSlide}
                        className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-md transition hover:bg-white"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex flex-col justify-between p-6 lg:p-8">
                  <div>
                    <div className="mb-3 text-sm font-medium text-emerald-600">
                      {sliderProperty.city}
                      {sliderProperty.district ? ` / ${sliderProperty.district}` : ""}
                    </div>

                    <h3 className="mb-4 text-3xl font-bold leading-tight text-gray-900">
                      {sliderProperty.title}
                    </h3>

                    <p className="mb-4 text-3xl font-bold text-emerald-700">
                      {new Intl.NumberFormat(language === "tr" ? "tr-TR" : "en-US", {
                        style: "currency",
                        currency: sliderProperty.currency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(sliderProperty.price)}
                    </p>

                    <div className="mb-5 grid grid-cols-2 gap-3 text-sm text-gray-600 sm:grid-cols-3">
                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <div className="text-xs text-gray-400">
                          {language === "tr" ? "Tür" : "Type"}
                        </div>
                        <div className="mt-1 font-medium capitalize text-gray-800">
                          {sliderProperty.property_type.replace(/_/g, " ")}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <div className="text-xs text-gray-400">m²</div>
                        <div className="mt-1 font-medium text-gray-800">
                          {sliderProperty.area}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <div className="text-xs text-gray-400">
                          {language === "tr" ? "Oda" : "Rooms"}
                        </div>
                        <div className="mt-1 font-medium text-gray-800">
                          {sliderProperty.rooms > 0 ? sliderProperty.rooms : "-"}
                        </div>
                      </div>
                    </div>

                    <p className="line-clamp-4 text-gray-600">
                      {sliderProperty.description}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      {featuredProperties.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFeaturedSlideIndex(index)}
                          className={`h-2.5 rounded-full transition-all ${
                            featuredSlideIndex === index
                              ? "w-10 bg-emerald-600"
                              : "w-2.5 bg-gray-300 hover:bg-gray-400"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => onNavigate("property-detail", sliderProperty.id)}
                        className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-700"
                      >
                        {language === "tr" ? "İlanı İncele" : "View Listing"}
                      </button>

                      <button
                        onClick={() => shareOnWhatsApp(sliderProperty)}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3 font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400">
              <Home size={50} className="mx-auto mb-4" />
              {t("home.noFeatured")}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t("home.featuredTitle")}</h2>

            <button
              onClick={() => onNavigate("properties")}
              className="flex items-center gap-2 text-green-600"
            >
              {t("home.viewAll")}
              <ArrowRight size={18} />
            </button>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">{featuredCards}</div>
          ) : (
            <div className="py-20 text-center text-gray-400">
              <Home size={50} className="mx-auto mb-4" />
              {t("home.noFeatured")}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {language === "tr"
                    ? "En Çok Görüntülenen İlanlar"
                    : "Most Viewed Listings"}
                </h2>
                <p className="text-sm text-gray-500">
                  {language === "tr"
                    ? "Kullanıcıların en çok incelediği ilanlar"
                    : "Listings viewed most by users"}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("properties")}
              className="flex items-center gap-2 text-green-600"
            >
              {t("home.viewAll")}
              <ArrowRight size={18} />
            </button>
          </div>

          {popularLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : popularProperties.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">{popularCards}</div>
          ) : (
            <div className="py-20 text-center text-gray-400">
              <TrendingUp size={50} className="mx-auto mb-4" />
              {language === "tr"
                ? "Henüz görüntüleme verisi oluşmadı."
                : "No view data yet."}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <History className="h-5 w-5 text-amber-600" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {language === "tr"
                    ? "Son Gezilen İlanlar"
                    : "Recently Viewed Listings"}
                </h2>
                <p className="text-sm text-gray-500">
                  {language === "tr"
                    ? "Yakın zamanda incelediğin ilanlara hızlıca geri dön."
                    : "Quickly return to the listings you viewed recently."}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("properties")}
              className="flex items-center gap-2 text-green-600"
            >
              {t("home.viewAll")}
              <ArrowRight size={18} />
            </button>
          </div>

          {recentLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : recentProperties.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">{recentCards}</div>
          ) : (
            <div className="py-20 text-center text-gray-400">
              <History size={50} className="mx-auto mb-4" />
              {language === "tr"
                ? "Henüz gezilen ilan geçmişi oluşmadı."
                : "No recently viewed listings yet."}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {language === "tr"
                    ? "Son Rehber Yazıları"
                    : "Latest Guide Articles"}
                </h2>
                <p className="text-sm text-gray-500">
                  {language === "tr"
                    ? "Gayrimenkul hakkında faydalı içerikleri keşfet."
                    : "Discover helpful content about real estate."}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={() => onNavigate("guide")}
                className="flex items-center gap-2 text-green-600"
              >
                {language === "tr" ? "Tümünü Gör" : "View All"}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {guideLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : guidePosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {guidePosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => onNavigate("guide-detail", post.slug)}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-52 overflow-hidden bg-gray-100">
                    <img
                      src={post.cover_image || "/logo_varol.png"}
                      alt={`${post.title} - ${
                        language === "tr" ? "Gayrimenkul Rehberi" : "Real Estate Guide"
                      }`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="p-5">
                    <div className="mb-2 text-xs font-medium text-emerald-700">
                      {formatGuideDate(post.created_at)}
                    </div>

                    <h3 className="line-clamp-2 text-lg font-bold leading-7 text-gray-900">
                      {post.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                      {post.seo_description && post.seo_description.trim()
                        ? post.seo_description
                        : language === "tr"
                          ? "Gayrimenkul rehber yazısını okumak için tıklayın."
                          : "Click to read the real estate guide article."}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-sm font-medium text-emerald-700">
                        {language === "tr" ? "Yazıyı Oku" : "Read Article"}
                      </span>

                      <ArrowRight className="h-4 w-4 text-emerald-700 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400">
              <BookOpen size={50} className="mx-auto mb-4" />
              {language === "tr"
                ? "Henüz rehber yazısı bulunmuyor."
                : "No guide articles yet."}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl bg-white shadow-lg">
            <div className="border-b p-4 text-center font-semibold">
              {language === "tr" ? "Tanıtım Videomuz" : "Our Promo Video"}
            </div>

            <video src="/promo.mp4" controls className="w-full" />
          </div>
        </section>

        <section className="bg-green-600 py-20 text-center text-white">
          <h2 className="mb-4 text-3xl font-bold">{t("home.ctaTitle")}</h2>
          <p className="mb-8 opacity-90">{t("home.ctaSubtitle")}</p>

          <button
            onClick={() => onNavigate("properties")}
            className="rounded-lg bg-white px-8 py-3 font-semibold text-green-700 hover:bg-gray-100"
          >
            {t("home.ctaButton")}
          </button>
        </section>
      </div>
    </>
  );
}