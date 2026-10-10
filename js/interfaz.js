// Referencias al DOM, renderizado y notificaciones (Toastify + SweetAlert2)

const COLOR_PRIMARIO = "#0f6b7a";
const COLOR_PELIGRO = "#a33b3b";

const COLORES_FEEDBACK = {
  ok: "linear-gradient(135deg, #1f7a4d, #2e9e66)",
  error: "linear-gradient(135deg, #a33b3b, #c55252)",
  warn: "linear-gradient(135deg, #8a5a12, #b7791f)",
  info: "linear-gradient(135deg, #0a4f5a, #0f6b7a)",
};

const CLASES_ESTADO = {
  [ESTADOS.aprobada]: "ok",
  [ESTADOS.desaprobada]: "error",
  [ESTADOS.pendiente]: "pendiente",
};

const estadoCarga = document.getElementById("estado-carga");
const avisoRecordatorio = document.getElementById("aviso-recordatorio");
const avisoTexto = document.getElementById("aviso-texto");
const btnCerrarAviso = document.getElementById("btn-cerrar-aviso");
const formMateria = document.getElementById("form-materia");
const btnAgregarMateria = formMateria.querySelector("button[type='submit']");
const inputNombre = document.getElementById("input-nombre");
const inputCategoria = document.getElementById("input-categoria");
const listaSugerenciasCategorias = document.getElementById("sugerencias-categorias");
const inputBusqueda = document.getElementById("input-busqueda");
const selectCategoria = document.getElementById("select-categoria");
const btnReiniciar = document.getElementById("btn-reiniciar");
const contadorMaterias = document.getElementById("contador-materias");
const contenedorMaterias = document.getElementById("contenedor-materias");
const contenedorActa = document.getElementById("contenedor-acta");
const resumenActa = document.getElementById("resumen-acta");
const btnVaciarActa = document.getElementById("btn-vaciar-acta");
const btnConfirmarActa = document.getElementById("btn-confirmar-acta");
const contenedorHistorial = document.getElementById("contenedor-historial");
const btnVaciarHistorial = document.getElementById("btn-vaciar-historial");

const escaparHTML = (texto) =>
  String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const formatearPromedio = (promedio) => (promedio === null ? "—" : promedio.toFixed(2));

const formatearFecha = (fechaISO) =>
  new Date(fechaISO).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });

const mostrarFeedback = (texto, tipo = "info") => {
  Toastify({
    text: texto,
    duration: 3200,
    gravity: "top",
    position: "right",
    close: true,
    stopOnFocus: true,
    style: { background: COLORES_FEEDBACK[tipo] || COLORES_FEEDBACK.info },
  }).showToast();
};

const confirmarAccion = async ({ titulo, contenidoHTML, textoBoton, icono = "warning", esPeligrosa = false }) => {
  const { isConfirmed } = await Swal.fire({
    icon: icono,
    title: titulo,
    html: contenidoHTML,
    showCancelButton: true,
    confirmButtonText: textoBoton,
    cancelButtonText: "Cancelar",
    confirmButtonColor: esPeligrosa ? COLOR_PELIGRO : COLOR_PRIMARIO,
    reverseButtons: true,
  });
  return isConfirmed;
};

const actualizarEstadoCarga = (texto, tipo) => {
  estadoCarga.className = "estado-carga " + tipo;
  estadoCarga.innerHTML =
    (tipo === "cargando" ? '<span class="spinner" aria-hidden="true"></span>' : "") + texto;
};

const mostrarCargando = (cargando) => {
  btnReiniciar.disabled = cargando;
  btnAgregarMateria.disabled = cargando;

  if (cargando) {
    actualizarEstadoCarga("Cargando materias desde el servidor…", "cargando");
    contadorMaterias.textContent = "Cargando…";
    contenedorMaterias.innerHTML =
      '<p class="cargando-lista"><span class="spinner" aria-hidden="true"></span>Cargando materias…</p>';
  }
};

const mostrarRecordatorio = (texto) => {
  avisoTexto.textContent = texto;
  avisoRecordatorio.classList.remove("oculto");
};

const ocultarRecordatorio = () => avisoRecordatorio.classList.add("oculto");

