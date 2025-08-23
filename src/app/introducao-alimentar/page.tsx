import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button'; 

export default function IntroducaoAlimentar () {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8 text-center sm:text-left">
          <h1 className="font-bold text-4xl sm:text-5xl text-[#0D1C14] mb-4 font-manrope">
            Introdução aos alimentos
          </h1>
          <p className="font-normal font-manrope text-base sm:text-lg text-[#598c75] max-w-4xl mx-auto sm:mx-0">
            Explore nossos recursos sobre como introduzir alimentos sólidos na alimentação do seu bebê, desde guias básicos até planos alimentares detalhados.
          </p>
        </div>
        {/* Recursos gratuitos section */}
        <div className="mb-12">
          <h2 className="font-bold text-2xl sm:text-3xl text-[#0D1C14] mb-8 font-manrope text-center sm:text-left">
            Recursos gratuitos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {/* Card 1 - Guia para os primeiros alimentos */}
            <div className="w-full" >
              <div className="h-[301px] w-full bg-gradient-to-b from-blue-200 via-green-200 to-green-300 relative rounded-lg overflow-hidden">
                <Image
                  src="/images/intro-alimento/pote-alimento.png"
                  alt="Potinho de comida de bebê"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="mt-4">
                <h3 className="font-manrope text-[#0D1C14] font-medium text-lg mb-2">
                  Guia para os primeiros alimentos
                </h3>
                <p className="font-manrope text-[#598c75] text-sm">
                  Um guia completo para introduzir alimentos sólidos na alimentação do seu bebê.
                </p>
              </div>
            </div>
            {/* Card 2 - Guia de introdução aos alérgenos */}
            <div className="w-full">
              <div className="h-[301px] w-full bg-gradient-to-b from-blue-200 via-green-200 to-green-300 relative rounded-lg overflow-hidden">
                <Image
                  src="/images/intro-alimento/guia-alergenos.png"
                  alt="Alimentos alergênicos"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-manrope text-[#0D1C14] font-medium text-lg mb-2 w-[301px]">
                  Guia de introdução aos alérgenos
                </h3>
                <p className="font-manrope text-[#598c75] text-sm w-[301px]">
                  Aprenda como introduzir com segurança os principais alérgenos alimentares.
                </p>
              </div>
            </div>
            {/* Card 3 - Noções básicas sobre o desmame */}
            <div className="w-full">
              <div className="h-[301px] w-full bg-gradient-to-b from-blue-200 via-green-200 to-green-300 relative rounded-lg overflow-hidden">
                <Image
                  src="/images/intro-alimento/bebe-comendo.png"
                  alt="Bebê comendo"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-manrope text-[#0D1C14] font-medium text-lg mb-2">
                  Noções básicas sobre o desmame conduzido pelo bebê
                </h3>
                <p className="font-manrope text-[#598c75] text-sm">
                  Explore a abordagem de desmame conduzido pelo próprio bebê.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Conteúdo Premium section */}
        <div className="mb-12">
          <h2 className="font-bold text-2xl sm:text-3xl text-[#0D1C14] mb-8 font-manrope text-center sm:text-left">
            Conteúdo Premium
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {/* Card 4 - Planos alimentares detalhados */}
            <div className="w-full">
              <div className="h-[301px] w-full bg-gradient-to-b from-blue-200 via-green-200 to-green-300 relative rounded-lg overflow-hidden">
                <Image
                  src="/images/intro-alimento/plano-alimentar.png"
                  alt="Plano alimentar para bebês"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-manrope text-[#0D1C14] font-medium text-lg mb-2">
                  Planos alimentares detalhados
                </h3>
                <p className="font-manrope text-[#598c75] text-sm">
                  Acesse planos alimentares detalhados, adaptados personalmente aos seus critérios.
                </p>
              </div>
            </div>
            {/* Card 5 - E-books exclusivos */}
            <div className="w-full">
              <div className="h-[301px] w-full bg-gradient-to-b from-blue-200 via-green-200 to-green-300 relative rounded-lg overflow-hidden">
                <Image
                  src="/images/intro-alimento/e-book.png"
                  alt="E-books sobre nutrição"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-manrope text-[#0D1C14] font-medium text-lg mb-2">
                  E-books exclusivos
                </h3>
                <p className="font-manrope text-[#598c75] text-sm">
                  Baixe e-books exclusivos com informações detalhadas.
                </p>
              </div>
            </div>
            {/* Card 6 - Suporte personalizado */}
            <div className="w-full">
              <div className="h-[301px] w-full bg-gradient-to-b from-blue-200 via-green-200 to-green-300 relative rounded-lg overflow-hidden">
                <Image
                  src="/images/intro-alimento/pai-filho.png"
                  alt="Pai com bebê"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-manrope text-[#0D1C14] font-medium text-lg mb-2">
                  Suporte personalizado
                </h3>
                <p className="font-manrope text-[#598c75] text-sm">
                  Obtenha suporte personalizado de nossos especialistas.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Call to action button */}
         <div className="text-center mt-8">
          <Button variant="default" size="lg" className="bg-primary text-foreground shadow-xs hover:bg-primary/90 font-manrope text-lg transition-all duration-300 ease-in-out hover:scale-105">
            Agende uma consulta
          </Button>
        </div>
      </div>
    </div>
  );
};