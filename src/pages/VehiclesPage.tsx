import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Vehicle } from '../lib/database.types';
import VehicleCard from '../components/VehicleCard';

interface VehiclesPageProps {
  onNavigate: (page: string, vehicleId?: string) => void;
}

export default function VehiclesPage({ onNavigate }: VehiclesPageProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    brand: '',
    model: '',
    fuel: 'all',
    transmission: 'all',
    minYear: '',
    maxYear: '',
    minKm: '',
    maxKm: '',
    minPrice: '',
    maxPrice: '',
    city: '',
  });

  useEffect(() => {
    loadVehicles();
  }, [filters]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
        );
      }

      if (filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters.brand) query = query.ilike('brand', `%${filters.brand}%`);
      if (filters.model) query = query.ilike('model', `%${filters.model}%`);
      if (filters.city) query = query.ilike('city', `%${filters.city}%`);
      if (filters.fuel !== 'all') query = query.eq('fuel', filters.fuel);
      if (filters.transmission !== 'all') query = query.eq('transmission', filters.transmission);

      if (filters.minYear) query = query.gte('year', parseInt(filters.minYear));
      if (filters.maxYear) query = query.lte('year', parseInt(filters.maxYear));
      if (filters.minKm) query = query.gte('km', parseInt(filters.minKm));
      if (filters.maxKm) query = query.lte('km', parseInt(filters.maxKm));
      if (filters.minPrice) query = query.gte('price', parseFloat(filters.minPrice));
      if (filters.maxPrice) query = query.lte('price', parseFloat(filters.maxPrice));

      const { data, error } = await query;
      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      brand: '',
      model: '',
      fuel: 'all',
      transmission: 'all',
      minYear: '',
      maxYear: '',
      minKm: '',
      maxKm: '',
      minPrice: '',
      maxPrice: '',
      city: '',
    });
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => key !== 'search' && value !== '' && value !== 'all'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Araç İlanları</h1>

          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Marka, model, şehir veya ilan ara..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-cta text-white border-brand'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span className="hidden sm:inline">Filtrele</span>
              {hasActiveFilters && (
                <span className="bg-white text-brand rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">!</span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filtreler</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-brand hover:text-brand-hover flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Filtreleri Temizle
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  >
                    <option value="all">Tümü</option>
                    <option value="for_sale">Satılık</option>
                    <option value="sold">Satıldı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marka</label>
                  <input
                    type="text"
                    placeholder="Örn: BMW"
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    placeholder="Örn: 3 Serisi"
                    value={filters.model}
                    onChange={(e) => handleFilterChange('model', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                  <input
                    type="text"
                    placeholder="Şehir"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yakıt</label>
                  <select
                    value={filters.fuel}
                    onChange={(e) => handleFilterChange('fuel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  >
                    <option value="all">Tümü</option>
                    <option value="gasoline">Benzin</option>
                    <option value="diesel">Dizel</option>
                    <option value="hybrid">Hibrit</option>
                    <option value="electric">Elektrik</option>
                    <option value="lpg">LPG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vites</label>
                  <select
                    value={filters.transmission}
                    onChange={(e) => handleFilterChange('transmission', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  >
                    <option value="all">Tümü</option>
                    <option value="automatic">Otomatik</option>
                    <option value="manual">Manuel</option>
                    <option value="semi_automatic">Yarı Otomatik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Yıl</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minYear}
                    onChange={(e) => handleFilterChange('minYear', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Yıl</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxYear}
                    onChange={(e) => handleFilterChange('maxYear', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min KM</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minKm}
                    onChange={(e) => handleFilterChange('minKm', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max KM</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxKm}
                    onChange={(e) => handleFilterChange('maxKm', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Fiyat</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Fiyat</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-600">Yükleniyor...</div>
        ) : vehicles.length > 0 ? (
          <>
            <div className="mb-6 text-gray-600">
              Toplam <span className="font-semibold">{vehicles.length}</span> araç ilanı bulundu
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onClick={() => onNavigate('vehicle-detail', vehicle.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Araç ilanı bulunamadı</h3>
            <p className="text-gray-600">Filtreleri değiştirerek tekrar deneyin</p>
          </div>
        )}
      </div>
    </div>
  );
}
