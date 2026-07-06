"use client";

import { FileText, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { storage } from "@/lib/firebase";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  url: string;
  label: string;
  contentType?: string;
}

interface FileUploadProps {
  /** Subpasta lógica no Storage (ex.: "expenses"). */
  scope: string;
  value?: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  accept?: string;
  disabled?: boolean;
  /** Texto do botão quando vazio. */
  label?: string;
}

const extOf = (name: string) => {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i) : "";
};

export function FileUpload({
  scope,
  value,
  onChange,
  accept = "image/*,application/pdf",
  disabled,
  label = "Enviar arquivo (imagem ou PDF)",
}: FileUploadProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const handleFile = (file: File) => {
    const companyId = user?.companyId ?? "sem-empresa";
    const uuid =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `companies/${companyId}/${scope}/${uuid}${extOf(file.name)}`;
    const task = uploadBytesResumable(ref(storage, path), file, {
      contentType: file.type || undefined,
    });
    setProgress(0);
    task.on(
      "state_changed",
      (snap) =>
        setProgress(
          snap.totalBytes
            ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
            : 0,
        ),
      () => {
        setProgress(null);
        toast.error("Falha no upload do arquivo.");
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setProgress(null);
        onChange({ url, label: file.name, contentType: file.type || undefined });
      },
    );
  };

  const uploading = progress !== null;

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-sm border border-input bg-muted/30 px-3 py-2 text-sm">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <a
          href={value.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 truncate font-medium text-primary hover:underline"
        >
          {value.label}
        </a>
        {!disabled ? (
          <button
            type="button"
            aria-label="Remover arquivo"
            className="text-muted-foreground transition-colors hover:text-destructive"
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-input bg-background px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando… {progress}%
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {label}
          </>
        )}
      </button>
    </div>
  );
}
