// Pre-entrega — Interfaz dinámica con DOM y eventos

const profesor = "Agustin";
const contraseña = "1234";

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
    if (this.nota1 === null || this.nota2 === null) return null;
    return (this.nota1 + this.nota2) / 2;
  }

  informarEstado() {
    const promedio = this.calcularPromedio();
    const textoPromedio = promedio !== null ? promedio.toFixed(2) : "sin notas cargadas";
    return "Materia: " + this.nombre + " | Categoria: " + this.categoria + " | Promedio: " + textoPromedio;
  }
}

const materiaFisica = new Materia(1, "fisica", "ciencias", profesor);
const materiaMatematica = new Materia(2, "matematica", "ciencias", profesor);
const materiaQuimica = new Materia(3, "quimica", "ciencias", profesor);
const materiaHistoria = new Materia(4, "historia", "humanidades", profesor);
const materiaIngles = new Materia(5, "ingles", "idiomas", profesor);

materiaFisica.registrarNotas(8, 9);
materiaMatematica.registrarNotas(7, 6);
materiaQuimica.registrarNotas(10, 9);

let materias = [materiaFisica, materiaMatematica, materiaQuimica, materiaHistoria, materiaIngles];
let siguienteId = 6;
let intentosRestantes = 3;
let idResaltado = null;
let temporizadorFeedback = null;

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
const contenedorItems = document.getElementById("contenedor-items");
const contadorMaterias = document.getElementById("contador-materias");
const mensajeFeedback = document.getElementById("mensaje-feedback");

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

const actualizarIntentos = () => {
  intentosRestantesTexto.textContent = "Intentos restantes: " + intentosRestantes;
};

const obtenerFiltro = () => inputBusqueda.value.trim().toLowerCase();

const materiasFiltradas = () => {
  const filtro = obtenerFiltro();
  if (!filtro) return materias;

  return materias.filter((materia) => {
    const nombre = materia.nombre.toLowerCase();
    const categoria = materia.categoria.toLowerCase();
    return nombre.includes(filtro) || categoria.includes(filtro);
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
    contenedorItems.innerHTML = '<p class="vacio">No hay materias para mostrar. Probá otra búsqueda o agregá una nueva.</p>';
    return;
  }

  contenedorItems.innerHTML = lista
    .map((materia) => {
      const promedio = materia.calcularPromedio();
      const textoPromedio = promedio !== null ? promedio.toFixed(2) : "sin notas";
      const aprobada = promedio !== null && promedio >= 7;
      const clases = ["item-materia"];
      if (materia.id === idResaltado) clases.push("recien-agregado");
      if (aprobada || materia.lograda) clases.push("aprobada");

      const estadoTexto = materia.lograda
        ? "Lograda"
        : aprobada
          ? "Aprobada"
          : promedio !== null
            ? "Desaprobada"
            : "Pendiente";

      const estadoClase = materia.lograda || aprobada ? "ok" : promedio === null ? "pendiente" : "";

      return `
        <article class="${clases.join(" ")}" data-id="${materia.id}">
          <div class="item-cabecera">
            <div>
              <h3>${materia.nombre}</h3>
              <p>Categoría: ${materia.categoria} · Profesor: ${materia.profesorAsignado}</p>
              <p>Nota 1: ${materia.nota1 ?? "-"} · Nota 2: ${materia.nota2 ?? "-"} · Promedio: ${textoPromedio}</p>
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
              <input type="number" name="nota1" min="1" max="10" step="any" placeholder="1 a 10" value="${materia.nota1 ?? ""}">
            </label>
            <label>
              Nota 2
              <input type="number" name="nota2" min="1" max="10" step="any" placeholder="1 a 10" value="${materia.nota2 ?? ""}">
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

  const tarjeta = contenedorItems.querySelector('[data-id="' + id + '"]');
  if (tarjeta) tarjeta.classList.add("eliminando");

  setTimeout(() => {
    materias = materias.filter((item) => item.id !== id);
    renderizarMaterias();
    mostrarFeedback('Se eliminó "' + materia.nombre + '".', "warn");
  }, 220);
};

const marcarLograda = (id) => {
  const materia = materias.find((item) => item.id === id);
  if (!materia) return;

  materia.lograda = true;
  renderizarMaterias();
  mostrarFeedback('"' + materia.nombre + '" marcada como lograda.', "ok");
};

const guardarNotas = (id, nota1, nota2) => {
  const materia = materias.find((item) => item.id === id);
  if (!materia) return;

  if (!esNotaValida(nota1) || !esNotaValida(nota2)) {
    mostrarFeedback("Las notas deben ser números mayores a 0 y hasta 10.", "error");
    return;
  }

  materia.registrarNotas(nota1, nota2);
  renderizarMaterias();
  mostrarFeedback(
    "Notas guardadas en " + materia.nombre + ". Promedio: " + materia.calcularPromedio().toFixed(2),
    "ok"
  );
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
    mostrarFeedback("Acceso permitido. Bienvenido/a, " + profesor + ".", "ok");
    return;
  }

  intentosRestantes -= 1;
  actualizarIntentos();

  if (intentosRestantes === 0) {
    formLogin.querySelector("button").disabled = true;
    mostrarFeedback("Credenciales incorrectas. Sin intentos restantes.", "error");
  } else {
    mostrarFeedback("Error de credenciales. Quedan " + intentosRestantes + " intentos.", "error");
  }
};

const cerrarSesion = () => {
  seccionApp.classList.add("oculto");
  seccionLogin.classList.remove("oculto");
  formLogin.reset();
  inputBusqueda.value = "";
  mostrarFeedback("Sesión cerrada.", "info");
};

formLogin.addEventListener("submit", iniciarSesion);
btnCerrarSesion.addEventListener("click", cerrarSesion);
formMateria.addEventListener("submit", agregarMateriaDesdeFormulario);

inputBusqueda.addEventListener("keyup", () => {
  renderizarMaterias();
  const filtro = obtenerFiltro();
  if (filtro) {
    mostrarFeedback('Filtro activo: "' + filtro + '".', "info");
  }
});

btnPromedioGeneral.addEventListener("click", () => {
  const general = promedioGeneralCurso(materias);
  if (general === null) {
    mostrarFeedback("No hay materias con notas cargadas.", "warn");
    return;
  }
  mostrarFeedback("Promedio general del curso: " + general.toFixed(2), "ok");
});

contenedorItems.addEventListener("click", (event) => {
  const boton = event.target.closest("button[data-accion]");
  if (!boton) return;

  const tarjeta = boton.closest(".item-materia");
  const id = Number(tarjeta.dataset.id);
  const accion = boton.dataset.accion;

  if (accion === "eliminar") eliminarMateria(id);
  if (accion === "lograr") marcarLograda(id);
});

contenedorItems.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-accion='notas']");
  if (!form) return;

  event.preventDefault();
  const tarjeta = form.closest(".item-materia");
  const id = Number(tarjeta.dataset.id);
  const datos = new FormData(form);
  guardarNotas(id, datos.get("nota1"), datos.get("nota2"));
});

actualizarIntentos();
