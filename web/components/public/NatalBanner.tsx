"use client";

import { useEffect, useRef } from "react";
import { initNatalBanner } from "@/lib/natalBanner";
import { NATAL_BANNER_INNER_HTML } from "./natalBannerMarkup";

export function NatalBanner() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const banner = ref.current;
    if (!banner) return;
    return initNatalBanner(banner);
  }, []);

  return (
    <section
      ref={ref}
      className="natal-banner"
      aria-label="Edição especial de Natal"
      dangerouslySetInnerHTML={{ __html: NATAL_BANNER_INNER_HTML }}
    />
  );
}
