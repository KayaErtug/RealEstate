import { useEffect, useState } from 'react';
import { Search, Building2, Users, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Property } from '../lib/database.types';
import PropertyCard from '../components/PropertyCard';
import { useLanguage } from '../contexts/LanguageContext';

interface HomePageProps {
  onNavigate: (page: string, propertyId?: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { t } = useLanguage();
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFeaturedProperties();
  }, []);

  const loadFeaturedProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('featured', true)
        .in('status', ['for_sale', 'for_rent'])
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setFeaturedProperties(data || []);
    } catch (error) {
      console.error('Error loading featured properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    onNavigate('properties');
  };

  return (
    <div className="min-h-screen">
      <div
        className="relative bg-cover bg-center h-96"
        style={{
          backgroundImage:
            'url(https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1600)',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">{t('home.heroTitle')}</h1>
          <p className="text-xl mb-8 text-center">{t('home.heroSubtitle')}</p>

          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('home.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent text-gray-900"
              />
              <button
                onClick={handleSearch}
                className="bg-cta text-white px-6 py-3 rounded-lg hover:bg-cta-hover transition-colors flex items-center gap-2"
              >
                <Search className="h-5 w-5" />
                <span className="hidden sm:inline">{t('home.search')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-brand/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('home.feature1.title')}</h3>
            <p className="text-gray-600">{t('home.feature1.desc')}</p>
          </div>

          <div className="text-center">
            <div className="bg-brand/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('home.feature2.title')}</h3>
            <p className="text-gray-600">{t('home.feature2.desc')}</p>
          </div>

          <div className="text-center">
            <div className="bg-brand/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('home.feature3.title')}</h3>
            <p className="text-gray-600">{t('home.feature3.desc')}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">{t('home.featuredTitle')}</h2>
            <button onClick={() => onNavigate('properties')} className="text-brand hover:text-brand-hover font-medium">
              {t('home.viewAll')}
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse" />
              ))}
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} onClick={() => onNavigate('property-detail', property.id)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('home.noFeatured')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.ctaTitle')}</h2>
          <p className="text-gray-600 mb-8">{t('home.ctaSubtitle')}</p>
          <button
            onClick={() => onNavigate('properties')}
            className="bg-cta text-white px-8 py-3 rounded-lg hover:bg-cta-hover transition-colors text-lg font-medium"
          >
            {t('home.ctaButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
