import Image from "next/image";
import { Button } from "@/components/ui/button";

const conteudoGratuito = [
  { img: "/imagens/pagina_nutricional/mini1.webp", title: "O poder de uma dieta equilibrada" },
  { img: "/imagens/pagina_nutricional/mini2.webp", title: "Receitas para uma alimentação saudável" },
  { img: "/imagens/pagina_nutricional/mini3.webp", title: "Dicas para um estilo de vida mais saudável" }
];

const conteudoPremium = [
  {
    badge: "Exclusivo",
    title: "Planos alimentares personalizados",
    desc: "Desbloqueie o acesso a planos alimentares personalizados, adaptados às suas necessidades específicas e objetivos de saúde. Nossos nutricionistas criarão um plano adequado ao seu estilo de vida e preferências.",
    img: "/imagens/pagina_nutricional/premium1.webp",
  },
  {
    badge: "Premium",
    title: "Guias nutricionais",
    desc: "Acesse guias completos sobre diversos temas de nutrição, desde controle de doenças até fortalecimento da imunidade.",
    img: "/imagens/pagina_nutricional/premium2.webp",
  }
];

export default function ConsultaNutricionalPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 flex flex-col items-center w-full px-6 py-8 max-w-[1100px] mx-auto">

        {/* Hero */}
        <section className="w-full">
          <Image
            src="/imagens/pagina_nutricional/foto1.webp"
            alt="Consulta Nutricional"
            width={928}
            height={180}
            className="rounded-lg object-cover w-full max-h-[180px]"
            priority
          />
          <p className="mt-5 text-[14px] text-gray-700 leading-relaxed">
            Na <strong>NAME</strong>, acreditamos que a nutrição é a base da saúde geral. 
            Nossos serviços de consultoria nutricional são projetados para ajudá-lo a atingir seus objetivos de saúde 
            por meio de orientação alimentar personalizada. Se você deseja controlar uma condição de saúde específica, 
            melhorar seus níveis de energia ou simplesmente adotar um estilo de vida mais saudável, nossos nutricionistas 
            especializados estão aqui para apoiá-lo em cada etapa do caminho.
          </p>
        </section>

        {/* Conteúdo gratuito */}
        <section className="w-full mt-10">
          <h2 className="text-[18px] font-semibold text-[#0D1C14] mb-5">
            Conteúdo gratuito
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {conteudoGratuito.map((item, i) => (
              <div
                key={i}
                className="border border-gray-300 rounded-md flex items-center gap-3 p-3 bg-white hover:shadow-md transition-shadow duration-300"
              >
                <Image
                  src={item.img}
                  alt={item.title}
                  width={38}
                  height={38}
                  className="rounded object-cover"
                />
                <span className="text-[14px] font-semibold text-[#0D1C14]">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Conteúdo Premium */}
        <section className="w-full mt-12">
          <h2 className="text-[18px] font-semibold text-[#0D1C14] mb-6">
            Conteúdo Premium
          </h2>
          <div className="space-y-5">
            {conteudoPremium.map((item, i) => (
              <div
                key={i}
                className="flex flex-col md:flex-row items-center justify-between bg-gray-50 border border-gray-300 rounded-md p-4 gap-6"
              >
                <div className="flex-1 space-y-2">
                  <span
                    className="inline-block px-3 py-1 text-white text-[12px] rounded"
                    style={{ backgroundColor: "#4F9678" }}
                  >
                    {item.badge}
                  </span>
                  <h3 className="text-[16px] font-semibold text-[#0D1C14]">
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-gray-700 leading-relaxed">
                    {item.desc}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2 h-9 px-4 border border-gray-300 text-[14px] font-semibold text-gray-800"
                  >
                    Inscreva-se agora
                  </Button>
                </div>
                <div className="flex-shrink-0">
                  <Image
                    src={item.img}
                    alt={item.title}
                    width={309}
                    height={165}
                    className="rounded-[8px] object-cover opacity-100"
                    style={{ transform: "rotate(0deg)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Botão de agendamento */}
        <section className="w-full mt-12 flex justify-center">
          <Button size="lg">
            Agende uma consulta
          </Button>
        </section>

      </main>
    </div>
  );
}
