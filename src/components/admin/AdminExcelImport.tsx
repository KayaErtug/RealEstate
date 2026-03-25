// src/components/admin/AdminExcelImport.tsx
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  MapPinned,
  Save,
  Search,
  Upload,
  XCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type ImportablePropertyRow = {
  id?: string | null;
  title: string;
  description: string;
  property_type: string;
  status: string;
  price: number;
  old_price: number | null;
  currency: string;
  location: string;
  city: string;
  district: string | null;
  area: number;
  net_area: number;
  gross_area: number;
  rooms: number;
  bathrooms: number;
  floor: number;
  total_floors: number;
  building_age: number;
  heating: string | null;
  dues: number;
  frontage: string | null;
  deed_status: string | null;
  usage_status: string | null;
  in_site: boolean;
  site_name: string | null;
  balcony_count: number;
  pool: boolean;
  security: boolean;
  furnished: boolean;
  parking: boolean;
  elevator: boolean;
  balcony: boolean;
  garden: boolean;
  images: string[];
  moderation_status: string;
  contact_name: string | null;
  contact_phone: string | null;
  featured: boolean;
  user_id: string | null;
  latitude: number | null;
  longitude: number | null;
};

type ParsedPreviewRow = {
  rowNumber: number;
  raw: Record<string, unknown>;
  normalized: ImportablePropertyRow | null;
  errors: string[];
  duplicateReason: string | null;
  geocodeStatus: "idle" | "success" | "not_found" | "error";
  geocodeMessage: string | null;
  isExcluded: boolean;
};

type ImportSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  rowsWithCoordinates: number;
  rowsMissingCoordinates: number;
  excludedRows: number;
};

type ImportLogItem = {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
  createdAt: string;
};

interface AdminExcelImportProps {
  onImported?: () => Promise<void> | void;
}

type ExistingPropertyLite = {
  id: string;
  title: string;
  city: string;
  district: string | null;
  price: number;
  property_type: string;
};

type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name?: string;
};

type ColumnGuideItem = {
  label: string;
  aliases: string[];
  example: string;
  required?: boolean;
};

type FilterMode = "all" | "valid" | "invalid" | "duplicate" | "missing_coordinates";

const REQUIRED_FIELDS = ["title", "price", "city", "property_type"] as const;
const ROWS_PER_PAGE = 10;

const NOMINATIM_EMAIL = "info@varolgayrimenkul.com";
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

const PROPERTY_TYPE_MAP: Record<string, string> = {
  daire: "apartment",
  apartment: "apartment",
  rezidans: "residence",
  residence: "residence",
  dubleks: "duplex",
  duplex: "duplex",
  villa: "villa",
  "müstakil ev": "detached_house",
  "mustakil ev": "detached_house",
  detached_house: "detached_house",
  arsa: "land",
  land: "land",
  tarla: "field",
  field: "field",
  çiftlik: "farm",
  ciftlik: "farm",
  farm: "farm",
  ofis: "office",
  office: "office",
  dükkan: "shop",
  dukkan: "shop",
  shop: "shop",
  bina: "building",
  building: "building",
  ticari: "commercial",
  commercial: "commercial",
};

const PROPERTY_TYPE_LABEL_TR: Record<string, string> = {
  apartment: "Daire",
  residence: "Rezidans",
  duplex: "Dubleks",
  villa: "Villa",
  detached_house: "Müstakil Ev",
  land: "Arsa",
  field: "Tarla",
  farm: "Çiftlik",
  office: "Ofis",
  shop: "Dükkan",
  building: "Bina",
  commercial: "Ticari Gayrimenkul",
};

const PROPERTY_TYPE_OPTIONS = [
  { value: "apartment", label: "Daire" },
  { value: "residence", label: "Rezidans" },
  { value: "duplex", label: "Dubleks" },
  { value: "villa", label: "Villa" },
  { value: "detached_house", label: "Müstakil Ev" },
  { value: "land", label: "Arsa" },
  { value: "field", label: "Tarla" },
  { value: "farm", label: "Çiftlik" },
  { value: "office", label: "Ofis" },
  { value: "shop", label: "Dükkan" },
  { value: "building", label: "Bina" },
  { value: "commercial", label: "Ticari Gayrimenkul" },
];

const STATUS_MAP: Record<string, string> = {
  satılık: "for_sale",
  satilik: "for_sale",
  for_sale: "for_sale",
  kiralık: "for_rent",
  kiralik: "for_rent",
  for_rent: "for_rent",
  satıldı: "sold",
  satildi: "sold",
  sold: "sold",
  kiralandı: "rented",
  kiralandi: "rented",
  rented: "rented",
};

const STATUS_OPTIONS = [
  { value: "for_sale", label: "Satılık" },
  { value: "for_rent", label: "Kiralık" },
  { value: "sold", label: "Satıldı" },
  { value: "rented", label: "Kiralandı" },
];

const CURRENCY_MAP: Record<string, string> = {
  tl: "TRY",
  try: "TRY",
  "₺": "TRY",
  usd: "USD",
  dollar: "USD",
  dolar: "USD",
  eur: "EUR",
  euro: "EUR",
};

const MODERATION_MAP: Record<string, string> = {
  approved: "approved",
  onaylı: "approved",
  onayli: "approved",
  pending: "pending",
  bekliyor: "pending",
  rejected: "rejected",
  reddedildi: "rejected",
};

