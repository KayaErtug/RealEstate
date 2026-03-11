// src/pages/AdminPage.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Mail,
  Car,
  CheckCircle,
  Users as UsersIcon,
  Building2,
  BarChart3,
  Clock3,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Property, Inquiry, Vehicle } from '../lib/database.types';
import PropertyForm from '../components/PropertyForm';
import VehicleForm from '../components/VehicleForm';

interface AdminPageProps {
  onNavigate: (page: string, propertyId?: string) => void;
}

type AdminTab = 'properties' | 'vehicles' | 'inquiries' | 'approvals' | 'users';

type DashboardStats = {
  totalProperties: number;
  totalVehicles: number;
  totalPropertyViews: number;
  totalVehicleViews: number;
  pendingPropertiesCount: number;
  pendingVehiclesCount: number;
  totalInquiries: number;
  latestProperties: Property[];
  mostViewedProperties: Property[];
};

type ProfileRole = 'super_admin' | 'user';

type ProfileRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  phone: string | null;
  role: ProfileRole;
  updated_at?: string;
};

type ProfilePatch = {
  display_name?: string | null;
  phone?: string | null;
  role?: ProfileRole;
};

const EMPTY_DASHBOARD: DashboardStats = {
  totalProperties: 0,
  totalVehicles: 0,
  totalPropertyViews: 0,
  totalVehicleViews: 0,
  pendingPropertiesCount: 0,
  pendingVehiclesCount: 0,
  totalInquiries: 0,
  latestProperties: [],
  mostViewedProperties: [],
};

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const { user, profile, isSuperAdmin, updateMyProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('properties');

  const [properties, setProperties] = useState<Property[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [pendingVehicles, setPendingVehicles] = useState<Vehicle[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(EMPTY_DASHBOARD);

  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formType, setFormType] = useState<'property' | 'vehicle'>('property');

  const [myDisplayName, setMyDisplayName] = useState('');
  const [myPhone, setMyPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      onNavigate('login');
      return;
    }

    void loadData();
    void loadDashboardStats();
  }, [user, activeTab, isSuperAdmin, onNavigate]);

  useEffect(() => {
    setMyDisplayName(profile?.display_name || '');
    setMyPhone(profile?.phone || '');
  }, [profile]);

  const loadDashboardStats = async () => {
    if (!user) return;

    setDashboardLoading(true);

    try {
      let propertyQuery = supabase.from('properties').select('*');
      let vehicleQuery = supabase.from('vehicles').select('*');

      if (!isSuperAdmin) {
        propertyQuery = propertyQuery.eq('user_id', user.id);
        vehicleQuery = vehicleQuery.eq('user_id', user.id);
      }

      const propertyRes = await propertyQuery.order('created_at', { ascending: false });
      const vehicleRes = await vehicleQuery.order('created_at', { ascending: false });

      if (propertyRes.error) throw propertyRes.error;
      if (vehicleRes.error) throw vehicleRes.error;

      const propertyRows = (propertyRes.data ?? []) as Property[];
      const vehicleRows = (vehicleRes.data ?? []) as Vehicle[];

      const totalPropertyViews = propertyRows.reduce(
        (sum, item) => sum + (typeof item.views === 'number' ? item.views : 0),
        0
      );

      const totalVehicleViews = vehicleRows.reduce(
        (sum, item) => sum + (typeof item.views === 'number' ? item.views : 0),
        0
      );

      let pendingPropertiesCount = 0;
      let pendingVehiclesCount = 0;
      let totalInquiries = 0;

      if (isSuperAdmin) {
        const [pendingPropertyRes, pendingVehicleRes, inquiryRes] = await Promise.all([
          supabase.from('properties').select('id').eq('moderation_status', 'pending'),
          supabase.from('vehicles').select('id').eq('moderation_status', 'pending'),
          supabase.from('inquiries').select('id'),
        ]);

        if (pendingPropertyRes.error) throw pendingPropertyRes.error;
        if (pendingVehicleRes.error) throw pendingVehicleRes.error;
        if (inquiryRes.error) throw inquiryRes.error;

        pendingPropertiesCount = pendingPropertyRes.data?.length || 0;
        pendingVehiclesCount = pendingVehicleRes.data?.length || 0;
        totalInquiries = inquiryRes.data?.length || 0;
      }

      setDashboardStats({
        totalProperties: propertyRows.length,
        totalVehicles: vehicleRows.length,
        totalPropertyViews,
        totalVehicleViews,
        pendingPropertiesCount,
        pendingVehiclesCount,
        totalInquiries,
        latestProperties: propertyRows.slice(0, 5),
        mostViewedProperties: [...propertyRows]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 5),
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setDashboardStats(EMPTY_DASHBOARD);
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);

    try {
      if (activeTab === 'properties') {
        let q = supabase.from('properties').select('*').order('created_at', { ascending: false });
        if (!isSuperAdmin) q = q.eq('user_id', user?.id || '');
        const { data, error } = await q;

        if (error) throw error;
        setProperties((data ?? []) as Property[]);
      } else if (activeTab === 'vehicles') {
        let q = supabase.from('vehicles').select('*').order('created_at', { ascending: false });
        if (!isSuperAdmin) q = q.eq('user_id', user?.id || '');
        const { data, error } = await q;

        if (error) throw error;
        setVehicles((data ?? []) as Vehicle[]);
      } else if (activeTab === 'inquiries') {
        if (!isSuperAdmin) {
          setInquiries([]);
          return;
        }

        const { data, error } = await supabase
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setInquiries((data ?? []) as Inquiry[]);
      } else if (activeTab === 'approvals') {
        if (!isSuperAdmin) return;

        const [pRes, vRes] = await Promise.all([
          supabase
            .from('properties')
            .select('*')
            .eq('moderation_status', 'pending')
            .order('created_at', { ascending: false }),
          supabase
            .from('vehicles')
            .select('*')
            .eq('moderation_status', 'pending')
            .order('created_at', { ascending: false }),
        ]);

        if (pRes.error) throw pRes.error;
        if (vRes.error) throw vRes.error;

        setPendingProperties((pRes.data ?? []) as Property[]);
        setPendingVehicles((vRes.data ?? []) as Vehicle[]);
      } else if (activeTab === 'users') {
        if (!isSuperAdmin) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('user_id,email,display_name,phone,role,updated_at')
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setProfiles((data ?? []) as ProfileRow[]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMyProfile = async () => {
    setSavingProfile(true);
    const { error } = await updateMyProfile({ display_name: myDisplayName, phone: myPhone });
    setSavingProfile(false);

    if (error) {
      alert(error.message);
    }
  };

  const approveProperty = async (id: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          moderation_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id || null,
        })
        .eq('id', id);

      if (error) throw error;
      await loadData();
      await loadDashboardStats();
    } catch (e) {
      console.error(e);
      alert('Onay sırasında hata oluştu.');
    }
  };

  const approveVehicle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          moderation_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id || null,
        })
        .eq('id', id);

      if (error) throw error;
      await loadData();
      await loadDashboardStats();
    } catch (e) {
      console.error(e);
      alert('Onay sırasında hata oluştu.');
    }
  };

  const updateUserProfile = async (row: ProfileRow, patch: ProfilePatch) => {
    try {
      const { error } = await supabase.from('profiles').update(patch).eq('user_id', row.user_id);

      if (error) throw error;
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Kullanıcı güncellenirken hata oluştu.');
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);

      if (error) throw error;
      await loadData();
      await loadDashboardStats();
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('İlan silinirken bir hata oluştu.');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Bu araç ilanını silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);

      if (error) throw error;
      await loadData();
      await loadDashboardStats();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Araç ilanı silinirken bir hata oluştu.');
    }
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setEditingVehicle(null);
    setFormType('property');
    setShowForm(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setEditingProperty(null);
    setFormType('vehicle');
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProperty(null);
    setEditingVehicle(null);
    void loadData();
    void loadDashboardStats();
  };

  const handleUpdateInquiryStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('inquiries').update({ status }).eq('id', id);

      if (error) throw error;
      await loadData();
      await loadDashboardStats();
    } catch (error) {
      console.error('Error updating inquiry:', error);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const statCards = useMemo(() => {
    const base = [
      {
        title: 'Toplam İlan',
        value: dashboardStats.totalProperties,
        icon: Building2,
        bg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
      },
      {
        title: 'Toplam Araç İlanı',
        value: dashboardStats.totalVehicles,
        icon: Car,
        bg: 'bg-sky-50',
        iconColor: 'text-sky-600',
      },
      {
        title: 'Toplam İlan Görüntülenme',
        value: dashboardStats.totalPropertyViews,
        icon: Eye,
        bg: 'bg-amber-50',
        iconColor: 'text-amber-600',
      },
      {
        title: 'Toplam Araç Görüntülenme',
        value: dashboardStats.totalVehicleViews,
        icon: TrendingUp,
        bg: 'bg-violet-50',
        iconColor: 'text-violet-600',
      },
    ];

    if (isSuperAdmin) {
      base.push(
        {
          title: 'Onay Bekleyen İlan',
          value: dashboardStats.pendingPropertiesCount,
          icon: CheckCircle,
          bg: 'bg-orange-50',
          iconColor: 'text-orange-600',
        },
        {
          title: 'Onay Bekleyen Araç',
          value: dashboardStats.pendingVehiclesCount,
          icon: Clock3,
          bg: 'bg-rose-50',
          iconColor: 'text-rose-600',
        },
        {
          title: 'Toplam Başvuru',
          value: dashboardStats.totalInquiries,
          icon: Mail,
          bg: 'bg-cyan-50',
          iconColor: 'text-cyan-600',
        }
      );
    }

    return base;
  }, [dashboardStats, isSuperAdmin]);

  if (!user) {
    return null;
  }

  if (showForm) {
    return formType === 'vehicle' ? (
      <VehicleForm vehicle={editingVehicle} onClose={handleFormClose} />
    ) : (
      <PropertyForm property={editingProperty} onClose={handleFormClose} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Gayrimenkul ilanlarınızı ve başvuruları yönetin</p>
        </div>

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-brand/10 p-3">
              <BarChart3 className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Genel İstatistikler</h2>
              <p className="text-sm text-gray-500">Paneldeki genel durum özeti</p>
            </div>
          </div>

          {dashboardLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-5 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">{card.title}</div>
                        <div className="mt-2 text-3xl font-bold text-gray-900">{card.value}</div>
                      </div>
                      <div className={`rounded-2xl p-3 ${card.bg}`}>
                        <Icon className={`h-6 w-6 ${card.iconColor}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!dashboardLoading && (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand" />
                  <h3 className="font-semibold text-gray-900">En Çok Görüntülenen İlanlar</h3>
                </div>

                {dashboardStats.mostViewedProperties.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardStats.mostViewedProperties.map((property, index) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between rounded-xl bg-white p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                              {index + 1}
                            </span>
                            <div className="truncate font-medium text-gray-900">
                              {property.title}
                            </div>
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {property.city}
                            {property.district ? `, ${property.district}` : ''}
                          </div>
                        </div>

                        <div className="ml-4 flex items-center gap-1 text-sm text-gray-700">
                          <Eye className="h-4 w-4 text-gray-400" />
                          {property.views || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Henüz görüntülenme verisi yok.</div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-brand" />
                  <h3 className="font-semibold text-gray-900">Son Eklenen İlanlar</h3>
                </div>

                {dashboardStats.latestProperties.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardStats.latestProperties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between rounded-xl bg-white p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-gray-900">{property.title}</div>
                          <div className="mt-1 text-sm text-gray-500">
                            {property.city}
                            {property.district ? `, ${property.district}` : ''}
                          </div>
                        </div>

                        <div className="ml-4 text-sm font-medium text-gray-700">
                          {formatPrice(property.price, property.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Henüz ilan eklenmedi.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white shadow-md">
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('properties')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'properties'
                    ? 'border-b-2 border-brand text-brand'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Gayrimenkul ({properties.length})
              </button>

              <button
                onClick={() => setActiveTab('vehicles')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'vehicles'
                    ? 'border-b-2 border-brand text-brand'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Araç ({vehicles.length})
              </button>

              {isSuperAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab('inquiries')}
                    className={`px-6 py-4 font-medium transition-colors ${
                      activeTab === 'inquiries'
                        ? 'border-b-2 border-brand text-brand'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Başvurular ({inquiries.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('approvals')}
                    className={`px-6 py-4 font-medium transition-colors ${
                      activeTab === 'approvals'
                        ? 'border-b-2 border-brand text-brand'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Onay
                  </button>

                  <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-4 font-medium transition-colors ${
                      activeTab === 'users'
                        ? 'border-b-2 border-brand text-brand'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Kullanıcılar
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-6">
            {!isSuperAdmin && (
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-gray-900">Profil Bilgileriniz</div>
                    <div className="text-sm text-gray-600">
                      İlanlarda ad/telefon bu bilgilerden alınabilir.
                    </div>
                  </div>

                  <div className="flex min-w-[280px] flex-1 gap-2">
                    <input
                      value={myDisplayName}
                      onChange={(e) => setMyDisplayName(e.target.value)}
                      placeholder="Ad Soyad"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                    />
                    <input
                      value={myPhone}
                      onChange={(e) => setMyPhone(e.target.value)}
                      placeholder="Telefon"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                    />
                    <button
                      onClick={saveMyProfile}
                      disabled={savingProfile}
                      className="rounded-lg bg-cta px-4 py-2 text-white hover:bg-cta-hover disabled:bg-gray-400"
                    >
                      {savingProfile ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'properties' && (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">İlanlar</h2>
                  <button
                    onClick={() => {
                      setFormType('property');
                      setEditingProperty(null);
                      setEditingVehicle(null);
                      setShowForm(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-cta px-4 py-2 text-white transition-colors hover:bg-cta-hover"
                  >
                    <Plus className="h-5 w-5" />
                    Yeni İlan
                  </button>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-gray-600">Yükleniyor...</div>
                ) : properties.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Başlık
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Fiyat
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Durum
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Görüntülenme
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            İşlemler
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200 bg-white">
                        {properties.map((property) => (
                          <tr key={property.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{property.title}</div>
                                <div className="text-sm text-gray-500">{property.city}</div>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-900">
                              {formatPrice(property.price, property.currency)}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  property.status === 'for_sale'
                                    ? 'bg-green-100 text-green-800'
                                    : property.status === 'for_rent'
                                      ? 'bg-brand/10 text-brand'
                                      : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {property.status === 'for_sale'
                                  ? 'Satılık'
                                  : property.status === 'for_rent'
                                    ? 'Kiralık'
                                    : property.status === 'sold'
                                      ? 'Satıldı'
                                      : 'Kiralandı'}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-900">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4 text-gray-400" />
                                {property.views}
                              </div>
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditProperty(property)}
                                  className="text-brand hover:text-brand-hover"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteProperty(property.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-gray-600">Henüz ilan bulunmamaktadır.</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'vehicles' && (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Araç İlanları</h2>
                  <button
                    onClick={() => {
                      setFormType('vehicle');
                      setEditingVehicle(null);
                      setEditingProperty(null);
                      setShowForm(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-cta px-4 py-2 text-white transition-colors hover:bg-cta-hover"
                  >
                    <Plus className="h-5 w-5" />
                    Yeni Araç İlanı
                  </button>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-gray-600">Yükleniyor...</div>
                ) : vehicles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Araç
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Fiyat
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Durum
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Görüntülenme
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            İşlemler
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200 bg-white">
                        {vehicles.map((v) => (
                          <tr key={v.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div>
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                  <Car className="h-4 w-4 text-gray-500" />
                                  {v.brand} {v.model} • {v.year}
                                </div>
                                <div className="text-sm text-gray-500">{v.city}</div>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-900">
                              {formatPrice(v.price, v.currency)}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  v.status === 'for_sale'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {v.status === 'for_sale' ? 'Satılık' : 'Satıldı'}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-900">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4 text-gray-400" />
                                {v.views}
                              </div>
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditVehicle(v)}
                                  className="text-brand hover:text-brand-hover"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteVehicle(v.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-600">Henüz araç ilanı bulunmuyor.</div>
                )}
              </>
            )}

            {activeTab === 'inquiries' && (
              <>
                <h2 className="mb-6 text-xl font-semibold text-gray-900">Başvurular</h2>

                {loading ? (
                  <div className="py-12 text-center text-gray-600">Yükleniyor...</div>
                ) : inquiries.length > 0 ? (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <div
                        key={inquiry.id}
                        className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{inquiry.name}</h3>
                            <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {inquiry.email}
                              </span>
                              {inquiry.phone && <span>{inquiry.phone}</span>}
                            </div>
                          </div>

                          <select
                            value={inquiry.status}
                            onChange={(e) => handleUpdateInquiryStatus(inquiry.id, e.target.value)}
                            className={`rounded-full border px-3 py-1 text-sm ${
                              inquiry.status === 'new'
                                ? 'border-gray-200 bg-gray-50 text-brand'
                                : inquiry.status === 'contacted'
                                  ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                                  : 'border-gray-200 bg-gray-50 text-gray-800'
                            }`}
                          >
                            <option value="new">Yeni</option>
                            <option value="contacted">İletişime Geçildi</option>
                            <option value="closed">Kapatıldı</option>
                          </select>
                        </div>

                        <p className="mb-2 text-gray-700">{inquiry.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(inquiry.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-gray-600">Henüz başvuru bulunmamaktadır.</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'approvals' && isSuperAdmin && (
              <>
                <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <CheckCircle className="h-5 w-5 text-brand" /> Onay Bekleyen İlanlar
                </h2>

                {loading ? (
                  <div className="py-12 text-center text-gray-600">Yükleniyor...</div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3 font-semibold text-gray-900">
                        Gayrimenkul ({pendingProperties.length})
                      </div>

                      {pendingProperties.length === 0 ? (
                        <div className="text-sm text-gray-600">Bekleyen gayrimenkul ilanı yok.</div>
                      ) : (
                        <div className="space-y-3">
                          {pendingProperties.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3"
                            >
                              <div className="min-w-0">
                                <div className="truncate font-medium text-gray-900">{p.title}</div>
                                <div className="truncate text-sm text-gray-600">
                                  {p.city}
                                  {p.district ? `, ${p.district}` : ''}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  {p.contact_name || ''}
                                  {p.contact_name && p.contact_phone ? ' • ' : ''}
                                  {p.contact_phone || ''}
                                </div>
                              </div>

                              <div className="flex shrink-0 gap-2">
                                <button
                                  onClick={() => approveProperty(p.id)}
                                  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                                >
                                  Onayla
                                </button>
                                <button
                                  onClick={() => onNavigate('property-detail', p.id)}
                                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                                >
                                  Gör
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3 font-semibold text-gray-900">
                        Araç ({pendingVehicles.length})
                      </div>

                      {pendingVehicles.length === 0 ? (
                        <div className="text-sm text-gray-600">Bekleyen araç ilanı yok.</div>
                      ) : (
                        <div className="space-y-3">
                          {pendingVehicles.map((v) => (
                            <div
                              key={v.id}
                              className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3"
                            >
                              <div className="min-w-0">
                                <div className="truncate font-medium text-gray-900">
                                  {v.brand} {v.model} • {v.year}
                                </div>
                                <div className="truncate text-sm text-gray-600">{v.title}</div>
                                <div className="mt-1 text-xs text-gray-500">
                                  {v.contact_name || ''}
                                  {v.contact_name && v.contact_phone ? ' • ' : ''}
                                  {v.contact_phone || ''}
                                </div>
                              </div>

                              <div className="flex shrink-0 gap-2">
                                <button
                                  onClick={() => approveVehicle(v.id)}
                                  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                                >
                                  Onayla
                                </button>
                                <button
                                  onClick={() => onNavigate('vehicle-detail', v.id)}
                                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                                >
                                  Gör
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'users' && isSuperAdmin && (
              <>
                <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <UsersIcon className="h-5 w-5 text-brand" /> Kullanıcılar
                </h2>

                {loading ? (
                  <div className="py-12 text-center text-gray-600">Yükleniyor...</div>
                ) : profiles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            E-posta
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            Ad Soyad
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            Telefon
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            Rol
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200 bg-white">
                        {profiles.map((p) => (
                          <tr key={p.user_id}>
                            <td className="px-4 py-3 text-sm text-gray-900">{p.email}</td>

                            <td className="px-4 py-3">
                              <input
                                defaultValue={p.display_name || ''}
                                onBlur={(e) =>
                                  updateUserProfile(p, { display_name: e.target.value || null })
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </td>

                            <td className="px-4 py-3">
                              <input
                                defaultValue={p.phone || ''}
                                onBlur={(e) =>
                                  updateUserProfile(p, { phone: e.target.value || null })
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </td>

                            <td className="px-4 py-3">
                              <select
                                defaultValue={p.role || 'user'}
                                onChange={(e) =>
                                  updateUserProfile(p, {
                                    role: e.target.value as ProfileRole,
                                  })
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              >
                                <option value="user">User</option>
                                <option value="super_admin">Super Admin</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-3 text-xs text-gray-500">
                      Not: Kullanıcı ekleme işlemi Supabase panelinden{' '}
                      <span className="font-medium">Invite user</span> ile yapılmalıdır.
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-600">Kullanıcı bulunamadı.</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}