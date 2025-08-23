import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Heart,
    Shield,
    Users,
    Stethoscope,
    Brain,
    Eye,
    Bone,
    Baby,
    Star,
    CheckCircle,
    Phone,
    Calendar,
    BriefcaseMedical,
    FlaskConical,
    Apple
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {

    return (
        <main className="flex flex-col">
            {/* Hero Section */}
            <section className="container mx-auto px-4 py-8">
                <div className="relative rounded-2xl overflow-hidden flex items-center justify-center text-center h-[680px]">
                    {/* Background Image */}
                    <Image
                        src="/images/home/hero-image.png"
                        alt="Equipe médica Health First"
                        fill
                        className="object-cover object-[center_30%]"
                        priority
                    />
                    {/* Overlay para melhorar a leitura do texto */}
                    <div className="absolute inset-0 bg-black/30" />

                    {/* Conteúdo de Texto */}
                    <div className="relative z-10 space-y-6 max-w-3xl px-4">
                        <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                            Sua saúde, nossa prioridade
                        </h1>
                        <p className="text-lg text-white/90 leading-relaxed">
                            Bem-vindo(a) à HealthFirst, onde oferecemos consultas médicas especializadas adaptadas às suas necessidades. Desde cuidados pediátricos até conselhos gerais sobre saúde e nutrição, nossa equipe está dedicada ao seu bem-estar.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Button size="lg" className="text-base px-8 py-4">
                                Explore os serviços
                            </Button>
                            <Button 
                                variant="outline" 
                                size="lg" 
                                className="text-base px-8 py-4 bg-transparent border-white text-white hover:bg-white hover:text-primary"
                            >
                                Agende uma consulta
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Nossos Serviços Section */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="text-left space-y-4 mb-12">
                         <h3 className="text-sm font-semibold text-primary">Nossos serviços</h3>
                        <h2 className="text-3xl lg:text-4xl font-bold">
                           Cuidados abrangentes para todas as fases da vida
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-3xl">
                           Na HealthFirst, oferecemos uma variedade de serviços de consultoria para atender às suas necessidades de saúde. Nossa equipe experiente oferece atendimento e suporte personalizados.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Card className="border-gray-200 shadow-md hover:shadow-xl transition-shadow p-6">
                            <CardHeader className="p-0">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <BriefcaseMedical className="w-6 h-6 text-primary" />
                                </div>
                                <CardTitle>Consultas pediátricas</CardTitle>
                                <CardDescription className="pt-2">
                                   Cuidamos da saúde de bebês, crianças e adolescentes, com foco na prevenção, desenvolvimento e bem-estar geral.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="border-gray-200 shadow-md hover:shadow-xl transition-shadow p-6">
                            <CardHeader className="p-0">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <FlaskConical className="w-6 h-6 text-primary" />
                                </div>
                                <CardTitle>Consultas gerais de saúde</CardTitle>
                                <CardDescription className="pt-2">
                                   Oferecemos avaliações de saúde abrangentes para adultos, cobrindo uma ampla gama de condições médicas.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="border-gray-200 shadow-md hover:shadow-xl transition-shadow p-6">
                            <CardHeader className="p-0">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <Apple className="w-6 h-6 text-primary" />
                                </div>
                                <CardTitle>Consultas nutricionais</CardTitle>
                                <CardDescription className="pt-2">
                                  Nossos nutricionistas fornecem orientação nutricional para aprender a se alimentar de forma saudável e controlar doenças crônicas.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Nossa Missão e Equipe Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-left space-y-4 mb-12">
                        <h3 className="text-sm font-semibold text-primary">Sobre a HealthFirst</h3>
                        <h2 className="text-3xl lg:text-4xl font-bold">
                            Nossa missão e equipe
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-3xl">
                            A HealthFirst está comprometida em fornecer cuidados de saúde acessíveis e de alta qualidade. Nossa equipe de profissionais experientes está dedicada à sua saúde e bem-estar.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="flex flex-col space-y-2">
                        <Image 
                          src="/images/home/team-image.png" 
                          alt="Nossa equipe" 
                          width={400} 
                          height={225}
                          className="w-full h-67 rounded-lg object-cover mb-2"
                        />
                        <h4 className="font-semibold text-lg pt-2">Nossa equipe</h4>
                        <p className="text-muted-foreground text-sm">Nossa equipe é formada por médicos e enfermeiros licenciados e qualificados, cada um com sua própria área de especialização e atendimento ao paciente.</p>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Image 
                          src="/images/home/approach-image.png" 
                          alt="Nossa abordagem" 
                          width={400} 
                          height={225} 
                          className="w-full h-67 rounded-lg object-cover mb-2"
                        />
                        <h4 className="font-semibold text-lg pt-2">Nossa abordagem</h4>
                        <p className="text-muted-foreground text-sm">Acreditamos em uma abordagem holística para o paciente, com foco em um plano de atendimento personalizado e comunicação aberta.</p>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Image 
                          src="/images/home/success-image.png" 
                          alt="Histórias de sucesso" 
                          width={400} 
                          height={225} 
                          className="w-full h-67 rounded-lg object-cover mb-2"
                        />
                        <h4 className="font-semibold text-lg pt-2">Histórias de sucesso</h4>
                        <p className="text-muted-foreground text-sm">Temos o prazer de compartilhar histórias de pacientes e sobre como a HealthFirst os ajudou a alcançar seus objetivos de saúde.</p>
                      </div>
                    </div>
                </div>
            </section>

            {/* CTA Final Section */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">Pronto para assumir o controle da sua saúde?</h2>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
                        Inscreva-se hoje mesmo em uma assinatura paga e tenha acesso a conteúdo premium, consultas personalizadas e recursos exclusivos.
                    </p>
                    <Button size="lg" className="text-base text-black px-8 py-6">
                        Inscreva-se agora
                    </Button>
                </div>
            </section>
        </main>
    )

}