const COLUMN_GUIDE: ColumnGuideItem[] = [
  { label: "İlan ID", aliases: ["id", "ilan_id", "property_id"], example: "uuid-değeri" },
  { label: "Başlık", aliases: ["title", "başlık", "baslik"], example: "Denizli Merkezde Satılık 3+1 Daire", required: true },
  { label: "Açıklama", aliases: ["description", "açıklama", "aciklama"], example: "Geniş kullanım alanına sahip, merkezi konumda..." },
  { label: "Emlak Türü", aliases: ["property_type", "emlak_türü", "emlak_turu", "type", "tür"], example: "Daire / apartment / Villa / Arsa", required: true },
  { label: "Durum", aliases: ["status", "durum"], example: "satılık / kiralık / for_sale / for_rent" },
  { label: "Fiyat", aliases: ["price", "fiyat"], example: "3250000", required: true },
  { label: "Eski Fiyat", aliases: ["old_price", "eski_fiyat", "eski fiyat"], example: "3500000" },
  { label: "Para Birimi", aliases: ["currency", "para_birimi", "para birimi"], example: "TRY / USD / EUR" },
  { label: "Şehir", aliases: ["city", "şehir", "sehir", "il"], example: "Denizli", required: true },
  { label: "İlçe", aliases: ["district", "ilçe", "ilce"], example: "Pamukkale" },
  { label: "Konum / Mahalle / Adres", aliases: ["location", "konum", "mahalle", "adres"], example: "İstiklal Mahallesi" },
  { label: "Alan", aliases: ["area", "m2", "metrekare", "alan"], example: "145" },
  { label: "Net Alan", aliases: ["net_area", "net_m2", "net alan"], example: "130" },
  { label: "Brüt Alan", aliases: ["gross_area", "gross_m2", "brüt alan", "brut alan"], example: "145" },
  { label: "Oda Sayısı", aliases: ["rooms", "oda", "oda_sayısı", "oda_sayisi"], example: "3" },
  { label: "Banyo Sayısı", aliases: ["bathrooms", "banyo", "banyo_sayısı", "banyo_sayisi"], example: "2" },
  { label: "Kat", aliases: ["floor", "kat"], example: "4" },
  { label: "Toplam Kat", aliases: ["total_floors", "toplam_kat", "binadaki_kat"], example: "8" },
  { label: "Bina Yaşı", aliases: ["building_age", "bina_yaşı", "bina_yasi"], example: "5" },
  { label: "Isıtma", aliases: ["heating", "ısıtma", "isitma"], example: "Doğalgaz" },
  { label: "Aidat", aliases: ["dues", "aidat"], example: "350" },
  { label: "Cephe", aliases: ["frontage", "cephe"], example: "Güney" },
  { label: "Tapu Durumu", aliases: ["deed_status", "tapu_durumu"], example: "Kat Mülkiyetli" },
  { label: "Kullanım Durumu", aliases: ["usage_status", "kullanım_durumu", "kullanim_durumu"], example: "Boş / Kiracılı" },
  { label: "Site İçinde", aliases: ["in_site", "site_içinde", "site_icinde"], example: "true / false / evet / hayır" },
  { label: "Site Adı", aliases: ["site_name", "site_adı", "site_adi"], example: "Örnek Yaşam Sitesi" },
  { label: "Balkon Sayısı", aliases: ["balcony_count", "balkon_sayısı", "balkon_sayisi"], example: "2" },
  { label: "Havuz", aliases: ["pool", "havuz"], example: "true / false" },
  { label: "Güvenlik", aliases: ["security", "güvenlik", "guvenlik"], example: "true / false" },
  { label: "Eşyalı", aliases: ["furnished", "eşyalı", "esyali"], example: "true / false" },
  { label: "Otopark", aliases: ["parking", "otopark"], example: "true / false" },
  { label: "Asansör", aliases: ["elevator", "asansör", "asansor"], example: "true / false" },
  { label: "Balkon Var/Yok", aliases: ["balcony", "balkon"], example: "true / false" },
  { label: "Bahçe", aliases: ["garden", "bahçe", "bahce"], example: "true / false" },
  { label: "Görseller", aliases: ["images", "görseller", "gorseller", "resimler"], example: "url1|url2|url3" },
  { label: "Onay Durumu", aliases: ["moderation_status", "onay_durumu"], example: "approved / pending" },
  { label: "İletişim Adı", aliases: ["contact_name", "iletişim_adı", "iletisim_adi", "yetkili"], example: "Varol Gayrimenkul" },
  { label: "İletişim Telefonu", aliases: ["contact_phone", "iletişim_telefonu", "iletisim_telefonu", "telefon"], example: "0532 340 20 36" },
  { label: "Öne Çıkan", aliases: ["featured", "öne_çıkan", "one_cikan"], example: "true / false" },
  { label: "Kullanıcı ID", aliases: ["user_id"], example: "uuid-değeri" },
  { label: "Enlem", aliases: ["latitude", "lat"], example: "37.776520" },
  { label: "Boylam", aliases: ["longitude", "lng", "lon"], example: "29.086390" },
];

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeLooseKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function normalizeComparableText(value: unknown): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function sentenceCaseWord(word: string): string {
  if (!word) return word;
  const lower = word.toLocaleLowerCase("tr-TR");
  return lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1);
}

function titleCaseTr(value: string): string {
  return collapseSpaces(value)
    .split(" ")
    .map((word) => {
      if (!word) return word;
      if (word.includes("/")) {
        return word
          .split("/")
          .map((part) => sentenceCaseWord(part))
          .join("/");
      }
      return sentenceCaseWord(word);
    })
    .join(" ");
}

function cleanTitle(value: string): string {
  const trimmed = collapseSpaces(value.replace(/[_-]+/g, " "));
  if (!trimmed) return "";

  const alphaOnly = trimmed.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, "");
  const isMostlyUpper =
    alphaOnly.length > 4 && alphaOnly === alphaOnly.toLocaleUpperCase("tr-TR");
  const isMostlyLower =
    alphaOnly.length > 4 && alphaOnly === alphaOnly.toLocaleLowerCase("tr-TR");

  if (isMostlyUpper || isMostlyLower) {
    return titleCaseTr(trimmed);
  }

  return trimmed;
}

