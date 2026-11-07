"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resizeImageForUpload } from "@/lib/imageResize";
import { getPhotoUrl } from "@/lib/storage";
import type { PhotoInput } from "@/app/actions/products";

export function PhotoUploader({
  value,
  onChange,
  productName,
}: {
  value: PhotoInput[];
  onChange: (photos: PhotoInput[]) => void;
  productName: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    setUploading(true);
    // Accumulate locally rather than reading the `value` prop each
    // iteration — it won't reflect earlier onChange calls from this same
    // batch until the next render, so appending to it would drop photos
    // when multiple files are selected at once.
    let next = value;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setError("Escolha apenas arquivos de imagem.");
          continue;
        }
        if (file.size > 8 * 1024 * 1024) {
          setError("Imagem muito grande (máximo 8MB).");
          continue;
        }
        const blob = await resizeImageForUpload(file);
        const path = `products/${crypto.randomUUID()}.webp`;
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from("product-photos")
          // `upsert: true` makes the storage API do its write via an
          // INSERT ... ON CONFLICT DO UPDATE, which Postgres only allows
          // when the row also satisfies the UPDATE RLS policy — even for
          // a path like this one that's always a brand-new random UUID
          // and never actually conflicts. Every photo path is unique, so
          // there's nothing to overwrite; plain insert avoids that check.
          .upload(path, blob, { contentType: "image/webp" });

        if (uploadError) {
          setError("Falha no upload: " + uploadError.message);
          continue;
        }
        next = [...next, { path, alt: productName }];
        onChange(next);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function updateAlt(index: number, alt: string) {
    onChange(value.map((p, i) => (i === index ? { ...p, alt } : p)));
  }
  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }
  function move(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= value.length) return;
    const next = [...value];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    onChange(next);
  }

  return (
    <div className="admin-field">
      <label>Fotos</label>
      {value.length > 0 && (
        <div className="admin-photo-gallery">
          {value.map((photo, i) => (
            <div key={photo.path} className="admin-photo-gallery-item">
              {/* eslint-disable-next-line @next/next/no-img-element -- small admin preview, not worth next/image here */}
              <img src={getPhotoUrl(photo.path) ?? ""} alt="" className="admin-photo-preview" />
              <input
                type="text"
                placeholder="Texto alternativo da foto"
                value={photo.alt}
                onChange={(e) => updateAlt(i, e.target.value)}
              />
              <div className="admin-row-actions">
                <button type="button" className="admin-link-btn" disabled={i === 0} onClick={() => move(i, "up")}>
                  ↑
                </button>
                <button
                  type="button"
                  className="admin-link-btn"
                  disabled={i === value.length - 1}
                  onClick={() => move(i, "down")}
                >
                  ↓
                </button>
                <button type="button" className="admin-link-btn admin-link-btn--danger" onClick={() => remove(i)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
        }}
      />
      {uploading && <span className="admin-help">Enviando...</span>}
      {error && <div className="admin-error">{error}</div>}
    </div>
  );
}
