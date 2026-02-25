import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const STORAGE_KEY = 'varol_cookie_consent'; // 'accepted' | 'rejected'

export default function CookieBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing !== 'accepted' && existing !== 'rejected') {
      setVisible(true);
    }
  }, []);

  const choose = (value: 'accepted' | 'rejected') => {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-200 p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
        <p className="text-sm text-gray-700 flex-1">{t('cookie.text')}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => choose('rejected')}
            className="px-4 py-2 rounded-lg border border-brand text-brand hover:bg-brand/5 transition-colors text-sm font-medium"
          >
            {t('cookie.reject')}
          </button>
          <button
            onClick={() => choose('accepted')}
            className="px-4 py-2 rounded-lg bg-cta text-white hover:bg-cta-hover transition-colors text-sm font-semibold"
          >
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