function cleanDescription(value: string): string {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatMoneyTR(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price.toLocaleString("tr-TR")} ${currency}`;
  }
}

function buildFallbackDescription(row: {
  property_type: string;
  status: string;
  city: string;
  district: string | null;
  area: number;
  price: number;
  old_price: number | null;
  currency: string;
  rooms: number;
  bathrooms: number;
  location: string;
}): string {
  const typeLabel = PROPERTY_TYPE_LABEL_TR[row.property_type] || "Gayrimenkul";
  const statusLabel =
    row.status === "for_rent"
      ? "kiralık"
      : row.status === "sold"
      ? "satılmış"
      : row.status === "rented"
      ? "kiralanmış"
      : "satılık";

  const parts: string[] = [];
  parts.push(
    `${row.city}${row.district ? ` / ${row.district}` : ""} bölgesinde ${statusLabel} ${typeLabel.toLocaleLowerCase("tr-TR")} ilanı.`
  );
  if (row.area > 0) parts.push(`Toplam alan: ${row.area} m².`);
  if (row.rooms > 0) parts.push(`Oda sayısı: ${row.rooms}.`);
  if (row.bathrooms > 0) parts.push(`Banyo sayısı: ${row.bathrooms}.`);
  if (row.location) parts.push(`Konum: ${row.location}.`);
  if (row.old_price && row.old_price > row.price) {
    parts.push(`İndirimli fiyat: ${formatMoneyTR(row.price, row.currency)}. Eski fiyat: ${formatMoneyTR(row.old_price, row.currency)}.`);
  } else {
    parts.push(`Fiyat: ${formatMoneyTR(row.price, row.currency)}.`);
  }
  return parts.join(" ");
}

function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const text = String(value).trim();
  if (!text) return null;

  const cleaned = text
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNumberWithFallback(value: unknown, fallback = 0): number {
  const parsed = parseNullableNumber(value);
  return parsed ?? fallback;
}

function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const normalized = normalizeText(value).toLowerCase();
  if (["true", "1", "evet", "yes", "var"].includes(normalized)) return true;
  if (["false", "0", "hayır", "hayir", "no", "yok"].includes(normalized)) return false;
  return fallback;
}

function splitImages(value: unknown): string[] {
  const raw = normalizeText(value);
  if (!raw) return [];
  return raw.split("|").map((item) => item.trim()).filter(Boolean);
}

function mapPropertyType(value: unknown): string {
  const normalized = normalizeLooseKey(normalizeText(value));
  return PROPERTY_TYPE_MAP[normalized] ?? normalized;
}

function mapStatus(value: unknown): string {
  const normalized = normalizeLooseKey(normalizeText(value));
  return STATUS_MAP[normalized] ?? "for_sale";
}

function mapCurrency(value: unknown): string {
  const normalized = normalizeLooseKey(normalizeText(value));
  return CURRENCY_MAP[normalized] ?? "TRY";
}

function mapModerationStatus(value: unknown): string {
  const normalized = normalizeLooseKey(normalizeText(value));
  return MODERATION_MAP[normalized] ?? "approved";
}

function pickValue(row: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    const foundKey = Object.keys(row).find(
      (key) => normalizeLooseKey(key) === normalizeLooseKey(alias)
    );
    if (foundKey) return row[foundKey];
  }
  return undefined;
}

function validateNormalizedRow(row: ImportablePropertyRow): string[] {
  const errors: string[] = [];

  if (!cleanTitle(row.title)) errors.push("Başlık eksik.");
  if (!row.price || row.price <= 0) errors.push("Fiyat eksik veya geçersiz.");
  if (!cleanTitle(row.city)) errors.push("Şehir eksik.");
  if (!row.property_type || !Object.values(PROPERTY_TYPE_MAP).includes(row.property_type)) {
    errors.push("Geçerli bir emlak türü yok.");
  }

  return errors;
}

function buildNormalizedRow(rawRow: Record<string, unknown>): ParsedPreviewRow {
  const rowNumber = Number(rawRow.__rowNumber ?? 0);

  const rawTitle = normalizeText(pickValue(rawRow, ["title", "başlık", "baslik"]));
  const rawDescription = normalizeText(
    pickValue(rawRow, ["description", "açıklama", "aciklama"])
  );

  const property_type = mapPropertyType(
    pickValue(rawRow, [
      "property_type",
      "emlak_türü",
      "emlak_turu",
      "property type",
      "type",
      "tur",
      "tür",
    ])
  );

  const id = normalizeText(pickValue(rawRow, ["id", "ilan_id", "property_id"])) || null;
  const status = mapStatus(pickValue(rawRow, ["status", "durum"]));
  const parsedPrice = parseNullableNumber(pickValue(rawRow, ["price", "fiyat"]));
  const parsedOldPrice = parseNullableNumber(pickValue(rawRow, ["old_price", "eski_fiyat", "eski fiyat"]));
  const currency = mapCurrency(
    pickValue(rawRow, ["currency", "para_birimi", "para birimi"])
  );

  const location = cleanTitle(
    normalizeText(pickValue(rawRow, ["location", "konum", "mahalle", "adres"]))
  );
  const city = cleanTitle(
    normalizeText(pickValue(rawRow, ["city", "şehir", "sehir", "il"]))
  );
  const district = cleanTitle(
    normalizeText(pickValue(rawRow, ["district", "ilçe", "ilce"]))
  );

  const areaValue = parseNullableNumber(
    pickValue(rawRow, ["area", "m2", "metrekare", "alan"])
  );
  const netAreaValue = parseNullableNumber(
    pickValue(rawRow, ["net_area", "net_m2", "net alan"])
  );
  const grossAreaValue = parseNullableNumber(
    pickValue(rawRow, ["gross_area", "gross_m2", "brüt alan", "brut alan"])
  );

  const rooms = parseNumberWithFallback(
    pickValue(rawRow, ["rooms", "oda", "oda_sayısı", "oda_sayisi"]),
    0
  );
  const bathrooms = parseNumberWithFallback(
    pickValue(rawRow, ["bathrooms", "banyo", "banyo_sayısı", "banyo_sayisi"]),
    0
  );
  const floor = parseNumberWithFallback(pickValue(rawRow, ["floor", "kat"]), 0);
  const total_floors = parseNumberWithFallback(
    pickValue(rawRow, ["total_floors", "toplam_kat", "binadaki_kat"]),
    0
  );
  const building_age = parseNumberWithFallback(
    pickValue(rawRow, ["building_age", "bina_yaşı", "bina_yasi"]),
    0
  );

  const heating =
    cleanTitle(normalizeText(pickValue(rawRow, ["heating", "ısıtma", "isitma"]))) || null;
  const dues = parseNumberWithFallback(pickValue(rawRow, ["dues", "aidat"]), 0);
  const frontage =
    cleanTitle(normalizeText(pickValue(rawRow, ["frontage", "cephe"]))) || null;
  const deed_status =
    cleanTitle(normalizeText(pickValue(rawRow, ["deed_status", "tapu_durumu"]))) || null;
  const usage_status =
    cleanTitle(
      normalizeText(
        pickValue(rawRow, ["usage_status", "kullanım_durumu", "kullanim_durumu"])
      )
    ) || null;

  const in_site = parseBoolean(
    pickValue(rawRow, ["in_site", "site_içinde", "site_icinde"]),
    false
  );
  const site_name =
    cleanTitle(normalizeText(pickValue(rawRow, ["site_name", "site_adı", "site_adi"]))) ||
    null;
  const balcony_count = parseNumberWithFallback(
    pickValue(rawRow, ["balcony_count", "balkon_sayısı", "balkon_sayisi"]),
    0
  );

  const pool = parseBoolean(pickValue(rawRow, ["pool", "havuz"]), false);
  const security = parseBoolean(
    pickValue(rawRow, ["security", "güvenlik", "guvenlik"]),
    false
  );
  const furnished = parseBoolean(
    pickValue(rawRow, ["furnished", "eşyalı", "esyali"]),
    false
  );
  const parking = parseBoolean(pickValue(rawRow, ["parking", "otopark"]), false);
  const elevator = parseBoolean(
    pickValue(rawRow, ["elevator", "asansör", "asansor"]),
    false
  );
  const balcony = parseBoolean(pickValue(rawRow, ["balcony", "balkon"]), false);
  const garden = parseBoolean(
    pickValue(rawRow, ["garden", "bahçe", "bahce"]),
    false
  );

  const images = splitImages(
    pickValue(rawRow, [
      "images",
      "görseller",
      "gorseller",
      "resimler",
      "fotoğraflar",
      "fotograflar",
    ])
  );

  const moderation_status = mapModerationStatus(
    pickValue(rawRow, ["moderation_status", "onay_durumu"])
  );

  const contact_name =
    cleanTitle(
      normalizeText(
        pickValue(rawRow, [
          "contact_name",
          "iletişim_adı",
          "iletisim_adi",
          "yetkili",
        ])
      )
    ) || "Varol Gayrimenkul";

  const contact_phone =
    normalizeText(
      pickValue(rawRow, [
        "contact_phone",
        "iletişim_telefonu",
        "iletisim_telefonu",
        "telefon",
      ])
    ) || "0 532 340 20 36";

  const featured = parseBoolean(
    pickValue(rawRow, ["featured", "öne_çıkan", "one_cikan"]),
    false
  );
  const user_id = normalizeText(pickValue(rawRow, ["user_id"])) || null;

  const latitude = parseNullableNumber(pickValue(rawRow, ["latitude", "lat"]));
  const longitude = parseNullableNumber(
    pickValue(rawRow, ["longitude", "lng", "lon"])
  );

  const title = cleanTitle(rawTitle);
  const baseArea = areaValue ?? netAreaValue ?? grossAreaValue ?? 0;

  const normalizedCandidate: ImportablePropertyRow = {
    id,
    title,
    description:
      cleanDescription(rawDescription) ||
      buildFallbackDescription({
        property_type,
        status,
        city,
        district: district || null,
        area: baseArea,
        price: parsedPrice ?? 0,
        old_price: parsedOldPrice,
        currency,
        rooms,
        bathrooms,
        location,
      }),
    property_type,
    status,
    price: parsedPrice ?? 0,
    old_price: parsedOldPrice,
    currency,
    location,
    city,
    district: district || null,
    area: baseArea,
    net_area: netAreaValue ?? 0,
    gross_area: grossAreaValue ?? 0,
    rooms,
    bathrooms,
    floor,
    total_floors,
    building_age,
    heating,
    dues,
    frontage,
    deed_status,
    usage_status,
    in_site,
    site_name,
    balcony_count,
    pool,
    security,
    furnished,
    parking,
    elevator,
    balcony,
    garden,
    images,
    moderation_status,
    contact_name,
    contact_phone,
    featured,
    user_id,
    latitude,
    longitude,
  };

  const errors = validateNormalizedRow(normalizedCandidate);

  return {
    rowNumber,
    raw: rawRow,
    normalized: normalizedCandidate,
    errors,
    duplicateReason: null,
    geocodeStatus: "idle",
    geocodeMessage: null,
    isExcluded: false,
  };
}

function buildComparableKey(row: {
  title: string;
  city: string;
  district?: string | null;
  price: number;
  property_type: string;
}): string {
  return [
    normalizeComparableText(row.title),
    normalizeComparableText(row.city),
    normalizeComparableText(row.district || ""),
    Math.round(row.price),
    normalizeComparableText(row.property_type),
  ].join("|");
}

function buildGeocodeQuery(row: ImportablePropertyRow): string {
  const parts = [row.location, row.district || "", row.city, "Türkiye"]
    .map((item) => normalizeText(item))
    .filter(Boolean);

  return parts.join(", ");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function geocodeAddress(query: string): Promise<{
  latitude: number | null;
  longitude: number | null;
  displayName: string | null;
}> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
    countrycodes: "tr",
    "accept-language": "tr",
    addressdetails: "0",
  });

  if (NOMINATIM_EMAIL) params.set("email", NOMINATIM_EMAIL);

  const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Geocode request failed with status ${response.status}`);
  }

  const data = (await response.json()) as NominatimSearchResult[];

  if (!Array.isArray(data) || data.length === 0) {
    return { latitude: null, longitude: null, displayName: null };
  }

  const first = data[0];
  const latitude = Number(first.lat);
  const longitude = Number(first.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      latitude: null,
      longitude: null,
      displayName: first.display_name || null,
    };
  }

  return {
    latitude,
    longitude,
    displayName: first.display_name || null,
  };
}

