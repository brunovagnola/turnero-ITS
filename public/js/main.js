const socket = io();

const turnoActual = document.getElementById("turnoActual");

socket.on("turno-actual", (turno) => {
    turnoActual.textContent = turno;
});