const socket = io();

const btnGenerar = document.getElementById("btnGenerar");
const ultimoGenerado = document.getElementById("ultimoGenerado");

btnGenerar.addEventListener("click", () => {
    socket.emit("generar-turno");
});

socket.on("nuevo-turno", (turno) => {
    ultimoGenerado.textContent = `Último: ${turno}`;
});