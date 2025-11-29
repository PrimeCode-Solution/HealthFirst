# Etapa 1: Instalar dependências
FROM node:20-alpine AS deps
WORKDIR /app
# Instalar libc6-compat pode ser necessário dependendo das libs nativas
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./ 
# Instala dependências (clean install)
RUN npm ci

# Etapa 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Build do projeto Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Etapa 3: Runner (Imagem de produção)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos públicos
COPY --from=builder /app/public ./public

# Configurar diretório .next com permissões corretas
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar o build standalone (que inclui apenas o necessário)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
# Variável de host para que o servidor escute em todas as interfaces
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]