const renderizarCategorias = (categorias) => {
  const seleccionActual = selectCategoria.value;

  selectCategoria.innerHTML =
    '<option value="todas">Todas</option>' +
    categorias
      .map((categoria) => `<option value="${escaparHTML(categoria)}">${escaparHTML(categoria)}</option>`)
      .join("");
  selectCategoria.value = categorias.includes(seleccionActual) ? seleccionActual : "todas";

  listaSugerenciasCategorias.innerHTML = categorias
    .map((categoria) => `<option value="${escaparHTML(categoria)}"></option>`)
    .join("");
};

const plantillaMateria = (materia, estaEnActa, estaResaltada) => {
  const { id, nombre, categoria, profesorAsignado, nota1, nota2, numeroActa } = materia;
  const estado = materia.obtenerEstado();
  const cerrada = materia.estaCerrada();

  const clases = ["item-materia"];
  if (cerrada) clases.push("cerrada");
  if (estaEnActa) clases.push("en-acta");
  if (estaResaltada) clases.push("recien-agregado");

  const acciones = cerrada
    ? `<span class="estado-chip cerrada">Cerrada · Acta N° ${numeroActa}</span>`
    : `
      <button type="button" class="btn ${estaEnActa ? "btn-secundario" : "btn-primario"} btn-chico" data-accion="acta">
        ${estaEnActa ? "Quitar del acta" : "+ Agregar al acta"}
      </button>
      <button type="button" class="btn btn-peligro btn-chico" data-accion="eliminar">Eliminar</button>
    `;

  const formularioNotas = cerrada
    ? ""
    : `
      <form class="item-notas" data-accion="notas">
        <label>
          Nota 1
          <input type="number" name="nota1" min="1" max="10" step="0.5" placeholder="1 a 10" value="${nota1 ?? ""}">
        </label>
        <label>
          Nota 2
          <input type="number" name="nota2" min="1" max="10" step="0.5" placeholder="1 a 10" value="${nota2 ?? ""}">
        </label>
        <button type="submit" class="btn btn-secundario btn-chico">Guardar notas</button>
      </form>
    `;

  return `
    <article class="${clases.join(" ")}" data-id="${id}">
      <div class="item-cabecera">
        <div>
          <h3>${escaparHTML(nombre)}</h3>
          <p>Categoría: ${escaparHTML(categoria)} · Profesor: ${escaparHTML(profesorAsignado)}</p>
          <p>Nota 1: ${nota1 ?? "-"} · Nota 2: ${nota2 ?? "-"} · Promedio: ${formatearPromedio(materia.calcularPromedio())}</p>
          <span class="estado-chip ${CLASES_ESTADO[estado]}">${estado}</span>
        </div>
        <div class="item-acciones">${acciones}</div>
      </div>
      ${formularioNotas}
    </article>
  `;
};

const PLANTILLA_SIN_MATERIAS = `
  <div class="vacio">
    <img src="assets/img/acta-vacia.svg" alt="" width="64" height="64">
    <p><strong>Todavía no hay materias cargadas.</strong><br>Cargá el listado o creá tu primera materia.</p>
    <div class="item-acciones">
      <button type="button" class="btn btn-primario btn-chico" data-accion="cargar-materias">Cargar materias</button>
      <button type="button" class="btn btn-secundario btn-chico" data-accion="crear-materia">Crear materia</button>
    </div>
  </div>
`;

const renderizarMaterias = (lista, idsEnActa, idResaltado, hayMaterias) => {
  contadorMaterias.textContent = lista.length + (lista.length === 1 ? " materia" : " materias");

  if (!hayMaterias) {
    contenedorMaterias.innerHTML = PLANTILLA_SIN_MATERIAS;
    return;
  }

  contenedorMaterias.innerHTML =
    lista.length === 0
      ? '<p class="vacio">No hay materias que coincidan con la búsqueda.</p>'
      : lista
          .map((materia) => plantillaMateria(materia, idsEnActa.includes(materia.id), materia.id === idResaltado))
          .join("");
};

