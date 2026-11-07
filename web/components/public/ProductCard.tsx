"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { formatPriceCents } from "@/lib/format";
import { getPhotoUrl } from "@/lib/storage";
import { WhatsAppButton } from "./WhatsAppButton";
import type { ProductWithPrices } from "@/lib/types";

// Module-scoped: survives for the page's lifetime (resets on full reload),
// so each product fires at most one "view" event per visit even if its
// card scrolls in and out of the viewport repeatedly.
const trackedViews = new Set<string>();

export function ProductCard({ product }: { product: ProductWithPrices }) {
  const photos = [...product.product_photos].sort((a, b) => a.position - b.position);
  const articleRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const el = articleRef.current;
    if (!el || trackedViews.has(product.id)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !trackedViews.has(product.id)) {
            trackedViews.add(product.id);
            fetch("/api/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: product.id, eventType: "view" }),
              keepalive: true,
            }).catch(() => {});
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product.id]);

  function go(delta: number) {
    setIndex((i) => (i + delta + photos.length) % photos.length);
  }

  return (
    <article className="card" ref={articleRef}>
      <div className="card-photo">
        {photos.length > 0 && (
          <div
            className="card-photo-track"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current == null) return;
              const delta = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
              touchStartX.current = null;
            }}
          >
            <Image
              src={getPhotoUrl(photos[index].path)!}
              alt={photos[index].alt ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, 240px"
              style={{ objectFit: "cover" }}
            />
          </div>
        )}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              className="card-photo-arrow card-photo-arrow--prev"
              aria-label="Foto anterior"
              onClick={() => go(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="card-photo-arrow card-photo-arrow--next"
              aria-label="Próxima foto"
              onClick={() => go(1)}
            >
              ›
            </button>
            <div className="card-photo-dots">
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  className={`card-photo-dot${i === index ? " active" : ""}`}
                  aria-label={`Ver foto ${i + 1}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="card-body">
        <div className="card-row">
          <div className="card-name">{product.name}</div>
          {product.pricing_mode === "single" && product.price_cents != null && (
            <div className="card-price">{formatPriceCents(product.price_cents)}</div>
          )}
        </div>
        {product.kit_label && <div className="card-kit">{product.kit_label}</div>}
        <div className="card-desc">{product.description}</div>
        {product.note && <div className="card-note">{product.note}</div>}
        {product.pricing_mode === "lines" && product.product_prices.length > 0 && (
          <div className="card-price-lines">
            {product.product_prices.map((line) => (
              <div key={line.id} className="card-price-line">
                <span>{line.label}</span>
                <span>{formatPriceCents(line.price_cents)}</span>
              </div>
            ))}
          </div>
        )}
        <WhatsAppButton productId={product.id} productName={product.name} className="card-whatsapp">
          Pedir no WhatsApp
        </WhatsAppButton>
      </div>
    </article>
  );
}
