import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AiChatWidget() {
  const { t, language } = useLanguage();
  const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY as string | undefined;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const listRef = useRef<HTMLDivElement | null>(null);

  const systemPrompt = useMemo(() => {
    // Keep it simple and safe. Always reply in current UI language.
    return language === 'tr'
      ? 'Sen Varol Gayrimenkul AI asistanısın. Kısa, net ve yardımcı cevaplar ver. Gayrimenkul ve site kullanımıyla ilgili sorularda yardımcı ol.'
      : 'You are the Varol Real Estate AI assistant. Reply concisely and helpfully. Assist with real estate and website usage questions.';
  }, [language]);

  useEffect(() => {
    // Ensure we have a greeting message
    setMessages([{ role: 'assistant', content: t('ai.greeting') }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;

    if (!apiKey) {
      setMessages((prev) => {
        const next = [...prev, { role: 'user', content: trimmed }, { role: 'assistant', content: t('ai.inactive') }];
        return next.slice(-10);
      });
      setInput('');
      return;
    }

    setBusy(true);
    setInput('');

    setMessages((prev) => {
      const next = [...prev, { role: 'user', content: trimmed }];
      return next.slice(-10);
    });

    try {
      const current = [...messages, { role: 'user', content: trimmed }].slice(-10);

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...current.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.4,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI error: ${res.status}`);
      }

      const data = await res.json();
      const answer: string | undefined = data?.choices?.[0]?.message?.content;

      setMessages((prev) => {
        const next = [...prev, { role: 'assistant', content: answer || '...' }];
        return next.slice(-10);
      });
    } catch (e) {
      setMessages((prev) => {
        const next = [...prev, { role: 'assistant', content: language === 'tr' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.' }];
        return next.slice(-10);
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {open && (
        <div className="w-[340px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mb-3">
          <div className="bg-brand text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Varol AI</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={listRef} className="max-h-[360px] overflow-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'bg-cta text-white rounded-br-md'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendMessage();
                }}
                placeholder={t('ai.placeholder')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cta focus:border-transparent text-sm"
                disabled={busy}
              />
              <button
                onClick={sendMessage}
                disabled={busy}
                className="w-10 h-10 rounded-xl bg-brand text-white hover:bg-brand-hover transition-colors flex items-center justify-center disabled:opacity-60"
                aria-label={t('ai.send')}
                title={t('ai.send')}
              >
                {busy ? (
                  <span className="text-xs">...</span>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-brand text-white shadow-lg flex items-center justify-center hover:bg-brand-hover transition-colors"
        aria-label="AI Chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
