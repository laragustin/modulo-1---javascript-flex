// Pre-entrega 10 — fetch + async/await a un JSON local y librerías (Toastify + SweetAlert2)

const profesor = "Agustin";
const contraseña = "1234";
const DATA_URL = "./data/materias.json";
const STORAGE_KEY = "materiasSimulador";
const STORAGE_ID_KEY = "siguienteIdMaterias";
const DEMORA_RECORDATORIO_MS = 3000;
const DEMORA_RED_SIMULADA_MS = 1200;
const DIAS_HASTA_CIERRE_ACTAS = 10;
const COLOR_PRIMARIO = "#0f6b7a";
const COLOR_PELIGRO = "#a33b3b";

const COLORES_FEEDBACK = {
  ok: "linear-gradient(135deg, #1f7a4d, #2e9e66)",
  error: "linear-gradient(135deg, #a33b3b, #c55252)",
  warn: "linear-gradient(135deg, #8a5a12, #b7791f)",
  info: "linear-gradient(135deg, #0a4f5a, #0f6b7a)",
};

class Materia {
  constructor(id, nombre, categoria, profesorAsignado) {
    this.id = id;
    this.nombre = nombre;
    this.categoria = categoria;
    this.profesorAsignado = profesorAsignado;
    this.nota1 = null;
    this.nota2 = null;
    this.lograda = false;
  }

  registrarNotas(nota1, nota2) {
    this.nota1 = Number(nota1);
    this.nota2 = Number(nota2);
  }

  calcularPromedio() {
    return this.nota1 === null || this.nota2 === null
      ? null
      : (this.nota1 + this.nota2) / 2;
  }

  informarEstado() {
    const promedio = this.calcularPromedio();
    const textoPromedio = promedio !== null ? promedio.toFixed(2) : "sin notas cargadas";
    return "Materia: " + this.nombre + " | Categoria: " + this.categoria + " | Promedio: " + textoPromedio;
  }
}

// Destructuring: reconstruye una instancia Materia desde un objeto del JSON o del storage
const materiaDesdeObjeto = ({
  id,
  nombre,
  categoria,
  profesorAsignado,
  nota1 = null,
  nota2 = null,
  lograda = false,
}) => {
  const materia = new Materia(id, nombre, categoria, profesorAsignado ?? profesor);
  if (nota1 !== null && nota2 !== null) materia.registrarNotas(nota1, nota2);
  materia.lograda = lograda ?? false;
  return materia;
};

const guardarMateriasEnStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(materias));
  localStorage.setItem(STORAGE_ID_KEY, String(siguienteId));
};

const calcularProximoId = (lista, idGuardado = 0) => {
  const maxId = lista.reduce((mayor, { id }) => (id > mayor ? id : mayor), 0);
  return !Number.isNaN(idGuardado) && idGuardado > maxId ? idGuardado : maxId + 1;
};

let storageCorrupto = false;

// Devuelve null si no hay nada guardado (o si estaba dañado) para que se usen los datos del servidor
const cargarEstadoDesdeStorage = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;

  try {
    const guardadas = JSON.parse(raw) ?? [];
    if (!Array.isArray(guardadas)) {
      throw new TypeError("El contenido guardado no es un listado de materias.");
    }

    const lista = guardadas.map(materiaDesdeObjeto);
    const idGuardado = Number(localStorage.getItem(STORAGE_ID_KEY));
    return { lista, proximoId: calcularProximoId(lista, idGuardado) };
  } catch (error) {
    console.error("No se pudo leer el localStorage:", error);
    storageCorrupto = true;
    return null;
  } finally {
    console.info("Lectura del localStorage finalizada.");
  }
};

const vaciarStorageMaterias = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_ID_KEY);
};

// Simula la latencia de una red real para que el estado "cargando" sea visible
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const obtenerMateriasDesdeJSON = async () => {
  let respuesta;
  try {
    respuesta = await fetch(DATA_URL);
  } catch {
    throw new Error("No se pudo conectar con el servidor de datos. Revisá tu conexión.");
  }

  if (!respuesta.ok) {
    throw new Error("El servidor respondió con un error (" + respuesta.status + " " + respuesta.statusText + ").");
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    throw new SyntaxError("El archivo de datos tiene un formato inválido.");
  }

  if (!Array.isArray(datos)) {
    throw new TypeError("El archivo de datos no contiene un listado de materias.");
  }

  return datos.map(materiaDesdeObjeto);
};

