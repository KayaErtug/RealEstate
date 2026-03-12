// src/components/BulkPropertyImportPanel.tsx
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PropertyInsert } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

interface BulkPropertyImportPanelProps {
  onImported?: () => void;
}

type ParsedRow = Record<string, unknown>;

type ValidationError = {
  rowNumber: number;
  title: string;
  message: string;
};

function normalizeKey(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function parseNullableText(value: unknown): string | null {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

function parseRequiredText(value: unknown, fieldName: string): string {
  const text = String(value ?? '').trim();
  if (!text) {
    throw new Error(`${fieldName} boş olamaz`);
  }
  return text;
}

function parseBoolean(value: unknown, defaultValue = false): boolean {
  const text = String(value ?? '').trim().toLowerCase();

  if (!text) return defaultValue;
  if (['true', '1', 'evet', 'yes', 'var'].includes(text)) return true;
  if (['false', '0', 'hayır', 'hayir', 'no', 'yok'].includes(text)) return false;

  return defaultValue;
}

function parseNumber(value: unknown, fieldName: string, nullable = false): number | null {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return nullable ? null : 0;
  }

  let normalized = raw.replace(/\s/g, '');

  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.');
  }

  const num = Number(normalized);

  if (Number.isNaN(num)) {
    throw new Error(`${fieldName} sayısal değil`);
  }

  return num;
}

