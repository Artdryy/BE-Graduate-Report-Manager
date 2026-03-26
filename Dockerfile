# Imagen base Node.js 22 Alpine (LTS, ligera y segura)
FROM node:22-alpine AS base

# Etapa de dependencias
FROM base AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Etapa de produccion
FROM base AS produccion
WORKDIR /app

# Crear usuario sin privilegios para ejecutar la aplicacion
RUN addgroup -S appgrupo && adduser -S appusuario -G appgrupo

# Copiar dependencias instaladas
COPY --from=dependencias /app/node_modules ./node_modules

# Copiar codigo fuente
COPY . .

# Crear directorio de uploads con permisos correctos
RUN mkdir -p uploads/reports && chown -R appusuario:appgrupo uploads

# Cambiar a usuario sin privilegios
USER appusuario

EXPOSE 3000

CMD ["node", "start.js"]
