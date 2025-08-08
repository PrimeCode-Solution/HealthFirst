import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ConsultaNutricionalPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col items-center w-full px-4">
        
        {/* Seção Hero */}
        <section className="w-full max-w-6xl py-6 md:py-12 lg:py-16">
          <div className="flex flex-col items-center space-y-6 text-center">
            <Image
              src="/imagens/pagina_nutricional/foto1.webp"
              alt="Nutritional Consultation Hero"
              width={800}
              height={400}
              priority
              className="rounded-xl object-cover w-full max-w-4xl"
            />
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Sua Jornada para uma Vida Saudável Começa Aqui
              </h1>
              <p className="text-gray-500 md:text-xl dark:text-gray-400 max-w-3xl mx-auto">
                Na Health First, acreditamos que a nutrição é a base da saúde geral. Nossos serviços de consultoria
                nutricional são projetados para ajudá-lo a atingir seus objetivos de saúde por meio de orientação
                alimentar personalizada...
              </p>
            </div>
          </div>
        </section>

        {/* Conteúdo Gratuito */}
        <section className="w-full max-w-6xl py-6 md:py-12 lg:py-16 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl text-center mb-8">
            Conteúdo gratuito
          </h2>
          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {[
              {
                img: "/imagens/pagina_nutricional/mini1.webp",
                title: "O poder de uma dieta equilibrada",
                desc: "Descubra os benefícios de uma alimentação balanceada para sua saúde e bem-estar."
              },
              {
                img: "/imagens/pagina_nutricional/mini2.webp",
                title: "Receitas para uma alimentação saudável",
                desc: "Acesse receitas deliciosas e nutritivas para o seu dia a dia."
              },
              {
                img: "/imagens/pagina_nutricional/mini3.webp",
                title: "Dicas para um estilo de vida mais saudável",
                desc: "Orientações práticas para incorporar hábitos saudáveis em sua rotina."
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-lg flex items-center gap-4 border border-gray-200">
                <Image
                  src={item.img}
                  alt={item.title}
                  width={64}
                  height={64}
                  className="object-cover rounded-md"
                />
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Conteúdo Premium */}
        <section className="w-full max-w-6xl py-6 md:py-12 lg:py-16">
          <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl text-center mb-8">
            Conteúdo Premium
          </h2>
          <div className="grid gap-8">
            {[
              {
                badge: "Exclusivo",
                title: "Planos alimentares personalizados",
                desc: "Desbloqueie o acesso a planos alimentares personalizados...",
                img: "/imagens/pagina_nutricional/premium1.webp",
                reverse: false
              },
              {
                badge: "Premium",
                title: "Guias nutricionais",
                desc: "Tenha acesso a guias aprofundados sobre diversos temas...",
                img: "/imagens/pagina_nutricional/premium2.webp",
                reverse: true
              }
            ].map((item, i) => (
              <Card
                key={i}
                className={`flex flex-col ${item.reverse ? "md:flex-row-reverse" : "md:flex-row"} items-center p-6 gap-6`}
              >
                <div className="md:w-1/2 space-y-4">
                  <Badge variant="secondary" className="text-[#00C896]">{item.badge}</Badge>
                  <h3 className="text-2xl font-bold">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
                  <Button className="bg-[#00C896] text-white hover:bg-[#00C896]/90">
                    Inscreva-se agora
                  </Button>
                </div>
                <div className="md:w-1/2 flex justify-center">
                  <Image
                    src={item.img}
                    alt={item.title}
                    width={400}
                    height={300}
                    className="rounded-xl object-cover w-full max-w-md"
                  />
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Botão de agendamento */}
        <section className="w-full py-6 md:py-12 lg:py-16 flex justify-center">
          <Button size="lg" className="bg-[#00C896] text-white hover:bg-[#00C896]/90">
            Agende uma consulta
          </Button>
        </section>
      </main>
    </div>
  )
}
