class TaskManager {
    constructor() {
        this.tasks = [];     
        this.currentId = 0;  
    }

    getAllTasks() {
        return this.tasks;
    }

    getTasksWithStatus(status) {
        return this.tasks.filter((task) => task.estado === status);
    }

    addTask(task) {
        this.currentId++;
        task.id = this.currentId;
        this.tasks.push(task);
        return task;
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter((task) => task.id !== taskId);
    }

    updateTask(taskId, status) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
            task.estado = status;
        }
    }

    assignTask(taskId, assignee) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
            task.asignadoA = assignee;
        }
    }
}

function createTaskObject(nombre, descripcion, asignadoA, fechaDeEntrega, estado) {
    return {
        id: 0,
        nombre: nombre,
        descripcion: descripcion,
        asignadoA: asignadoA,
        fechaDeEntrega: fechaDeEntrega, 
        estado: estado
    };
}

const taskManager = new TaskManager();

const formulario = document.getElementById("formulario-tarea");
const campoNombre = document.getElementById("nombre");
const campoDescripcion = document.getElementById("descripcion");
const campoAsignadoA = document.getElementById("asignadoA");
const campoFecha = document.getElementById("fechaDeEntrega");
const campoEstado = document.getElementById("estado");
const contenedorErrores = document.getElementById("errores");
const listaTareas = document.getElementById("lista-tareas");
const mensajeVacio = document.getElementById("mensaje-vacio");

const ESTADOS = ["POR HACER", "EN PROCESO", "REVISIÓN", "HECHO"];


function validateTaskForm() {
    const errores = [];
    const campos = [campoNombre, campoDescripcion, campoAsignadoA, campoFecha, campoEstado];
    campos.forEach((c) => c.classList.remove("campo-invalido"));

    const nombre = campoNombre.value.trim();
    const descripcion = campoDescripcion.value.trim();
    const asignadoA = campoAsignadoA.value.trim();
    const fecha = campoFecha.value.trim();
    const estado = campoEstado.value.trim();

    if (nombre.length <= 8) {
        errores.push("El nombre no puede estar en blanco y debe tener más de 8 caracteres.");
        campoNombre.classList.add("campo-invalido");
    }
    if (descripcion.length <= 15) {
        errores.push("La descripción no puede estar en blanco y debe tener más de 15 caracteres.");
        campoDescripcion.classList.add("campo-invalido");
    }
    if (asignadoA.length <= 8) {
        errores.push("El campo 'Asignado a' no puede estar en blanco y debe tener más de 8 caracteres.");
        campoAsignadoA.classList.add("campo-invalido");
    }
    if (fecha === "") {
        errores.push("Debes seleccionar una fecha de entrega.");
        campoFecha.classList.add("campo-invalido");
    }
    if (estado === "") {
        errores.push("Debes seleccionar un estado para la tarea.");
        campoEstado.classList.add("campo-invalido");
    }

    mostrarErrores(errores);
    return errores.length === 0;
}

function mostrarErrores(errores) {
    contenedorErrores.innerHTML = "";
    if (errores.length === 0) {
        contenedorErrores.hidden = true;
        return;
    }
    const ul = document.createElement("ul");
    errores.forEach((mensaje) => {
        const li = document.createElement("li");
        li.textContent = mensaje;
        ul.appendChild(li);
    });
    contenedorErrores.appendChild(ul);
    contenedorErrores.hidden = false;
}

function claseEstado(estado) {
    return "estado-" + estado
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita tildes
        .toLowerCase().replace(/\s+/g, "-");
}

function crearElemento(etiqueta, clase, texto) {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
}

function createTaskCard(task) {
    const tarjeta = crearElemento("article", "tarjeta");
    tarjeta.dataset.id = task.id;


    const cabecera = crearElemento("div", "tarjeta-cabecera");
    cabecera.appendChild(crearElemento("h3", "", task.nombre));
    const insignia = crearElemento("span", "insignia " + claseEstado(task.estado), task.estado);
    cabecera.appendChild(insignia);
    tarjeta.appendChild(cabecera);

    tarjeta.appendChild(crearElemento("p", "", task.descripcion));
    tarjeta.appendChild(crearElemento("div", "tarjeta-datos", "Asignado a: " + task.asignadoA));
    tarjeta.appendChild(crearElemento("div", "tarjeta-datos", "Entrega: " + task.fechaDeEntrega));

    const acciones = crearElemento("div", "tarjeta-acciones");

    const selectEstado = document.createElement("select");
    ESTADOS.forEach((e) => {
        const opcion = crearElemento("option", "", e);
        opcion.value = e;
        if (e === task.estado) opcion.selected = true;
        selectEstado.appendChild(opcion);
    });
    selectEstado.addEventListener("change", () => {
        taskManager.updateTask(task.id, selectEstado.value);
        insignia.textContent = selectEstado.value;
        insignia.className = "insignia " + claseEstado(selectEstado.value);
    });
    acciones.appendChild(selectEstado);

    const botonEliminar = crearElemento("button", "boton-eliminar", "Eliminar");
    botonEliminar.type = "button";
    botonEliminar.addEventListener("click", () => {
        taskManager.deleteTask(task.id); // 1. se quita del array
        tarjeta.remove();                // 2. se quita del DOM
        actualizarMensajeVacio();
    });
    acciones.appendChild(botonEliminar);

    tarjeta.appendChild(acciones);
    return tarjeta;
}

function actualizarMensajeVacio() {
    mensajeVacio.hidden = taskManager.getAllTasks().length > 0;
}

formulario.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateTaskForm()) {
        return; 
    }

    const nuevaTarea = createTaskObject(
        campoNombre.value.trim(),
        campoDescripcion.value.trim(),
        campoAsignadoA.value.trim(),
        campoFecha.value,
        campoEstado.value
    );

    const tareaGuardada = taskManager.addTask(nuevaTarea);
    listaTareas.appendChild(createTaskCard(tareaGuardada));
    actualizarMensajeVacio();

    formulario.reset();
});