let materias = [];
let siguienteId = 1;
let intentosRestantes = 3;
let idResaltado = null;
let temporizadorRecordatorio = null;
let cargandoDatos = false;

const seccionLogin = document.getElementById("seccion-login");
const seccionApp = document.getElementById("seccion-app");
const formLogin = document.getElementById("form-login");
const botonIngresar = formLogin.querySelector("button[type='submit']");
const estadoCarga = document.getElementById("estado-carga");
const inputUsuario = document.getElementById("input-usuario");
const inputContrasena = document.getElementById("input-contrasena");
const intentosRestantesTexto = document.getElementById("intentos-restantes");
const nombreSesion = document.getElementById("nombre-sesion");
const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
const formMateria = document.getElementById("form-materia");
const inputNombre = document.getElementById("input-nombre");
const inputCategoria = document.getElementById("input-categoria");
const inputBusqueda = document.getElementById("input-busqueda");
const btnPromedioGeneral = document.getElementById("btn-promedio-general");
const btnVaciarMaterias = document.getElementById("btn-vaciar-materias");
const btnRestaurarServidor = document.getElementById("btn-restaurar-servidor");
const contenedorItems = document.getElementById("contenedor-items");
const contadorMaterias = document.getElementById("contador-materias");
const avisoRecordatorio = document.getElementById("aviso-recordatorio");
const avisoTexto = document.getElementById("aviso-texto");
const btnCerrarAviso = document.getElementById("btn-cerrar-aviso");

const esTextoValido = (valor) => valor !== null && valor.trim() !== "" && isNaN(Number(valor));

const esNotaValida = (valor) => {
  const numero = Number(valor);
  return !Number.isNaN(numero) && numero > 0 && numero <= 10;
};

const mostrarFeedback = (texto, tipo = "info") => {
  Toastify({
    text: texto,
    duration: 3200,
    gravity: "top",
    position: "right",
    close: true,
    stopOnFocus: true,
    style: { background: COLORES_FEEDBACK[tipo] ?? COLORES_FEEDBACK.info },
  }).showToast();
};

const actualizarEstadoCarga = (texto, tipo) => {
  estadoCarga.className = "estado-carga " + tipo;
  estadoCarga.innerHTML =
    (tipo === "cargando" ? '<span class="spinner" aria-hidden="true"></span>' : "") + texto;
};

const activarEstadoCarga = (cargando) => {
  cargandoDatos = cargando;
  botonIngresar.disabled = cargando || intentosRestantes <= 0;
  btnRestaurarServidor.disabled = cargando;

  if (cargando) {
    actualizarEstadoCarga("Cargando materias desde el servidor…", "cargando");
    contadorMaterias.textContent = "Cargando…";
    contenedorItems.innerHTML =
      '<p class="cargando-lista"><span class="spinner" aria-hidden="true"></span>Cargando materias…</p>';
  }
};

const fechaCierreActas = () => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + DIAS_HASTA_CIERRE_ACTAS);
  return fecha.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
};

const armarTextoRecordatorio = () => {
  const pendientes = materias.filter((materia) => materia.calcularPromedio() === null);

  if (materias.length === 0) {
    return "🔔 Tu listado está vacío. Agregá las materias que dictás para empezar a cargar notas.";
  }

  if (pendientes.length === 0) {
    const general = promedioGeneralCurso(materias);
    return "🔔 ¡Todas tus materias tienen notas cargadas! Promedio general del curso: " + general.toFixed(2) + ".";
  }

  const nombres = pendientes.map(({ nombre }) => nombre).join(", ");
  const plural = pendientes.length === 1 ? "materia" : "materias";
  return (
    "🔔 Recordatorio: tenés " + pendientes.length + " " + plural + " sin notas (" + nombres +
    "). El cierre de actas es el " + fechaCierreActas() + "."
  );
};

const ocultarRecordatorio = () => {
  avisoRecordatorio.classList.add("oculto");
};

const programarRecordatorio = () => {
  if (temporizadorRecordatorio) clearTimeout(temporizadorRecordatorio);
  ocultarRecordatorio();

  temporizadorRecordatorio = setTimeout(() => {
    avisoTexto.textContent = armarTextoRecordatorio();
    avisoRecordatorio.classList.remove("oculto");
    temporizadorRecordatorio = null;
  }, DEMORA_RECORDATORIO_MS);
};

const actualizarIntentos = () => {
  intentosRestantesTexto.textContent = "Intentos restantes: " + intentosRestantes;
};

