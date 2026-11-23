const assert = require("node:assert/strict");
const { TaskManager, createTaskObject, initApp } = require("./Script.js");

function createMockDOM() {
    const createMockElement = (tagName) => {
        const element = {
            tagName: tagName.toUpperCase(),
            id: "",
            className: "",
            textContent: "",
            value: "",
            type: "",
            hidden: false,
            dataset: {},
            children: [],
            listeners: {},
            classList: {
                _classes: new Set(),
                add(cls) { this._classes.add(cls); },
                remove(cls) { this._classes.delete(cls); },
                contains(cls) { return this._classes.has(cls); }
            },
            appendChild(child) {
                child.parentNode = this;
                this.children.push(child);
                return child;
            },
            remove() {
                if (this.parentNode) {
                    this.parentNode.children = this.parentNode.children.filter((c) => c !== this);
                }
            },
            addEventListener(event, handler) {
                if (!this.listeners[event]) this.listeners[event] = [];
                this.listeners[event].push(handler);
            },
            dispatchEvent(event) {
                event.target = event.target || this;
                event.preventDefault = event.preventDefault || (() => {});
                const handlers = this.listeners[event.type] || [];
                handlers.forEach((fn) => fn(event));
            },
            click() {
                this.dispatchEvent({ type: "click" });
            },
            closest(selector) {
                if (selector === "select" && this.tagName === "SELECT") return this;
                if (selector === "button" && this.tagName === "BUTTON") return this;
                return null;
            },
            focus() {},
            querySelector(selector) {
                if (selector === "#mensaje-vacio") {
                    return findById(this, "mensaje-vacio");
                }
                if (selector === 'button[type="submit"]') {
                    return findByType(this, "submit");
                }
                if (selector === ".boton-eliminar") {
                    return findByClass(this, "boton-eliminar");
                }
                return null;
            },
            querySelectorAll(selector) {
                if (selector === ".tarjeta") {
                    return collectByClass(this, "tarjeta");
                }
                return [];
            },
            set innerHTML(val) {
                if (val === "") {
                    const emptyMsg = findById(this, "mensaje-vacio");
                    this.children = emptyMsg ? [emptyMsg] : [];
                }
            },
            get innerHTML() {
                const collectText = (node) => {
                    let text = node.textContent || "";
                    for (const child of node.children || []) {
                        text += " " + collectText(child);
                    }
                    return text;
                };
                return collectText(this);
            }
        };
        return element;
    };

    const findById = (root, id) => {
        if (root.id === id) return root;
        for (const child of root.children || []) {
            const found = findById(child, id);
            if (found) return found;
        }
        return null;
    };

    const findByType = (root, type) => {
        if (root.type === type) return root;
        for (const child of root.children || []) {
            const found = findByType(child, type);
            if (found) return found;
        }
        return null;
    };

    const findByClass = (root, cls) => {
        if (root.className && root.className.split(" ").includes(cls)) return root;
        for (const child of root.children || []) {
            const found = findByClass(child, cls);
            if (found) return found;
        }
        return null;
    };

    const collectByClass = (root, cls, acc = []) => {
        if (root.className && root.className.split(" ").includes(cls)) acc.push(root);
        for (const child of root.children || []) {
            collectByClass(child, cls, acc);
        }
        return acc;
    };

    const storage = new Map();
    global.localStorage = {
        getItem(key) { return storage.has(key) ? storage.get(key) : null; },
        setItem(key, val) { storage.set(key, String(val)); },
        removeItem(key) { storage.delete(key); },
        clear() { storage.clear(); }
    };

    const formulario = createMockElement("form");
    formulario.id = "formulario-tarea";
    formulario.reset = () => {
        campoNombre.value = "";
        campoDescripcion.value = "";
        campoAsignadoA.value = "";
        campoFecha.value = "";
        campoEstado.value = "";
    };

    const campoNombre = createMockElement("input"); campoNombre.id = "nombre";
    const campoDescripcion = createMockElement("textarea"); campoDescripcion.id = "descripcion";
    const campoAsignadoA = createMockElement("input"); campoAsignadoA.id = "asignadoA";
    const campoFecha = createMockElement("input"); campoFecha.id = "fechaDeEntrega";
    const campoEstado = createMockElement("select"); campoEstado.id = "estado";
    const errores = createMockElement("div"); errores.id = "errores"; errores.hidden = true;
    const botonSubmit = createMockElement("button"); botonSubmit.type = "submit"; botonSubmit.textContent = "guardar";

    const listaTareas = createMockElement("div"); listaTareas.id = "lista-tareas";
    const mensajeVacio = createMockElement("p"); mensajeVacio.id = "mensaje-vacio"; mensajeVacio.textContent = "Todavía no hay tareas.";
    listaTareas.appendChild(mensajeVacio);

    formulario.appendChild(campoNombre);
    formulario.appendChild(campoDescripcion);
    formulario.appendChild(campoAsignadoA);
    formulario.appendChild(campoFecha);
    formulario.appendChild(campoEstado);
    formulario.appendChild(errores);
    formulario.appendChild(botonSubmit);

    const elementsById = {
        "formulario-tarea": formulario,
        "nombre": campoNombre,
        "descripcion": campoDescripcion,
        "asignadoA": campoAsignadoA,
        "fechaDeEntrega": campoFecha,
        "estado": campoEstado,
        "errores": errores,
        "lista-tareas": listaTareas,
        "mensaje-vacio": mensajeVacio
    };

    global.document = {
        createElement: createMockElement,
        getElementById(id) { return elementsById[id] || null; },
        addEventListener() {}
    };

    return { formulario, campoNombre, campoDescripcion, campoAsignadoA, campoFecha, campoEstado, listaTareas };
}

