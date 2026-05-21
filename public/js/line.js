const socket = io();

const lista = document.getElementById("listaTurnos");
const btnAtender = document.getElementById("btnAtender");

btnAtender.addEventListener("click", () => {
    socket.emit("atender-turno");
});

socket.on("cola-actualizada", (cola) => {
    lista.innerHTML = "";

    cola.forEach(turno => {
        lista.innerHTML += `
            <li>${turno}</li>
        `;
    });

});