
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

async function obtenerEstado() {
    const [pendientes, actual, ultimo] = await Promise.all([
        pool.query(
            "SELECT numero FROM turnos WHERE estado = 'esperando' ORDER BY id"
        ),
        pool.query(
            `SELECT numero FROM turnos
            WHERE estado = 'atendido'
            ORDER BY fecha_atencion DESC, id DESC LIMIT 1`
        ),
        pool.query(
            "SELECT numero FROM turnos ORDER BY id DESC LIMIT 1"
        )
    ]);

    return {
        colaTurnos: pendientes.rows.map(t => t.numero),
        turnoActual: actual.rows[0]?.numero || null,
        ultimoTurno: ultimo.rows[0]?.numero || null
    };
}

async function emitirEstado() {
    const estado = await obtenerEstado();

    io.emit("cola-actualizada", estado.colaTurnos);
    io.emit("turno-actual", estado.turnoActual);
    io.emit("ultimo-turno", estado.ultimoTurno);
}

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "ok", servicio: "turnero-its" });
    } catch (error) {
        res.status(503).json({ status: "error", servicio: "turnero-its" });
    }
});

io.on("connection", async (socket) => {
    console.log("Cliente conectado:", socket.id);

    try {
        const estado = await obtenerEstado();

        socket.emit("cola-actualizada", estado.colaTurnos);
        socket.emit("turno-actual", estado.turnoActual);
        socket.emit("ultimo-turno", estado.ultimoTurno);
    } catch (error) {
        console.error("Error al cargar estado:", error);
        socket.emit("error-turnero", "No se pudo cargar el estado");
    }

    socket.on("generar-turno", async () => {
        try {
            const resultado = await pool.query(`
                INSERT INTO turnos (numero)
                VALUES (
                    'A-' || LPAD(
                        nextval('turnos_numero_seq')::text, 3, '0'
                    )
                )
                RETURNING numero
            `);

            const nuevoTurno = resultado.rows[0].numero;

            io.emit("nuevo-turno", nuevoTurno);
            await emitirEstado();
        } catch (error) {
            console.error("Error al generar turno:", error);
            socket.emit("error-turnero", "No se pudo generar el turno");
        }
    });

    socket.on("atender-turno", async () => {
        try {
            const resultado = await pool.query(`
                WITH siguiente AS (
                    SELECT id
                    FROM turnos
                    WHERE estado = 'esperando'
                    ORDER BY id
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED
                )
                UPDATE turnos
                SET estado = 'atendido',
                    fecha_atencion = NOW()
                WHERE id = (SELECT id FROM siguiente)
                RETURNING numero
            `);

            if (resultado.rowCount === 0) return;

            await emitirEstado();
        } catch (error) {
            console.error("Error al atender turno:", error);
            socket.emit("error-turnero", "No se pudo atender el turno");
        }
    });
});

async function iniciarServidor() {
    try {
        await pool.query("SELECT 1");
        console.log("Conexión con PostgreSQL establecida");

        server.listen(PORT, "0.0.0.0", () => {
            console.log(`Turnero funcionando en puerto ${PORT}`);
        });
    } catch (error) {
        console.error("No se pudo conectar a PostgreSQL:", error.message);
        process.exit(1);
    }
}

iniciarServidor();