function parseImages(value: unknown): string[] {
  return String(value ?? '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isEmptyRow(row: ParsedRow) {
  return Object.values(row).every((value) => String(value ?? '').trim() === '');
}

export default function BulkPropertyImportPanel({ onImported }: BulkPropertyImportPanelProps) {
  const { user, profile } = useAuth();

  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);

  const resetAll = () => {
    setFileName('');
    setRows([]);
    setErrors([]);
  };

  const transformRows = (inputRows: ParsedRow[]) => {
    const parsed: ParsedRow[] = [];
    const validationErrors: ValidationError[] = [];

    inputRows.forEach((rawRow, index) => {
      const rowNumber = index + 2;
      const row: ParsedRow = {};

      Object.entries(rawRow).forEach(([key, value]) => {
        row[normalizeKey(key)] = value;
      });

      if (isEmptyRow(row)) {
        return;
      }

      try {
        const title = String(row.title ?? '').trim();

        const property: PropertyInsert = {
          title: parseRequiredText(row.title, 'title'),
          description: parseRequiredText(row.description, 'description'),
          property_type: parseRequiredText(row.property_type, 'property_type'),
          status: parseRequiredText(row.status, 'status'),
          price: Number(parseNumber(row.price, 'price')),
          currency: parseRequiredText(row.currency, 'currency'),
          location: parseRequiredText(row.location, 'location'),
          city: parseRequiredText(row.city, 'city'),
          district: parseNullableText(row.district),
          area: Number(parseNumber(row.area, 'area')),
          net_area: parseNumber(row.net_area, 'net_area', true),
          gross_area: parseNumber(row.gross_area, 'gross_area', true),
          rooms: Number(parseNumber(row.rooms, 'rooms')),
          bathrooms: Number(parseNumber(row.bathrooms, 'bathrooms')),
          floor: parseNumber(row.floor, 'floor', true),
          total_floors: parseNumber(row.total_floors, 'total_floors', true),
          building_age: parseNumber(row.building_age, 'building_age', true),
          heating: parseNullableText(row.heating),
          dues: parseNumber(row.dues, 'dues', true),
          frontage: parseNullableText(row.frontage),
          deed_status: parseNullableText(row.deed_status),
          usage_status: parseNullableText(row.usage_status),
          in_site: parseBoolean(row.in_site, false),
          site_name: parseNullableText(row.site_name),
          balcony_count: parseNumber(row.balcony_count, 'balcony_count', true),
          pool: parseBoolean(row.pool, false),
          security: parseBoolean(row.security, false),
          furnished: parseBoolean(row.furnished, false),
          parking: parseBoolean(row.parking, false),
          elevator: parseBoolean(row.elevator, false),
          balcony: parseBoolean(row.balcony, false),
          garden: parseBoolean(row.garden, false),
          images: parseImages(row.images),
          moderation_status: parseNullableText(row.moderation_status) || 'approved',
          approved_at:
            (parseNullableText(row.moderation_status) || 'approved') === 'approved'
              ? new Date().toISOString()
              : null,
          approved_by: null,
          contact_name: parseNullableText(row.contact_name) || profile?.display_name || null,
          contact_phone: parseNullableText(row.contact_phone) || profile?.phone || null,
          featured: parseBoolean(row.featured, false),
          user_id: parseNullableText(row.user_id) || user?.id || null,
        };

        parsed.push(property as unknown as ParsedRow);

        if (!title) {
          throw new Error('title boş olamaz');
        }
      } catch (error) {
        validationErrors.push({
          rowNumber,
          title: String(row.title ?? ''),
          message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        });
      }
    });

    setRows(parsed);
    setErrors(validationErrors);
  };

  const readFile = async (file: File) => {
    setFileName(file.name);

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      setRows([]);
      setErrors([
        {
          rowNumber: 0,
          title: '',
          message: 'Excel sayfası bulunamadı',
        },
      ]);
      return;
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const jsonRows = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, {
      defval: '',
      raw: false,
    });

    transformRows(jsonRows);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await readFile(file);
  };

  const handleImport = async () => {
    if (!rows.length || errors.length > 0) return;

    setLoading(true);

    try {
      const chunkSize = 50;

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize) as PropertyInsert[];

        const { error } = await supabase.from('properties').insert(chunk);

        if (error) {
          throw error;
        }
      }

      alert(`${rows.length} ilan başarıyla yüklendi.`);
      resetAll();
      onImported?.();
    } catch (error) {
      console.error('Bulk import error:', error);
      alert('Toplu yükleme sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-50 p-3">
          <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Excel ile Toplu İlan Yükleme</h2>
          <p className="text-sm text-gray-500">
            Gayrimenkul Excel dosyanı sürükleyip bırak veya seçerek tek seferde yükle.
          </p>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (!file) return;
          await readFile(file);
        }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <Upload className="mx-auto mb-3 h-10 w-10 text-gray-400" />
        <div className="mb-2 text-base font-medium text-gray-800">
          Excel dosyasını buraya bırak
        </div>
        <div className="mb-4 text-sm text-gray-500">.xlsx veya .xls dosyası seçebilirsin</div>

        <label className="inline-flex cursor-pointer items-center rounded-xl bg-cta px-5 py-3 font-medium text-white transition-colors hover:bg-cta-hover">
          Dosya Seç
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {fileName && (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Dosya:</span> {fileName}
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Temizle
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm text-gray-500">Hazır Satır</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{rows.length}</div>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="text-sm text-green-700">Geçerli Durum</div>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            {errors.length === 0 ? 'Hazır' : 'Kontrol Gerekli'}
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm text-amber-700">Hata Sayısı</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{errors.length}</div>
        </div>
      </div>

      {previewRows.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Önizleme</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Başlık</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Tür</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Durum</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Şehir</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Fiyat</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Öne Çıkan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {previewRows.map((row, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">{String(row.title ?? '')}</td>
                    <td className="px-3 py-2">{String(row.property_type ?? '')}</td>
                    <td className="px-3 py-2">{String(row.status ?? '')}</td>
                    <td className="px-3 py-2">{String(row.city ?? '')}</td>
                    <td className="px-3 py-2">{String(row.price ?? '')}</td>
                    <td className="px-3 py-2">{String(row.featured ?? '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Excel içinde düzeltmen gereken satırlar var</span>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {errors.map((errorItem, index) => (
              <div key={index} className="rounded-lg bg-white px-3 py-2 text-sm text-gray-700">
                <span className="font-semibold">Satır {errorItem.rowNumber}</span>
                {errorItem.title ? ` - ${errorItem.title}` : ''} : {errorItem.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleImport}
          disabled={!rows.length || errors.length > 0 || loading}
          className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? 'Yükleniyor...' : 'İlanları Sisteme Yükle'}
        </button>

        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          İlk sheet okunur. Boş satırlar otomatik atlanır.
        </div>
      </div>
    </div>
  );
}