// src/pages/GuideDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, BookOpen, Share2, Copy } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import type { Property } from '../lib/database.types';
import { useLanguage } from '../contexts/LanguageContext';
import PropertyCard from '../components/PropertyCard';

interface GuideDetailPageProps {
  slug: string;
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

export default function GuideDetailPage({ slug, onNavigate }: GuideDetailPageProps) {
  const { language } = useLanguage();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [relatedProperties, setRelatedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [relatedPropertiesLoading, setRelatedPropertiesLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [slug]);

  useEffect(() => {
    if (post) {
      loadRecentPosts(post.slug);
      loadRelatedProperties(post);
    }
  }, [post]);

  const loadPost = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) throw error;

      setPost((data || null) as BlogPost | null);
    } catch (error) {
      console.error('Guide post load error:', error);
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentPosts = async (currentSlug: string) => {
    try {
      setRecentLoading(true);

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .neq('slug', currentSlug)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      setRecentPosts((data || []) as BlogPost[]);
    } catch (error) {
      console.error('Recent guide posts load error:', error);
      setRecentPosts([]);
    } finally {
      setRecentLoading(false);
    }
  };

  const loadRelatedProperties = async (currentPost: BlogPost) => {
    try {
      setRelatedPropertiesLoading(true);

      const normalizedText = `${currentPost.title} ${currentPost.content} ${currentPost.seo_description || ''}`
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

      const isLandContent =
        normalizedText.includes('arsa') ||
        normalizedText.includes('tarla') ||
        normalizedText.includes('land') ||
        normalizedText.includes('field') ||
        normalizedText.includes('farm');

      const isOfficeContent =
        normalizedText.includes('ofis') ||
        normalizedText.includes('dükkan') ||
        normalizedText.includes('ticari') ||
        normalizedText.includes('office') ||
        normalizedText.includes('shop') ||
        normalizedText.includes('commercial');

      const isVillaContent =
        normalizedText.includes('villa') ||
        normalizedText.includes('müstakil') ||
        normalizedText.includes('detached');

      const isResidenceContent =
        normalizedText.includes('rezidans') ||
        normalizedText.includes('residence');

      const isApartmentContent =
        normalizedText.includes('daire') ||
        normalizedText.includes('konut') ||
        normalizedText.includes('apartment') ||
        normalizedText.includes('residence') ||
        normalizedText.includes('duplex');

      let propertyTypeFilter: string[] | null = null;

      if (isLandContent) {
        propertyTypeFilter = ['land', 'field', 'farm'];
      } else if (isOfficeContent) {
        propertyTypeFilter = ['office', 'shop', 'commercial', 'building'];
      } else if (isVillaContent) {
        propertyTypeFilter = ['villa', 'detached_house'];
      } else if (isResidenceContent) {
        propertyTypeFilter = ['residence', 'duplex', 'apartment'];
      } else if (isApartmentContent) {
        propertyTypeFilter = ['apartment', 'residence', 'duplex'];
      }

      let cityFilter: string | null = null;

      if (normalizedText.includes('denizli')) {
        cityFilter = 'Denizli';
      }

      let query = supabase
        .from('properties')
        .select('*')
        .eq('moderation_status', 'approved')
        .in('status', ['for_sale', 'for_rent', 'sold', 'rented'])
        .order('featured', { ascending: false })
        .order('views', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);

      if (cityFilter) {
        query = query.ilike('city', `%${cityFilter}%`);
      }

      if (propertyTypeFilter) {
        query = query.in('property_type', propertyTypeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        setRelatedProperties(data as Property[]);
        return;
      }

      let fallbackQuery = supabase
        .from('properties')
        .select('*')
        .eq('moderation_status', 'approved')
        .in('status', ['for_sale', 'for_rent', 'sold', 'rented'])
        .order('featured', { ascending: false })
        .order('views', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);

      if (cityFilter) {
        fallbackQuery = fallbackQuery.ilike('city', `%${cityFilter}%`);
      }

      const fallbackResponse = await fallbackQuery;

      if (fallbackResponse.error) throw fallbackResponse.error;

      if (fallbackResponse.data && fallbackResponse.data.length > 0) {
        setRelatedProperties(fallbackResponse.data as Property[]);
        return;
      }

      const secondFallback = await supabase
        .from('properties')
        .select('*')
        .eq('moderation_status', 'approved')
        .in('status', ['for_sale', 'for_rent', 'sold', 'rented'])
        .order('featured', { ascending: false })
        .order('views', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);

      if (secondFallback.error) throw secondFallback.error;

      setRelatedProperties((secondFallback.data || []) as Property[]);
    } catch (error) {
      console.error('Related properties load error:', error);
      setRelatedProperties([]);
    } finally {
      setRelatedPropertiesLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const locale = language === 'tr' ? 'tr-TR' : 'en-US';

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const shareOnWhatsApp = () => {
    if (!post) return;

    const postUrl = `${window.location.origin}/rehber/${post.slug}`;
    const message =
      language === 'tr'
        ? `Bu rehber yazısını gördün mü?\n\n${post.title}\n${postUrl}`
        : `Have you seen this guide article?\n\n${post.title}\n${postUrl}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const copyGuideLink = async () => {
    if (!post) return;

    const url = `${window.location.origin}/rehber/${post.slug}`;

    try {
      await navigator.clipboard.writeText(url);
      alert(language === 'tr' ? 'Rehber linki kopyalandı.' : 'Guide link copied.');
    } catch (error) {
      console.error('Clipboard error:', error);
      alert(language === 'tr' ? 'Link kopyalanamadı.' : 'Link could not be copied.');
    }
  };

  const canonicalUrl = useMemo(() => {
    return `${window.location.origin}/rehber/${slug}`;
  }, [slug]);

  const seoTitle = useMemo(() => {
    if (!post) {
      return language === 'tr'
        ? 'Gayrimenkul Rehberi | Varol Gayrimenkul'
        : 'Real Estate Guide | Varol Gayrimenkul';
    }

    return `${post.title} | Varol Gayrimenkul`;
  }, [post, language]);

  const seoDescription = useMemo(() => {
    if (!post) {
      return language === 'tr'
        ? 'Gayrimenkul rehberi yazılarını inceleyin.'
        : 'Browse real estate guide articles.';
    }

    if (post.seo_description && post.seo_description.trim()) {
      return post.seo_description.trim();
    }

    const plainText = post.content?.replace(/\s+/g, ' ').trim() || '';

    if (!plainText) {
      return language === 'tr'
        ? 'Gayrimenkul rehberi yazısı.'
        : 'Real estate guide article.';
    }

    return plainText.length > 160 ? `${plainText.slice(0, 160)}...` : plainText;
  }, [post, language]);

  const pageImage = useMemo(() => {
    if (post?.cover_image && post.cover_image.trim()) {
      return post.cover_image;
    }

    return `${window.location.origin}/logo_varol.png`;
  }, [post]);

  const breadcrumbSchemaJson = useMemo(() => {
    if (!post) return null;

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
          item: `${window.location.origin}/rehber`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.title,
          item: `${window.location.origin}/rehber/${post.slug}`,
        },
      ],
    });
  }, [post, language]);

  const blogPostingSchemaJson = useMemo(() => {
    if (!post) return null;

    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: seoDescription,
      image: pageImage ? [pageImage] : undefined,
      datePublished: post.created_at,
      dateModified: post.created_at,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      author: {
        '@type': 'Organization',
        name: 'Varol Gayrimenkul',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Varol Gayrimenkul',
        logo: {
          '@type': 'ImageObject',
          url: `${window.location.origin}/logo_varol.png`,
        },
      },
      inLanguage: language === 'tr' ? 'tr-TR' : 'en-US',
      url: canonicalUrl,
      articleSection: language === 'tr' ? 'Gayrimenkul Rehberi' : 'Real Estate Guide',
      keywords: language === 'tr'
        ? ['gayrimenkul', 'rehber', 'denizli', 'yatırım', 'arsa', 'konut']
        : ['real estate', 'guide', 'denizli', 'investment', 'land', 'housing'],
    });
  }, [post, seoDescription, pageImage, canonicalUrl, language]);

  const articleSchemaJson = useMemo(() => {
    if (!post) return null;

    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: seoDescription,
      image: pageImage ? [pageImage] : undefined,
      datePublished: post.created_at,
      dateModified: post.created_at,
      author: {
        '@type': 'Organization',
        name: 'Varol Gayrimenkul',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Varol Gayrimenkul',
      },
      mainEntityOfPage: canonicalUrl,
    });
  }, [post, seoDescription, pageImage, canonicalUrl]);

  const itemListRelatedPropertiesSchemaJson = useMemo(() => {
    if (!relatedProperties.length || !post) return null;

    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: language === 'tr' ? 'İlgili Gayrimenkuller' : 'Related Properties',
      itemListElement: relatedProperties.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${window.location.origin}/properties/${item.id}`,
        name: item.title,
      })),
    });
  }, [relatedProperties, post, language]);

  const renderContentParagraphs = (content: string) => {
    const parts = content
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);

    return parts.map((paragraph, index) => (
      <p key={index} className="whitespace-pre-line text-base leading-8 text-gray-700">
        {paragraph}
      </p>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 h-12 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 h-6 w-1/3 animate-pulse rounded bg-gray-200" />
          <div className="mt-8 h-[360px] animate-pulse rounded-3xl bg-gray-200" />
          <div className="mt-8 space-y-4">
            <div className="h-6 animate-pulse rounded bg-gray-200" />
            <div className="h-6 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-5/6 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <>
        <Helmet>
          <html lang={language === 'tr' ? 'tr' : 'en'} />
          <title>
            {language === 'tr'
              ? 'Yazı Bulunamadı | Varol Gayrimenkul'
              : 'Article Not Found | Varol Gayrimenkul'}
          </title>
          <meta
            name="description"
            content={
              language === 'tr'
                ? 'Aradığınız rehber yazısı bulunamadı.'
                : 'The guide article you are looking for could not be found.'
            }
          />
          <meta name="robots" content="noindex, follow" />
        </Helmet>

        <div className="min-h-screen bg-gray-50 pt-28">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <BookOpen className="mx-auto h-16 w-16 text-gray-300" />
            <h1 className="mt-6 text-3xl font-bold text-gray-900">
              {language === 'tr' ? 'Yazı bulunamadı' : 'Article not found'}
            </h1>
            <p className="mt-3 text-gray-600">
              {language === 'tr'
                ? 'Aradığınız rehber yazısı mevcut değil veya yayından kaldırılmış olabilir.'
                : 'The guide article you are looking for may not exist or may have been removed.'}
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('guide')}
                className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700"
              >
                {language === 'tr' ? 'Rehbere Dön' : 'Back to Guide'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <html lang={language === 'tr' ? 'tr' : 'en'} />
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Varol Gayrimenkul" />
        <meta property="og:locale" content={language === 'tr' ? 'tr_TR' : 'en_US'} />
        <meta property="og:image" content={pageImage} />
        <meta property="article:published_time" content={post.created_at} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={pageImage} />
        <link rel="canonical" href={canonicalUrl} />
        {blogPostingSchemaJson ? (
          <script type="application/ld+json">{blogPostingSchemaJson}</script>
        ) : null}
        {articleSchemaJson ? (
          <script type="application/ld+json">{articleSchemaJson}</script>
        ) : null}
        {breadcrumbSchemaJson ? (
          <script type="application/ld+json">{breadcrumbSchemaJson}</script>
        ) : null}
        {itemListRelatedPropertiesSchemaJson ? (
          <script type="application/ld+json">{itemListRelatedPropertiesSchemaJson}</script>
        ) : null}
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-20 pb-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => onNavigate('guide')}
            className="mb-6 flex items-center text-gray-600 transition-colors hover:text-emerald-700"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {language === 'tr' ? 'Gayrimenkul Rehberine Dön' : 'Back to Real Estate Guide'}
          </button>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <article className="lg:col-span-8">
              <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="relative h-[260px] bg-gray-100 sm:h-[360px]">
                  <img
                    src={pageImage}
                    alt={`${post.title} - ${language === 'tr' ? 'Gayrimenkul Rehberi' : 'Real Estate Guide'}`}
                    className="h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-800 backdrop-blur-sm">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.created_at)}
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    <BookOpen className="h-4 w-4" />
                    {language === 'tr' ? 'Gayrimenkul Rehberi' : 'Real Estate Guide'}
                  </div>

                  <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
                    {post.title}
                  </h1>

                  <p className="mt-4 text-lg leading-8 text-gray-600">
                    {seoDescription}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={shareOnWhatsApp}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      <Share2 className="h-4 w-4" />
                      WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={copyGuideLink}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      <Copy className="h-4 w-4" />
                      {language === 'tr' ? 'Linki Kopyala' : 'Copy Link'}
                    </button>
                  </div>

                  <div className="mt-8 border-t border-gray-100 pt-8">
                    <div className="space-y-6">
                      {renderContentParagraphs(post.content)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {language === 'tr' ? 'İlgili İlanlar' : 'Related Properties'}
                  </h2>
                </div>

                {relatedPropertiesLoading ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-72 animate-pulse rounded-2xl bg-gray-200" />
                    ))}
                  </div>
                ) : relatedProperties.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {relatedProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        onClick={() => onNavigate('property-detail', property.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
                    {language === 'tr'
                      ? 'Bu yazı için ilgili ilan bulunamadı.'
                      : 'No related properties were found for this article.'}
                  </div>
                )}
              </div>
            </article>

            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900">
                    {language === 'tr' ? 'Yazı Bilgileri' : 'Article Details'}
                  </h2>

                  <div className="mt-4 space-y-4 text-sm text-gray-700">
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                      <span className="font-medium text-gray-500">
                        {language === 'tr' ? 'Kategori' : 'Category'}
                      </span>
                      <span>{language === 'tr' ? 'Gayrimenkul Rehberi' : 'Real Estate Guide'}</span>
                    </div>

                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                      <span className="font-medium text-gray-500">
                        {language === 'tr' ? 'Yayın Tarihi' : 'Publish Date'}
                      </span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium text-gray-500">
                        {language === 'tr' ? 'Yazar' : 'Author'}
                      </span>
                      <span>Varol Gayrimenkul</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900">
                    {language === 'tr' ? 'Diğer Yazılar' : 'Other Articles'}
                  </h2>

                  {recentLoading ? (
                    <div className="mt-4 space-y-4">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
                      ))}
                    </div>
                  ) : recentPosts.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      {recentPosts.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onNavigate('guide-detail', item.slug)}
                          className="w-full rounded-2xl border border-gray-100 p-4 text-left transition-colors hover:bg-gray-50"
                        >
                          <div className="text-sm text-emerald-700">
                            {formatDate(item.created_at)}
                          </div>
                          <div className="mt-1 line-clamp-2 font-semibold text-gray-900">
                            {item.title}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">
                      {language === 'tr'
                        ? 'Henüz başka rehber yazısı bulunmuyor.'
                        : 'There are no other guide articles yet.'}
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}