const obtenerFiltro = () => inputBusqueda.value.trim().toLowerCase();

const materiasFiltradas = () => {
  const filtro = obtenerFiltro();
  return !filtro
    ? materias
    : materias.filter(({ nombre, categoria }) => {
        const nombreLower = nombre.toLowerCase();
        const categoriaLower = categoria.toLowerCase();
        return nombreLower.includes(filtro) || categoriaLower.includes(filtro);
      });
};

const promedioGeneralCurso = (lista) => {
  const conNotas = lista.filter((materia) => materia.calcularPromedio() !== null);
  if (conNotas.length === 0) return null;
  const suma = conNotas.reduce((acc, materia) => acc + materia.calcularPromedio(), 0);
  return suma / conNotas.length;
};

const renderizarMaterias = () => {
  const lista = materiasFiltradas();
  contadorMaterias.textContent = lista.length + (lista.length === 1 ? " materia" : " materias");

  if (lista.length === 0) {
    contenedorItems.innerHTML =
      '<p class="vacio">No hay materias para mostrar. Probá otra búsqueda o agregá una nueva.</p>';
    return;
  }

  contenedorItems.innerHTML = lista
    .map((materia) => {
      const { id, nombre, categoria, profesorAsignado, nota1, nota2, lograda } = materia;
      const promedio = materia.calcularPromedio();
      const textoPromedio = promedio !== null ? promedio.toFixed(2) : "sin notas";
      const aprobada = promedio !== null && promedio >= 7;

      const clases = ["item-materia"];
      if (id === idResaltado) clases.push("recien-agregado");
      if (aprobada || lograda) clases.push("aprobada");

      const estadoTexto = lograda
        ? "Lograda"
        : aprobada
          ? "Aprobada"
          : promedio !== null
            ? "Desaprobada"
            : "Pendiente";

      const estadoClase = lograda || aprobada ? "ok" : promedio === null ? "pendiente" : "";

      return `
        <article class="${clases.join(" ")}" data-id="${id}">
          <div class="item-cabecera">
            <div>
              <h3>${nombre}</h3>
              <p>Categoría: ${categoria} · Profesor: ${profesorAsignado}</p>
              <p>Nota 1: ${nota1 ?? "-"} · Nota 2: ${nota2 ?? "-"} · Promedio: ${textoPromedio}</p>
              <span class="estado-chip ${estadoClase}">${estadoTexto}</span>
            </div>
            <div class="item-acciones">
              <button type="button" class="btn btn-exito btn-chico" data-accion="lograr">Logrado</button>
              <button type="button" class="btn btn-peligro btn-chico" data-accion="eliminar">Eliminar</button>
            </div>
          </div>
          <form class="item-notas" data-accion="notas">
            <label>
              Nota 1
              <input type="number" name="nota1" min="1" max="10" step="any" placeholder="1 a 10" value="${nota1 ?? ""}">
            </label>
            <label>
              Nota 2
              <input type="number" name="nota2" min="1" max="10" step="any" placeholder="1 a 10" value="${nota2 ?? ""}">
            </label>
            <button type="submit" class="btn btn-secundario btn-chico">Guardar notas</button>
          </form>
        </article>
      `;
    })
    .join("");
};

const agregarMateriaDesdeFormulario = (event) => {
  event.preventDefault();

  const nombre = inputNombre.value.trim();
  const categoria = inputCategoria.value.trim();

  if (!esTextoValido(nombre)) {
    mostrarFeedback("El nombre de la materia debe ser un texto válido.", "error");
    return;
  }

  if (!esTextoValido(categoria)) {
    mostrarFeedback("La categoría debe ser un texto válido.", "error");
    return;
  }

  const nueva = new Materia(siguienteId, nombre.toLowerCase(), categoria.toLowerCase(), profesor);
  siguienteId += 1;
  materias.push(nueva);
  idResaltado = nueva.id;

  guardarMateriasEnStorage();
  formMateria.reset();
  inputNombre.focus();
  renderizarMaterias();
  mostrarFeedback('Se agregó "' + nueva.nombre + '" a la lista.', "ok");

  setTimeout(() => {
    idResaltado = null;
    renderizarMaterias();
  }, 1800);
};

const eliminarMateria = (id) => {
  const materia = materias.find((item) => item.id === id);
  if (!materia) return;

  const { nombre } = materia;
  const tarjeta = contenedorItems.querySelector('[data-id="' + id + '"]');
  tarjeta?.classList.add("eliminando");

  setTimeout(() => {
    materias = materias.filter((item) => item.id !== id);
    guardarMateriasEnStorage();
    renderizarMaterias();
    mostrarFeedback('Se eliminó "' + nombre + '".', "warn");
  }, 220);
};

