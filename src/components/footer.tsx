"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function Footer() {
  const { status } = useSession();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
          
          {/* Copyright e Links Legais */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 order-2 md:order-1">
            <span>© 2025 HealthFirst. Todos os direitos reservados.</span>
            <div className="flex gap-4">
              <Link href="/privacidade" className="hover:text-primary transition-colors">
                Política de Privacidade
              </Link>
              <Link href="/termos" className="hover:text-primary transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>

          {/* Links de Acesso Rápido */}
          <div className="flex space-x-6 order-1 md:order-2 font-medium">
            {status === "authenticated" ? (
              <Link href="/dashboard" className="text-primary hover:underline">
                Ir para meu Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Área do Cliente
                </Link>
                <Link href="/register" className="hover:text-primary transition-colors">
                  Criar Conta
                </Link>
              </>
            )}
            <Link href="/contato" className="hover:text-primary transition-colors">
              Contato
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
}