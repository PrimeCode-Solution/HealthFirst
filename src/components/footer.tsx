import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="mb-4 md:mb-0">
            <span>2024 HealthFirst. Todos os direitos reservados.</span>
          </div>
          <div className="flex space-x-6">
            <Link href="/privacidade" className="hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="hover:text-primary transition-colors">
              Termos de Serviço
            </Link>
            <Link href="/contato" className="hover:text-primary transition-colors">
              Entre em contato conosco
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}