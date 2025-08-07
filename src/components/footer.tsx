import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold text-lg">
                H+
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold">HealthFirst</span>
                <span className="text-xs text-slate-400">Cuidando de você</span>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Oferecemos cuidados médicos de qualidade com uma equipe especializada, 
              tecnologia avançada e atendimento humanizado para toda a família.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Links Rápidos</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/sobre" className="text-slate-300 hover:text-white transition-colors text-sm">
                Sobre Nós
              </Link>
              <Link href="/especialidades" className="text-slate-300 hover:text-white transition-colors text-sm">
                Especialidades
              </Link>
              <Link href="/medicos" className="text-slate-300 hover:text-white transition-colors text-sm">
                Nossos Médicos
              </Link>
              <Link href="/convenios" className="text-slate-300 hover:text-white transition-colors text-sm">
                Convênios
              </Link>
              <Link href="/exames" className="text-slate-300 hover:text-white transition-colors text-sm">
                Exames
              </Link>
              <Link href="/contato" className="text-slate-300 hover:text-white transition-colors text-sm">
                Contato
              </Link>
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Serviços</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/consultas" className="text-slate-300 hover:text-white transition-colors text-sm">
                Consultas Médicas
              </Link>
              <Link href="/emergencia" className="text-slate-300 hover:text-white transition-colors text-sm">
                Atendimento de Emergência
              </Link>
              <Link href="/cirurgias" className="text-slate-300 hover:text-white transition-colors text-sm">
                Cirurgias
              </Link>
              <Link href="/internacao" className="text-slate-300 hover:text-white transition-colors text-sm">
                Internação
              </Link>
              <Link href="/checkup" className="text-slate-300 hover:text-white transition-colors text-sm">
                Check-up Completo
              </Link>
              <Link href="/telemedicina" className="text-slate-300 hover:text-white transition-colors text-sm">
                Telemedicina
              </Link>
            </nav>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-slate-300 text-sm">(82) 99999-9999</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-slate-300 text-sm">contato@healthfirst.com.br</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-slate-300 text-sm">
                  Rua da Saúde, 123<br />
                  Centro - Arapiraca, AL<br />
                  CEP: 01234-567
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-slate-300 text-sm">24h por dia, 7 dias por semana</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Newsletter</h4>
              <p className="text-slate-400 text-xs">
                Receba dicas de saúde e novidades
              </p>
              <div className="flex space-x-2">
                <Input 
                  placeholder="Seu e-mail" 
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                />
                <Button size="sm" className="shrink-0">
                  Inscrever
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-slate-700" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-slate-400 text-sm">
            © 2024 HealthFirst. Todos os direitos reservados.
          </div>
          <div className="flex space-x-6 text-sm">
            <Link href="/privacidade" className="text-slate-400 hover:text-white transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="text-slate-400 hover:text-white transition-colors">
              Termos de Uso
            </Link>
            <Link href="/cookies" className="text-slate-400 hover:text-white transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}