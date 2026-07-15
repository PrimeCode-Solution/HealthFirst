import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { s3Client } from "@/lib/storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Só permitimos imagens (avatares/capas) e documentos de ebook. Sem essa
// allowlist, um usuário logado poderia subir HTML/JS e servir XSS a partir do
// nosso bucket público.
const ALLOWED = new Map<string, string[]>([
  ["image/png", ["png"]],
  ["image/jpeg", ["jpg", "jpeg"]],
  ["image/webp", ["webp"]],
  ["image/gif", ["gif"]],
  ["application/pdf", ["pdf"]],
  ["application/epub+zip", ["epub"]],
]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, contentType } = await req.json();

    if (typeof filename !== "string" || typeof contentType !== "string" || !filename.includes(".")) {
      return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
    }

    const fileExtension = filename.split(".").pop()!.toLowerCase();
    const allowedExtensions = ALLOWED.get(contentType);

    if (!allowedExtensions || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido." },
        { status: 415 }
      );
    }

    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

    return NextResponse.json({
      uploadUrl: signedUrl,
      fileKey: publicUrl, 
    });

  } catch (error) {
    console.error("Erro ao gerar URL assinada:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}