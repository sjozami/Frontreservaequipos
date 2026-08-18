# Next 16 exige Node >= 20.9; con node:18 el build falla.
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* se resuelve en tiempo de build: el navegador del docente
# necesita una URL a la que pueda llegar, no "localhost".
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- Imagen de ejecución ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Los .env NO se copian: quedarían horneados en las capas de la imagen y
# además el .env.local apunta a localhost, que no sirve fuera de la máquina.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

# Corre como usuario sin privilegios.
USER node

EXPOSE 3000
CMD ["npm", "start"]
