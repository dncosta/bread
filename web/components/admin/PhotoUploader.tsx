"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resizeImageForUpload } from "@/lib/imageResize";
import { getPhotoUrl } from "@/lib/storage";

export function PhotoUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (path: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Imagem muito grande (máximo 8MB).");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const blob = await resizeImageForUpload(file);
      const path = `products/${crypto.randomUUID()}.webp`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("product-photos")
        .upload(path, blob, { contentType: "image/webp", upsert: true });

      if (uploadError) {
        setError("Falha no upload: " + uploadError.message);
        return;
      }

      const oldPath = value;
      onChange(path);
      if (oldPath) {
        await supabase.storage.from("product-photos").remove([oldPath]);
      }
    } finally {
      setUploading(false);
    }
  }

  const previewUrl = getPhotoUrl(value);

  return (
    <div className="admin-field">
      <label>Foto</label>
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- small admin preview, not worth next/image here
        <img src={previewUrl} alt="" className="admin-photo-preview" />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {uploading && <span className="admin-help">Enviando...</span>}
      {error && <div className="admin-error">{error}</div>}
    </div>
  );
}
