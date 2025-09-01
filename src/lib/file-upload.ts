import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { FileUploadResult } from "@/types/api";

export async function handleFileUpload(
  request: NextRequest,
  fieldName: string,
  allowedTypes: string[],
  maxSize: number = 50 * 1024 * 1024 // 50MB default
): Promise<FileUploadResult | null> {
  try {
    const formData = await request.formData();
    const file = formData.get(fieldName) as File;

    if (!file) {
      return null;
    }

    // Validar tipo de arquivo
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(", ")}`);
    }

    // Validar tamanho
    if (file.size > maxSize) {
      throw new Error(`Arquivo muito grande. Máximo: ${maxSize / (1024 * 1024)}MB`);
    }

    // Gerar nome único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Determinar diretório baseado no tipo
    const uploadDir = file.type.startsWith('image/') ? 'covers' : 'ebooks';
    const uploadPath = join(process.cwd(), 'public', 'uploads', uploadDir);

    // Criar diretório se não existir
    await mkdir(uploadPath, { recursive: true });

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadPath, filename);
    
    await writeFile(filePath, buffer);

    return {
      url: `/uploads/${uploadDir}/${filename}`,
      filename,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error("Erro no upload:", error);
    throw error;
  }
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}