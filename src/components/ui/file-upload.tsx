"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, X, Check } from "lucide-react";
import axios from "axios";

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  accept?: string;
  label?: string;
}

export function FileUpload({ onUploadComplete, accept = "image/*", label = "Enviar Arquivo" }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadedUrl(null);
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // 1. Pedir URL assinada para nossa API
      const { data } = await axios.post("/api/upload", {
        filename: file.name,
        contentType: file.type,
      });

      const { uploadUrl, fileKey } = data;

      // 2. Enviar arquivo diretamente para a AWS S3
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setProgress(percent);
        },
      });

      // 3. Sucesso
      setUploadedUrl(fileKey);
      onUploadComplete(fileKey); 
      toast.success("Upload concluído com sucesso!");

    } catch (error) {
      console.error(error);
      toast.error("Erro ao fazer upload do arquivo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-sm">
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          id={`file-upload-${label}`}
        />
        <label
          htmlFor={`file-upload-${label}`}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <div className="h-10 w-10 bg-muted flex items-center justify-center rounded-md border border-dashed border-gray-400">
             <Upload className="h-4 w-4" />
          </div>
          {file ? <span className="truncate max-w-[200px]">{file.name}</span> : label}
        </label>
      </div>

      {file && !uploadedUrl && (
        <Button onClick={handleUpload} disabled={uploading} size="sm" className="w-full">
          {uploading ? "Enviando..." : "Confirmar Upload"}
        </Button>
      )}

      {uploading && <Progress value={progress} className="h-2" />}

      {uploadedUrl && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-2 rounded">
          <Check className="h-4 w-4" /> Arquivo pronto para salvar
        </div>
      )}
    </div>
  );
}