function downloadTemplateWorkbook(): void {
  const propertyRows = [
    {
      title: "Denizli Pamukkale'de Satılık 3+1 Daire",
      description: "Merkezi konumda, geniş balkonlu, aile yaşamına uygun satılık daire.",
      property_type: "Daire",
      status: "satılık",
      price: 3250000,
      old_price: 3500000,
      currency: "TRY",
      city: "Denizli",
      district: "Pamukkale",
      location: "İstiklal Mahallesi",
      area: 145,
      net_area: 130,
      gross_area: 145,
      rooms: 3,
      bathrooms: 2,
      floor: 4,
      total_floors: 8,
      building_age: 5,
      heating: "Doğalgaz",
      dues: 350,
      frontage: "Güney",
      deed_status: "Kat Mülkiyetli",
      usage_status: "Boş",
      in_site: true,
      site_name: "Örnek Yaşam Sitesi",
      balcony_count: 2,
      pool: false,
      security: true,
      furnished: false,
      parking: true,
      elevator: true,
      balcony: true,
      garden: false,
      images: "https://ornek.com/gorsel1.jpg|https://ornek.com/gorsel2.jpg",
      moderation_status: "approved",
      contact_name: "Varol Gayrimenkul",
      contact_phone: "0532 340 20 36",
      featured: true,
      user_id: "",
      latitude: 37.77652,
      longitude: 29.08639,
    },
    {
      title: "Denizli Merkezefendi'de Kiralık Ofis",
      description: "İşlek bölgede, ulaşımı kolay, kurumsal kullanıma uygun kiralık ofis.",
      property_type: "Ofis",
      status: "kiralık",
      price: 45000,
      old_price: 50000,
      currency: "TRY",
      city: "Denizli",
      district: "Merkezefendi",
      location: "Sırakapılar Mahallesi",
      area: 110,
      net_area: 95,
      gross_area: 110,
      rooms: 4,
      bathrooms: 1,
      floor: 2,
      total_floors: 5,
      building_age: 8,
      heating: "Klima",
      dues: 500,
      frontage: "Cadde",
      deed_status: "Kat İrtifaklı",
      usage_status: "Boş",
      in_site: false,
      site_name: "",
      balcony_count: 0,
      pool: false,
      security: false,
      furnished: false,
      parking: true,
      elevator: true,
      balcony: false,
      garden: false,
      images: "https://ornek.com/ofis1.jpg|https://ornek.com/ofis2.jpg",
      moderation_status: "approved",
      contact_name: "Varol Gayrimenkul",
      contact_phone: "0532 340 20 36",
      featured: false,
      user_id: "",
      latitude: "",
      longitude: "",
    },
  ];

  const guideRows = COLUMN_GUIDE.map((item) => ({
    alan: item.label,
    desteklenen_kolon_adlari: item.aliases.join(", "),
    ornek_deger: item.example,
    zorunlu: item.required ? "EVET" : "HAYIR",
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(propertyRows), "properties");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(guideRows), "rehber");
  XLSX.writeFile(workbook, "property_import_template_varol.xlsx");
}

function buildLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getNowLabel(): string {
  return new Date().toLocaleString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function exportWorkbookFromJson(
  filename: string,
  sheetName: string,
  rows: Array<Record<string, unknown>>
): void {
  if (rows.length === 0) return;
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

export default function AdminExcelImport({
  onImported,
}: AdminExcelImportProps) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedPreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");
  const [showGuide, setShowGuide] = useState(true);
  const [logs, setLogs] = useState<ImportLogItem[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [page, setPage] = useState(1);

  const [bulkCity, setBulkCity] = useState("");
  const [bulkDistrict, setBulkDistrict] = useState("");
  const [bulkStatus, setBulkStatus] = useState("for_sale");

  const addLog = (type: ImportLogItem["type"], message: string) => {
    setLogs((prev) =>
      [
        {
          id: buildLogId(),
          type,
          message,
          createdAt: getNowLabel(),
        },
        ...prev,
      ].slice(0, 15)
    );
  };

  const summary = useMemo<ImportSummary>(() => {
    const totalRows = rows.length;
    const validRows = rows.filter(
      (row) => !row.isExcluded && row.errors.length === 0 && !row.duplicateReason
    ).length;
    const invalidRows = rows.filter((row) => row.errors.length > 0).length;
    const duplicateRows = rows.filter((row) => !!row.duplicateReason).length;
    const rowsWithCoordinates = rows.filter(
      (row) =>
        row.normalized &&
        typeof row.normalized.latitude === "number" &&
        typeof row.normalized.longitude === "number"
    ).length;
    const rowsMissingCoordinates = rows.filter(
      (row) =>
        row.normalized &&
        (typeof row.normalized.latitude !== "number" ||
          typeof row.normalized.longitude !== "number")
    ).length;
    const excludedRows = rows.filter((row) => row.isExcluded).length;

    return {
      totalRows,
      validRows,
      invalidRows,
      duplicateRows,
      rowsWithCoordinates,
      rowsMissingCoordinates,
      excludedRows,
    };
  }, [rows]);

  const validPayload = useMemo(() => {
    return rows
      .filter((row) => !row.isExcluded && row.errors.length === 0 && !row.duplicateReason)
      .map((row) => row.normalized) as ImportablePropertyRow[];
  }, [rows]);

  const invalidRows = useMemo(() => rows.filter((row) => row.errors.length > 0), [rows]);
  const duplicateRows = useMemo(() => rows.filter((row) => !!row.duplicateReason), [rows]);
  const geocodeResultRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.geocodeStatus === "success" ||
          row.geocodeStatus === "not_found" ||
          row.geocodeStatus === "error"
      ),
    [rows]
  );

  const geocodableRows = useMemo(() => {
    return rows.filter(
      (row) =>
        !row.isExcluded &&
        row.errors.length === 0 &&
        !row.duplicateReason &&
        row.normalized &&
        (row.normalized.latitude === null || row.normalized.longitude === null)
    );
  }, [rows]);

  const selectedRowNumbers = useMemo(
    () => rows.filter((row) => !row.isExcluded).map((row) => row.rowNumber),
    [rows]
  );

  const applyDuplicateChecks = async (preparedRows: ParsedPreviewRow[]) => {
    const normalizedRows = preparedRows.filter((row) => row.normalized);
    if (normalizedRows.length === 0) return preparedRows;

    const { data, error } = await supabase
      .from("properties")
      .select("id,title,city,district,price,property_type");

    if (error) throw error;

    const existingRows = ((data || []) as ExistingPropertyLite[]).map((item) => ({
      ...item,
      district: item.district || null,
    }));

    const existingKeySet = new Set(existingRows.map((item) => buildComparableKey(item)));
    const seenExcelKeys = new Set<string>();

    return preparedRows.map((row) => {
      if (!row.normalized) {
        return { ...row, duplicateReason: null };
      }

      const comparableKey = buildComparableKey(row.normalized);

      if (existingKeySet.has(comparableKey)) {
        return { ...row, duplicateReason: "Veritabanında benzer ilan zaten mevcut." };
      }

      if (seenExcelKeys.has(comparableKey)) {
        return { ...row, duplicateReason: "Excel dosyasında mükerrer satır bulundu." };
      }

      seenExcelKeys.add(comparableKey);
      return { ...row, duplicateReason: null };
    });
  };

  const refreshRows = async (
    updater: (currentRows: ParsedPreviewRow[]) => ParsedPreviewRow[]
  ) => {
    const updatedRows = updater(rows);
    const refreshed = await applyDuplicateChecks(updatedRows);
    setRows(refreshed);
    return refreshed;
  };

  const resetState = () => {
    setFileName("");
    setRows([]);
    setSearchTerm("");
    setFilterMode("all");
    setPage(1);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    setImportResult("");

    if (!file) {
      resetState();
      return;
    }

    try {
      setLoading(true);
      setCheckingDuplicates(false);
      setFileName(file.name);
      addLog("info", `${file.name} dosyası yüklenmeye başladı.`);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const preferredSheet =
        workbook.SheetNames.find((name) => normalizeLooseKey(name) === "properties") ??
        workbook.SheetNames[0];

      const sheet = workbook.Sheets[preferredSheet];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: false,
      });

      const preparedRows = jsonRows
        .map((row, index) => ({
          ...row,
          __rowNumber: index + 2,
        }))
        .filter((row) =>
          Object.entries(row).some(
            ([key, value]) => key !== "__rowNumber" && normalizeText(value) !== ""
          )
        )
        .map(buildNormalizedRow);

      addLog("success", `${preparedRows.length} satır okundu. Duplicate kontrolü başlatıldı.`);
      setCheckingDuplicates(true);

      const rowsWithDuplicateChecks = await applyDuplicateChecks(preparedRows);
      setRows(rowsWithDuplicateChecks);
      setPage(1);

      const invalidCount = rowsWithDuplicateChecks.filter((row) => row.errors.length > 0).length;
      const duplicateCount = rowsWithDuplicateChecks.filter((row) => !!row.duplicateReason).length;
      const validCount = rowsWithDuplicateChecks.filter(
        (row) => !row.isExcluded && row.errors.length === 0 && !row.duplicateReason
      ).length;

      addLog(
        "success",
        `Analiz tamamlandı. Geçerli: ${validCount}, hatalı: ${invalidCount}, mükerrer: ${duplicateCount}.`
      );
    } catch (error) {
      console.error("Excel parse error:", error);
      setRows([]);
      setImportResult("Excel dosyası okunamadı veya duplicate kontrolü yapılamadı.");
      addLog("error", "Excel dosyası okunamadı veya duplicate kontrolü yapılamadı.");
    } finally {
      setLoading(false);
      setCheckingDuplicates(false);
      event.target.value = "";
    }
  };

  const updateRowField = async (
    rowNumber: number,
    field: keyof ImportablePropertyRow,
    value: string
  ) => {
    await refreshRows((currentRows) =>
      currentRows.map((row) => {
        if (row.rowNumber !== rowNumber || !row.normalized) return row;

        const updatedNormalized: ImportablePropertyRow = { ...row.normalized };

        switch (field) {
          case "title":
            updatedNormalized.title = cleanTitle(value);
            break;
          case "description":
            updatedNormalized.description = cleanDescription(value);
            break;
          case "price":
            updatedNormalized.price = parseNumberWithFallback(value, 0);
            break;
          case "city":
            updatedNormalized.city = cleanTitle(value);
            break;
          case "district":
            updatedNormalized.district = cleanTitle(value) || null;
            break;
          case "property_type":
            updatedNormalized.property_type = value;
            break;
          case "status":
            updatedNormalized.status = value;
            break;
          case "location":
            updatedNormalized.location = cleanTitle(value);
            break;
          case "latitude":
            updatedNormalized.latitude = parseNullableNumber(value);
            break;
          case "longitude":
            updatedNormalized.longitude = parseNullableNumber(value);
            break;
          default:
            break;
        }

        const validationErrors = validateNormalizedRow(updatedNormalized);

        return {
          ...row,
          normalized: updatedNormalized,
          errors: validationErrors,
          geocodeStatus:
            field === "location" ||
            field === "city" ||
            field === "district" ||
            field === "latitude" ||
            field === "longitude"
              ? "idle"
              : row.geocodeStatus,
          geocodeMessage:
            field === "location" ||
            field === "city" ||
            field === "district" ||
            field === "latitude" ||
            field === "longitude"
              ? null
              : row.geocodeMessage,
        };
      })
    );
  };

  const handleToggleExcluded = async (rowNumber: number) => {
    await refreshRows((currentRows) =>
      currentRows.map((row) =>
        row.rowNumber === rowNumber ? { ...row, isExcluded: !row.isExcluded } : row
      )
    );
    addLog("info", `Satır ${rowNumber} hariç tutma durumu güncellendi.`);
  };

  const handleExcludeFiltered = async () => {
    const targetSet = new Set(filteredRows.map((row) => row.rowNumber));
    await refreshRows((currentRows) =>
      currentRows.map((row) =>
        targetSet.has(row.rowNumber) ? { ...row, isExcluded: true } : row
      )
    );
    addLog("warning", `${targetSet.size} satır importtan hariç tutuldu.`);
  };

  const handleIncludeAll = async () => {
    await refreshRows((currentRows) => currentRows.map((row) => ({ ...row, isExcluded: false })));
    addLog("success", "Hariç tutulan tüm satırlar tekrar dahil edildi.");
  };

  const applyBulkUpdateToFiltered = async (
    updater: (normalized: ImportablePropertyRow) => ImportablePropertyRow,
    successMessage: string
  ) => {
    const targetSet = new Set(
      filteredRows
        .filter((row) => row.normalized)
        .map((row) => row.rowNumber)
    );

    if (targetSet.size === 0) {
      addLog("warning", "Toplu işlem uygulanacak satır bulunamadı.");
      return;
    }

    await refreshRows((currentRows) =>
      currentRows.map((row) => {
        if (!targetSet.has(row.rowNumber) || !row.normalized) return row;

        const updatedNormalized = updater({ ...row.normalized });
        return {
          ...row,
          normalized: updatedNormalized,
          errors: validateNormalizedRow(updatedNormalized),
          geocodeStatus: "idle",
          geocodeMessage: null,
        };
      })
    );

    addLog("success", successMessage);
  };

  const handleBulkCityUpdate = async () => {
    if (!bulkCity.trim()) {
      addLog("warning", "Toplu şehir güncelleme için şehir gir.");
      return;
    }

    await applyBulkUpdateToFiltered(
      (normalized) => ({
        ...normalized,
        city: cleanTitle(bulkCity),
      }),
      `Filtredeki satırlara toplu şehir güncellemesi uygulandı: ${cleanTitle(bulkCity)}`
    );
  };

  const handleBulkDistrictUpdate = async () => {
    if (!bulkDistrict.trim()) {
      addLog("warning", "Toplu ilçe güncelleme için ilçe gir.");
      return;
    }

    await applyBulkUpdateToFiltered(
      (normalized) => ({
        ...normalized,
        district: cleanTitle(bulkDistrict),
      }),
      `Filtredeki satırlara toplu ilçe güncellemesi uygulandı: ${cleanTitle(bulkDistrict)}`
    );
  };

  const handleBulkStatusUpdate = async () => {
    await applyBulkUpdateToFiltered(
      (normalized) => ({
        ...normalized,
        status: bulkStatus,
      }),
      `Filtredeki satırlara toplu durum güncellemesi uygulandı.`
    );
  };

  const handleAutoFillCoordinates = async () => {
    if (geocodableRows.length === 0) {
      setImportResult("Koordinatı eksik geçerli satır bulunamadı.");
      addLog("warning", "Koordinatı eksik geçerli satır bulunamadı.");
      return;
    }

    try {
      setGeocoding(true);
      setImportResult("");
      addLog("info", `${geocodableRows.length} satır için koordinat doldurma işlemi başlatıldı.`);

      let nextRows = [...rows];

      for (const row of geocodableRows) {
        if (!row.normalized) continue;

        const query = buildGeocodeQuery(row.normalized);

        try {
          const result = await geocodeAddress(query);

          nextRows = nextRows.map((currentRow) => {
            if (currentRow.rowNumber !== row.rowNumber || !currentRow.normalized) {
              return currentRow;
            }

            if (
              typeof result.latitude === "number" &&
              typeof result.longitude === "number"
            ) {
              return {
                ...currentRow,
                normalized: {
                  ...currentRow.normalized,
                  latitude: result.latitude,
                  longitude: result.longitude,
                },
                geocodeStatus: "success" as const,
                geocodeMessage: result.displayName
                  ? `Koordinat bulundu: ${result.displayName}`
                  : "Koordinat bulundu.",
              };
            }

            return {
              ...currentRow,
              geocodeStatus: "not_found" as const,
              geocodeMessage: "Uygun koordinat bulunamadı.",
            };
          });
        } catch (error) {
          console.error("Geocode row error:", error);

          nextRows = nextRows.map((currentRow) => {
            if (currentRow.rowNumber !== row.rowNumber) return currentRow;

            return {
              ...currentRow,
              geocodeStatus: "error" as const,
              geocodeMessage: "Koordinat sorgusu başarısız oldu.",
            };
          });
        }

        setRows(nextRows);
        await sleep(1100);
      }

      const successCount = nextRows.filter((row) => row.geocodeStatus === "success").length;
      const notFoundCount = nextRows.filter((row) => row.geocodeStatus === "not_found").length;
      const errorCount = nextRows.filter((row) => row.geocodeStatus === "error").length;

      setImportResult(`${successCount} satır için koordinat dolduruldu.`);
      addLog(
        "success",
        `Koordinat işlemi tamamlandı. Başarılı: ${successCount}, bulunamadı: ${notFoundCount}, hata: ${errorCount}.`
      );
    } catch (error) {
      console.error("Geocode process error:", error);
      setImportResult("Koordinat doldurma sırasında hata oluştu.");
      addLog("error", "Koordinat doldurma sırasında hata oluştu.");
    } finally {
      setGeocoding(false);
    }
  };

  const handleImport = async () => {
    if (validPayload.length === 0) {
      setImportResult("İçe aktarılacak geçerli satır bulunamadı.");
      addLog("warning", "İçe aktarılacak geçerli satır bulunamadı.");
      return;
    }

    try {
      setImporting(true);
      setImportResult("");
      addLog("info", `${validPayload.length} ilan için içe aktarma işlemi başlatıldı.`);

      const chunkSize = 100;
      const chunks: ImportablePropertyRow[][] = [];
      for (let i = 0; i < validPayload.length; i += chunkSize) {
        chunks.push(validPayload.slice(i, i + chunkSize));
      }

      let importedCount = 0;

      for (const chunk of chunks) {
        const upsertRows = chunk.filter((item) => item.id);
        const insertRows = chunk.filter((item) => !item.id);

        if (upsertRows.length > 0) {
          const { error } = await (supabase.from("properties") as any).upsert(upsertRows, {
            onConflict: "id",
          });
          if (error) throw error;
          importedCount += upsertRows.length;
        }

        if (insertRows.length > 0) {
          const insertPayload = insertRows.map(({ id, ...rest }) => rest);
          const { error } = await (supabase.from("properties") as any).insert(insertPayload);
          if (error) throw error;
          importedCount += insertRows.length;
        }
      }

      setImportResult(`${importedCount} ilan başarıyla içe aktarıldı.`);
      addLog("success", `${importedCount} ilan başarıyla içe aktarıldı.`);
      resetState();

      if (onImported) {
        await onImported();
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportResult("Toplu ilan ekleme sırasında hata oluştu.");
      addLog("error", "Toplu ilan ekleme sırasında hata oluştu.");
    } finally {
      setImporting(false);
    }
  };

  const handleExportInvalidReport = () => {
    if (invalidRows.length === 0) {
      addLog("warning", "Dışa aktarılacak hatalı satır bulunamadı.");
      return;
    }

    const reportRows = invalidRows.map((row) => ({
      satir: row.rowNumber,
      baslik: row.normalized?.title || normalizeText(row.raw.title),
      sehir: row.normalized?.city || normalizeText(row.raw.city),
      ilce: row.normalized?.district || normalizeText(row.raw.district),
      fiyat: row.normalized?.price || normalizeText(row.raw.price),
      hatalar: row.errors.join(" | "),
    }));

    exportWorkbookFromJson("import_hata_raporu.xlsx", "hatali_satirlar", reportRows);
    addLog("success", `${reportRows.length} satırlık hata raporu dışa aktarıldı.`);
  };

  const handleExportDuplicateReport = () => {
    if (duplicateRows.length === 0) {
      addLog("warning", "Dışa aktarılacak mükerrer satır bulunamadı.");
      return;
    }

    const reportRows = duplicateRows.map((row) => ({
      satir: row.rowNumber,
      baslik: row.normalized?.title || "-",
      sehir: row.normalized?.city || "-",
      ilce: row.normalized?.district || "-",
      fiyat: row.normalized?.price || "-",
      emlak_turu: row.normalized?.property_type || "-",
      neden: row.duplicateReason || "-",
    }));

    exportWorkbookFromJson("import_mukerrer_raporu.xlsx", "mukerrer_satirlar", reportRows);
    addLog("success", `${reportRows.length} satırlık mükerrer raporu dışa aktarıldı.`);
  };

  const handleExportGeocodeReport = () => {
    if (geocodeResultRows.length === 0) {
      addLog("warning", "Dışa aktarılacak koordinat sonucu bulunamadı.");
      return;
    }

    const reportRows = geocodeResultRows.map((row) => ({
      satir: row.rowNumber,
      baslik: row.normalized?.title || "-",
      sehir: row.normalized?.city || "-",
      ilce: row.normalized?.district || "-",
      konum: row.normalized?.location || "-",
      latitude: row.normalized?.latitude ?? "",
      longitude: row.normalized?.longitude ?? "",
      sonuc: row.geocodeStatus,
      aciklama: row.geocodeMessage || "-",
    }));

    exportWorkbookFromJson(
      "import_koordinat_sonuclari.xlsx",
      "koordinat_sonuclari",
      reportRows
    );
    addLog("success", `${reportRows.length} satırlık koordinat raporu dışa aktarıldı.`);
  };

  const filteredRows = useMemo(() => {
    const term = normalizeComparableText(searchTerm);

    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        normalizeComparableText(row.normalized?.title || "").includes(term) ||
        normalizeComparableText(row.normalized?.city || "").includes(term) ||
        normalizeComparableText(row.normalized?.district || "").includes(term) ||
        normalizeComparableText(row.normalized?.location || "").includes(term);

      if (!matchesSearch) return false;

      switch (filterMode) {
        case "valid":
          return !row.isExcluded && row.errors.length === 0 && !row.duplicateReason;
        case "invalid":
          return row.errors.length > 0;
        case "duplicate":
          return !!row.duplicateReason;
        case "missing_coordinates":
          return (
            !row.isExcluded &&
            row.errors.length === 0 &&
            !row.duplicateReason &&
            row.normalized !== null &&
            (row.normalized.latitude === null || row.normalized.longitude === null)
          );
        default:
          return true;
      }
    });
  }, [rows, searchTerm, filterMode]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filteredRows.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRows, page]);

  const selectedVisibleCount = useMemo(
    () => filteredRows.filter((row) => !row.isExcluded).length,
    [filteredRows]
  );

  const visibleExcludedCount = useMemo(
    () => filteredRows.filter((row) => row.isExcluded).length,
    [filteredRows]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Excel ile Toplu İlan Yükleme
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Excel satırları okunur, eksik veriler mümkün olduğunca otomatik tamamlanır,
            hatalı ve mükerrer satırlar ayrı gösterilir. Eksik koordinatlar da otomatik
            doldurulabilir.
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={downloadTemplateWorkbook}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-medium text-emerald-700 transition hover:bg-emerald-100"
        >
          <Download className="h-4 w-4" />
          Örnek Excel Şablonunu İndir
        </button>

        <div className="text-sm text-slate-500">
          Şablonda örnek ilanlar ve rehber sayfası hazır gelir.
        </div>
      </div>

      {logs.length > 0 ? (
        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">İşlem Özeti / Import Log</h3>
            <button
              type="button"
              onClick={() => setLogs([])}
              className="text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Temizle
            </button>
          </div>

          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`rounded-xl px-4 py-3 text-sm ${
                  log.type === "success"
                    ? "bg-emerald-50 text-emerald-800"
                    : log.type === "warning"
                    ? "bg-amber-50 text-amber-800"
                    : log.type === "error"
                    ? "bg-rose-50 text-rose-800"
                    : "bg-white text-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>{log.message}</div>
                  <div className="shrink-0 text-xs opacity-70">{log.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => setShowGuide((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/10 p-2 text-brand">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">
                Desteklenen Kolonlar ve Örnek Değerler
              </div>
              <div className="text-sm text-slate-500">
                Excel hazırlarken hangi sütun adlarını kullanabileceğini burada görebilirsin.
              </div>
            </div>
          </div>

          <div className="text-slate-500">
            {showGuide ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </button>

        {showGuide && (
          <div className="border-t border-slate-200 bg-white">
            <div className="px-4 py-4">
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Zorunlu kolonlar: <span className="font-semibold">{REQUIRED_FIELDS.join(", ")}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Alan</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Desteklenen Kolon Adları</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Örnek Değer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COLUMN_GUIDE.map((item) => (
                      <tr key={item.label} className="border-t border-slate-100">
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-slate-900">{item.label}</div>
                          {item.required ? (
                            <div className="mt-1 inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                              Zorunlu
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">{item.aliases.join(", ")}</td>
                        <td className="px-4 py-3 align-top text-slate-700">{item.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Görseller için bir hücre içinde birden fazla URL kullanacaksan{" "}
                <span className="font-semibold">|</span> karakteriyle ayır.
                Örnek: <span className="font-semibold">url1|url2|url3</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-brand hover:bg-white">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <Upload className="h-5 w-5 text-slate-500" />
        <div>
          <div className="font-medium text-slate-900">Excel dosyasını yüklemek için tıkla</div>
          <div className="text-sm text-slate-500">Desteklenen formatlar: .xlsx, .xls, .csv</div>
        </div>
      </label>

      {fileName ? (
        <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          Yüklenen dosya: <span className="font-semibold">{fileName}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-4 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Excel okunuyor...
        </div>
      ) : null}

      {checkingDuplicates ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-4 text-slate-600">
          <Search className="h-5 w-5 animate-pulse" />
          Mükerrer ilan kontrolü yapılıyor...
        </div>
      ) : null}

      {geocoding ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-4 text-slate-600">
          <MapPinned className="h-5 w-5 animate-pulse" />
          Eksik koordinatlar dolduruluyor...
        </div>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-7">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Toplam Satır</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{summary.totalRows}</div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm text-emerald-700">İçe Aktarılacak</div>
              <div className="mt-1 text-2xl font-bold text-emerald-800">{summary.validRows}</div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-sm text-rose-700">Hatalı Satır</div>
              <div className="mt-1 text-2xl font-bold text-rose-800">{summary.invalidRows}</div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm text-amber-700">Mükerrer Satır</div>
              <div className="mt-1 text-2xl font-bold text-amber-800">{summary.duplicateRows}</div>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <div className="text-sm text-sky-700">Koordinatı Olan</div>
              <div className="mt-1 text-2xl font-bold text-sky-800">{summary.rowsWithCoordinates}</div>
            </div>

            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <div className="text-sm text-violet-700">Koordinatı Eksik</div>
              <div className="mt-1 text-2xl font-bold text-violet-800">{summary.rowsMissingCoordinates}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Hariç Tutulan</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{summary.excludedRows}</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Ara</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Başlık, şehir, ilçe, konum ara..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Filtre</label>
              <select
                value={filterMode}
                onChange={(e) => {
                  setFilterMode(e.target.value as FilterMode);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                <option value="all">Tümü</option>
                <option value="valid">Sadece Geçerli</option>
                <option value="invalid">Sadece Hatalı</option>
                <option value="duplicate">Sadece Mükerrer</option>
                <option value="missing_coordinates">Sadece Koordinatı Eksik</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <div className="rounded-xl bg-white px-4 py-2 text-sm text-slate-700">
                Görünen aktif: <span className="font-semibold">{selectedVisibleCount}</span> • Hariç:{" "}
                <span className="font-semibold">{visibleExcludedCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Toplu Şehir</label>
              <input
                value={bulkCity}
                onChange={(e) => setBulkCity(e.target.value)}
                placeholder="Örn: Denizli"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Toplu İlçe</label>
              <input
                value={bulkDistrict}
                onChange={(e) => setBulkDistrict(e.target.value)}
                placeholder="Örn: Pamukkale"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Toplu Durum</label>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={handleBulkCityUpdate}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
              >
                Şehri Uygula
              </button>
              <button
                type="button"
                onClick={handleBulkDistrictUpdate}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
              >
                İlçeyi Uygula
              </button>
              <button
                type="button"
                onClick={handleBulkStatusUpdate}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
              >
                Durumu Uygula
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleAutoFillCoordinates}
              disabled={geocoding || geocodableRows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPinned className="h-4 w-4" />}
              {geocoding ? "Koordinatlar dolduruluyor..." : `${geocodableRows.length} satıra koordinat doldur`}
            </button>

            <button
              type="button"
              onClick={handleExcludeFiltered}
              disabled={filteredRows.length === 0}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Filtredekileri Hariç Tut
            </button>

            <button
              type="button"
              onClick={handleIncludeAll}
              disabled={summary.excludedRows === 0}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hariçleri Tekrar Dahil Et
            </button>

            <button
              type="button"
              onClick={handleExportInvalidReport}
              disabled={invalidRows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              Hata Raporu
            </button>

            <button
              type="button"
              onClick={handleExportDuplicateReport}
              disabled={duplicateRows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              Mükerrer Raporu
            </button>

            <button
              type="button"
              onClick={handleExportGeocodeReport}
              disabled={geocodeResultRows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 font-medium text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              Koordinat Raporu
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4 text-brand" />
                <h3 className="font-semibold text-slate-900">Düzenlenebilir Önizleme</h3>
              </div>
              <p className="text-sm text-slate-500">
                Import etmeden önce panel içinden düzelt. Sayfa başına {ROWS_PER_PAGE} satır gösterilir.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1550px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Durum</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Satır</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Başlık</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Fiyat</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Şehir</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">İlçe</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Tür</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Durum</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Konum</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Latitude</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Longitude</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Açıklama</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Sonuç</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row) => {
                    const normalized = row.normalized;

                    return (
                      <tr key={row.rowNumber} className="border-t border-slate-100 align-top">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void handleToggleExcluded(row.rowNumber)}
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              row.isExcluded
                                ? "bg-slate-200 text-slate-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {row.isExcluded ? "Hariç" : "Dahil"}
                          </button>
                        </td>

                        <td className="px-4 py-3 text-slate-700">{row.rowNumber}</td>

                        <td className="px-4 py-3">
                          <input
                            value={normalized?.title ?? ""}
                            onChange={(e) => void updateRowField(row.rowNumber, "title", e.target.value)}
                            className="w-56 rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            value={normalized?.price ?? 0}
                            onChange={(e) => void updateRowField(row.rowNumber, "price", e.target.value)}
                            className="w-32 rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            value={normalized?.city ?? ""}
                            onChange={(e) => void updateRowField(row.rowNumber, "city", e.target.value)}
                            className="w-36 rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            value={normalized?.district ?? ""}
                            onChange={(e) => void updateRowField(row.rowNumber, "district", e.target.value)}
                            className="w-36 rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={normalized?.property_type ?? "apartment"}
                            onChange={(e) => void updateRowField(row.rowNumber, "property_type", e.target.value)}
                            className="w-40 rounded-lg border border-slate-300 px-3 py-2"
                          >
                            {PROPERTY_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={normalized?.status ?? "for_sale"}
                            onChange={(e) => void updateRowField(row.rowNumber, "status", e.target.value)}
                            className="w-32 rounded-lg border border-slate-300 px-3 py-2"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-3">
                          <input
                            value={normalized?.location ?? ""}
                            onChange={(e) => void updateRowField(row.rowNumber, "location", e.target.value)}
                            className="w-44 rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            value={normalized?.latitude ?? ""}
                            onChange={(e) => void updateRowField(row.rowNumber, "latitude", e.target.value)}
                            className="w-32 rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            value={normalized?.longitude ?? ""}
                            onChange={(e) => void updateRowField(row.rowNumber, "longitude", e.target.value)}
                            className="w-32 rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <textarea
                            value={normalized?.description ?? ""}
                            onChange={(e) => void updateRowField(row.rowNumber, "description", e.target.value)}
                            className="min-h-[88px] w-72 rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-4 py-3">
                          {row.isExcluded ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              Hariç Tutuldu
                            </span>
                          ) : row.errors.length > 0 ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                                <XCircle className="h-3.5 w-3.5" />
                                Hatalı
                              </span>
                              <div className="max-w-[180px] text-xs text-rose-700">
                                {row.errors.join(" | ")}
                              </div>
                            </div>
                          ) : row.duplicateReason ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Mükerrer
                              </span>
                              <div className="max-w-[180px] text-xs text-amber-700">
                                {row.duplicateReason}
                              </div>
                            </div>
                          ) : row.geocodeStatus === "success" ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                                <MapPinned className="h-3.5 w-3.5" />
                                Koordinat bulundu
                              </span>
                              <div className="max-w-[180px] text-xs text-sky-700">
                                {row.geocodeMessage}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Geçerli
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <div className="text-sm text-slate-500">
                Toplam görünür: {filteredRows.length} • Sayfa {page}/{totalPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {invalidRows.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-rose-800">
                <XCircle className="h-5 w-5" />
                <h3 className="font-semibold">Hatalı Satırlar</h3>
              </div>

              <div className="space-y-3">
                {invalidRows.slice(0, 20).map((row) => (
                  <div key={row.rowNumber} className="rounded-xl bg-white/70 px-4 py-3">
                    <div className="font-medium text-slate-900">Satır {row.rowNumber}</div>
                    <ul className="mt-1 space-y-1 text-sm text-slate-700">
                      {row.errors.map((error) => (
                        <li key={error}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {duplicateRows.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-5 w-5" />
                <h3 className="font-semibold">Mükerrer Satırlar</h3>
              </div>

              <div className="space-y-3">
                {duplicateRows.slice(0, 20).map((row) => (
                  <div key={row.rowNumber} className="rounded-xl bg-white/70 px-4 py-3">
                    <div className="font-medium text-slate-900">Satır {row.rowNumber}</div>
                    <div className="mt-1 text-sm text-slate-700">{row.normalized?.title || "-"}</div>
                    <div className="mt-1 text-sm text-amber-800">{row.duplicateReason}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {geocodeResultRows.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sky-800">
                <MapPinned className="h-5 w-5" />
                <h3 className="font-semibold">Koordinat Sonuçları</h3>
              </div>

              <div className="space-y-3">
                {geocodeResultRows.slice(0, 20).map((row) => (
                  <div key={row.rowNumber} className="rounded-xl bg-white/70 px-4 py-3">
                    <div className="font-medium text-slate-900">Satır {row.rowNumber}</div>
                    <div className="mt-1 text-sm text-slate-700">{row.normalized?.title || "-"}</div>
                    <div className="mt-1 text-sm text-sky-800">{row.geocodeMessage || "-"}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || validPayload.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {importing ? "İçe aktarılıyor..." : `${validPayload.length} ilanı içe aktar`}
            </button>

            <div className="text-sm text-slate-500">
              Seçili aktif satır: {selectedRowNumbers.length - summary.excludedRows} • Zorunlu alanlar: {REQUIRED_FIELDS.join(", ")}
            </div>
          </div>
        </>
      ) : null}

      {importResult ? (
        <div className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-800">
          {importResult}
        </div>
      ) : null}
    </div>
  );
}