# Turnero ITS

Sistema web de gestión de turnos desarrollado con Node.js, Express, Socket.IO y PostgreSQL. Permite generar turnos correlativos, administrar una cola de espera y mostrar el turno en atención con actualización en tiempo real.

El proyecto fue desarrollado originalmente para **Integración de Aplicaciones** y ampliado para el trabajo final de **Laboratorio Full Stack II**, del **Instituto Técnico Superior de Cipolletti**.

## 1. Funcionalidades

- Generación de turnos con numeración correlativa.
- Atención de turnos según su orden de llegada.
- Visualización de turnos pendientes y del turno en atención.
- Actualización de las interfaces mediante Socket.IO.
- Persistencia de datos y secuencias en PostgreSQL.
- Endpoint `/health`, que verifica la conexión con la base de datos.

## 2. Entorno implementado

El despliegue se realizó en una máquina virtual con Debian 13, utilizando Docker Engine y Docker Compose.

| Componente | Función |
|---|---|
| Node.js y Express | Servidor de la aplicación y distribución de archivos estáticos |
| Socket.IO | Comunicación en tiempo real |
| PostgreSQL 17 | Almacenamiento de turnos y numeración |
| Docker Compose | Definición y ejecución del stack |
| Cockpit | Administración del servidor Debian |
| Portainer CE | Administración de Docker y consulta de registros |
| Uptime Kuma | Monitoreo de disponibilidad |
| Nginx Proxy Manager | Acceso web mediante proxy inverso |
| Bash y cron | Respaldo programado de PostgreSQL |

Cockpit se instala directamente en Debian. Los demás servicios del stack se ejecutan en contenedores.

## 3. Arquitectura

El navegador accede a `turnero.test`, resuelto localmente hacia la VM. Nginx Proxy Manager recibe la solicitud y la dirige al servicio `turnero`, en el puerto interno 3000.

La aplicación se conecta a PostgreSQL mediante la red interna de Compose. Uptime Kuma consulta `http://turnero:3000/health`.

La VM utiliza un adaptador NAT para acceder a Internet y otro host-only para la comunicación con Windows. La dirección host-only se obtiene mediante DHCP.

## 4. Estructura del proyecto

```text
turnero-ITS/
├── db/
│   └── init/
│       └── 001-turnos.sql
├── public/
│   ├── js/
│   ├── index.html
│   ├── ticket-generate.html
│   └── ticket-line.html
├── scripts/
│   ├── backup.sh
│   └── backup.cron
├── db.js
├── server.js
├── Dockerfile
├── compose.yml
├── package.json
├── package-lock.json
└── README.md
```

- `server.js`: servidor HTTP, eventos y gestión de turnos.
- `db.js`: conexión con PostgreSQL.
- `db/init/001-turnos.sql`: definición inicial de la tabla y la secuencia.
- `public/`: interfaces y código del navegador.
- `scripts/backup.sh`: respaldo de PostgreSQL y retención.
- `scripts/backup.cron`: referencia de la programación diaria.
- `compose.yml`: servicios, puertos y volúmenes.

## 5. Despliegue con Docker Compose

### Requisitos

- Git.
- Docker Engine.
- Complemento Docker Compose.
- Puertos necesarios disponibles.

Mientras la integración a `main` esté pendiente, la versión del despliegue se encuentra en `feature/despliegue-debian`.

```bash
git clone --branch feature/despliegue-debian https://github.com/brunovagnola/turnero-ITS.git
cd turnero-ITS
```

Crear un archivo `.env` local con valores propios:

```dotenv
POSTGRES_DB=turnero_db
POSTGRES_USER=turnero_user
POSTGRES_PASSWORD=REEMPLAZAR_POR_UNA_CONTRASENA_PROPIA
```

No publicar este archivo ni credenciales en Git. En Linux se recomienda restringir sus permisos:

```bash
chmod 600 .env
```

Validar e iniciar el stack con permisos para acceder a Docker:

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Consultar la salud desde el servidor después de completar el arranque:

```bash
curl http://127.0.0.1:3000/health
```

PostgreSQL ejecuta el SQL de inicialización únicamente cuando su directorio de datos está vacío. El script no se vuelve a ejecutar automáticamente sobre un volumen ya inicializado.

