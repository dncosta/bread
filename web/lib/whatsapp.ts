export const WHATSAPP_PHONE = "5511968280273";

export function buildWhatsAppUrl(productName: string): string {
  const text = `Olá! Gostaria de fazer um pedido de um "${productName}".`;
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}
