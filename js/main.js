// Pre-entrega 9 — Asincronismo (setTimeout) y manejo de errores (try-catch-finally)

const profesor = "Agustin";
const contraseña = "1234";
const STORAGE_KEY = "materiasSimulador";
const STORAGE_ID_KEY = "siguienteIdMaterias";
const DEMORA_RECORDATORIO_MS = 3000;
const DIAS_HASTA_CIERRE_ACTAS = 10;

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

const crearMateriasIniciales = () => {
  const fisica = new Materia(1, "fisica", "ciencias", profesor);
  const matematica = new Materia(2, "matematica", "ciencias", profesor);
  const quimica = new Materia(3, "quimica", "ciencias", profesor);
  const historia = new Materia(4, "historia", "humanidades", profesor);
  const ingles = new Materia(5, "ingles", "idiomas", profesor);

  fisica.registrarNotas(8, 9);
  matematica.registrarNotas(7, 6);
  quimica.registrarNotas(10, 9);

  return [fisica, matematica, quimica, historia, ingles];
};

// Destructuring: reconstruye una instancia Materia desde un objeto del storage
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

let storageCorrupto = false;

const cargarEstadoDesdeStorage = () => {
  const raw = localStorage.getItem(STORAGE_KEY);

  // Si nunca se guardó nada, arrancamos con el listado por defecto
  if (raw === null) {
    return { lista: crearMateriasIniciales(), proximoId: 6 };
  }

  try {
    const guardadas = JSON.parse(raw) ?? [];
    if (!Array.isArray(guardadas)) {
      throw new TypeError("El contenido guardado no es un listado de materias.");
    }

    const idGuardado = Number(localStorage.getItem(STORAGE_ID_KEY));
    const maxId = guardadas.reduce((mayor, { id }) => (id > mayor ? id : mayor), 0);
    const proximoId =
      !Number.isNaN(idGuardado) && idGuardado > maxId
        ? idGuardado
        : maxId > 0
          ? maxId + 1
          : 1;

    return { lista: guardadas.map(materiaDesdeObjeto), proximoId };
  } catch (error) {
    console.error("No se pudo leer el localStorage:", error);
    storageCorrupto = true;
    return { lista: crearMateriasIniciales(), proximoId: 6 };
  } finally {
    console.info("Lectura del localStorage finalizada.");
  }
};

const vaciarStorageMaterias = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_ID_KEY);
};

const { lista: materiasCargadas, proximoId } = cargarEstadoDesdeStorage();
let materias = materiasCargadas;
let siguienteId = proximoId;
let intentosRestantes = 3;
let idResaltado = null;
let temporizadorFeedback = null;
let temporizadorRecordatorio = null;

const seccionLogin = document.getElementById("seccion-login");
const seccionApp = document.getElementById("seccion-app");
const formLogin = document.getElementById("form-login");
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
const contenedorItems = document.getElementById("contenedor-items");
const contadorMaterias = document.getElementById("contador-materias");
const mensajeFeedback = document.getElementById("mensaje-feedback");
const avisoRecordatorio = document.getElementById("aviso-recordatorio");
const avisoTexto = document.getElementById("aviso-texto");
const btnCerrarAviso = document.getElementById("btn-cerrar-aviso");

const esTextoValido = (valor) => valor !== null && valor.trim() !== "" && isNaN(Number(valor));

const esNotaValida = (valor) => {
  const numero = Number(valor);
  return !Number.isNaN(numero) && numero > 0 && numero <= 10;
};

const mostrarFeedback = (texto, tipo = "info") => {
  mensajeFeedback.textContent = texto;
  mensajeFeedback.className = "feedback visible " + tipo;

  if (temporizadorFeedback) clearTimeout(temporizadorFeedback);
  temporizadorFeedback = setTimeout(() => {
    mensajeFeedback.classList.remove("visible");
  }, 3200);
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

const vaciarMaterias = () => {
  if (materias.length === 0) {
    mostrarFeedback("No hay materias para vaciar.", "warn");
    return;
  }

  const confirmar = window.confirm("¿Vaciar todas las materias del listado y del almacenamiento?");
  if (!confirmar) return;

  materias = [];
  siguienteId = 1;
  vaciarStorageMaterias();
  guardarMateriasEnStorage();
  renderizarMaterias();
  mostrarFeedback("Se vació el listado y el localStorage.", "warn");
};

const iniciarSesion = (event) => {
  event.preventDefault();

  if (intentosRestantes <= 0) {
    mostrarFeedback("Acceso bloqueado. Recargá la página para reintentar.", "error");
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

    if (storageCorrupto) {
      mostrarFeedback("⚠️ Los datos guardados estaban dañados. Se restauró el listado inicial.", "warn");
      storageCorrupto = false;
    } else {
      mostrarFeedback("Acceso permitido. Bienvenido/a, " + profesor + ".", "ok");
    }
    return;
  }

  intentosRestantes -= 1;
  actualizarIntentos();

  const mensajeError =
    intentosRestantes === 0
      ? "Credenciales incorrectas. Sin intentos restantes."
      : "Error de credenciales. Quedan " + intentosRestantes + " intentos.";

  if (intentosRestantes === 0) formLogin.querySelector("button").disabled = true;
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
btnVaciarMaterias?.addEventListener("click", vaciarMaterias);
btnCerrarAviso.addEventListener("click", ocultarRecordatorio);

inputBusqueda.addEventListener("keyup", () => {
  renderizarMaterias();
  const filtro = obtenerFiltro();
  if (filtro) mostrarFeedback('Filtro activo: "' + filtro + '".', "info");
});

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

// Primera persistencia si el storage estaba vacío
guardarMateriasEnStorage();
actualizarIntentos();
