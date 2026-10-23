const socket = io();

const lista = document.getElementById("listaTurnos");
const btnAtender = document.getElementById("btnAtender");

btnAtender.addEventListener("click", () => {
    socket.emit("atender-turno");
});

socket.on("cola-actualizada", (cola) => {
    lista.innerHTML = "";

    if (cola.length === 0) {
        lista.innerHTML = `
            <li class="text-center text-slate-500 py-6">
                No hay turnos pendientes
            </li>
        `;
        return;
    }

    cola.forEach((turno) => {
        const li = document.createElement("li");

        li.className =
            "bg-slate-100 border border-slate-200 rounded-2xl p-5 flex items-center justify-between";

        const numero = document.createElement("span");
        numero.className = "text-xl font-semibold text-slate-700";
        numero.textContent = turno;

        const estado = document.createElement("span");
        estado.className =
            "bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold";
        estado.textContent = "Esperando";

        li.append(numero, estado);
        lista.appendChild(li);
    });
});

socket.on("error-turnero", (mensaje) => {
    alert(mensaje);
});
