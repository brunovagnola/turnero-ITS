const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const pool = require("./db");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

// Ordenar las operaciones y sus actualizaciones de pantalla
// dentro de esta instancia de la aplicación.
let operaciones = Promise.resolve();

function encolar(tarea) {
    const resultado = operaciones.then(tarea);
    operaciones = resultado.catch(() => {});
    return resultado;
}

async function obtenerJornada() {
    const resultado = await pool.query(`
        SELECT (
            CURRENT_TIMESTAMP AT TIME ZONE
            'America/Argentina/Buenos_Aires'
        )::date::text AS jornada
    `);

    return resultado.rows[0].jornada;
}

async function obtenerEstado() {
    const jornada = await obtenerJornada();

    const [pendientes, actual, ultimo] = await Promise.all([
        pool.query(
            `SELECT numero
             FROM public.turnos
             WHERE jornada = $1 AND estado = 'esperando'
             ORDER BY id`,
            [jornada]
        ),
        pool.query(
            `SELECT numero
             FROM public.turnos
             WHERE jornada = $1 AND estado = 'atendido'
             ORDER BY fecha_atencion DESC, id DESC
             LIMIT 1`,
            [jornada]
        ),
        pool.query(
            `SELECT numero
             FROM public.turnos
             WHERE jornada = $1
             ORDER BY id DESC
             LIMIT 1`,
            [jornada]
        )
    ]);

    return {
        jornada,
        colaTurnos: pendientes.rows.map(t => t.numero),
        turnoActual: actual.rows[0]?.numero || null,
        ultimoTurno: ultimo.rows[0]?.numero || null
    };
}

let ultimaJornadaEmitida = null;

async function emitirEstado() {
    const estado = await obtenerEstado();

    io.emit("cola-actualizada", estado.colaTurnos);
    io.emit("turno-actual", estado.turnoActual);
    io.emit("ultimo-turno", estado.ultimoTurno);

    ultimaJornadaEmitida = estado.jornada;
}

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "ok", servicio: "turnero-its" });
    } catch (error) {
        res.status(503).json({
            status: "error",
            servicio: "turnero-its"
        });
    }
});

io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    encolar(emitirEstado).catch(error => {
        console.error("Error al cargar estado:", error);
        socket.emit("error-turnero", "No se pudo cargar el estado");
    });

    socket.on("generar-turno", () => {
        encolar(async () => {
            const jornada = await obtenerJornada();

            // El contador y el turno se modifican en una sola sentencia.
            // Si falla la inserción, también se revierte el contador.
            const resultado = await pool.query(
                `WITH contador AS (
                    INSERT INTO public.jornadas (fecha, ultimo_numero)
                    VALUES ($1::date, 1)
                    ON CONFLICT (fecha)
                    DO UPDATE SET ultimo_numero =
                        public.jornadas.ultimo_numero + 1
                    RETURNING fecha, ultimo_numero
                )
                INSERT INTO public.turnos (jornada, numero)
                SELECT
                    fecha,
                    'A-' || LPAD(
                        ultimo_numero::text,
                        GREATEST(3, LENGTH(ultimo_numero::text)),
                        '0'
                    )
                FROM contador
                RETURNING numero`,
                [jornada]
            );

            io.emit("nuevo-turno", resultado.rows[0].numero);
            await emitirEstado();
        }).catch(error => {
            console.error("Error al generar turno:", error);
            socket.emit("error-turnero", "No se pudo generar el turno");
        });
    });

    socket.on("atender-turno", () => {
        encolar(async () => {
            const jornada = await obtenerJornada();

            const resultado = await pool.query(
                `WITH siguiente AS (
                    SELECT id
                    FROM public.turnos
                    WHERE jornada = $1 AND estado = 'esperando'
                    ORDER BY id
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED
                )
                UPDATE public.turnos
                SET estado = 'atendido',
                    fecha_atencion = NOW()
                WHERE id = (SELECT id FROM siguiente)
                RETURNING numero`,
                [jornada]
            );

            if (resultado.rowCount > 0) {
                await emitirEstado();
            }
        }).catch(error => {
            console.error("Error al atender turno:", error);
            socket.emit("error-turnero", "No se pudo atender el turno");
        });
    });
});

async function iniciarServidor() {
    try {
        // Comprobar que la estructura requerida esté disponible.
        await pool.query(`
            SELECT fecha, ultimo_numero
            FROM public.jornadas
            LIMIT 0
        `);

        await pool.query(`
            SELECT jornada, numero, estado
            FROM public.turnos
            LIMIT 0
        `);

        ultimaJornadaEmitida = await obtenerJornada();

        server.listen(PORT, "0.0.0.0", () => {
            console.log(`Turnero funcionando en puerto ${PORT}`);
        });

        // Actualizar pantallas abiertas al cambiar el día,
        // aunque nadie genere ni atienda un turno.
        setInterval(() => {
            encolar(async () => {
                const jornada = await obtenerJornada();

                if (jornada !== ultimaJornadaEmitida) {
                    await emitirEstado();
                }
            }).catch(error => {
                console.error("Error al comprobar jornada:", error);
            });
        }, 5000).unref();
    } catch (error) {
        console.error("No se pudo iniciar el servidor:", error.message);
        process.exit(1);
    }
}

iniciarServidor();