const marcarLograda = (id) => {
  const materia = materias.find((item) => item.id === id);
  if (!materia) return;

  const { nombre } = materia;
  materia.lograda = true;
  guardarMateriasEnStorage();
  renderizarMaterias();
  mostrarFeedback('"' + nombre + '" marcada como lograda.', "ok");
};

const guardarNotas = (id, nota1, nota2) => {
  const materia = materias.find((item) => item.id === id);
  if (!materia) {
    throw new Error("La materia ya no existe en el listado.");
  }

  if (!esNotaValida(nota1) || !esNotaValida(nota2)) {
    throw new RangeError("Las notas deben ser números mayores a 0 y hasta 10.");
  }

  const notasAnteriores = { nota1: materia.nota1, nota2: materia.nota2 };
  materia.registrarNotas(nota1, nota2);

  try {
    guardarMateriasEnStorage();
  } catch (error) {
    // Si el storage falla (ej. cuota llena), revertimos para no desincronizar DOM y Storage
    materia.nota1 = notasAnteriores.nota1;
    materia.nota2 = notasAnteriores.nota2;
    throw new Error("No se pudo guardar en el almacenamiento del navegador.");
  }

  mostrarFeedback(
    "Notas guardadas en " + materia.nombre + ". Promedio: " + materia.calcularPromedio().toFixed(2),
    "ok"
  );
};

const vaciarMaterias = async () => {
  if (materias.length === 0) {
    mostrarFeedback("No hay materias para vaciar.", "warn");
    return;
  }

  const { isConfirmed } = await Swal.fire({
    icon: "warning",
    title: "¿Vaciar el listado?",
    text: "Se eliminarán todas las materias del listado y del almacenamiento del navegador.",
    showCancelButton: true,
    confirmButtonText: "Sí, vaciar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: COLOR_PELIGRO,
  });
  if (!isConfirmed) return;

  materias = [];
  siguienteId = 1;
  vaciarStorageMaterias();
  guardarMateriasEnStorage();
  renderizarMaterias();
  mostrarFeedback("Se vació el listado y el localStorage.", "warn");
};

const notificarErrorDeCarga = async (error, usarStorage) => {
  const detalle = !usarStorage
    ? "Tu listado actual no se modificó."
    : materias.length > 0
      ? "Mientras tanto se muestran las materias guardadas en este navegador."
      : "Podés reintentar o agregar materias manualmente.";

  const { isConfirmed } = await Swal.fire({
    icon: "error",
    title: "No se pudieron cargar las materias",
    text: error.message,
    footer: detalle,
    showCancelButton: true,
    confirmButtonText: "Reintentar",
    cancelButtonText: "Cerrar",
    confirmButtonColor: COLOR_PRIMARIO,
  });

  if (isConfirmed) await cargarMaterias({ usarStorage });
};

// usarStorage = true: si hay progreso guardado en localStorage, tiene prioridad sobre los datos del servidor
const cargarMaterias = async ({ usarStorage = true } = {}) => {
  let errorDeCarga = null;
  activarEstadoCarga(true);

  try {
    await esperar(DEMORA_RED_SIMULADA_MS);
    const delServidor = await obtenerMateriasDesdeJSON();
    const guardado = usarStorage ? cargarEstadoDesdeStorage() : null;

    materias = guardado?.lista ?? delServidor;
    siguienteId = guardado?.proximoId ?? calcularProximoId(delServidor);
    guardarMateriasEnStorage();

    const plural = materias.length === 1 ? "materia" : "materias";
    actualizarEstadoCarga("✅ " + materias.length + " " + plural + " listas para gestionar.", "ok");
    mostrarFeedback(
      guardado
        ? "Materias cargadas con éxito. Se recuperó tu progreso guardado."
        : "Materias cargadas con éxito desde el servidor (" + materias.length + ").",
      "ok"
    );
  } catch (error) {
    console.error("Error al cargar las materias:", error);
    errorDeCarga = error;
    actualizarEstadoCarga("❌ No se pudieron cargar las materias del servidor.", "error");

    if (usarStorage) {
      const guardado = cargarEstadoDesdeStorage();
      materias = guardado?.lista ?? [];
      siguienteId = guardado?.proximoId ?? 1;
    }
  } finally {
    activarEstadoCarga(false);
    renderizarMaterias();
  }

  if (storageCorrupto) {
    mostrarFeedback("⚠️ Los datos guardados en el navegador estaban dañados y se descartaron.", "warn");
    storageCorrupto = false;
  }

  if (errorDeCarga) await notificarErrorDeCarga(errorDeCarga, usarStorage);
};

