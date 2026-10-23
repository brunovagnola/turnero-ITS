
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "turnos.json");

app.use(express.static(path.join(__dirname, "public")));

function estadoInicial() {
    return {
        contador: 0,
        colaTurnos: [],
        turnoActual: null
    };
}

function cargarEstado() {
    try {
        const datos = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

        if (
            !Number.isSafeInteger(datos.contador) ||
            datos.contador < 0 ||
            !Array.isArray(datos.colaTurnos) ||
            !datos.colaTurnos.every(t => typeof t === "string") ||
            !(datos.turnoActual === null ||
            typeof datos.turnoActual === "string")
        ) {
            throw new Error("Estado inválido");
        }

        return datos;
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
        return estadoInicial();
    }
}

fs.mkdirSync(DATA_DIR, { recursive: true });

let estado = cargarEstado();

function guardarEstado(nuevoEstado) {
    const temporal = DATA_FILE + ".tmp";
    fs.writeFileSync(temporal, JSON.stringify(nuevoEstado, null, 2));
    fs.renameSync(temporal, DATA_FILE);
    estado = nuevoEstado;
}

function ultimoTurno() {
    return estado.contador > 0
        ? `A-${String(estado.contador).padStart(3, "0")}`
        : null;
}

function enviarEstado(socket) {
    socket.emit("cola-actualizada", estado.colaTurnos);
    socket.emit("turno-actual", estado.turnoActual);
    socket.emit("ultimo-turno", ultimoTurno());
}

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        servicio: "turnero-its"
    });
});

io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    enviarEstado(socket);

    socket.on("generar-turno", () => {
        const contador = estado.contador + 1;
        const nuevoTurno = `A-${String(contador).padStart(3, "0")}`;

        try {
            guardarEstado({
                ...estado,
                contador,
                colaTurnos: [...estado.colaTurnos, nuevoTurno]
            });

            io.emit("nuevo-turno", nuevoTurno);
            io.emit("ultimo-turno", nuevoTurno);
            io.emit("cola-actualizada", estado.colaTurnos);
        } catch (error) {
            console.error("Error al guardar turno:", error);
            socket.emit("error-turnero", "No se pudo guardar el turno");
        }
    });

    socket.on("atender-turno", () => {
        if (estado.colaTurnos.length === 0) return;

        const turnoActual = estado.colaTurnos[0];

        try {
            guardarEstado({
                ...estado,
                turnoActual,
                colaTurnos: estado.colaTurnos.slice(1)
            });

            io.emit("turno-actual", estado.turnoActual);
            io.emit("cola-actualizada", estado.colaTurnos);
        } catch (error) {
            console.error("Error al atender turno:", error);
            socket.emit("error-turnero", "No se pudo atender el turno");
        }
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Turnero funcionando en puerto ${PORT}`);
});
