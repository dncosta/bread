"use client";

import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { gtag } from "@/lib/gtag";

export function WhatsAppButton({
  productId,
  productName,
  className,
  children,
}: {
  productId: string;
  productName: string;
  className: string;
  children: React.ReactNode;
}) {
  function handleClick() {
    gtag("event", "whatsapp_click", {
      event_category: "engagement",
      event_label: productName,
      location: "card",
    });
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, eventType: "whatsapp_click", location: "card" }),
      keepalive: true,
    }).catch(() => {});
  }

  return (
    <a
      href={buildWhatsAppUrl(productName)}
      target="_blank"
      rel="noopener"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
