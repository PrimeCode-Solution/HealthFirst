import React from 'react';
import { Card }  from '@/components/ui/card';
import { Stethoscope, Baby, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ConsutaPediatricaPage() {
    return (
        <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-6 w-full">
        
        <section className="grid grid-cols-1 gap-6 mb-12 mt-8">
        <div className="relative w-full mx-auto overflow-hidden rounded-xl">
           <Image
           width={1500}
           height={1000}
           alt="Mãe segurando seu filho"
           src="/pediatria.png"
           className="w-full h-[35rem] object-cover"
           />
           

           <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/70">
           <div className="absolute inset-0 flex flex-col justify-center px-8">
            <h1 className="mb-2 text-5xl font-bold tracking-tight text-white"> 
                 Cuidados pediátricos especializados para a saúde do seu filho
            </h1>
                <p className="mb-3 font-normal text-white">
                    Na HealthFirst, oferecemos atendimento para crianças de todas as idades, desde recém-nascidos até adolescentes.
                    Nossa equipe experiente se dedica a garantir a saúde e o bem-estar do seu filho. 
                </p>
                 
                <Link href="/agendar-consulta" className="inline-block text-center items-center px-4 py-3 w-48 text-sm font-bold text-black bg-[var(--primary)] rounded-lg">
                    Agende uma consulta
                </Link>

        </div>
        </div>  
        </div>
        
       
        
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
             Nossos serviços pediátricos
            </h2>
        
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2"> 
        <Card className="flex flex-col p-6 gap-2">
        
        
            <Stethoscope/>
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
                Consulta pediátrica de rotina
            </h2>

            <p className="text-[var(--chart-2)]">
             Check-ups regulares para monitorar o crescimento e o desenvolvimento.
            </p>

        </Card>
        <Card className="flex flex-col p-6 gap-2">
          
          <Baby />
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            Cuidados com o recém-nascido
          </h2>
          
          <p className="text-[var(--chart-2)]">
            Cuidados especializados para recém-nascidos e bebês.
          </p>

        </Card>
        <Card className="flex flex-col p-6 gap-2">
          
           <Heart />
           <h2 className="text-xl font-bold tracking-tight text-gray-900">
            Saúde do adolescente
           </h2>

           <p className="text-[var(--chart-2)]">
            Apoio e orientação para adolescentes e jovens adultos.
           </p>
             
        </Card>
        </section>

        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Recursos gratuitos para pais
        </h2>

        <div className="flex flex-col md:flex-row items-center gap-4 my-6">
        <div className="flex-1">
            <h3 className="block max-w-sm text-[var(--chart-2)]">Artigo</h3>
                <h3 className="mb-2 text-xl font-bold tracking-tight text-gray-900">Compreendendo os marcos do desenvolvimento do seu filho</h3>
                    <p className="mb-4 text-[var(--chart-2)]">Aprenda sobre as principais fases do desenvolvimento, desde a infância até a adolescência, e como apoiar o crescimento do seu filho.</p> 
                <button className="px-4 py-2 bg-gray-100 rounded-md text-black hover:bg-gray-300">Leia mais</button>
         </div>
                <div className="w-[280px] h-40 flex-shrink-0">
                     <Image
                     width={250}
                     height={100}
                     alt="bebê brincando"
                     src="/card_image1.png"
                     className="w-full h-full object-cover rounded-lg"

                     />                    
                
        </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 my-6">
        <div className="flex-1">
            <h3 className="block max-w-sm text-[var(--chart-2)]"> Guia </h3>
                <h3 className="mb-2 text-xl font-bold tracking-tight text-gray-900"> Calendários de vacinação: mantendo seu filho protegido </h3>
                  <p className="mb-4 text-[var(--chart-2)]">Mantenha-se atualizado com o calendário de vacinação recomendado para garantir a imunidade do seu filho contra doenças comuns.</p>
                   <button className="px-4 py-2 bg-gray-100 rounded-md text-black hover:bg-gray-300">Ver programação</button>
         </div>
            <div className="w-[280px] h-40 flex-shrink-0">
                <Image
                width={100}
                height={100}
                alt="Fundo com degradê laranja até branco"
                src="/card_image2.png"
                className="w-full h-full object-cover rounded-lg"
                />
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 my-6">
        <div className="flex-1">
            <h3 className="block max-w-sm text-[var(--chart-2)]"> Dicas </h3>
                <h3 className="mb-2 text-xl font-bold tracking-tight text-gray-900">Dicas gerais de saúde para crianças</h3>
            
            <p className="mb-4 text-[var(--chart-2)]">Conselhos práticos sobre nutrição, sono e atividade física para promover a saúde e o bem-estar geral do seu filho.</p>

             <button className="px-4 py-2 bg-gray-100 rounded-md text-black hover:bg-gray-300">Leia as dicas</button>
            </div>

            <div className="w-[280px] h-40 flex-shrink-0">
                <Image 
                width={100}
                height={100}
                alt="Crianças em um parque"
                src="/card_image3.png"
                className="w-full h-full object-cover rounded-lg"
                />
            </div>
        
        </div>

        <div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900"> Agende uma consulta </h2>

            <p className="mb-3">
                 Agende uma consulta com nossos especialistas em pediatria para discutir as questões de saúde do seu filho e receber 
                 orientação personalizada. Nossa equipe está aqui para apoiá-lo em cada etapa do processo.
            </p>

            <Link href="/agendar-consulta" className="inline-block text-center items-center px-4 py-2 bg-[var(--primary)] rounded-md text-black font-bold"> 
                Marcar consulta
            </Link>

        </div>
        </section>
        </div>
        </div>
    );
}