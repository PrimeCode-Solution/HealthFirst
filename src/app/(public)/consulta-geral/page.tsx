import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function generalConsultation() {
  return (
    <div className="min-h-screen bg-[#f7fcfa] p-4">
      <div className="mx-auto max-w-[930px]">
        <h1 className="pb-4 text-3xl font-bold">
          Serviços de consultoria geral
        </h1>
        <p className="text-md text-[#4F9678] md:text-sm">
          A HealthWise oferece consultas gerais abrangentes para tratar de uma
          ampla gama de questões de saúde. Nossa experiente equipe de
          profissionais de saúde oferece atendimento personalizado e orientação
          para ajudá-lo a alcançar o bem-estar ideal. Se você precisa de um
          check-up de rotina, tem dúvidas específicas sobre saúde ou precisa de
          apoio contínuo, estamos aqui para ajudá-lo em cada etapa do processo.
        </p>
        <h2 className="pt-9 pb-5 text-xl font-bold md:pt-8 md:pb-7 md:text-2xl md:font-semibold">
          Recursos gratuitos
        </h2>
        <div className="flex flex-col justify-between md:flex-row">
          <div className="w-full md:w-[301]">
            <Image
              className="w-full rounded-lg md:w-[301] md:p-1 lg:p-0"
              src="/images/consulta-geral/example-1.png"
              alt="example_1"
              width={301}
              height={301}
            />
            <h3 className="pt-3 pb-1 text-xl md:pb-0 md:text-lg">
              Compreendendo problemas de saúde comuns
            </h3>
            <p className="text-md pb-12 text-[#4F9678] md:text-sm">
              Saiba mais sobre as doenças mais comuns, seus sintomas e medidas
              preventivas.
            </p>
          </div>
          <div className="w-full md:w-[301]">
            <Image
              className="w-full rounded-lg md:w-[301] md:p-1 lg:p-0"
              src="/images/consulta-geral/example-2.png"
              alt="example_2"
              width={301}
              height={301}
            />
            <h3 className="pt-3 pb-1 text-xl md:pb-0 md:text-lg">
              Dicas de bem-estar para a vida cotidiana
            </h3>
            <p className="text-md pb-12 text-[#4F9678] md:pb-8 md:text-sm">
              Incorpore práticas de bem-estar simples, mas eficazes, à sua
              rotina diária para melhorar a sua saúde.
            </p>
          </div>
          <div className="w-full md:w-[301]">
            <Image
              className="w-full rounded-lg md:w-[301] md:p-1 lg:p-0"
              src="/images/consulta-geral/example-3.png"
              alt="example_3"
              width={301}
              height={301}
            />
            <h3 className="pt-3 pb-1 text-xl md:pb-0 md:text-lg">
              Navegando pelas opções de saúde
            </h3>
            <p className="text-md pb-12 text-[#4F9678] md:text-sm">
              Obtenha informações sobre diferentes serviços de saúde e saiba
              como escolher o mais adequado às suas necessidades.
            </p>
          </div>
        </div>
        <h2 className="pt-6 pb-5 text-xl font-bold md:pt-0 md:pb-7 md:text-2xl md:font-semibold">
          Conteúdo Premium
        </h2>
        <div className="flex flex-col rounded-sm p-3 shadow-[0_0_4px_0_rgba(0,0,0,0.102)] md:flex-row">
          <div className="order-2 md:order-1">
            <p className="pt-1 text-sm text-[#4F9678] md:pt-0">
              Assinatura necessária
            </p>
            <h3 className="pt-1 pb-1 text-lg font-bold md:pt-0 md:pb-0">
              Recursos detalhados sobre saúde
            </h3>
            <p className="mb-3 text-sm text-[#4F9678]">
              Desbloqueie o acesso à nossa extensa biblioteca de recursos
              detalhados sobre saúde, incluindo artigos detalhados, guias e
              opiniões de especialistas sobre vários temas relacionados à saúde.
              Inscreva-se agora para ter acesso a conteúdo exclusivo.
            </p>
            <Button
              variant="outline"
              className="h-8 w-37 bg-[#E8F2ED] p-2 text-sm"
            >
              Inscreva-se agora
            </Button>
          </div>
          <Image
            className="order-1 mt-1 h-41 w-full rounded-lg md:order-2 md:w-77"
            src="/images/consulta-geral/example-4.png"
            alt="example_4"
            width={1120}
            height={593}
          />
        </div>
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            className="h-10 w-45 bg-[var(--primary)] font-bold"
          >
            Agende uma consulta
          </Button>
        </div>
      </div>
    </div>
  );
}
