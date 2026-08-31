#!/bin/bash
# Script de inicializacion de la base de datos
# Se ejecuta automaticamente al crear el contenedor de MariaDB.
#
# OJO: docker-entrypoint-initdb.d solo corre cuando /var/lib/mysql esta vacio.
# Para reaplicar los procedimientos en un despliegue existente usa
# init-db/actualizar-procedimientos.sh (o borra el volumen con `down -v`).
set -e

# La contraseña se pasa por MYSQL_PWD y no como argumento: los argumentos son
# visibles en la tabla de procesos del contenedor durante la inicializacion.
export MYSQL_PWD="$MARIADB_ROOT_PASSWORD"

echo ">>> Creando base de datos y usuario..."
mariadb -u root <<EOSQL
CREATE DATABASE IF NOT EXISTS residencias;
CREATE USER IF NOT EXISTS '$MARIADB_USER'@'%' IDENTIFIED BY '$MARIADB_PASSWORD';
EOSQL

# El entrypoint de la imagen ya concedio ALL PRIVILEGES sobre MARIADB_DATABASE
# al crear el usuario, asi que primero hay que revocarlo. Si no existe la
# concesion, MariaDB da error y se ignora.
echo ">>> Ajustando privilegios al minimo necesario..."
mariadb -u root -e "REVOKE ALL PRIVILEGES ON residencias.* FROM '$MARIADB_USER'@'%';" 2>/dev/null || true

# Privilegios minimos: DML para la aplicacion y EXECUTE para los
# procedimientos almacenados. Sin CREATE/DROP/ALTER, de modo que la
# credencial de la aplicacion no puede modificar el esquema.
mariadb -u root <<EOSQL
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE, SHOW VIEW ON residencias.* TO '$MARIADB_USER'@'%';
FLUSH PRIVILEGES;
EOSQL

echo ">>> Creando tablas..."
mariadb -u root < /docker-entrypoint-initdb.d/sql/tablas.sql

echo ">>> Creando procedimientos almacenados..."
# Los procedimientos requieren cambiar el delimitador para manejar BEGIN...END
archivo_tmp=$(mktemp)
echo "DELIMITER //" > "$archivo_tmp"
# Reemplazar 'end;' al final de cada procedimiento con 'end //'
sed 's/^end;$/end \/\//' /docker-entrypoint-initdb.d/sql/procedimientos.sql >> "$archivo_tmp"
echo "" >> "$archivo_tmp"
echo "DELIMITER ;" >> "$archivo_tmp"
mariadb -u root residencias < "$archivo_tmp"
rm "$archivo_tmp"

echo ">>> Base de datos inicializada correctamente."
