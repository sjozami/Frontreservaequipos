FROM node:18-bullseye AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make gcc g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

# Si `npm ci` rompe, usá install para continuar
RUN npm install --force

# Copiar .env antes del código para que esté disponible en build time
COPY .env* ./
COPY . .

RUN npm run build

FROM node:18-bullseye AS runner

WORKDIR /app

# Copiar el .env antes de establecer NODE_ENV
COPY .env* ./

# Permitir variables de entorno como argumentos de build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm install --production --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/styles ./styles

EXPOSE 3000

CMD ["npm", "start"]
