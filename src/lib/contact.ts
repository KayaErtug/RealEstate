export const WHATSAPP_PHONE_DISPLAY = "+44 7355 612852";

export const WHATSAPP_PHONE_RAW = "447355612852";

export const WHATSAPP_DEFAULT_MESSAGE_TR =
  "Merhaba, sitenizdeki ilanlar hakkında detaylı bilgi almak istiyorum.";

export const WHATSAPP_DEFAULT_MESSAGE_EN =
  "Hello, I would like to get detailed information about the listings on your website.";

export function getWhatsAppUrl(language: "tr" | "en" = "tr") {
  const message =
    language === "tr" ? WHATSAPP_DEFAULT_MESSAGE_TR : WHATSAPP_DEFAULT_MESSAGE_EN;

  return `https://wa.me/${WHATSAPP_PHONE_RAW}?text=${encodeURIComponent(message)}`;
}