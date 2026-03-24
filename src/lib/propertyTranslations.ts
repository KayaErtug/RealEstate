// src/lib/propertyTranslations.ts

export type SiteLanguage = 'tr' | 'en';

type TranslationMap = Record<string, { tr: string; en: string }>;

const NOT_SPECIFIED: Record<SiteLanguage, string> = {
  tr: 'Belirtilmedi',
  en: 'Not specified',
};

const normalizeValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
};

const titleCaseFallback = (value: string): string => {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const translateFromMap = (
  value: unknown,
  language: SiteLanguage,
  map: TranslationMap,
): string => {
  const normalized = normalizeValue(value);

  if (!normalized) return NOT_SPECIFIED[language];

  const exactMatch = map[normalized];
  if (exactMatch) {
    return exactMatch[language];
  }

  return titleCaseFallback(normalized);
};

const propertyTypeMap: TranslationMap = {
  apartment: { tr: 'Daire', en: 'Apartment' },
  daire: { tr: 'Daire', en: 'Apartment' },
  residence: { tr: 'Rezidans', en: 'Residence' },
  duplex: { tr: 'Dubleks', en: 'Duplex' },
  villa: { tr: 'Villa', en: 'Villa' },
  detached_house: { tr: 'Müstakil Ev', en: 'Detached House' },
  mustakil_ev: { tr: 'Müstakil Ev', en: 'Detached House' },
  house: { tr: 'Ev', en: 'House' },
  office: { tr: 'Ofis', en: 'Office' },
  ofis: { tr: 'Ofis', en: 'Office' },
  shop: { tr: 'Dükkan', en: 'Shop' },
  dukkan: { tr: 'Dükkan', en: 'Shop' },
  store: { tr: 'Mağaza', en: 'Store' },
  warehouse: { tr: 'Depo', en: 'Warehouse' },
  depo: { tr: 'Depo', en: 'Warehouse' },
  land: { tr: 'Arsa', en: 'Land' },
  arsa: { tr: 'Arsa', en: 'Land' },
  plot: { tr: 'Parsel', en: 'Plot' },
  field: { tr: 'Tarla', en: 'Field' },
  tarla: { tr: 'Tarla', en: 'Field' },
  farm: { tr: 'Çiftlik', en: 'Farm' },
  ciftlik: { tr: 'Çiftlik', en: 'Farm' },
  building: { tr: 'Bina', en: 'Building' },
  bina: { tr: 'Bina', en: 'Building' },
  hotel: { tr: 'Otel', en: 'Hotel' },
  motel: { tr: 'Motel', en: 'Motel' },
  tourist_facility: { tr: 'Turistik Tesis', en: 'Tourist Facility' },
  turistik_tesis: { tr: 'Turistik Tesis', en: 'Tourist Facility' },
  petrol_station: { tr: 'Akaryakıt İstasyonu', en: 'Fuel Station' },
  akaryakit_istasyonu: { tr: 'Akaryakıt İstasyonu', en: 'Fuel Station' },
  factory: { tr: 'Fabrika', en: 'Factory' },
  fabrika: { tr: 'Fabrika', en: 'Factory' },
  plaza: { tr: 'Plaza', en: 'Plaza' },
  commercial: { tr: 'Ticari Gayrimenkul', en: 'Commercial Property' },
  ticari: { tr: 'Ticari Gayrimenkul', en: 'Commercial Property' },
  industrial: { tr: 'Sanayi İmarlı', en: 'Industrial Zoned' },
  sanayi: { tr: 'Sanayi İmarlı', en: 'Industrial Zoned' },
};

const statusMap: TranslationMap = {
  sale: { tr: 'Satılık', en: 'For Sale' },
  satilik: { tr: 'Satılık', en: 'For Sale' },
  for_sale: { tr: 'Satılık', en: 'For Sale' },
  rent: { tr: 'Kiralık', en: 'For Rent' },
  kiralik: { tr: 'Kiralık', en: 'For Rent' },
  for_rent: { tr: 'Kiralık', en: 'For Rent' },
  daily_rent: { tr: 'Günlük Kiralık', en: 'Daily Rent' },
  gunluk_kiralik: { tr: 'Günlük Kiralık', en: 'Daily Rent' },
  sold: { tr: 'Satıldı', en: 'Sold' },
  rented: { tr: 'Kiralandı', en: 'Rented' },
  devren: { tr: 'Devren', en: 'Transfer' },
};

const heatingMap: TranslationMap = {
  natural_gas: { tr: 'Doğalgaz', en: 'Natural Gas' },
  dogalgaz: { tr: 'Doğalgaz', en: 'Natural Gas' },
  stove: { tr: 'Soba', en: 'Stove' },
  soba: { tr: 'Soba', en: 'Stove' },
  underfloor_heating: { tr: 'Yerden Isıtma', en: 'Underfloor Heating' },
  merkezi: { tr: 'Merkezi Sistem', en: 'Central Heating' },
  central_heating: { tr: 'Merkezi Sistem', en: 'Central Heating' },
  air_conditioning: { tr: 'Klima', en: 'Air Conditioning' },
  klima: { tr: 'Klima', en: 'Air Conditioning' },
  combi: { tr: 'Kombi', en: 'Combi Boiler' },
  electric: { tr: 'Elektrik', en: 'Electric' },
  electricity: { tr: 'Elektrik', en: 'Electric' },
  none: { tr: 'Yok', en: 'None' },
  yok: { tr: 'Yok', en: 'None' },
};

const frontageMap: TranslationMap = {
  north: { tr: 'Kuzey', en: 'North' },
  south: { tr: 'Güney', en: 'South' },
  east: { tr: 'Doğu', en: 'East' },
  west: { tr: 'Batı', en: 'West' },
  north_south: { tr: 'Kuzey-Güney', en: 'North-South' },
  east_west: { tr: 'Doğu-Batı', en: 'East-West' },
  north_east: { tr: 'Kuzey-Doğu', en: 'North-East' },
  north_west: { tr: 'Kuzey-Batı', en: 'North-West' },
  south_east: { tr: 'Güney-Doğu', en: 'South-East' },
  south_west: { tr: 'Güney-Batı', en: 'South-West' },
};

const deedStatusMap: TranslationMap = {
  condominium: { tr: 'Kat Mülkiyeti', en: 'Condominium Ownership' },
  kat_mulkiyeti: { tr: 'Kat Mülkiyeti', en: 'Condominium Ownership' },
  construction_servitude: { tr: 'Kat İrtifakı', en: 'Construction Servitude' },
  kat_irtifaki: { tr: 'Kat İrtifakı', en: 'Construction Servitude' },
  easement: { tr: 'İrtifak Hakkı', en: 'Easement' },
  hisseli: { tr: 'Hisseli Tapu', en: 'Shared Title Deed' },
  shared_title: { tr: 'Hisseli Tapu', en: 'Shared Title Deed' },
  detached_title: { tr: 'Müstakil Tapu', en: 'Detached Title Deed' },
  mustakil_tapu: { tr: 'Müstakil Tapu', en: 'Detached Title Deed' },
  title_deed: { tr: 'Tapulu', en: 'Title Deed' },
  tapulu: { tr: 'Tapulu', en: 'Title Deed' },
};

const usageStatusMap: TranslationMap = {
  empty: { tr: 'Boş', en: 'Empty' },
  bos: { tr: 'Boş', en: 'Empty' },
  tenant: { tr: 'Kiracılı', en: 'Tenant Occupied' },
  kiracili: { tr: 'Kiracılı', en: 'Tenant Occupied' },
  owner: { tr: 'Mülk Sahibi Oturuyor', en: 'Owner Occupied' },
  owner_occupied: { tr: 'Mülk Sahibi Oturuyor', en: 'Owner Occupied' },
  under_construction: { tr: 'İnşaat Halinde', en: 'Under Construction' },
  insaat_halinde: { tr: 'İnşaat Halinde', en: 'Under Construction' },
  vacant: { tr: 'Boş', en: 'Empty' },
};

const currencyMap: TranslationMap = {
  try: { tr: 'TL', en: 'TRY' },
  tl: { tr: 'TL', en: 'TRY' },
  usd: { tr: 'Dolar', en: 'USD' },
  eur: { tr: 'Euro', en: 'EUR' },
  gbp: { tr: 'Sterlin', en: 'GBP' },
};

const moderationStatusMap: TranslationMap = {
  pending: { tr: 'Onay Bekliyor', en: 'Pending Approval' },
  approved: { tr: 'Onaylandı', en: 'Approved' },
  rejected: { tr: 'Reddedildi', en: 'Rejected' },
  draft: { tr: 'Taslak', en: 'Draft' },
};

const roomCountMap: TranslationMap = {
  studio: { tr: 'Stüdyo', en: 'Studio' },
  '1_0': { tr: '1+0', en: '1+0' },
  '1_1': { tr: '1+1', en: '1+1' },
  '2_1': { tr: '2+1', en: '2+1' },
  '2_2': { tr: '2+2', en: '2+2' },
  '3_1': { tr: '3+1', en: '3+1' },
  '3_2': { tr: '3+2', en: '3+2' },
  '4_1': { tr: '4+1', en: '4+1' },
  '4_2': { tr: '4+2', en: '4+2' },
  '5_1': { tr: '5+1', en: '5+1' },
  '5_2': { tr: '5+2', en: '5+2' },
  '6_1': { tr: '6+1', en: '6+1' },
  '6_2': { tr: '6+2', en: '6+2' },
};

const statusColorMap: Record<string, string> = {
  sale: 'bg-emerald-600',
  satilik: 'bg-emerald-600',
  for_sale: 'bg-emerald-600',
  rent: 'bg-blue-600',
  kiralik: 'bg-blue-600',
  for_rent: 'bg-blue-600',
  daily_rent: 'bg-cyan-600',
  gunluk_kiralik: 'bg-cyan-600',
  sold: 'bg-red-600',
  rented: 'bg-amber-600',
  devren: 'bg-violet-600',
};

export const getPropertyTypeLabel = (
  value: unknown,
  language: SiteLanguage = 'tr',
): string => translateFromMap(value, language, propertyTypeMap);

export const getStatusLabel = (
  value: unknown,
  language: SiteLanguage = 'tr',
): string => translateFromMap(value, language, statusMap);

export const getListingStatusLabel = (
  value: unknown,
  language: SiteLanguage = 'tr',
): string => getStatusLabel(value, language);

export const getStatusColor = (value: unknown): string => {
  const normalized = normalizeValue(value);
  return statusColorMap[normalized] || 'bg-slate-600';
};

export const getHeatingLabel = (
  value: unknown,
  language: SiteLanguage = 'tr',
): string => translateFromMap(value, language, heatingMap);

export const getFrontageLabel = (
  value: unknown,
  language: SiteLanguage = 'tr',
): string => translateFromMap(value, language, frontageMap);

export const getDeedStatusLabel = (
  value: unknown,
  language: SiteLanguage = 'tr',
): string => translateFromMap(value, language, deedStatusMap);

export const getUsageStatusLabel = (
  value: unknown,
  language: SiteLanguage = 'tr',
): string => translateFromMap(value, language, usageStatusMap);

export const getCurrencyLabel = (
  value: unknown,
  language: SiteLanguage = 'tr',
): string => translateFromMap(value, language, currencyMap);

export const getModerationStatusLabel = (
  value: unknown,
  language: SiteLanguage = 'tr',
): string => translateFromMap(value, language, moderationStatusMap);

export const getRoomCountLabel = (
  value: unknown,
  language: SiteLanguage = 'tr',
): string => translateFromMap(value, language, roomCountMap);

export const getTranslatedEnumValue = (
  field:
    | 'property_type'
    | 'status'
    | 'heating'
    | 'frontage'
    | 'deed_status'
    | 'usage_status'
    | 'currency'
    | 'moderation_status'
    | 'rooms',
  value: unknown,
  language: SiteLanguage = 'tr',
): string => {
  switch (field) {
    case 'property_type':
      return getPropertyTypeLabel(value, language);
    case 'status':
      return getStatusLabel(value, language);
    case 'heating':
      return getHeatingLabel(value, language);
    case 'frontage':
      return getFrontageLabel(value, language);
    case 'deed_status':
      return getDeedStatusLabel(value, language);
    case 'usage_status':
      return getUsageStatusLabel(value, language);
    case 'currency':
      return getCurrencyLabel(value, language);
    case 'moderation_status':
      return getModerationStatusLabel(value, language);
    case 'rooms':
      return getRoomCountLabel(value, language);
    default:
      return NOT_SPECIFIED[language];
  }
};

export const translatePropertyValue = (
  key: string,
  value: unknown,
  language: SiteLanguage = 'tr',
): string => {
  const normalizedKey = normalizeValue(key);

  switch (normalizedKey) {
    case 'property_type':
      return getPropertyTypeLabel(value, language);
    case 'status':
      return getStatusLabel(value, language);
    case 'heating':
      return getHeatingLabel(value, language);
    case 'frontage':
      return getFrontageLabel(value, language);
    case 'deed_status':
      return getDeedStatusLabel(value, language);
    case 'usage_status':
      return getUsageStatusLabel(value, language);
    case 'currency':
      return getCurrencyLabel(value, language);
    case 'moderation_status':
      return getModerationStatusLabel(value, language);
    case 'rooms':
      return getRoomCountLabel(value, language);
    default:
      if (value === null || value === undefined || String(value).trim() === '') {
        return NOT_SPECIFIED[language];
      }
      return String(value);
  }
};

export const propertyTranslations = {
  propertyTypeMap,
  statusMap,
  heatingMap,
  frontageMap,
  deedStatusMap,
  usageStatusMap,
  currencyMap,
  moderationStatusMap,
  roomCountMap,
  statusColorMap,
};

export default propertyTranslations;