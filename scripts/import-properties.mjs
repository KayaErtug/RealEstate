// scripts/import-properties.mjs
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const env = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) continue;

    const key = trimmed.slice(0, equalIndex).trim();
    let value = trimmed.slice(equalIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

const fileEnv = readEnvFile(envPath);

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  fileEnv.VITE_SUPABASE_URL ||
  fileEnv.SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  fileEnv.VITE_SUPABASE_ANON_KEY ||
  fileEnv.SUPABASE_ANON_KEY ||
  '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase env bilgileri eksik.');
  console.error('Gerekli alanlar: VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const csvFileArg = process.argv[2] || 'properties_import.csv';
const csvPath = path.resolve(process.cwd(), csvFileArg);

if (!fs.existsSync(csvPath)) {
  console.error(`CSV dosyası bulunamadı: ${csvPath}`);
  process.exit(1);
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .replace(/^\uFEFF/, '')
    .toLowerCase();
}

function parseCsv(content, delimiter = ';') {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }

      row.push(current);
      rows.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['true', '1', 'yes', 'evet', 'var'].includes(normalized)) return true;
  if (['false', '0', 'no', 'hayir', 'hayır', 'yok'].includes(normalized)) return false;

  return defaultValue;
}

function parseNullableText(value) {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function parseRequiredText(value, fieldName) {
  const trimmed = String(value || '').trim();

  if (!trimmed) {
    throw new Error(`Zorunlu alan boş: ${fieldName}`);
  }

  return trimmed;
}

function parseNumber(value, { nullable = false, fieldName = '' } = {}) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return nullable ? null : 0;
  }

  let normalized = String(value).trim();

  normalized = normalized.replace(/\s/g, '');

  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.');
  }

  const num = Number(normalized);

  if (Number.isNaN(num)) {
    throw new Error(`Sayısal alan okunamadı: ${fieldName || value}`);
  }

  return num;
}

function parseImages(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];

  return raw
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function detectDelimiter(firstLine) {
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  return semicolonCount >= commaCount ? ';' : ',';
}

function buildRowObject(headers, values) {
  const obj = {};

  headers.forEach((header, index) => {
    obj[header] = values[index] ?? '';
  });

  return obj;
}

function isCompletelyEmptyRow(obj) {
  return Object.values(obj).every((value) => String(value || '').trim() === '');
}

function toPropertyInsert(row) {
  return {
    title: parseRequiredText(row.title, 'title'),
    description: parseRequiredText(row.description, 'description'),
    property_type: parseRequiredText(row.property_type, 'property_type'),
    status: parseRequiredText(row.status, 'status'),
    price: parseNumber(row.price, { fieldName: 'price' }),
    currency: parseRequiredText(row.currency, 'currency'),
    location: parseRequiredText(row.location, 'location'),
    city: parseRequiredText(row.city, 'city'),
    district: parseNullableText(row.district),
    area: parseNumber(row.area, { fieldName: 'area' }),
    net_area: parseNumber(row.net_area, { nullable: true, fieldName: 'net_area' }),
    gross_area: parseNumber(row.gross_area, { nullable: true, fieldName: 'gross_area' }),
    rooms: parseNumber(row.rooms, { fieldName: 'rooms' }),
    bathrooms: parseNumber(row.bathrooms, { fieldName: 'bathrooms' }),
    floor: parseNumber(row.floor, { nullable: true, fieldName: 'floor' }),
    total_floors: parseNumber(row.total_floors, { nullable: true, fieldName: 'total_floors' }),
    building_age: parseNumber(row.building_age, { nullable: true, fieldName: 'building_age' }),
    heating: parseNullableText(row.heating),
    dues: parseNumber(row.dues, { nullable: true, fieldName: 'dues' }),
    frontage: parseNullableText(row.frontage),
    deed_status: parseNullableText(row.deed_status),
    usage_status: parseNullableText(row.usage_status),
    in_site: parseBoolean(row.in_site, false),
    site_name: parseNullableText(row.site_name),
    balcony_count: parseNumber(row.balcony_count, { nullable: true, fieldName: 'balcony_count' }),
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
    contact_name: parseNullableText(row.contact_name),
    contact_phone: parseNullableText(row.contact_phone),
    featured: parseBoolean(row.featured, false),
    user_id: parseNullableText(row.user_id),
  };
}

async function main() {
  const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
  const firstLine = raw.split(/\r?\n/)[0] || '';
  const delimiter = detectDelimiter(firstLine);

  const parsedRows = parseCsv(raw, delimiter);

  if (parsedRows.length < 2) {
    console.error('CSV içinde veri bulunamadı.');
    process.exit(1);
  }

  const headers = parsedRows[0].map(normalizeHeader);
  const dataRows = parsedRows.slice(1);

  const validRows = [];
  const errors = [];

  dataRows.forEach((values, index) => {
    const lineNumber = index + 2;
    const rowObject = buildRowObject(headers, values);

    if (isCompletelyEmptyRow(rowObject)) {
      return;
    }

    try {
      const property = toPropertyInsert(rowObject);
      validRows.push(property);
    } catch (error) {
      errors.push({
        line: lineNumber,
        message: error instanceof Error ? error.message : String(error),
        title: rowObject.title || '',
      });
    }
  });

  if (errors.length > 0) {
    console.error('CSV doğrulama hataları bulundu:\n');
    for (const err of errors) {
      console.error(`Satır ${err.line}: ${err.message}${err.title ? ` | Başlık: ${err.title}` : ''}`);
    }
    process.exit(1);
  }

  if (validRows.length === 0) {
    console.error('İçe aktarılacak geçerli satır bulunamadı.');
    process.exit(1);
  }

  console.log(`Toplam geçerli ilan: ${validRows.length}`);
  console.log('Yükleme başlıyor...\n');

  const chunkSize = 100;
  let insertedCount = 0;

  for (let i = 0; i < validRows.length; i += chunkSize) {
    const chunk = validRows.slice(i, i + chunkSize);

    const { error } = await supabase.from('properties').insert(chunk);

    if (error) {
      console.error('Supabase insert hatası:', error.message);
      process.exit(1);
    }

    insertedCount += chunk.length;
    console.log(`Yüklenen ilan: ${insertedCount}/${validRows.length}`);
  }

  console.log('\nTüm gayrimenkul ilanları başarıyla yüklendi.');
}

main().catch((error) => {
  console.error('Import işlemi başarısız:', error);
  process.exit(1);
});