const enfocarFormularioMateria = () => {
  const panelFormulario = formMateria.closest(".panel");
  panelFormulario.scrollIntoView({ behavior: "smooth", block: "center" });
  inputNombre.focus({ preventScroll: true });
  panelFormulario.classList.add("panel-destacado");
  setTimeout(() => panelFormulario.classList.remove("panel-destacado"), 1600);
};

const plantillaResumen = ({ cantidad, aprobadas, desaprobadas, pendientes, promedioGeneral }) => `
  <dl class="resumen">
    <div><dt>Materias</dt><dd>${cantidad}</dd></div>
    <div><dt>Aprobadas</dt><dd class="texto-ok">${aprobadas}</dd></div>
    <div><dt>Desaprobadas</dt><dd class="texto-error">${desaprobadas}</dd></div>
    <div><dt>Sin notas</dt><dd class="texto-warn">${pendientes}</dd></div>
    <div class="resumen-total"><dt>Promedio general</dt><dd>${formatearPromedio(promedioGeneral)}</dd></div>
  </dl>
`;

const renderizarActa = (materiasDelActa) => {
  const sinMaterias = materiasDelActa.length === 0;
  btnVaciarActa.disabled = sinMaterias;
  btnConfirmarActa.disabled = sinMaterias;

  if (sinMaterias) {
    contenedorActa.innerHTML = `
      <div class="vacio">
        <img src="assets/img/acta-vacia.svg" alt="" width="64" height="64">
        <p>El acta está vacía. Agregá materias desde el listado.</p>
      </div>
    `;
    resumenActa.innerHTML = "";
    return;
  }

  contenedorActa.innerHTML = `
    <ul class="lista-acta">
      ${materiasDelActa
        .map((materia) => {
          const { id, nombre } = materia;
          const estado = materia.obtenerEstado();
          return `
            <li class="fila-acta" data-id="${id}">
              <div>
                <strong>${escaparHTML(nombre)}</strong>
                <span class="meta">Promedio: ${formatearPromedio(materia.calcularPromedio())}</span>
              </div>
              <span class="estado-chip ${CLASES_ESTADO[estado]}">${estado}</span>
              <button type="button" class="btn btn-secundario btn-chico" data-accion="quitar" aria-label="Quitar ${escaparHTML(nombre)} del acta">✕</button>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;
  resumenActa.innerHTML = plantillaResumen(calcularResumen(materiasDelActa));
};

const plantillaDetalleActa = ({ numero, fecha, materias, resumen }) => `
  <p class="detalle-meta">Acta N° ${numero} · ${formatearFecha(fecha)}</p>
  <table class="tabla-acta">
    <thead>
      <tr><th>Materia</th><th>Nota 1</th><th>Nota 2</th><th>Promedio</th><th>Estado</th></tr>
    </thead>
    <tbody>
      ${materias
        .map(
          ({ nombre, nota1, nota2, promedio, estado }) => `
            <tr>
              <td>${escaparHTML(nombre)}</td>
              <td>${nota1}</td>
              <td>${nota2}</td>
              <td>${formatearPromedio(promedio)}</td>
              <td><span class="estado-chip ${CLASES_ESTADO[estado]}">${estado}</span></td>
            </tr>
          `
        )
        .join("")}
    </tbody>
  </table>
  ${plantillaResumen(resumen)}
`;

const renderizarHistorial = (historial) => {
  btnVaciarHistorial.disabled = historial.length === 0;

  if (historial.length === 0) {
    contenedorHistorial.innerHTML = '<p class="vacio">Todavía no cerraste ninguna acta.</p>';
    return;
  }

  contenedorHistorial.innerHTML = `
    <ul class="lista-historial">
      ${[...historial]
        .reverse()
        .map(
          ({ numero, fecha, materias, resumen: { promedioGeneral } }) => `
            <li class="fila-historial" data-numero="${numero}">
              <div>
                <strong>Acta N° ${numero}</strong>
                <span class="meta">${formatearFecha(fecha)} · ${materias.length} materias · Promedio ${formatearPromedio(promedioGeneral)}</span>
              </div>
              <div class="item-acciones">
                <button type="button" class="btn btn-secundario btn-chico" data-accion="detalle">Ver detalle</button>
                <button type="button" class="btn btn-peligro btn-chico" data-accion="anular">Anular</button>
              </div>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
};
