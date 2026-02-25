import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye, Mail, Car } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Property, Inquiry, Vehicle } from '../lib/database.types';
import PropertyForm from '../components/PropertyForm';
import VehicleForm from '../components/VehicleForm';

interface AdminPageProps {
  onNavigate: (page: string) => void;
}

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'properties' | 'vehicles' | 'inquiries'>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formType, setFormType] = useState<'property' | 'vehicle'>('property');

  useEffect(() => {
    if (!user) {
      onNavigate('login');
      return;
    }
    loadData();
  }, [user, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'properties') {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProperties(data || []);
      } else if (activeTab === 'vehicles') {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setVehicles(data || []);
      } else {
        const { data, error } = await supabase
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setInquiries(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
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
      loadData();
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
    loadData();
  };

  const handleUpdateInquiryStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error updating inquiry:', error);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Gayrimenkul ilanlarınızı ve başvuruları yönetin</p>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <div className="flex">
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
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'properties' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">İlanlar</h2>
                  <button
                    onClick={() => {
                      setFormType('property');
                      setEditingProperty(null);
                      setEditingVehicle(null);
                      setShowForm(true);
                    }}
                    className="bg-cta text-white px-4 py-2 rounded-lg hover:bg-cta-hover transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Yeni İlan
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-600">Yükleniyor...</div>
                ) : properties.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Başlık
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fiyat
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durum
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Görüntülenme
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
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
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                property.status === 'for_sale' ? 'bg-green-100 text-green-800' :
                                property.status === 'for_rent' ? 'bg-brand/10 text-brand' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {property.status === 'for_sale' ? 'Satılık' :
                                 property.status === 'for_rent' ? 'Kiralık' :
                                 property.status === 'sold' ? 'Satıldı' : 'Kiralandı'}
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
                  <div className="text-center py-12">
                    <p className="text-gray-600">Henüz ilan bulunmamaktadır.</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'vehicles' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Araç İlanları</h2>
                  <button
                    onClick={() => {
                      setFormType('vehicle');
                      setEditingVehicle(null);
                      setEditingProperty(null);
                      setShowForm(true);
                    }}
                    className="bg-cta text-white px-4 py-2 rounded-lg hover:bg-cta-hover transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Yeni Araç İlanı
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-600">Yükleniyor...</div>
                ) : vehicles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Araç
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fiyat
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durum
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Görüntülenme
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vehicles.map((v) => (
                          <tr key={v.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div>
                                <div className="font-medium text-gray-900 flex items-center gap-2">
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
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                  <div className="text-center py-12 text-gray-600">Henüz araç ilanı bulunmuyor.</div>
                )}
              </>
            )}

            {activeTab === 'inquiries' && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Başvurular</h2>

                {loading ? (
                  <div className="text-center py-12 text-gray-600">Yükleniyor...</div>
                ) : inquiries.length > 0 ? (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <div key={inquiry.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{inquiry.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
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
                            className={`px-3 py-1 text-sm rounded-full border ${
                              inquiry.status === 'new' ? 'bg-gray-50 border-gray-200 text-brand' :
                              inquiry.status === 'contacted' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                              'bg-gray-50 border-gray-200 text-gray-800'
                            }`}
                          >
                            <option value="new">Yeni</option>
                            <option value="contacted">İletişime Geçildi</option>
                            <option value="closed">Kapatıldı</option>
                          </select>
                        </div>
                        <p className="text-gray-700 mb-2">{inquiry.message}</p>
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
                  <div className="text-center py-12">
                    <p className="text-gray-600">Henüz başvuru bulunmamaktadır.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}