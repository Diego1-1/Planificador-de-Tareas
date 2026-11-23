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
        return task;
    }

    updateTaskDetails(taskId, updatedFields) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
            task.nombre = updatedFields.nombre;
            task.descripcion = updatedFields.descripcion;
            task.asignadoA = updatedFields.asignadoA;
            task.fechaDeEntrega = updatedFields.fechaDeEntrega;
            task.estado = updatedFields.estado;
        }
        return task;
    }

    assignTask(taskId, assignee) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
            task.asignadoA = assignee;
        }
        return task;
    }

    save() {
        localStorage.setItem("tasks", JSON.stringify(this.tasks));
        localStorage.setItem("currentId", String(this.currentId));
    }

    load() {
        const savedTasks = localStorage.getItem("tasks");
        if (savedTasks) {
            try {
                const parsed = JSON.parse(savedTasks);
                if (Array.isArray(parsed)) {
                    this.tasks = parsed;
                }
            } catch (error) {
                console.error("Error al leer 'tasks' desde localStorage:", error);
            }
        }

        const savedId = localStorage.getItem("currentId");
        if (savedId !== null) {
            const parsedId = Number(savedId);
            if (Number.isFinite(parsedId)) {
                this.currentId = parsedId;
            }
        }
    }

    render(container, createCardFn, onEmptyFn) {
        const emptyMsg = container.querySelector("#mensaje-vacio");
        container.innerHTML = "";
        if (emptyMsg) {
            container.appendChild(emptyMsg);
        }

        this.tasks.forEach((task) => {
            container.appendChild(createCardFn(task));
        });

        if (typeof onEmptyFn === "function") {
            onEmptyFn();
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

let taskManager = null;
let formulario = null;
let campoNombre = null;
let campoDescripcion = null;
let campoAsignadoA = null;
let campoFecha = null;
let campoEstado = null;
let botonSubmit = null;
let contenedorErrores = null;
let listaTareas = null;
let mensajeVacio = null;
let editingTaskId = null;

const ESTADOS = ["POR HACER", "EN PROCESO", "REVISIÓN", "HECHO"];

function setFormMode(mode) {
    if (!botonSubmit) return;
    if (mode === "update") {
        botonSubmit.textContent = "actualización";
    } else {
        botonSubmit.textContent = "guardar";
        editingTaskId = null;
    }
}

function loadTaskIntoForm(task) {
    if (!task) return;
    editingTaskId = task.id;
    campoNombre.value = task.nombre;
    campoDescripcion.value = task.descripcion;
    campoAsignadoA.value = task.asignadoA;
    campoFecha.value = task.fechaDeEntrega;
    campoEstado.value = task.estado;
    setFormMode("update");
    campoNombre.focus();
}

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
    if (!contenedorErrores) return;
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
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/\s+/g, "-");
}

function crearElemento(etiqueta, clase, texto) {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
}

function actualizarMensajeVacio() {
    if (!mensajeVacio || !taskManager) return;
    mensajeVacio.hidden = taskManager.getAllTasks().length > 0;
}

function renderizarTareas() {
    if (!listaTareas || !taskManager) return;
    taskManager.render(listaTareas, createTaskCard, actualizarMensajeVacio);
}

function createTaskCard(task) {
    const tarjeta = crearElemento("article", "tarjeta");
    tarjeta.dataset.id = task.id;

    tarjeta.addEventListener("click", (event) => {
        if (event.target.closest("select") || event.target.closest("button")) {
            return;
        }
        loadTaskIntoForm(task);
    });

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
        taskManager.save();
        insignia.textContent = selectEstado.value;
        insignia.className = "insignia " + claseEstado(selectEstado.value);
    });
    acciones.appendChild(selectEstado);

    const botonEliminar = crearElemento("button", "boton-eliminar", "Eliminar");
    botonEliminar.type = "button";
    botonEliminar.addEventListener("click", () => {
        if (editingTaskId === task.id) {
            formulario.reset();
            setFormMode("create");
        }
        taskManager.deleteTask(task.id);
        taskManager.save();
        tarjeta.remove();
        actualizarMensajeVacio();
    });
    acciones.appendChild(botonEliminar);

    tarjeta.appendChild(acciones);
    return tarjeta;
}

function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateTaskForm()) {
        return;
    }

    const datosFormulario = {
        nombre: campoNombre.value.trim(),
        descripcion: campoDescripcion.value.trim(),
        asignadoA: campoAsignadoA.value.trim(),
        fechaDeEntrega: campoFecha.value,
        estado: campoEstado.value
    };

    if (editingTaskId !== null) {
        taskManager.updateTaskDetails(editingTaskId, datosFormulario);
        taskManager.save();
        renderizarTareas();
        formulario.reset();
        setFormMode("create");
        return;
    }

    const nuevaTarea = createTaskObject(
        datosFormulario.nombre,
        datosFormulario.descripcion,
        datosFormulario.asignadoA,
        datosFormulario.fechaDeEntrega,
        datosFormulario.estado
    );

    taskManager.addTask(nuevaTarea);
    taskManager.save();
    renderizarTareas();

    formulario.reset();
    setFormMode("create");
}

function initApp() {
    formulario = document.getElementById("formulario-tarea");
    if (!formulario) return;

    campoNombre = document.getElementById("nombre");
    campoDescripcion = document.getElementById("descripcion");
    campoAsignadoA = document.getElementById("asignadoA");
    campoFecha = document.getElementById("fechaDeEntrega");
    campoEstado = document.getElementById("estado");
    botonSubmit = formulario.querySelector('button[type="submit"]');
    contenedorErrores = document.getElementById("errores");
    listaTareas = document.getElementById("lista-tareas");
    mensajeVacio = document.getElementById("mensaje-vacio");

    taskManager = new TaskManager();
    setFormMode("create");
    formulario.addEventListener("submit", handleFormSubmit);

    taskManager.load();
    renderizarTareas();
}

if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initApp);
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        TaskManager,
        createTaskObject,
        createTaskCard,
        initApp
    };
}