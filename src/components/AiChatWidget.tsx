// src/components/AiChatWidget.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  role: ChatRole;
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
    return language === 'tr'
      ? 'Sen Varol Gayrimenkul AI asistanısın. Kısa, net ve yardımcı cevaplar ver. Gayrimenkul ve site kullanımıyla ilgili sorularda yardımcı ol.'
      : 'You are the Varol Real Estate AI assistant. Reply concisely and helpfully. Assist with real estate and website usage questions.';
  }, [language]);

  useEffect(() => {
    const greeting: ChatMessage = {
      role: 'assistant',
      content: t('ai.greeting'),
    };

    setMessages([greeting]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages]);

  const trimMessages = (items: ChatMessage[]) => items.slice(-10);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
    };

    if (!apiKey) {
      const inactiveMessage: ChatMessage = {
        role: 'assistant',
        content: t('ai.inactive'),
      };

      setMessages((prev) => trimMessages([...prev, userMessage, inactiveMessage]));
      setInput('');
      return;
    }

    setBusy(true);
    setInput('');

    setMessages((prev) => trimMessages([...prev, userMessage]));

    try {
      const current: ChatMessage[] = trimMessages([...messages, userMessage]);

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
      const answer =
        typeof data?.choices?.[0]?.message?.content === 'string'
          ? data.choices[0].message.content
          : '...';

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: answer,
      };

      setMessages((prev) => trimMessages([...prev, assistantMessage]));
    } catch (error) {
      console.error('AI chat error:', error);

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content:
          language === 'tr'
            ? 'Bir hata oluştu. Lütfen tekrar deneyin.'
            : 'An error occurred. Please try again.',
      };

      setMessages((prev) => trimMessages([...prev, errorMessage]));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {open && (
        <div className="mb-3 w-[340px] max-w-[calc(100vw-48px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Varol AI</span>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 transition-colors hover:bg-white/10"
              aria-label="Close"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={listRef}
            className="max-h-[360px] space-y-3 overflow-auto bg-gray-50 px-4 py-3"
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'rounded-br-md bg-cta text-white'
                      : 'rounded-bl-md border border-gray-200 bg-white text-gray-900'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 bg-white p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendMessage();
                  }
                }}
                placeholder={t('ai.placeholder')}
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-cta"
                disabled={busy}
              />

              <button
                onClick={sendMessage}
                disabled={busy}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
                aria-label={t('ai.send')}
                title={t('ai.send')}
                type="button"
              >
                {busy ? <span className="text-xs">...</span> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-colors hover:bg-brand-hover"
        aria-label="AI Chat"
        type="button"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}