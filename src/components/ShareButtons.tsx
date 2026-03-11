import { useMemo, useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type Lang = 'tr' | 'en';

interface Props {
  title: string;
}

export default function ShareButtons({ title }: Props) {
  const { language, t } = useLanguage() as { language: Lang; t: (k: string) => string };
  const [copied, setCopied] = useState(false);

  const safeT = (key: string, trFallback: string, enFallback: string) => {
    const out = t(key);
    if (out === key) return language === 'tr' ? trFallback : enFallback;
    return out;
  };

  const url = useMemo(() => (typeof window !== 'undefined' ? window.location.href : ''), []);

  const waLink = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
  const fbLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  // Instagram web’de direkt “share link” yok. En iyi çözüm: Web Share (mobilde IG dahil) + Copy Link
  const webShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
        return;
      }
      // fallback: kopyala
      await copyLink();
    } catch {
      // ignore
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard kapalı olabilir
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={webShare}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
      >
        <Share2 className="h-4 w-4" />
        {safeT('share.webshare', 'Paylaş', 'Share')}
      </button>

      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
      >
        WhatsApp
      </a>

      <a
        href={fbLink}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      >
        Facebook
      </a>

      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50"
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        {copied ? safeT('share.copied', 'Kopyalandı!', 'Copied!') : safeT('share.copy', 'Linki Kopyala', 'Copy link')}
      </button>
    </div>
  );
}