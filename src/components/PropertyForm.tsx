// src/components/PropertyForm.tsx
import { useState, useEffect, useMemo } from 'react';
import { X, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { Property } from '../lib/database.types';
import LocationPickerMap from './LocationPickerMap';

interface PropertyFormProps {
  property: Property | null;
  onClose: () => void;
}

type LocalizedLabel = {
  tr: string;
  en: string;
};

type SelectOption = {
  value: string;
  label: LocalizedLabel;
};

type FormState = {
  title: string;
  description: string;
  property_type: string;
  status: string;
  price: string;
  currency: string;
  location: string;
  city: string;
  district: string;
  area: string;
  net_area: string;
  gross_area: string;
  rooms: string;
  bathrooms: string;
  floor: string;
  total_floors: string;
  building_age: string;
  heating: string;
  dues: string;
  frontage: string;
  deed_status: string;
  usage_status: string;
  in_site: boolean;
  site_name: string;
  balcony_count: string;
  pool: boolean;
  security: boolean;
  furnished: boolean;
  parking: boolean;
  elevator: boolean;
  balcony: boolean;
  garden: boolean;
  images: string;
  featured: boolean;
  contact_name: string;
  contact_phone: string;
  latitude: string;
  longitude: string;
};

type QualityLevel = 'high' | 'medium' | 'low';

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  property_type: 'apartment',
  status: 'for_sale',
  price: '',
  currency: 'TRY',
  location: '',
  city: '',
  district: '',
  area: '',
  net_area: '',
  gross_area: '',
  rooms: '',
  bathrooms: '',
  floor: '',
  total_floors: '',
  building_age: '',
  heating: '',
  dues: '',
  frontage: '',
  deed_status: '',
  usage_status: '',
  in_site: false,
  site_name: '',
  balcony_count: '',
  pool: false,
  security: false,
  furnished: false,
  parking: false,
  elevator: false,
  balcony: false,
  garden: false,
  images: '',
  featured: false,
  contact_name: '',
  contact_phone: '',
  latitude: '',
  longitude: '',
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export default function PropertyForm({ property, onClose }: PropertyFormProps) {
  const { user, profile, isSuperAdmin } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);

  const text = useMemo(() => {
    const tr = language === 'tr';

    return {
      pageTitleNew: tr ? 'Yeni İlan Oluştur' : 'Create New Listing',
      pageTitleEdit: tr ? 'İlanı Düzenle' : 'Edit Listing',

      title: tr ? 'Başlık *' : 'Title *',
      description: tr ? 'Açıklama *' : 'Description *',
      contactName: tr ? 'İlan Veren (Ad Soyad)' : 'Contact Person (Full Name)',
      contactPhone: tr ? 'İlan Veren Telefon' : 'Contact Phone',
      propertyType: tr ? 'Emlak Tipi *' : 'Property Type *',
      status: tr ? 'Durum *' : 'Status *',
      price: tr ? 'Fiyat *' : 'Price *',
      currency: tr ? 'Para Birimi *' : 'Currency *',
      city: tr ? 'Şehir *' : 'City *',
      district: tr ? 'İlçe' : 'District',
      address: tr ? 'Adres *' : 'Address *',
      area: tr ? 'Alan (m²) *' : 'Area (m²) *',
      netArea: tr ? 'Net Alan (m²)' : 'Net Area (m²)',
      grossArea: tr ? 'Brüt Alan (m²)' : 'Gross Area (m²)',
      roomCount: tr ? 'Oda Sayısı' : 'Room Count',
      facilityRoomCount: tr ? 'Oda Sayısı (Tesis)' : 'Room Count (Facility)',
      bathroomCount: tr ? 'Banyo Sayısı' : 'Bathroom Count',
      floor: tr ? 'Bulunduğu Kat' : 'Floor',
      totalFloors: tr ? 'Binadaki Kat Sayısı' : 'Total Floors',
      buildingAge: tr ? 'Bina Yaşı' : 'Building Age',
      heating: tr ? 'Isıtma' : 'Heating',
      dues: tr ? 'Aidat (₺)' : 'Dues (₺)',
      frontage: tr ? 'Cephe' : 'Frontage',
      deedStatus: tr ? 'Tapu Durumu' : 'Title Deed Status',
      usageStatus: tr ? 'Kullanım Durumu' : 'Usage Status',
      locationInfo: tr ? 'Konum Bilgisi' : 'Location Information',
      latitude: tr ? 'Latitude' : 'Latitude',
      longitude: tr ? 'Longitude' : 'Longitude',
      imageUrls: tr
        ? "Resim URL'leri (Her satıra bir URL)"
        : 'Image URLs (One URL per line)',
      features: tr ? 'Özellikler' : 'Features',
      siteName: tr ? 'Site Adı' : 'Site Name',
      balconyCount: tr ? 'Balkon Adedi' : 'Balcony Count',

      cancel: tr ? 'İptal' : 'Cancel',
      update: tr ? 'Güncelle' : 'Update',
      create: tr ? 'Oluştur' : 'Create',
      saving: tr ? 'Kaydediliyor...' : 'Saving...',

      select: tr ? 'Seçiniz' : 'Select',
      qualityTitle: tr ? 'Form Kalite Durumu' : 'Form Quality Status',
      qualityReady: tr ? 'Yayına hazır görünüyor' : 'Looks ready to publish',
      qualityMissing: tr ? 'Eksik / zayıf alanlar var' : 'There are missing / weak fields',
      qualityScoreTitle: tr ? 'İlan Kalite Skoru' : 'Listing Quality Score',
      qualityExcellent: tr ? 'Çok güçlü ilan kalitesi' : 'Very strong listing quality',
      qualityGood: tr ? 'İlan kalitesi iyi' : 'Listing quality is good',
      qualityWeak: tr ? 'İlan kalitesi geliştirilmeli' : 'Listing quality should be improved',
      qualityBlockSave: tr
        ? 'İlan kalitesi çok düşük. Kaydetmeden önce temel alanları iyileştirin.'
        : 'Listing quality is too low. Improve the basic fields before saving.',
      mapHelp: tr
        ? 'Haritada uygun noktaya tıklayarak ilan konumunu seçebilirsin. İstersen latitude ve longitude alanlarını elle de doldurabilirsin.'
        : 'You can choose the listing location by clicking on the map. You can also enter latitude and longitude manually.',
      imagePlaceholder:
        'https://example.com/image1.jpg\nhttps://example.com/image2.jpg',
      contactNamePlaceholder: tr ? 'Ad Soyad' : 'Full Name',
      contactPhonePlaceholder: tr ? '05xx xxx xx xx' : '+90 5xx xxx xx xx',
      latitudePlaceholder: tr ? '37.7765' : '37.7765',
      longitudePlaceholder: tr ? '29.0864' : '29.0864',

      qualityWarnings: {
        title: tr ? 'Başlık eksik.' : 'Title is missing.',
        description: tr ? 'Açıklama eksik.' : 'Description is missing.',
        city: tr ? 'Şehir eksik.' : 'City is missing.',
        location: tr ? 'Adres / konum eksik.' : 'Address / location is missing.',
        price: tr ? 'Fiyat geçersiz.' : 'Price is invalid.',
        area: tr ? 'Alan bilgisi eksik.' : 'Area information is missing.',
        images: tr ? 'En az 1 görsel önerilir.' : 'At least 1 image is recommended.',
        coordinates: tr
          ? 'Koordinat girilmesi önerilir.'
          : 'Coordinates are recommended.',
        titleShort: tr ? 'Başlık çok kısa.' : 'Title is too short.',
        titleCaps: tr
          ? 'Başlık tamamen büyük harf olmamalı.'
          : 'Title should not be all caps.',
        titleWeak: tr
          ? 'Başlıkta şehir / ilçe / tip gibi ayırt edici bilgi eksik olabilir.'
          : 'Title may be missing distinctive information such as city / district / type.',
        descriptionShort: tr
          ? 'Açıklama çok kısa. Daha detaylı bilgi girin.'
          : 'Description is too short. Add more detail.',
        descriptionWeak: tr
          ? 'Açıklama detay açısından zayıf görünüyor.'
          : 'Description looks weak in detail.',
        imageWeak: tr
          ? '3+ görsel daha profesyonel görünüm sağlar.'
          : '3+ images provide a more professional presentation.',
        imageStrong: tr
          ? '5+ görsel tavsiye edilir.'
          : '5+ images are recommended.',
        coordinatesInvalid: tr
          ? 'Koordinatlar sayısal ve geçerli aralıkta olmalı.'
          : 'Coordinates must be numeric and within valid ranges.',
        netAreaInvalid: tr
          ? 'Net alan, toplam alandan büyük olmamalı.'
          : 'Net area should not be greater than total area.',
        grossAreaInvalid: tr
          ? 'Brüt alan, toplam alandan mantıksız şekilde küçük olmamalı.'
          : 'Gross area should not be unrealistically smaller than total area.',
        roomMissing: tr
          ? 'Bu emlak tipinde oda sayısı girilmesi önerilir.'
          : 'Room count is recommended for this property type.',
        bathroomMissing: tr
          ? 'Bu emlak tipinde banyo sayısı girilmesi önerilir.'
          : 'Bathroom count is recommended for this property type.',
        floorInvalid: tr
          ? 'Bulunduğu kat, toplam kat sayısından büyük olamaz.'
          : 'Floor cannot be greater than total floors.',
        siteNameMissing: tr
          ? 'Site içinde seçildiyse site adı girilmesi önerilir.'
          : 'If inside a complex, site name is recommended.',
        balconyCountMissing: tr
          ? 'Balkon seçildiyse balkon adedi girilmesi önerilir.'
          : 'If balcony is selected, balcony count is recommended.',
        contactMissing: tr
          ? 'İletişim bilgisi eklemek dönüşümü artırır.'
          : 'Adding contact details improves conversion.',
        districtMissing: tr
          ? 'İlçe bilgisi eklenmesi önerilir.'
          : 'District information is recommended.',
      },

      saveError: tr
        ? 'İlan kaydedilirken bir hata oluştu.'
        : 'An error occurred while saving the listing.',
      requiredValidation: tr
        ? 'Lütfen zorunlu alanları eksiksiz doldurun.'
        : 'Please fill in all required fields.',
      numericValidation: tr
        ? 'Lütfen sayısal alanları mantıklı değerlerle doldurun.'
        : 'Please fill numeric fields with reasonable values.',
      titlePlaceholder: tr
        ? 'Örn: Denizli Pamukkale Satılık 3+1 Geniş Daire'
        : 'Example: Spacious 3+1 Apartment for Sale in Denizli Pamukkale',
      descriptionPlaceholder: tr
        ? 'İlanın konumu, ulaşım avantajı, cephe bilgisi, iç özellikleri, yatırım potansiyeli gibi detayları yazın.'
        : 'Write details such as location, transportation advantages, frontage, interior features, and investment potential.',
    };
  }, [language]);

  const labelOf = (label: LocalizedLabel) => (language === 'tr' ? label.tr : label.en);

  const PROPERTY_TYPES: SelectOption[] = [
    { value: 'apartment', label: { tr: 'Daire', en: 'Apartment' } },
    { value: 'residence', label: { tr: 'Rezidans', en: 'Residence' } },
    { value: 'duplex', label: { tr: 'Dubleks', en: 'Duplex' } },
    { value: 'penthouse', label: { tr: 'Çatı Dubleksi / Penthouse', en: 'Penthouse' } },
    { value: 'villa', label: { tr: 'Villa', en: 'Villa' } },
    { value: 'detached_house', label: { tr: 'Müstakil Ev', en: 'Detached House' } },
    { value: 'bungalow', label: { tr: 'Bungalov', en: 'Bungalow' } },
    { value: 'mansion', label: { tr: 'Köşk / Konak', en: 'Mansion / Manor' } },
    { value: 'land', label: { tr: 'Arsa', en: 'Land' } },
    { value: 'field', label: { tr: 'Tarla', en: 'Field' } },
    { value: 'farm', label: { tr: 'Çiftlik', en: 'Farm' } },
    { value: 'commercial', label: { tr: 'Ticari', en: 'Commercial' } },
    { value: 'shop', label: { tr: 'Dükkan / Mağaza', en: 'Shop / Store' } },
    { value: 'office', label: { tr: 'Ofis', en: 'Office' } },
    { value: 'plaza', label: { tr: 'Plaza / İş Merkezi', en: 'Plaza / Business Center' } },
    { value: 'warehouse', label: { tr: 'Depo / Antrepo', en: 'Warehouse / Storage' } },
    {
      value: 'factory',
      label: { tr: 'Fabrika / Üretim Tesisi', en: 'Factory / Production Facility' },
    },
    { value: 'building', label: { tr: 'Bina', en: 'Building' } },
    { value: 'hotel', label: { tr: 'Otel', en: 'Hotel' } },
    { value: 'hostel', label: { tr: 'Pansiyon / Hostel', en: 'Hostel / Pension' } },
    { value: 'touristic_facility', label: { tr: 'Turistik Tesis', en: 'Touristic Facility' } },
    { value: 'gas_station', label: { tr: 'Akaryakıt İstasyonu', en: 'Gas Station' } },
    { value: 'restaurant', label: { tr: 'Restoran', en: 'Restaurant' } },
    { value: 'cafe', label: { tr: 'Kafe', en: 'Cafe' } },
    { value: 'clinic', label: { tr: 'Muayenehane / Klinik', en: 'Clinic / Medical Office' } },
    { value: 'hospital', label: { tr: 'Hastane', en: 'Hospital' } },
    { value: 'school', label: { tr: 'Okul / Eğitim Kurumu', en: 'School / Educational Institution' } },
    { value: 'dormitory', label: { tr: 'Yurt', en: 'Dormitory' } },
    { value: 'parking_lot', label: { tr: 'Otopark', en: 'Parking Lot' } },
  ];

  const STATUS_OPTIONS: SelectOption[] = [
    { value: 'for_sale', label: { tr: 'Satılık', en: 'For Sale' } },
    { value: 'for_rent', label: { tr: 'Kiralık', en: 'For Rent' } },
    { value: 'sold', label: { tr: 'Satıldı', en: 'Sold' } },
    { value: 'rented', label: { tr: 'Kiralandı', en: 'Rented' } },
  ];

  const CURRENCY_OPTIONS: SelectOption[] = [
    { value: 'TRY', label: { tr: 'TRY', en: 'TRY' } },
    { value: 'USD', label: { tr: 'USD', en: 'USD' } },
    { value: 'EUR', label: { tr: 'EUR', en: 'EUR' } },
  ];

  const HEATING_OPTIONS: SelectOption[] = [
    {
      value: 'natural_gas',
      label: { tr: 'Doğalgaz (Kombi)', en: 'Natural Gas (Combi Boiler)' },
    },
    { value: 'central', label: { tr: 'Merkezi', en: 'Central Heating' } },
    { value: 'floor_heating', label: { tr: 'Yerden Isıtma', en: 'Floor Heating' } },
    { value: 'air_conditioner', label: { tr: 'Klima', en: 'Air Conditioner' } },
    { value: 'stove', label: { tr: 'Soba', en: 'Stove' } },
    { value: 'none', label: { tr: 'Yok', en: 'None' } },
  ];

  const FRONTAGE_OPTIONS: SelectOption[] = [
    { value: 'north', label: { tr: 'Kuzey', en: 'North' } },
    { value: 'south', label: { tr: 'Güney', en: 'South' } },
    { value: 'east', label: { tr: 'Doğu', en: 'East' } },
    { value: 'west', label: { tr: 'Batı', en: 'West' } },
    { value: 'north_south', label: { tr: 'Kuzey-Güney', en: 'North-South' } },
    { value: 'east_west', label: { tr: 'Doğu-Batı', en: 'East-West' } },
  ];

  const DEED_STATUS_OPTIONS: SelectOption[] = [
    { value: 'condominium', label: { tr: 'Kat Mülkiyeti', en: 'Condominium Title' } },
    { value: 'easement', label: { tr: 'Kat İrtifakı', en: 'Construction Servitude' } },
    { value: 'shared', label: { tr: 'Hisseli Tapu', en: 'Shared Title Deed' } },
    { value: 'land', label: { tr: 'Arsa Tapulu', en: 'Land Title Deed' } },
  ];

  const USAGE_STATUS_OPTIONS: SelectOption[] = [
    { value: 'empty', label: { tr: 'Boş', en: 'Vacant' } },
    { value: 'tenant', label: { tr: 'Kiracılı', en: 'With Tenant' } },
    { value: 'owner', label: { tr: 'Mülk Sahibi Oturuyor', en: 'Owner Occupied' } },
  ];

  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title,
        description: property.description,
        property_type: property.property_type,
        status: property.status,
        price: property.price.toString(),
        currency: property.currency,
        location: property.location,
        city: property.city,
        district: property.district || '',
        area: property.area.toString(),
        net_area: property.net_area?.toString() || '',
        gross_area: property.gross_area?.toString() || '',
        rooms: property.rooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        floor: property.floor?.toString() || '',
        total_floors: property.total_floors?.toString() || '',
        building_age: property.building_age?.toString() || '',
        heating: property.heating || '',
        dues: property.dues?.toString() || '',
        frontage: property.frontage || '',
        deed_status: property.deed_status || '',
        usage_status: property.usage_status || '',
        in_site: property.in_site,
        site_name: property.site_name || '',
        balcony_count: property.balcony_count?.toString() || '',
        pool: property.pool,
        security: property.security,
        furnished: property.furnished,
        parking: property.parking,
        elevator: property.elevator,
        balcony: property.balcony,
        garden: property.garden,
        images: property.images.join('\n'),
        featured: property.featured,
        contact_name: property.contact_name || '',
        contact_phone: property.contact_phone || '',
        latitude: ((property as any).latitude ?? '').toString(),
        longitude: ((property as any).longitude ?? '').toString(),
      });
    } else {
      setFormData({
        ...EMPTY_FORM,
        contact_name: profile?.display_name || '',
        contact_phone: profile?.phone || '',
      });
    }
  }, [property, profile]);

  const isLandLike = ['land', 'field', 'farm'].includes(formData.property_type);
  const isHospitality = ['hotel', 'hostel', 'touristic_facility'].includes(
    formData.property_type
  );
  const isResidentialLike = [
    'apartment',
    'residence',
    'duplex',
    'penthouse',
    'villa',
    'detached_house',
    'bungalow',
    'mansion',
  ].includes(formData.property_type);

  const parsedLatitude =
    formData.latitude.trim() !== '' && !Number.isNaN(Number(formData.latitude))
      ? Number(formData.latitude)
      : null;

  const parsedLongitude =
    formData.longitude.trim() !== '' && !Number.isNaN(Number(formData.longitude))
      ? Number(formData.longitude)
      : null;

  const normalizedTitle = formData.title.trim();
  const normalizedDescription = formData.description.trim();
  const normalizedLocation = formData.location.trim();
  const normalizedCity = formData.city.trim();
  const normalizedDistrict = formData.district.trim();
  const normalizedSiteName = formData.site_name.trim();
  const normalizedContactName = formData.contact_name.trim();
  const normalizedContactPhone = formData.contact_phone.trim();

  const imageUrls = useMemo(() => {
    return formData.images
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean);
  }, [formData.images]);

  const imageCount = imageUrls.length;

  const numericValues = useMemo(() => {
    const price = formData.price.trim() !== '' ? Number(formData.price) : null;
    const area = formData.area.trim() !== '' ? Number(formData.area) : null;
    const netArea = formData.net_area.trim() !== '' ? Number(formData.net_area) : null;
    const grossArea = formData.gross_area.trim() !== '' ? Number(formData.gross_area) : null;
    const rooms = formData.rooms.trim() !== '' ? Number(formData.rooms) : null;
    const bathrooms = formData.bathrooms.trim() !== '' ? Number(formData.bathrooms) : null;
    const floor = formData.floor.trim() !== '' ? Number(formData.floor) : null;
    const totalFloors =
      formData.total_floors.trim() !== '' ? Number(formData.total_floors) : null;
    const buildingAge =
      formData.building_age.trim() !== '' ? Number(formData.building_age) : null;
    const dues = formData.dues.trim() !== '' ? Number(formData.dues) : null;
    const balconyCount =
      formData.balcony_count.trim() !== '' ? Number(formData.balcony_count) : null;

    return {
      price,
      area,
      netArea,
      grossArea,
      rooms,
      bathrooms,
      floor,
      totalFloors,
      buildingAge,
      dues,
      balconyCount,
    };
  }, [
    formData.price,
    formData.area,
    formData.net_area,
    formData.gross_area,
    formData.rooms,
    formData.bathrooms,
    formData.floor,
    formData.total_floors,
    formData.building_age,
    formData.dues,
    formData.balcony_count,
  ]);

  const qualityWarnings = useMemo(() => {
    const warnings: string[] = [];

    if (!normalizedTitle) warnings.push(text.qualityWarnings.title);
    if (!normalizedDescription) warnings.push(text.qualityWarnings.description);
    if (!normalizedCity) warnings.push(text.qualityWarnings.city);
    if (!normalizedLocation) warnings.push(text.qualityWarnings.location);
    if (!formData.price.trim() || (numericValues.price !== null && numericValues.price <= 0)) {
      warnings.push(text.qualityWarnings.price);
    }
    if (!formData.area.trim() || (numericValues.area !== null && numericValues.area <= 0)) {
      warnings.push(text.qualityWarnings.area);
    }

    if (normalizedTitle && normalizedTitle.length < 10) {
      warnings.push(text.qualityWarnings.titleShort);
    }

    if (
      normalizedTitle &&
      normalizedTitle.length >= 6 &&
      normalizedTitle === normalizedTitle.toUpperCase()
    ) {
      warnings.push(text.qualityWarnings.titleCaps);
    }

    if (
      normalizedTitle &&
      !/denizli|pamukkale|merkezefendi|arsa|daire|villa|ofis|dükkan|dukkan|tarla|satılık|satilik|kiralık|kiralik/i.test(
        normalizedTitle
      )
    ) {
      warnings.push(text.qualityWarnings.titleWeak);
    }

    if (normalizedDescription && normalizedDescription.length < 50) {
      warnings.push(text.qualityWarnings.descriptionShort);
    }

    if (
      normalizedDescription &&
      normalizedDescription.length >= 50 &&
      !/ulaşım|ulasim|merkezi|yatırım|yatirim|cephe|otopark|asansör|asansor|balkon|konum|metro|okul|hastane|market|site/i.test(
        normalizedDescription
      )
    ) {
      warnings.push(text.qualityWarnings.descriptionWeak);
    }

    if (imageCount === 0) warnings.push(text.qualityWarnings.images);
    if (imageCount > 0 && imageCount < 3) warnings.push(text.qualityWarnings.imageWeak);
    if (imageCount >= 3 && imageCount < 5) warnings.push(text.qualityWarnings.imageStrong);

    if (!formData.latitude.trim() || !formData.longitude.trim()) {
      warnings.push(text.qualityWarnings.coordinates);
    }

    if (
      (parsedLatitude !== null && (parsedLatitude < -90 || parsedLatitude > 90)) ||
      (parsedLongitude !== null && (parsedLongitude < -180 || parsedLongitude > 180))
    ) {
      warnings.push(text.qualityWarnings.coordinatesInvalid);
    }

    if (
      numericValues.netArea !== null &&
      numericValues.area !== null &&
      numericValues.netArea > numericValues.area
    ) {
      warnings.push(text.qualityWarnings.netAreaInvalid);
    }

    if (
      numericValues.grossArea !== null &&
      numericValues.area !== null &&
      numericValues.grossArea < numericValues.area * 0.5
    ) {
      warnings.push(text.qualityWarnings.grossAreaInvalid);
    }

    if (!isLandLike && isResidentialLike && (!formData.rooms.trim() || (numericValues.rooms ?? 0) <= 0)) {
      warnings.push(text.qualityWarnings.roomMissing);
    }

    if (
      !isLandLike &&
      isResidentialLike &&
      (!formData.bathrooms.trim() || (numericValues.bathrooms ?? 0) <= 0)
    ) {
      warnings.push(text.qualityWarnings.bathroomMissing);
    }

    if (
      numericValues.floor !== null &&
      numericValues.totalFloors !== null &&
      numericValues.totalFloors >= 0 &&
      numericValues.floor > numericValues.totalFloors
    ) {
      warnings.push(text.qualityWarnings.floorInvalid);
    }

    if (formData.in_site && !normalizedSiteName) {
      warnings.push(text.qualityWarnings.siteNameMissing);
    }

    if (formData.balcony && (!formData.balcony_count.trim() || (numericValues.balconyCount ?? 0) <= 0)) {
      warnings.push(text.qualityWarnings.balconyCountMissing);
    }

    if (!normalizedContactName && !normalizedContactPhone) {
      warnings.push(text.qualityWarnings.contactMissing);
    }

    if (!normalizedDistrict) {
      warnings.push(text.qualityWarnings.districtMissing);
    }

    return warnings;
  }, [
    normalizedTitle,
    normalizedDescription,
    normalizedLocation,
    normalizedCity,
    normalizedDistrict,
    normalizedSiteName,
    normalizedContactName,
    normalizedContactPhone,
    formData.price,
    formData.area,
    formData.rooms,
    formData.bathrooms,
    formData.latitude,
    formData.longitude,
    formData.in_site,
    formData.balcony,
    formData.balcony_count,
    parsedLatitude,
    parsedLongitude,
    text,
    imageCount,
    numericValues,
    isLandLike,
    isResidentialLike,
  ]);

  const qualityReady = qualityWarnings.length === 0;

  const qualityScore = useMemo(() => {
    let score = 0;

    if (normalizedTitle.length >= 10) score += 12;
    if (normalizedTitle.length >= 20) score += 6;
    if (
      normalizedTitle &&
      normalizedTitle !== normalizedTitle.toUpperCase() &&
      /[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(normalizedTitle)
    ) {
      score += 4;
    }
    if (
      /denizli|pamukkale|merkezefendi|arsa|daire|villa|ofis|dükkan|dukkan|tarla|satılık|satilik|kiralık|kiralik/i.test(
        normalizedTitle
      )
    ) {
      score += 6;
    }

    if (normalizedDescription.length >= 50) score += 12;
    if (normalizedDescription.length >= 120) score += 10;
    if (normalizedDescription.length >= 250) score += 8;
    if (
      /ulaşım|ulasim|merkezi|yatırım|yatirim|cephe|otopark|asansör|asansor|balkon|konum|metro|okul|hastane|market|site/i.test(
        normalizedDescription
      )
    ) {
      score += 5;
    }

    if (numericValues.price !== null && numericValues.price > 0) score += 10;
    if (numericValues.area !== null && numericValues.area > 0) score += 10;

    if (normalizedCity) score += 5;
    if (normalizedDistrict) score += 4;
    if (normalizedLocation) score += 6;

    if (parsedLatitude !== null && parsedLongitude !== null) {
      const latValid = parsedLatitude >= -90 && parsedLatitude <= 90;
      const lngValid = parsedLongitude >= -180 && parsedLongitude <= 180;
      if (latValid && lngValid) score += 10;
    }

    if (imageCount >= 1) score += 4;
    if (imageCount >= 3) score += 6;
    if (imageCount >= 5) score += 8;
    if (imageCount >= 8) score += 4;

    if (!isLandLike && numericValues.rooms !== null && numericValues.rooms > 0) score += 4;
    if (!isLandLike && numericValues.bathrooms !== null && numericValues.bathrooms > 0) score += 4;

    if (formData.in_site && normalizedSiteName) score += 2;
    if (formData.balcony && numericValues.balconyCount !== null && numericValues.balconyCount > 0) {
      score += 2;
    }

    if (normalizedContactName) score += 2;
    if (normalizedContactPhone) score += 2;

    const penalties = qualityWarnings.length * 3;
    return clamp(score - penalties, 0, 100);
  }, [
    normalizedTitle,
    normalizedDescription,
    normalizedCity,
    normalizedDistrict,
    normalizedLocation,
    parsedLatitude,
    parsedLongitude,
    imageCount,
    numericValues,
    formData.in_site,
    formData.balcony,
    normalizedSiteName,
    normalizedContactName,
    normalizedContactPhone,
    qualityWarnings.length,
    isLandLike,
  ]);

  const qualityLevel: QualityLevel =
    qualityScore >= 80 ? 'high' : qualityScore >= 55 ? 'medium' : 'low';

  const qualityBarClass =
    qualityLevel === 'high'
      ? 'bg-emerald-500'
      : qualityLevel === 'medium'
      ? 'bg-amber-500'
      : 'bg-rose-500';

  const qualityBoxClass =
    qualityLevel === 'high'
      ? 'border-emerald-200 bg-emerald-50'
      : qualityLevel === 'medium'
      ? 'border-amber-200 bg-amber-50'
      : 'border-rose-200 bg-rose-50';

  const qualityTextClass =
    qualityLevel === 'high'
      ? 'text-emerald-800'
      : qualityLevel === 'medium'
      ? 'text-amber-800'
      : 'text-rose-800';

  const qualitySubtextClass =
    qualityLevel === 'high'
      ? 'text-emerald-700'
      : qualityLevel === 'medium'
      ? 'text-amber-700'
      : 'text-rose-700';

  const handleMapLocationChange = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
  };

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const hasCriticalValidationError = () => {
    if (!normalizedTitle) return true;
    if (!normalizedDescription) return true;
    if (!normalizedCity) return true;
    if (!normalizedLocation) return true;
    if (!formData.price.trim()) return true;
    if (!formData.area.trim()) return true;
    if (numericValues.price === null || Number.isNaN(numericValues.price) || numericValues.price <= 0) {
      return true;
    }
    if (numericValues.area === null || Number.isNaN(numericValues.area) || numericValues.area <= 0) {
      return true;
    }

    return false;
  };

  const hasNumericLogicError = () => {
    const numericList = [
      numericValues.price,
      numericValues.area,
      numericValues.netArea,
      numericValues.grossArea,
      numericValues.rooms,
      numericValues.bathrooms,
      numericValues.floor,
      numericValues.totalFloors,
      numericValues.buildingAge,
      numericValues.dues,
      numericValues.balconyCount,
    ];

    const hasNegativeInvalid = numericList.some((value) => value !== null && Number.isNaN(value));
    if (hasNegativeInvalid) return true;

    if (numericValues.price !== null && numericValues.price <= 0) return true;
    if (numericValues.area !== null && numericValues.area <= 0) return true;
    if (numericValues.netArea !== null && numericValues.netArea <= 0) return true;
    if (numericValues.grossArea !== null && numericValues.grossArea <= 0) return true;
    if (numericValues.rooms !== null && numericValues.rooms < 0) return true;
    if (numericValues.bathrooms !== null && numericValues.bathrooms < 0) return true;
    if (numericValues.floor !== null && numericValues.floor < 0) return true;
    if (numericValues.totalFloors !== null && numericValues.totalFloors < 0) return true;
    if (numericValues.buildingAge !== null && numericValues.buildingAge < 0) return true;
    if (numericValues.dues !== null && numericValues.dues < 0) return true;
    if (numericValues.balconyCount !== null && numericValues.balconyCount < 0) return true;

    if (
      numericValues.floor !== null &&
      numericValues.totalFloors !== null &&
      numericValues.floor > numericValues.totalFloors
    ) {
      return true;
    }

    if (
      numericValues.netArea !== null &&
      numericValues.area !== null &&
      numericValues.netArea > numericValues.area
    ) {
      return true;
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasCriticalValidationError()) {
      alert(text.requiredValidation);
      return;
    }

    if (hasNumericLogicError()) {
      alert(text.numericValidation);
      return;
    }

    if (qualityScore < 35) {
      alert(text.qualityBlockSave);
      return;
    }

    setLoading(true);

    try {
      const propertyData = {
        title: normalizedTitle,
        description: normalizedDescription,
        property_type: formData.property_type,
        status: formData.status,
        price: parseFloat(formData.price),
        currency: formData.currency,
        location: normalizedLocation,
        city: normalizedCity,
        district: normalizedDistrict || null,
        area: parseFloat(formData.area),
        net_area: formData.net_area ? parseFloat(formData.net_area) : null,
        gross_area: formData.gross_area ? parseFloat(formData.gross_area) : null,
        rooms: isLandLike ? 0 : parseInt(formData.rooms, 10) || 0,
        bathrooms: isLandLike ? 0 : parseInt(formData.bathrooms, 10) || 0,
        floor: isLandLike ? null : formData.floor ? parseInt(formData.floor, 10) : null,
        total_floors: isLandLike
          ? null
          : formData.total_floors
          ? parseInt(formData.total_floors, 10)
          : null,
        building_age: formData.building_age ? parseInt(formData.building_age, 10) : null,
        heating: formData.heating || null,
        dues: formData.dues ? parseFloat(formData.dues) : null,
        frontage: formData.frontage || null,
        deed_status: formData.deed_status || null,
        usage_status: formData.usage_status || null,
        in_site: formData.in_site,
        site_name: normalizedSiteName || null,
        balcony_count: formData.balcony_count ? parseInt(formData.balcony_count, 10) : null,
        pool: formData.pool,
        security: formData.security,
        furnished: formData.furnished,
        parking: formData.parking,
        elevator: formData.elevator,
        balcony: formData.balcony,
        garden: formData.garden,
        images: imageUrls,
        featured: formData.featured,
        contact_name: normalizedContactName || null,
        contact_phone: normalizedContactPhone || null,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        moderation_status: isSuperAdmin ? property?.moderation_status || 'approved' : 'pending',
        approved_at: isSuperAdmin ? property?.approved_at || new Date().toISOString() : null,
        approved_by: isSuperAdmin ? property?.approved_by || user?.id || null : null,
        user_id: user?.id,
      };

      if (property) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData as never)
          .eq('id', property.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('properties')
          .insert([propertyData as never]);

        if (error) throw error;
      }

      onClose();
    } catch (error) {
      console.error('Error saving property:', error);
      alert(text.saveError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {property ? text.pageTitleEdit : text.pageTitleNew}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className={`rounded-2xl border px-4 py-4 ${qualityBoxClass}`}>
              <div className="flex items-start gap-3">
                {qualityReady ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                ) : qualityLevel === 'medium' ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-600" />
                )}

                <div className="min-w-0 flex-1">
                  <div className={`font-semibold ${qualityTextClass}`}>{text.qualityTitle}</div>

                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className={`text-sm font-medium ${qualityTextClass}`}>
                        {text.qualityScoreTitle}
                      </div>
                      <div className={`text-sm font-bold ${qualityTextClass}`}>{qualityScore}/100</div>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/70">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${qualityBarClass}`}
                        style={{ width: `${qualityScore}%` }}
                      />
                    </div>

                    <div className={`mt-2 text-sm ${qualitySubtextClass}`}>
                      {qualityLevel === 'high'
                        ? text.qualityExcellent
                        : qualityLevel === 'medium'
                        ? text.qualityGood
                        : text.qualityWeak}
                    </div>
                  </div>

                  {qualityReady ? (
                    <div className="mt-3 text-sm text-emerald-700">{text.qualityReady}</div>
                  ) : (
                    <div className={`mt-3 space-y-1 text-sm ${qualitySubtextClass}`}>
                      <div>{text.qualityMissing}</div>
                      <ul className="list-disc pl-5">
                        {qualityWarnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.title}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                  placeholder={text.titlePlaceholder}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.description}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  required
                  rows={6}
                  placeholder={text.descriptionPlaceholder}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.contactName}
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => handleChange('contact_name', e.target.value)}
                  placeholder={text.contactNamePlaceholder}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.contactPhone}
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder={text.contactPhonePlaceholder}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.propertyType}
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => handleChange('property_type', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {labelOf(t.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.status}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {labelOf(option.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.price}
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.currency}
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {labelOf(option.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.city}
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.district}
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleChange('district', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.address}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.area}
                </label>
                <input
                  type="number"
                  value={formData.area}
                  onChange={(e) => handleChange('area', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.netArea}
                </label>
                <input
                  type="number"
                  value={formData.net_area}
                  onChange={(e) => handleChange('net_area', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.grossArea}
                </label>
                <input
                  type="number"
                  value={formData.gross_area}
                  onChange={(e) => handleChange('gross_area', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              {!isLandLike && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {isHospitality ? text.facilityRoomCount : text.roomCount}
                    </label>
                    <input
                      type="number"
                      value={formData.rooms}
                      onChange={(e) => handleChange('rooms', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {text.bathroomCount}
                    </label>
                    <input
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => handleChange('bathrooms', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {text.floor}
                    </label>
                    <input
                      type="number"
                      value={formData.floor}
                      onChange={(e) => handleChange('floor', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {text.totalFloors}
                    </label>
                    <input
                      type="number"
                      value={formData.total_floors}
                      onChange={(e) => handleChange('total_floors', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.buildingAge}
                </label>
                <input
                  type="number"
                  value={formData.building_age}
                  onChange={(e) => handleChange('building_age', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.heating}
                </label>
                <select
                  value={formData.heating}
                  onChange={(e) => handleChange('heating', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                >
                  <option value="">{text.select}</option>
                  {HEATING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {labelOf(option.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.dues}
                </label>
                <input
                  type="number"
                  value={formData.dues}
                  onChange={(e) => handleChange('dues', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.frontage}
                </label>
                <select
                  value={formData.frontage}
                  onChange={(e) => handleChange('frontage', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                >
                  <option value="">{text.select}</option>
                  {FRONTAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {labelOf(option.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.deedStatus}
                </label>
                <select
                  value={formData.deed_status}
                  onChange={(e) => handleChange('deed_status', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                >
                  <option value="">{text.select}</option>
                  {DEED_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {labelOf(option.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.usageStatus}
                </label>
                <select
                  value={formData.usage_status}
                  onChange={(e) => handleChange('usage_status', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                >
                  <option value="">{text.select}</option>
                  {USAGE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {labelOf(option.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <label className="block text-sm font-medium text-gray-700">
                    {text.locationInfo}
                  </label>
                </div>

                <LocationPickerMap
                  latitude={parsedLatitude}
                  longitude={parsedLongitude}
                  onChange={handleMapLocationChange}
                  height={380}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.latitude}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleChange('latitude', e.target.value)}
                  placeholder={text.latitudePlaceholder}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.longitude}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleChange('longitude', e.target.value)}
                  placeholder={text.longitudePlaceholder}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div className="md:col-span-2">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {text.mapHelp}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {text.imageUrls}
                </label>
                <textarea
                  value={formData.images}
                  onChange={(e) => handleChange('images', e.target.value)}
                  rows={5}
                  placeholder={text.imagePlaceholder}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {text.features}
                </label>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.in_site}
                      onChange={(e) => handleChange('in_site', e.target.checked)}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">
                      {language === 'tr' ? 'Site İçinde' : 'In Residential Complex'}
                    </span>
                  </label>

                  {formData.in_site && (
                    <label className="flex items-center md:col-span-2">
                      <span className="mr-2 whitespace-nowrap text-gray-700">
                        {text.siteName}
                      </span>
                      <input
                        type="text"
                        value={formData.site_name}
                        onChange={(e) => handleChange('site_name', e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                      />
                    </label>
                  )}

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.furnished}
                      onChange={(e) => handleChange('furnished', e.target.checked)}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">
                      {language === 'tr' ? 'Eşyalı' : 'Furnished'}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.parking}
                      onChange={(e) => handleChange('parking', e.target.checked)}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">
                      {language === 'tr' ? 'Otopark' : 'Parking'}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.elevator}
                      onChange={(e) => handleChange('elevator', e.target.checked)}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">
                      {language === 'tr' ? 'Asansör' : 'Elevator'}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.balcony}
                      onChange={(e) => handleChange('balcony', e.target.checked)}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">
                      {language === 'tr' ? 'Balkon' : 'Balcony'}
                    </span>
                  </label>

                  {formData.balcony && (
                    <label className="flex items-center">
                      <span className="mr-2 whitespace-nowrap text-gray-700">
                        {text.balconyCount}
                      </span>
                      <input
                        type="number"
                        value={formData.balcony_count}
                        onChange={(e) => handleChange('balcony_count', e.target.value)}
                        className="w-24 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-cta"
                      />
                    </label>
                  )}

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.garden}
                      onChange={(e) => handleChange('garden', e.target.checked)}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">
                      {language === 'tr' ? 'Bahçe' : 'Garden'}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.pool}
                      onChange={(e) => handleChange('pool', e.target.checked)}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">
                      {language === 'tr' ? 'Havuz' : 'Pool'}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.security}
                      onChange={(e) => handleChange('security', e.target.checked)}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">
                      {language === 'tr' ? 'Güvenlik' : 'Security'}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => handleChange('featured', e.target.checked)}
                      className="rounded border-gray-300 text-brand focus:ring-cta"
                    />
                    <span className="ml-2 text-gray-700">
                      {language === 'tr' ? 'Öne Çıkan' : 'Featured'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-6 py-2 transition-colors hover:bg-gray-50"
              >
                {text.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-cta px-6 py-2 text-white transition-colors hover:bg-cta-hover disabled:bg-gray-400"
              >
                {loading ? text.saving : property ? text.update : text.create}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}