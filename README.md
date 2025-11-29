<div align="center">

  # 🏥 HealthFirst Fullstack

  **Plataforma de agendamento de consultas e gestão de saúde moderna e eficiente.**

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)

  <p>
    <a href="#-pré-requisitos">Pré-requisitos</a> •
    <a href="#-configuração-de-ambiente">Env</a> •
    <a href="#-opção-1-execução-com-docker-recomendado">Docker</a> •
    <a href="#-opção-2-execução-local-desenvolvimento">Local</a> •
    <a href="#-estrutura-do-projeto">Estrutura</a> •
    <a href="#-resolução-de-problemas">Troubleshooting</a>
  </p>

</div>

---

## 📋 Pré-requisitos

Certifique-se de ter as ferramentas abaixo instaladas antes de começar:

| Ferramenta | Descrição | Instalação |
| :--- | :--- | :--- |
| **Git** | Versionamento de código | [Baixar](https://git-scm.com/downloads) |
| **Docker Desktop** | **(Recomendado)** Para containers | [Baixar](https://www.docker.com/products/docker-desktop/) |
| **Node.js** | (v18+) Apenas para rodar sem Docker | [Baixar](https://nodejs.org/) |

> ⚠️ **Windows Users:** Para usar o Docker, ative o **WSL 2** e verifique se a **Virtualização (VT-x/SVM)** está habilitada na BIOS.

---

## ⚙️ Configuração de Ambiente

Crie um arquivo `.env` na raiz do projeto. Você pode copiar o exemplo abaixo:

```properties
# --- Banco de Dados ---
# Docker: postgres://postgres:password@db:5432/healthfirst
# Local:  postgres://postgres:password@localhost:5432/healthfirst
DATABASE_URL="postgresql://postgres:password@db:5432/healthfirst"

# --- Integrações Externas ---
# MP_ACCESS_TOKEN=seu_token_aqui
# NEXTAUTH_SECRET=sua_chave_secreta
🐳 Opção 1: Execução com Docker (Recomendado)Esta é a maneira mais simples e robusta. O banco de dados e a aplicação sobem juntos, isolados do seu sistema operacional.1. Iniciar os ServiçosExecute o comando para construir a imagem e subir os containers em segundo plano:Bashdocker-compose up --build -d
2. Configurar Banco de DadosNa primeira execução, é necessário criar as tabelas no banco (que é criado vazio):Bashdocker exec -it healthfirst-app npx prisma migrate deploy
3. AcessarPronto! Acesse no seu navegador:👉 http://localhost:3000🕹️ Comandos Úteis do DockerAçãoComandoVer logsdocker-compose logs -f appParar tudodocker-compose downReiniciardocker-compose restartAcessar Shelldocker exec -it healthfirst-app sh💻 Opção 2: Execução Local (Desenvolvimento)Use esta opção se precisar debugar código nativamente ou não quiser usar containers para a aplicação Node.1. Instalar DependênciasBashnpm install
2. Subir o Banco de DadosVocê ainda precisará de um Postgres rodando. Use o Docker apenas para o banco:Bashdocker-compose up -d db
(Nota: Ajuste seu .env para apontar para localhost:5432)3. Sincronizar PrismaBashnpx prisma migrate dev
4. Rodar AplicaçãoBashnpm run dev
📂 Estrutura do ProjetoPlaintexthealthfirst-fullstack/
├── prisma/              # Schema do banco e migrações
├── public/              # Assets estáticos (imagens, ícones)
├── src/
│   ├── app/             # Next.js App Router (Páginas e API)
│   │   └── api/         # Rotas de Backend (Webhooks, REST)
│   ├── components/      # UI Components (Botões, Modais, ShadcnUI)
│   ├── lib/             # Utilitários (Axios, Zod, Utils)
│   ├── modules/         # Regras de Negócio (Domains, DTOs)
│   │   ├── user/
│   │   ├── appointments/
│   │   └── subscriptions/
│   └── presentation/    # Camada de Apresentação (Forms, Hooks, Mutations)
└── docker-compose.yml   # Orquestração de Containers
🔧 Resolução de Problemas<details><summary>🔴 <strong>Erro: "getaddrinfo ENOTFOUND binaries.prisma.sh"</strong></summary>Causa: O container não consegue acessar a internet para baixar a engine do Prisma.Solução:Reinicie o Docker Desktop.Ou adicione DNS do Google no docker-compose.yml:YAMLdns:
  - 8.8.8.8
</details><details><summary>🔴 <strong>Erro: "Virtualization support not detected"</strong></summary>Causa: A virtualização está desligada na BIOS.Solução: Reinicie o computador, entre na BIOS (F2/Del) e habilite Intel VT-x / VMX ou AMD-V / SVM.</details><details><summary>🔴 <strong>Erro: Porta em uso (EADDRINUSE)</strong></summary>Causa: Outro serviço já está usando a porta 3000 ou 5432.Solução: Pare o serviço conflitante ou altere o mapeamento de portas no docker-compose.yml (ex: "3001:3000").</details><div align="center"><p>Desenvolvido com 💚 por <strong>PrimeCode Solutions</strong></p></div>