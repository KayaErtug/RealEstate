// scripts/generate-sitemap.mjs
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');
const envPath = path.join(rootDir, '.env');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');
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

const SITE_URL =
  process.env.VITE_SITE_URL ||
  fileEnv.VITE_SITE_URL ||
  'https://varolgayrimenkul.com';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  fileEnv.VITE_SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  fileEnv.VITE_SUPABASE_ANON_KEY ||
  '';

function normalizeUrl(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const baseUrl = normalizeUrl(SITE_URL);

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function createUrlTag(loc, lastmod, priority, changefreq) {
  return [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${xmlEscape(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${xmlEscape(changefreq)}</changefreq>` : null,
    priority ? `    <priority>${xmlEscape(priority)}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

async function fetchSupabaseRows(tableName, queryString = 'select=*') {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(`[sitemap] Supabase env eksik. ${tableName} alınamadı.`);
    return [];
  }

  const url = `${normalizeUrl(SUPABASE_URL)}/rest/v1/${tableName}?${queryString}`;

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`[sitemap] ${tableName} alınamadı: ${response.status} ${errorText}`);
    return [];
  }

  const json = await response.json();
  return Array.isArray(json) ? json : [];
}

async function generateSitemap() {
  const now = new Date().toISOString();

  const staticPages = [
    {
      loc: `${baseUrl}/`,
      lastmod: now,
      priority: '1.0',
      changefreq: 'daily',
    },
    {
      loc: `${baseUrl}/properties`,
      lastmod: now,
      priority: '0.95',
      changefreq: 'daily',
    },
    {
      loc: `${baseUrl}/vehicles`,
      lastmod: now,
      priority: '0.90',
      changefreq: 'daily',
    },
    {
      loc: `${baseUrl}/rehber`,
      lastmod: now,
      priority: '0.90',
      changefreq: 'weekly',
    },
    {
      loc: `${baseUrl}/contact`,
      lastmod: now,
      priority: '0.70',
      changefreq: 'monthly',
    },
  ];

  const [propertyRows, vehicleRows, blogRows] = await Promise.all([
    fetchSupabaseRows(
      'properties',
      'select=id,created_at,updated_at,moderation_status&moderation_status=eq.approved&order=created_at.desc'
    ),
    fetchSupabaseRows(
      'vehicles',
      'select=id,created_at,updated_at,moderation_status&moderation_status=eq.approved&order=created_at.desc'
    ),
    fetchSupabaseRows(
      'blog_posts',
      'select=slug,created_at,published&published=eq.true&order=created_at.desc'
    ),
  ]);

  const propertyPages = propertyRows
    .filter((row) => row.id)
    .map((row) => ({
      loc: `${baseUrl}/properties/${row.id}`,
      lastmod: row.updated_at || row.created_at || now,
      priority: '0.85',
      changefreq: 'weekly',
    }));

  const vehiclePages = vehicleRows
    .filter((row) => row.id)
    .map((row) => ({
      loc: `${baseUrl}/vehicles/${row.id}`,
      lastmod: row.updated_at || row.created_at || now,
      priority: '0.80',
      changefreq: 'weekly',
    }));

  const blogPages = blogRows
    .filter((row) => row.slug)
    .map((row) => ({
      loc: `${baseUrl}/rehber/${row.slug}`,
      lastmod: row.created_at || now,
      priority: '0.75',
      changefreq: 'monthly',
    }));

  const allPages = [
    ...staticPages,
    ...propertyPages,
    ...vehiclePages,
    ...blogPages,
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...allPages.map((page) =>
      createUrlTag(page.loc, page.lastmod, page.priority, page.changefreq)
    ),
    '</urlset>',
    '',
  ].join('\n');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf-8');

  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf-8');
  }

  console.log(`[sitemap] sitemap.xml oluşturuldu. Toplam URL: ${allPages.length}`);
}

generateSitemap().catch((error) => {
  console.error('[sitemap] oluşturulamadı:', error);
  process.exit(1);
});