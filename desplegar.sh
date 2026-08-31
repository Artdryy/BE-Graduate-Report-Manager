#!/bin/bash
# Script de despliegue - Descarga imagenes y levanta los servicios
set -e

REGISTRO="ghcr.io"
PROPIETARIO="artdryy"
IMAGEN_BACKEND="$REGISTRO/$PROPIETARIO/be-graduate-report-manager:latest"
IMAGEN_FRONTEND="$REGISTRO/$PROPIETARIO/fe-graduate-report-manager:latest"

echo "=== Despliegue del Sistema de Gestion de Residencias ==="

# Verificar que exista el archivo .env
if [ ! -f .env ]; then
    echo "ERROR: No se encontro el archivo .env"
    echo "Copia .env.example a .env y configura las variables:"
    echo "  cp .env.example .env"
    exit 1
fi

# Que el archivo exista no basta: hay que asegurarse de que los valores de
# ejemplo fueron reemplazados, o el despliegue saldria con secretos conocidos.
# Solo se miran las asignaciones reales (VARIABLE=valor), no los comentarios.
if grep -qE '^[[:space:]]*[A-Z_]+=cambiar_' .env; then
    echo "ERROR: .env todavia contiene valores de ejemplo (cambiar_*)."
    echo "Configura estas variables antes de desplegar:"
    grep -nE '^[[:space:]]*[A-Z_]+=cambiar_' .env | sed 's/^/  /'
    exit 1
fi

# Descargar imagenes
echo ""
echo ">>> Descargando imagen del backend..."
docker pull "$IMAGEN_BACKEND"

echo ""
echo ">>> Descargando imagen del frontend..."
docker pull "$IMAGEN_FRONTEND"

# Levantar servicios
echo ""
echo ">>> Levantando servicios con docker-compose..."
docker compose up -d

echo ""
echo "=== Despliegue completado ==="
echo "Frontend disponible en: http://localhost"
echo "Backend API en: http://localhost/api"
echo ""
echo "Comandos utiles:"
echo "  docker compose logs -f    # Ver logs en tiempo real"
echo "  docker compose down       # Detener servicios"
echo "  docker compose ps         # Ver estado de servicios"