const restaurarDesdeServidor = async () => {
  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: "¿Restaurar datos del servidor?",
    text: "Tu listado actual se reemplazará por las materias del archivo de datos.",
    showCancelButton: true,
    confirmButtonText: "Sí, restaurar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: COLOR_PRIMARIO,
  });
  if (!isConfirmed) return;

  await cargarMaterias({ usarStorage: false });
};

const iniciarSesion = (event) => {
  event.preventDefault();

  if (intentosRestantes <= 0) {
    mostrarFeedback("Acceso bloqueado. Recargá la página para reintentar.", "error");
    return;
  }

  if (cargandoDatos) {
    mostrarFeedback("Esperá a que terminen de cargar las materias.", "info");
    return;
  }

  const usuario = inputUsuario.value.trim();
  const clave = inputContrasena.value;

  if (!esTextoValido(usuario)) {
    mostrarFeedback("El nombre del profesor debe ser un texto.", "error");
    return;
  }

  if (usuario === profesor && clave === contraseña) {
    seccionLogin.classList.add("oculto");
    seccionApp.classList.remove("oculto");
    nombreSesion.textContent = profesor;
    renderizarMaterias();
    programarRecordatorio();
    mostrarFeedback("Acceso permitido. Bienvenido/a, " + profesor + ".", "ok");
    return;
  }

  intentosRestantes -= 1;
  actualizarIntentos();

  const mensajeError =
    intentosRestantes === 0
      ? "Credenciales incorrectas. Sin intentos restantes."
      : "Error de credenciales. Quedan " + intentosRestantes + " intentos.";

  if (intentosRestantes === 0) botonIngresar.disabled = true;
  mostrarFeedback(mensajeError, "error");
};

const cerrarSesion = () => {
  if (temporizadorRecordatorio) clearTimeout(temporizadorRecordatorio);
  temporizadorRecordatorio = null;
  ocultarRecordatorio();
  seccionApp.classList.add("oculto");
  seccionLogin.classList.remove("oculto");
  formLogin.reset();
  inputBusqueda.value = "";
  mostrarFeedback("Sesión cerrada.", "info");
};

formLogin.addEventListener("submit", iniciarSesion);
btnCerrarSesion.addEventListener("click", cerrarSesion);
formMateria.addEventListener("submit", agregarMateriaDesdeFormulario);
btnVaciarMaterias.addEventListener("click", vaciarMaterias);
btnRestaurarServidor.addEventListener("click", restaurarDesdeServidor);
btnCerrarAviso.addEventListener("click", ocultarRecordatorio);

inputBusqueda.addEventListener("keyup", renderizarMaterias);

btnPromedioGeneral.addEventListener("click", () => {
  const general = promedioGeneralCurso(materias);
  general === null
    ? mostrarFeedback("No hay materias con notas cargadas.", "warn")
    : mostrarFeedback("Promedio general del curso: " + general.toFixed(2), "ok");
});

contenedorItems.addEventListener("click", (event) => {
  const boton = event.target.closest("button[data-accion]");
  if (!boton) return;

  const tarjeta = boton.closest(".item-materia");
  const id = Number(tarjeta?.dataset?.id);
  const { accion } = boton.dataset;

  if (accion === "eliminar") eliminarMateria(id);
  if (accion === "lograr") marcarLograda(id);
});

contenedorItems.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-accion='notas']");
  if (!form) return;

  event.preventDefault();
  const botonGuardar = form.querySelector("button[type='submit']");
  botonGuardar.disabled = true;

  try {
    const tarjeta = form.closest(".item-materia");
    const id = Number(tarjeta?.dataset?.id);
    const datos = new FormData(form);
    guardarNotas(id, datos.get("nota1"), datos.get("nota2"));
  } catch (error) {
    console.error("Error al guardar notas:", error);
    mostrarFeedback("⚠️ No se pudo procesar la operación: " + error.message + " Intentá de nuevo.", "error");
  } finally {
    // Se ejecuta siempre: re-sincroniza el DOM con el estado (descarta valores inválidos en los inputs)
    botonGuardar.disabled = false;
    renderizarMaterias();
  }
});

actualizarIntentos();
cargarMaterias();