function runUnitTests() {
    const tmAdd = new TaskManager();
    const added = tmAdd.addTask(
        createTaskObject("Diseñar pieza", "Modelado en CAD para prototipo", "Diego Moreno", "2026-12-01", "POR HACER")
    );
    assert.equal(added.id, 1);
    assert.equal(tmAdd.getAllTasks().length, 1);
    assert.equal(tmAdd.getAllTasks()[0].nombre, "Diseñar pieza");

    const tmDelete = new TaskManager();
    const t1 = tmDelete.addTask(createTaskObject("Tarea uno", "Descripción válida uno", "Diego Moreno", "2026-12-01", "POR HACER"));
    const t2 = tmDelete.addTask(createTaskObject("Tarea dos", "Descripción válida dos", "Diego Moreno", "2026-12-02", "HECHO"));
    tmDelete.deleteTask(t1.id);
    assert.equal(tmDelete.getAllTasks().length, 1);
    assert.equal(tmDelete.getAllTasks()[0].id, t2.id);

    const tmUpdate = new TaskManager();
    const t3 = tmUpdate.addTask(createTaskObject("Revisar plano", "Validar tolerancias geométricas", "Diego Moreno", "2026-12-03", "POR HACER"));
    tmUpdate.updateTask(t3.id, "REVISIÓN");
    assert.equal(tmUpdate.getAllTasks()[0].estado, "REVISIÓN");

    const tmAssign = new TaskManager();
    const t4 = tmAssign.addTask(createTaskObject("Pruebas de carga", "Ejecutar ensayo estructural base", "Diego Moreno", "2026-12-04", "EN PROCESO"));
    tmAssign.assignTask(t4.id, "Ervin Ruiz");
    assert.equal(tmAssign.getAllTasks()[0].asignadoA, "Ervin Ruiz");

    console.log("Pruebas unitarias de TaskManager: OK (4/4)");
}

function runUITests() {
    const { formulario, campoNombre, campoDescripcion, campoAsignadoA, campoFecha, campoEstado, listaTareas } = createMockDOM();
    initApp();

    campoNombre.value = "Configurar entorno";
    campoDescripcion.value = "Preparar pruebas y validaciones del proyecto";
    campoAsignadoA.value = "Diego Moreno";
    campoFecha.value = "2026-12-05";
    campoEstado.value = "EN PROCESO";

    formulario.dispatchEvent({ type: "submit" });

    const tarjetasTrasAgregar = listaTareas.querySelectorAll(".tarjeta");
    assert.equal(tarjetasTrasAgregar.length, 1);
    assert.ok(tarjetasTrasAgregar[0].innerHTML.includes("Configurar entorno"));

    const botonEliminar = tarjetasTrasAgregar[0].querySelector(".boton-eliminar");
    assert.ok(botonEliminar, "Debe existir el botón eliminar en la tarjeta");
    botonEliminar.click();

    const tarjetasTrasEliminar = listaTareas.querySelectorAll(".tarjeta");
    assert.equal(tarjetasTrasEliminar.length, 0);

    console.log("Pruebas de UI (agregar y eliminar en lista HTML): OK (2/2)");
}

runUnitTests();
runUITests();
console.log("Todas las pruebas con node:assert pasaron correctamente.");