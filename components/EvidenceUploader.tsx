"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface UploadedFile {
  url: string;
  name: string;
}

export default function EvidenceUploader({ files, onChange }: { files: UploadedFile[]; onChange: (files: UploadedFile[]) => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(selected)) {
        const sigRes = await fetch("/api/uploads/cloudinary-signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
        });
        const sigJson = await sigRes.json();
        if (!sigJson.success) {
          toast.error(sigJson.error || `Could not upload ${file.name}`);
          continue;
        }

        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sigJson.apiKey);
        form.append("timestamp", String(sigJson.timestamp));
        form.append("signature", sigJson.signature);
        form.append("folder", sigJson.folder);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigJson.cloudName}/${sigJson.resourceType}/upload`, { method: "POST", body: form });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) {
          toast.error(uploadJson.error?.message || `Could not upload ${file.name}`);
          continue;
        }

        onChange([...files, { url: uploadJson.secure_url, name: file.name }]);
      }
      toast.success("Evidence uploaded");
    } catch {
      toast.error("Upload failed — check your connection and try again");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.mp4,.xlsx,.docx" onChange={handleFileSelect} disabled={uploading} className="form-input" style={{ padding: 8 }} />
      {uploading && (
        <p style={{ fontSize: "0.8125rem", color: "var(--color-neutral-500)", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <span className="spinner" style={{ width: 14, height: 14 }} /> Uploading…
        </p>
      )}
      {files.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          {files.map((f) => (
            <div key={f.url} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8125rem", background: "var(--color-neutral-50)", padding: "6px 10px", borderRadius: "var(--radius-md)" }}>
              <a href={f.url} target="_blank" rel="noreferrer" style={{ color: "var(--color-info)" }}>{f.name}</a>
              <button type="button" onClick={() => onChange(files.filter((x) => x.url !== f.url))} style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontSize: "0.75rem" }}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}