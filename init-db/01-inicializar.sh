#!/bin/bash
# Script de inicializacion de la base de datos
# Se ejecuta automaticamente al crear el contenedor de MariaDB
set -e

echo ">>> Creando base de datos y permisos..."
mariadb -u root -p"$MARIADB_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS residencias;
GRANT ALL PRIVILEGES ON residencias.* TO '$MARIADB_USER'@'%';
FLUSH PRIVILEGES;
EOF

echo ">>> Creando tablas..."
mariadb -u root -p"$MARIADB_ROOT_PASSWORD" < /docker-entrypoint-initdb.d/sql/tablas.sql

echo ">>> Creando procedimientos almacenados..."
# Los procedimientos requieren cambiar el delimitador para manejar BEGIN...END
archivo_tmp=$(mktemp)
echo "DELIMITER //" > "$archivo_tmp"
# Reemplazar 'end;' al final de cada procedimiento con 'end //'
sed 's/^end;$/end \/\//' /docker-entrypoint-initdb.d/sql/procedimientos.sql >> "$archivo_tmp"
echo "" >> "$archivo_tmp"
echo "DELIMITER ;" >> "$archivo_tmp"
mariadb -u root -p"$MARIADB_ROOT_PASSWORD" residencias < "$archivo_tmp"
rm "$archivo_tmp"

echo ">>> Base de datos inicializada correctamente."
