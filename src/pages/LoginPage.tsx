// src/pages/LoginPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Lock, Mail, ArrowLeft, ShieldCheck, Building2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface LoginPageProps {
  onNavigate: (page: string, propertyId?: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const { language } = useLanguage();
  const { user, signIn, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user) {
      onNavigate("admin");
    }
  }, [user, onNavigate]);

  const pageTitle = useMemo(() => {
    return language === "tr"
      ? "Giriş Yap | Varol Gayrimenkul"
      : "Login | Varol Real Estate";
  }, [language]);

  const pageDescription = useMemo(() => {
    return language === "tr"
      ? "Varol Gayrimenkul yönetim paneline giriş yapın."
      : "Log in to the Varol Real Estate admin panel.";
  }, [language]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      setErrorMessage(
        language === "tr"
          ? "Lütfen e-posta ve şifre alanlarını doldurun."
          : "Please fill in both email and password fields."
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      const { error } = await signIn(trimmedEmail, password);

      if (error) {
        setErrorMessage(
          language === "tr"
            ? "Giriş başarısız. E-posta veya şifre hatalı olabilir."
            : "Login failed. Your email or password may be incorrect."
        );
        return;
      }

      onNavigate("admin");
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(
        language === "tr"
          ? "Giriş sırasında bir hata oluştu."
          : "An error occurred during login."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-md">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
          <p className="text-sm text-gray-600">
            {language === "tr" ? "Yükleniyor..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <html lang={language === "tr" ? "tr" : "en"} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-100">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
            <div className="relative hidden overflow-hidden bg-emerald-700 lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-800" />
              <div className="relative flex h-full flex-col justify-between p-10 text-white">
                <div>
                  <button
                    type="button"
                    onClick={() => onNavigate("home")}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {language === "tr" ? "Ana Sayfaya Dön" : "Back to Home"}
                  </button>
                </div>

                <div className="max-w-md">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
                    <Building2 className="h-8 w-8" />
                  </div>

                  <h1 className="mb-4 text-4xl font-bold leading-tight">
                    {language === "tr"
                      ? "Varol Gayrimenkul Yönetim Paneli"
                      : "Varol Real Estate Admin Panel"}
                  </h1>

                  <p className="mb-8 text-white/85">
                    {language === "tr"
                      ? "İlanlarınızı, araç portföyünüzü ve başvurularınızı güvenli şekilde yönetin."
                      : "Securely manage your listings, vehicle portfolio, and inquiries."}
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="text-sm">
                        {language === "tr"
                          ? "Yetkili kullanıcı girişi"
                          : "Authorized user access"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                      <Building2 className="h-5 w-5" />
                      <span className="text-sm">
                        {language === "tr"
                          ? "İlan ve içerik yönetimi"
                          : "Listing and content management"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-white/75">
                  {language === "tr" ? "Varol Gayrimenkul" : "Varol Real Estate"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
              <div className="w-full max-w-md">
                <div className="mb-8 lg:hidden">
                  <button
                    type="button"
                    onClick={() => onNavigate("home")}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {language === "tr" ? "Ana Sayfa" : "Home"}
                  </button>
                </div>

                <div className="mb-8">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                    <Lock className="h-7 w-7 text-emerald-700" />
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900">
                    {language === "tr" ? "Giriş Yap" : "Sign In"}
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    {language === "tr"
                      ? "Yönetim paneline erişmek için hesabınızla giriş yapın."
                      : "Sign in with your account to access the admin panel."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {language === "tr" ? "E-posta" : "Email"}
                    </label>

                    <div className="flex items-center rounded-2xl border border-gray-300 bg-white px-4 py-3 focus-within:border-transparent focus-within:ring-2 focus-within:ring-emerald-500">
                      <Mail className="mr-3 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={language === "tr" ? "ornek@mail.com" : "name@example.com"}
                        autoComplete="email"
                        className="w-full border-0 bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {language === "tr" ? "Şifre" : "Password"}
                    </label>

                    <div className="flex items-center rounded-2xl border border-gray-300 bg-white px-4 py-3 focus-within:border-transparent focus-within:ring-2 focus-within:ring-emerald-500">
                      <Lock className="mr-3 h-5 w-5 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="w-full border-0 bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-emerald-600 px-6 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? language === "tr"
                        ? "Giriş Yapılıyor..."
                        : "Signing In..."
                      : language === "tr"
                        ? "Giriş Yap"
                        : "Sign In"}
                  </button>
                </form>

                <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                  {language === "tr"
                    ? "Not: Yeni üyelik kapalıdır. Hesaplar yalnızca yetkili şekilde oluşturulmaktadır."
                    : "Note: New registration is closed. Accounts are created only by authorization."}
                </div>

                <div className="mt-8 text-center text-sm text-gray-500">
                  {language === "tr"
                    ? "Sorun yaşıyorsanız yönetici ile iletişime geçin."
                    : "If you have trouble signing in, contact the administrator."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}