Los volúmenes conservan la información al recrear contenedores. No utilizar `docker compose down -v` si se desea conservar esos datos.

### Configuración inicial de las herramientas

Las cuentas de Portainer, Uptime Kuma y Nginx Proxy Manager se crean desde sus interfaces.

Para reproducir el acceso usado en el laboratorio:

1. Crear en Nginx Proxy Manager un Proxy Host `turnero.test` hacia `http://turnero:3000`, con soporte WebSocket.
2. Configurar en el archivo `hosts` del equipo cliente la IP host-only actual de Debian y el nombre `turnero.test`.
3. Crear en Uptime Kuma un monitor HTTP hacia `http://turnero:3000/health`.

Estas configuraciones se guardan en los volúmenes de las herramientas; no quedan creadas solamente por clonar el repositorio.

## 6. Acceso a servicios

| Dirección | Servicio |
|---|---|
| `http://turnero.test/` | Pantalla de atención |
| `http://turnero.test/ticket-generate.html` | Generación de turnos |
| `http://turnero.test/ticket-line.html` | Cola de turnos |
| `https://IP_VM:9090` | Cockpit |
| `https://IP_VM:9443` | Portainer |
| `http://IP_VM:3001` | Uptime Kuma |
| `http://IP_VM:81` | Administración de Nginx Proxy Manager |

Reemplazar `IP_VM` por la dirección host-only actual. Si cambia por DHCP, actualizar también la entrada de `turnero.test` en el equipo cliente.

El acceso de Turnero se verificó mediante HTTP en la red del laboratorio. No se configuró HTTPS para `turnero.test`.

## 7. Backup y recuperación

### PostgreSQL

El script `scripts/backup.sh`:

- Ejecuta `pg_dump` en formato custom comprimido.
- Genera un archivo temporal y comprueba que `pg_restore` pueda interpretar su contenido.
- Publica la copia definitiva después de esas comprobaciones.
- Utiliza permisos restringidos y un bloqueo para evitar ejecuciones simultáneas.
- Elimina copias automáticas de más de siete días después de generar una nueva.

En el entorno implementado utiliza `/home/bruno/turnero-ITS` como ruta del proyecto y `/var/backups/turnero` como destino. Estas rutas deben adaptarse si se instala en otra ubicación.

La programación instalada en el crontab de root ejecuta el respaldo diariamente a las 02:00, según la zona horaria argentina del servidor. `scripts/backup.cron` documenta esa entrada; no la instala automáticamente.

La VM debe estar encendida al llegar el horario. Cron no recupera automáticamente esa ejecución si el servidor estaba apagado.

### Configuraciones complementarias

Se realizó un respaldo manual separado de:

- Volumen de Portainer.
- Volumen de Uptime Kuma.
- Volúmenes de datos y certificados de Nginx Proxy Manager.
- `.env` privado, Compose y crontab de root.

Los servicios correspondientes se detuvieron durante la copia de sus volúmenes y se iniciaron nuevamente al finalizar.

Se copiaron respaldos a Windows mediante SCP y se verificó su integridad comparando SHA-256. Esa transferencia es manual y conserva una copia fuera del disco virtual, pero en el mismo equipo físico.

Los paquetes privados no se publican en Git.

## 8. Pruebas realizadas y límites

Se verificaron:

- Inicialización de PostgreSQL desde una base nueva.
- Generación, atención y actualización de turnos.
- Persistencia al recrear los contenedores.
- Backup y restauración de PostgreSQL en una base separada.
- Pérdida controlada de datos y recuperación efectiva.
- Funcionamiento de la aplicación con datos restaurados.
- Restauración de una copia generada por el script.
- Ejecución mediante cron y retención con un archivo ficticio antiguo.
- Detección de caída y recuperación mediante Uptime Kuma.
- Acceso por proxy y establecimiento de WebSocket con respuesta HTTP 101.
- Transferencia de respaldos a Windows con huellas coincidentes.

La restauración funcional de los volúmenes de las herramientas complementarias todavía no fue probada. La copia externa no está automatizada y no constituye un respaldo en otro equipo físico.

## 9. Autor

**Bruno Vagnola**

Instituto Técnico Superior de Cipolletti.

Proyecto académico para Integración de Aplicaciones y Laboratorio Full Stack II.
