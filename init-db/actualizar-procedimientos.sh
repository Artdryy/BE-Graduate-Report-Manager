#!/bin/bash
# Reaplica .db-procedures sobre una base de datos YA existente.
#
# Los scripts de /docker-entrypoint-initdb.d solo corren cuando el volumen de
# MariaDB esta vacio, asi que un cambio en .db-procedures no llega a un
# despliegue en marcha. Este script cierra ese hueco sin borrar datos.
#
# Es seguro repetirlo: todos los procedimientos usan CREATE OR REPLACE.
#
# Uso:  ./init-db/actualizar-procedimientos.sh
set -e

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
    echo "ERROR: No se encontro el archivo .env"
    exit 1
fi

# shellcheck disable=SC1091
set -a; . ./.env; set +a

if [ -z "$MARIADB_ROOT_PASSWORD" ]; then
    echo "ERROR: MARIADB_ROOT_PASSWORD no esta definido en .env"
    exit 1
fi

BASE_DATOS="${DATABASE_NAME:-residencias}"

echo ">>> Reaplicando procedimientos almacenados en '$BASE_DATOS'..."

# Mismo preprocesado que init-db/01-inicializar.sh: el volcado no trae
# sentencias DELIMITER, asi que se envuelven aqui y se reescribe el 'end;'
# final de cada procedimiento como 'end //'.
archivo_tmp=$(mktemp)
trap 'rm -f "$archivo_tmp"' EXIT

echo "DELIMITER //" > "$archivo_tmp"
sed 's/^end;$/end \/\//' .db-procedures >> "$archivo_tmp"
echo "" >> "$archivo_tmp"
echo "DELIMITER ;" >> "$archivo_tmp"

docker compose exec -T \
    -e MYSQL_PWD="$MARIADB_ROOT_PASSWORD" \
    mariadb mariadb -u root "$BASE_DATOS" < "$archivo_tmp"

echo ">>> Procedimientos actualizados. Reinicia el backend si hace falta:"
echo "    docker compose restart backend"
