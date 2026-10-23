# Turnero ITS

Sistema web de gestión de turnos desarrollado con Node.js, Express y Socket.IO. Permite generar turnos, administrar una cola de espera y visualizar en tiempo real el turno que se encuentra en atención.

El proyecto fue desarrollado originalmente para la materia **Integración de Aplicaciones** del **Instituto Técnico Superior de Cipolletti (ITS)**.

Actualmente se encuentra en una etapa de ampliación y adaptación para la materia **Laboratorio Full Stack II**, con el objetivo de implementar un entorno de despliegue, administración, monitoreo y mantenimiento de aplicaciones mediante Docker Compose.

## 1. Descripción del proyecto

Turnero ITS es una aplicación web que simula el funcionamiento de un sistema de atención por turnos.

Su arquitectura utiliza un servidor Node.js que administra los turnos y establece la comunicación entre las distintas interfaces mediante Socket.IO, permitiendo que los cambios se reflejen en tiempo real sin necesidad de actualizar manualmente las páginas.

El sistema dispone de tres interfaces principales:

- **Generación de turnos:** permite solicitar un nuevo turno mediante una numeración correlativa.
- **Administración de la cola:** muestra los turnos pendientes y permite llamar al siguiente.
- **Pantalla de atención:** muestra el turno que está siendo atendido.

## 2. Tecnologías utilizadas

| Tecnología | Función |
|---|---|
| Node.js | Ejecución del servidor |
| Express | Servidor HTTP y distribución de archivos estáticos |
| Socket.IO | Comunicación bidireccional en tiempo real |
| JavaScript | Lógica del servidor y del cliente |
| HTML5 | Estructura de las interfaces |
| Tailwind CSS | Diseño y estilos de las pantallas |

## 3. Funcionalidades implementadas

La versión actual de la aplicación incorpora:

- Generación de turnos con numeración correlativa.
- Administración de una cola de espera siguiendo el orden de llegada.
- Visualización del turno en atención.
- Actualización de las interfaces mediante eventos de Socket.IO.
- Sincronización del estado al establecer nuevas conexiones.
- Persistencia local mediante almacenamiento JSON.
- Endpoint HTTP `/health` para comprobar la disponibilidad del servidor.

La persistencia mediante JSON corresponde a la implementación actual y será reemplazada por PostgreSQL durante la siguiente etapa de desarrollo.

## 4. Estructura del proyecto

```text
turnero-ITS/
├── public/
│   ├── js/
│   │   ├── createTicket.js
│   │   ├── line.js
│   │   └── main.js
│   ├── index.html
│   ├── ticket-generate.html
│   └── ticket-line.html
├── data/
│   └── turnos.json
├── server.js
├── package.json
└── package-lock.json
```

**Componentes principales:**

- `server.js`: servidor HTTP, gestión de turnos y eventos de Socket.IO.
- `public/`: archivos correspondientes a las interfaces web.
- `public/js/`: lógica de comunicación entre las interfaces y el servidor.
- `data/`: almacenamiento persistente local utilizado en la versión actual.
- `package.json`: configuración del proyecto y dependencias.

## 5. Instalación y ejecución local

### Requisitos previos

- Node.js
- npm
- Git

### Clonar el repositorio

```bash
git clone https://github.com/brunovagnola/turnero-ITS.git
cd turnero-ITS
```

### Instalar dependencias

```bash
npm install
```

### Iniciar la aplicación

```bash
npm start
```

Por defecto, el servidor utiliza el puerto `3000`.

### Acceso a las interfaces

| Dirección | Descripción |
|---|---|
| `http://localhost:3000/` | Pantalla de atención |
| `http://localhost:3000/ticket-generate.html` | Generación de turnos |
| `http://localhost:3000/ticket-line.html` | Administración de la cola |
| `http://localhost:3000/health` | Estado del servicio |

## 6. Ampliación del proyecto: Laboratorio Full Stack II

La nueva etapa del proyecto se centra en adaptar la aplicación para su ejecución y administración dentro de un entorno de contenedores.

Se busca integrar conceptos de infraestructura, persistencia de datos, administración de servicios, monitoreo y recuperación ante fallas.

### Objetivos de la ampliación

- [ ] Migrar el almacenamiento de datos a PostgreSQL.
- [ ] Implementar la conexión entre Node.js y PostgreSQL.
- [ ] Contenerizar la aplicación mediante Docker.
- [ ] Definir y configurar los servicios con Docker Compose.
- [ ] Implementar persistencia mediante volúmenes Docker.
- [ ] Incorporar herramientas de administración y monitoreo.
- [ ] Establecer una estrategia de respaldo de la base de datos.
- [ ] Automatizar las copias de seguridad cuando corresponda.
- [ ] Verificar la recuperación de datos mediante pruebas de restauración.

### Arquitectura prevista

La arquitectura propuesta contempla una aplicación Node.js conectada a una base de datos PostgreSQL, ejecutándose en contenedores independientes y comunicándose mediante una red interna de Docker.

El entorno incorporará servicios complementarios para facilitar la administración, supervisión y mantenimiento de la aplicación.

La selección definitiva de estas herramientas se documentará a medida que avance la implementación.

## 7. Estado del proyecto

**Versión actual:** aplicación funcional con comunicación en tiempo real y persistencia local mediante JSON.

**Etapa en desarrollo:** migración a PostgreSQL y preparación del entorno Docker Compose.

La documentación se actualizará conforme se incorporen y validen los nuevos componentes.

## 8. Contexto académico

**Institución:** Instituto Técnico Superior de Cipolletti (ITS).

**Desarrollo original:** Integración de Aplicaciones.

**Ampliación y despliegue:** Laboratorio Full Stack II.

El proyecto permite integrar el desarrollo de aplicaciones web con prácticas de despliegue, administración, monitoreo y recuperación de servicios.

## 9. Autor

**Bruno Vagnola**

Instituto Técnico Superior de Cipolletti.

[Repositorio del proyecto](https://github.com/brunovagnola/turnero-ITS)