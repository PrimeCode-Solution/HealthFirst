import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  Shield, 
  Clock, 
  Users, 
  Stethoscope, 
  Brain, 
  Eye, 
  Bone,
  Baby,
  Activity,
  Star,
  CheckCircle,
  Phone,
  Calendar,
  MapPin,
  Award,
  UserCheck,
  Zap
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  <Heart className="w-4 h-4 mr-2" />
                  Cuidados Médicos de Excelência
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Sua saúde é nossa 
                  <span className="text-primary"> prioridade</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Oferecemos cuidados médicos de qualidade com uma equipe especializada, 
                  tecnologia avançada e atendimento humanizado para toda a família.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg px-8">
                  <Calendar className="w-5 h-5 mr-2" />
                  Agendar Consulta
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8">
                  <Phone className="w-5 h-5 mr-2" />
                  Emergência 24h
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">2+</div>
                  <div className="text-sm text-muted-foreground">Anos de experiência</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">15+</div>
                  <div className="text-sm text-muted-foreground">Médicos especialistas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">3k+</div>
                  <div className="text-sm text-muted-foreground">Pacientes atendidos</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto">
                      <Stethoscope className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">Atendimento Especializado</h3>
                      <p className="text-muted-foreground">Tecnologia avançada e cuidado humanizado</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-4 z-20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Consulta Agendada</div>
                    <div className="text-xs text-muted-foreground">Dr. Silva - 14:30</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4 z-20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Exame Disponível</div>
                    <div className="text-xs text-muted-foreground">Resultado em 24h</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="secondary" className="w-fit mx-auto">
              <Shield className="w-4 h-4 mr-2" />
              Por que escolher a HealthFirst?
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold">
              Cuidados médicos que fazem a diferença
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Nossa missão é proporcionar cuidados médicos excepcionais com tecnologia 
              de ponta e atendimento humanizado.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Atendimento 24/7</CardTitle>
                <CardDescription>
                  Emergência médica disponível 24 horas por dia, 7 dias por semana
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Médicos Especialistas</CardTitle>
                <CardDescription>
                  Equipe altamente qualificada com especialistas em diversas áreas
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Tecnologia Avançada</CardTitle>
                <CardDescription>
                  Equipamentos modernos e tecnologia de ponta para diagnósticos precisos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Cuidado Humanizado</CardTitle>
                <CardDescription>
                  Atendimento personalizado com foco no bem-estar do paciente
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Localização Central</CardTitle>
                <CardDescription>
                  Fácil acesso no centro de São Paulo com estacionamento gratuito
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Certificações</CardTitle>
                <CardDescription>
                  Acreditações nacionais e internacionais de qualidade em saúde
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="secondary" className="w-fit mx-auto">
              <Stethoscope className="w-4 h-4 mr-2" />
              Nossas Especialidades
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold">
              Cuidados especializados para toda a família
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Oferecemos uma ampla gama de especialidades médicas com profissionais 
              altamente qualificados.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group hover:shadow-lg transition-all cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-lg">Cardiologia</CardTitle>
                <CardDescription>
                  Cuidados especializados para o coração e sistema cardiovascular
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <Brain className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Neurologia</CardTitle>
                <CardDescription>
                  Diagnóstico e tratamento de doenças do sistema nervoso
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <Eye className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Oftalmologia</CardTitle>
                <CardDescription>
                  Cuidados completos para a saúde dos seus olhos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <Bone className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-lg">Ortopedia</CardTitle>
                <CardDescription>
                  Tratamento de lesões e doenças do sistema musculoesquelético
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-200 transition-colors">
                  <Baby className="w-8 h-8 text-pink-600" />
                </div>
                <CardTitle className="text-lg">Pediatria</CardTitle>
                <CardDescription>
                  Cuidados especializados para bebês, crianças e adolescentes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Clínica Geral</CardTitle>
                <CardDescription>
                  Atendimento médico geral e acompanhamento de saúde
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-200 transition-colors">
                  <Activity className="w-8 h-8 text-teal-600" />
                </div>
                <CardTitle className="text-lg">Medicina Esportiva</CardTitle>
                <CardDescription>
                  Prevenção e tratamento de lesões relacionadas ao esporte
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 transition-colors">
                  <Shield className="w-8 h-8 text-indigo-600" />
                </div>
                <CardTitle className="text-lg">Medicina Preventiva</CardTitle>
                <CardDescription>
                  Check-ups e programas de prevenção de doenças
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Ver Todas as Especialidades
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="secondary" className="w-fit mx-auto">
              <Star className="w-4 h-4 mr-2" />
              Depoimentos
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold">
              O que nossos pacientes dizem
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A satisfação dos nossos pacientes é nossa maior recompensa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-base leading-relaxed">
                  "Atendimento excepcional! A equipe médica é muito atenciosa e o 
                  ambiente é acolhedor. Recomendo a todos."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-primary">MR</span>
                  </div>
                  <div>
                    <div className="font-semibold">Maria Rosa</div>
                    <div className="text-sm text-muted-foreground">Paciente há 3 anos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-base leading-relaxed">
                  "Profissionais competentes e tecnologia de ponta. Minha família 
                  toda é atendida aqui e estamos muito satisfeitos."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-primary">JS</span>
                  </div>
                  <div>
                    <div className="font-semibold">João Silva</div>
                    <div className="text-sm text-muted-foreground">Paciente há 5 anos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-base leading-relaxed">
                  "O atendimento de emergência salvou minha vida. Equipe preparada 
                  e equipamentos modernos. Gratidão eterna!"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-primary">AS</span>
                  </div>
                  <div>
                    <div className="font-semibold">Ana Santos</div>
                    <div className="text-sm text-muted-foreground">Paciente há 1 ano</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Pronto para cuidar da sua saúde?
              </h2>
              <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                Agende sua consulta hoje mesmo e tenha acesso aos melhores 
                cuidados médicos da cidade.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                <Calendar className="w-5 h-5 mr-2" />
                Agendar Consulta
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-white text-black hover:bg-white hover:text-primary">
                <Phone className="w-5 h-5 mr-2" />
                (82) 99999-9999
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-8 pt-12">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-primary-foreground/80" />
                <h3 className="text-lg font-semibold mb-2">Atendimento 24h</h3>
                <p className="text-primary-foreground/80">
                  Emergência médica disponível todos os dias
                </p>
              </div>
              <div className="text-center">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-primary-foreground/80" />
                <h3 className="text-lg font-semibold mb-2">Localização Central</h3>
                <p className="text-primary-foreground/80">
                  Fácil acesso no centro de São Paulo
                </p>
              </div>
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-primary-foreground/80" />
                <h3 className="text-lg font-semibold mb-2">Convênios Aceitos</h3>
                <p className="text-primary-foreground/80">
                  Trabalhamos com os principais planos de saúde
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}