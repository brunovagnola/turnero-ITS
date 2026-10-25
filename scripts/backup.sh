#!/bin/bash
# Backup de PostgreSQL para Turnero ITS.
# Ejecutar como root. No contiene contraseñas.

set -Eeuo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
umask 077

PROJECT_DIR="/home/bruno/turnero-ITS"
BACKUP_DIR="/var/backups/turnero"
RETENTION_MINUTES=10080  # Siete días.
TEMP_FILE=""

log() {
    printf '[%s] %s\n' "$(date --iso-8601=seconds)" "$*"
}

cleanup() {
    if [[ -n "$TEMP_FILE" && -f "$TEMP_FILE" ]]; then
        rm -- "$TEMP_FILE"
    fi
}

trap cleanup EXIT
trap 'log "ERROR: fallo en la línea $LINENO" >&2' ERR

if [[ "$EUID" -ne 0 ]]; then
    log "ERROR: ejecutar como root." >&2
    exit 1
fi

cd "$PROJECT_DIR"
install -d -m 700 "$BACKUP_DIR"

# Evitar dos backups simultáneos.
exec 9>/run/lock/turnero-backup.lock
if ! flock -n 9; then
    log "ERROR: ya existe un backup en ejecución." >&2
    exit 1
fi

log "Iniciando backup de PostgreSQL."

# Archivo temporal: no se presenta como copia terminada.
TEMP_FILE="$(mktemp "$BACKUP_DIR/.turnero-auto-XXXXXXXX.partial")"

docker compose exec -T postgres sh -c \
    'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
    > "$TEMP_FILE"

if [[ ! -s "$TEMP_FILE" ]]; then
    log "ERROR: el archivo está vacío." >&2
    exit 1
fi

# Comprobar que pg_restore puede interpretar el archivo.
docker compose exec -T postgres pg_restore --list \
    < "$TEMP_FILE" > /dev/null

FINAL_FILE="$BACKUP_DIR/turnero-auto-$(date +%Y%m%d-%H%M%S)-$$.dump"
mv -- "$TEMP_FILE" "$FINAL_FILE"
TEMP_FILE=""

log "Backup generado: $FINAL_FILE"
log "Tamaño: $(stat -c %s "$FINAL_FILE") bytes"

# Limpiar solo copias automáticas, tras generar una nueva.
log "Retención: eliminando copias automáticas de más de siete días."
find "$BACKUP_DIR" -maxdepth 1 -type f \
    -name 'turnero-auto-*.dump' \
    -mmin +"$RETENTION_MINUTES" \
    -print -delete

log "Backup finalizado correctamente."
