const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

const server = http.createServer(app);

const io = new Server(server);

// carpeta public
app.use(express.static('public'));


// variables del turnero
let contador = 0;
let colaTurnos = [];
let turnoActual = null;

// sockets

io.on('connection', (socket) => {

    console.log('Cliente conectado');

    // generar turnos -->
    socket.on('generar-turno', () => {
        contador++;

        const nuevoTurno = `A-${contador}`;

        colaTurnos.push(nuevoTurno);

        // avisar nuevo turno
        io.emit('nuevo-turno', nuevoTurno);

        // actualizar cola
        io.emit('cola-actualizada', colaTurnos);

    });


    // -------- ATENDER TURNO --------

    socket.on('atender-turno', () => {

        if (colaTurnos.length === 0) return;

        turnoActual = colaTurnos.shift();

        // actualizar pantalla principal
        io.emit('turno-actual', turnoActual);

        // actualizar cola
        io.emit('cola-actualizada', colaTurnos);

    });


    // -------- ENVIAR ESTADO ACTUAL --------

    socket.emit('cola-actualizada', colaTurnos);

    socket.emit('turno-actual', turnoActual);

});


// =====================
// SERVER
// =====================

server.listen(3000, () => {

    console.log('Servidor corriendo en puerto 3000');

});