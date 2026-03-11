// src/pages/GuidePage.tsx
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Calendar, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface GuidePageProps {
  onNavigate: (page: string, propertyId?: string) => void;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  seo_description: string | null;
  published: boolean;
  created_at: string;
}

export default function GuidePage({ onNavigate }: GuidePageProps) {
  const { language } = useLanguage();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      setFilteredPosts(posts);
      return;
    }

    const nextPosts = posts.filter((post) => {
      const title = post.title?.toLowerCase() || '';
      const description = post.seo_description?.toLowerCase() || '';
      const content = post.content?.toLowerCase() || '';

      return (
        title.includes(query) ||
        description.includes(query) ||
        content.includes(query)
      );
    });

    setFilteredPosts(nextPosts);
  }, [searchQuery, posts]);

  const loadPosts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const nextPosts = (data || []) as BlogPost[];
      setPosts(nextPosts);
      setFilteredPosts(nextPosts);
    } catch (error) {
      console.error('Guide posts load error:', error);
      setPosts([]);
      setFilteredPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const canonicalUrl = useMemo(() => {
    return `${window.location.origin}/rehber`;
  }, []);

  const seoTitle = useMemo(() => {
    return language === 'tr'
      ? 'Gayrimenkul Rehberi | Varol Gayrimenkul'
      : 'Real Estate Guide | Varol Gayrimenkul';
  }, [language]);

  const seoDescription = useMemo(() => {
    return language === 'tr'
      ? 'Denizli başta olmak üzere gayrimenkul yatırımı, satılık daire, arsa, konut ve piyasa rehberlerini inceleyin.'
      : 'Browse guides on real estate investment, apartments, land, housing and market insights, especially for Denizli.';
  }, [language]);

  const pageImage = useMemo(() => {
    const firstImagePost = posts.find(
      (post) => typeof post.cover_image === 'string' && post.cover_image.trim() !== ''
    );

    return firstImagePost?.cover_image || `${window.location.origin}/logo_varol.png`;
  }, [posts]);

  const breadcrumbSchemaJson = useMemo(() => {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: language === 'tr' ? 'Ana Sayfa' : 'Home',
          item: `${window.location.origin}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: language === 'tr' ? 'Gayrimenkul Rehberi' : 'Real Estate Guide',
          item: canonicalUrl,
        },
      ],
    });
  }, [language, canonicalUrl]);

  const collectionPageSchemaJson = useMemo(() => {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      inLanguage: language === 'tr' ? 'tr-TR' : 'en-US',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Varol Gayrimenkul',
        url: window.location.origin,
      },
      about: {
        '@type': 'Thing',
        name: language === 'tr' ? 'Gayrimenkul Rehberi' : 'Real Estate Guide',
      },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: filteredPosts.length,
      },
    });
  }, [seoTitle, seoDescription, canonicalUrl, language, filteredPosts.length]);

  const itemListSchemaJson = useMemo(() => {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: language === 'tr' ? 'Gayrimenkul Rehberi Yazıları' : 'Real Estate Guide Articles',
      numberOfItems: filteredPosts.length,
      itemListElement: filteredPosts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${window.location.origin}/rehber/${post.slug}`,
        name: post.title,
        item: {
          '@type': 'BlogPosting',
          headline: post.title,
          url: `${window.location.origin}/rehber/${post.slug}`,
          datePublished: post.created_at,
          image: post.cover_image ? [post.cover_image] : undefined,
          description: post.seo_description || undefined,
        },
      })),
    });
  }, [filteredPosts, language]);

  const formatDate = (dateString: string) => {
    const locale = language === 'tr' ? 'tr-TR' : 'en-US';

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getExcerpt = (post: BlogPost) => {
    if (post.seo_description && post.seo_description.trim()) {
      return post.seo_description.trim();
    }

    if (!post.content) {
      return language === 'tr'
        ? 'Bu içerik için açıklama bulunmuyor.'
        : 'No description is available for this content.';
    }

    const plainText = post.content.replace(/\s+/g, ' ').trim();
    return plainText.length > 180 ? `${plainText.slice(0, 180)}...` : plainText;
  };

  return (
    <>
      <Helmet>
        <html lang={language === 'tr' ? 'tr' : 'en'} />
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Varol Gayrimenkul" />
        <meta property="og:locale" content={language === 'tr' ? 'tr_TR' : 'en_US'} />
        <meta property="og:image" content={pageImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={pageImage} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{collectionPageSchemaJson}</script>
        <script type="application/ld+json">{breadcrumbSchemaJson}</script>
        <script type="application/ld+json">{itemListSchemaJson}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-20">
        <section className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                <BookOpen className="h-4 w-4" />
                {language === 'tr' ? 'Gayrimenkul Rehberi' : 'Real Estate Guide'}
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
                {language === 'tr'
                  ? 'Gayrimenkul Rehberi'
                  : 'Real Estate Guide'}
              </h1>

              <p className="mt-4 text-lg text-gray-600">
                {language === 'tr'
                  ? 'Denizli başta olmak üzere konut, arsa, yatırım ve piyasa hakkında rehber içerikleri inceleyin.'
                  : 'Browse guide content about housing, land, investment and market insights, especially for Denizli.'}
              </p>

              <div className="relative mt-8">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === 'tr'
                      ? 'Rehber içinde ara...'
                      : 'Search in the guide...'
                  }
                  className="w-full rounded-2xl border border-gray-300 bg-white py-4 pl-12 pr-4 text-gray-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-[420px] animate-pulse rounded-3xl bg-gray-200" />
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {language === 'tr' ? 'Tüm Rehber Yazıları' : 'All Guide Articles'}
                </h2>
                <div className="text-sm text-gray-500">
                  {language === 'tr'
                    ? `${filteredPosts.length} yazı bulundu`
                    : `${filteredPosts.length} articles found`}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post) => {
                  const coverImage =
                    post.cover_image && post.cover_image.trim()
                      ? post.cover_image
                      : 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200';

                  return (
                    <article
                      key={post.id}
                      onClick={() => onNavigate('guide-detail', post.slug)}
                      className="group cursor-pointer overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="relative h-60 overflow-hidden bg-gray-100">
                        <img
                          src={coverImage}
                          alt={`${post.title} - ${language === 'tr' ? 'Gayrimenkul Rehberi' : 'Real Estate Guide'}`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                        <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-800 backdrop-blur-sm">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(post.created_at)}
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="line-clamp-2 text-xl font-bold leading-7 text-gray-900">
                          {post.title}
                        </h3>

                        <p className="mt-3 line-clamp-4 text-sm leading-6 text-gray-600">
                          {getExcerpt(post)}
                        </p>

                        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                          <span className="text-sm font-medium text-emerald-700">
                            {language === 'tr' ? 'Yazıyı Oku' : 'Read Article'}
                          </span>

                          <ArrowRight className="h-4 w-4 text-emerald-700 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-gray-100 bg-white px-6 py-20 text-center shadow-sm">
              <BookOpen className="mx-auto h-14 w-14 text-gray-300" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                {language === 'tr'
                  ? 'Henüz rehber yazısı bulunamadı'
                  : 'No guide articles found yet'}
              </h2>
              <p className="mt-3 text-gray-600">
                {searchQuery.trim()
                  ? language === 'tr'
                    ? 'Arama kriterine uygun içerik bulunamadı.'
                    : 'No content matched your search.'
                  : language === 'tr'
                  ? 'Yakında burada gayrimenkul rehberi içerikleri yayınlanacak.'
                  : 'Guide content will be published here soon.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}