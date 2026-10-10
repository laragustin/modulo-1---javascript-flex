// Lógica del simulador: estado, circuito de cierre de actas y eventos

const DEMORA_RECORDATORIO_MS = 3000;
const DURACION_RESALTADO_MS = 1800;

let materias = [];
let idsEnActa = [];
let historialActas = [];
let idResaltado = null;
let cargandoDatos = false;
let temporizadorRecordatorio = null;

const guardarEstado = () => {
  guardarEnStorage(STORAGE_KEYS.materias, materias);
  guardarEnStorage(STORAGE_KEYS.actaEnCurso, idsEnActa);
  guardarEnStorage(STORAGE_KEYS.historial, historialActas);
};

const buscarMateria = (id) => materias.find((materia) => materia.id === id);

const obtenerMateriasDelActa = () =>
  idsEnActa.map(buscarMateria).filter((materia) => materia !== undefined);

// Descarta del acta en curso las materias que ya no existen o que ya fueron cerradas
const sincronizarActa = () => {
  idsEnActa = idsEnActa.filter((id) => {
    const materia = buscarMateria(id);
    return materia !== undefined && !materia.estaCerrada();
  });
};

const obtenerCategorias = () =>
  [...new Set(materias.map(({ categoria }) => categoria))].sort((primera, segunda) =>
    primera.localeCompare(segunda)
  );

const obtenerMateriasFiltradas = () => {
  const busqueda = normalizarTexto(inputBusqueda.value);
  const categoriaElegida = selectCategoria.value;

  return materias.filter(({ nombre, categoria }) => {
    const coincideNombre = busqueda === "" || normalizarTexto(nombre).includes(busqueda);
    const coincideCategoria = categoriaElegida === "todas" || categoria === categoriaElegida;
    return coincideNombre && coincideCategoria;
  });
};

const renderizarMateriasFiltradas = () =>
  renderizarMaterias(obtenerMateriasFiltradas(), idsEnActa, idResaltado, materias.length > 0);

const renderizarTodo = () => {
  renderizarCategorias(obtenerCategorias());
  renderizarMateriasFiltradas();
  renderizarActa(obtenerMateriasDelActa());
  renderizarHistorial(historialActas);
};

const armarTextoRecordatorio = () => {
  const pendientes = materias.filter((materia) => !materia.estaCerrada() && !materia.tieneNotas());

  if (materias.length === 0) {
    return "🔔 Tu listado está vacío. Agregá las materias que dictás para empezar a cargar notas.";
  }

  if (pendientes.length === 0) {
    return "🔔 Todas tus materias abiertas tienen notas. ¡Ya podés armar y cerrar el acta!";
  }

  const nombres = pendientes.map(({ nombre }) => nombre).join(", ");
  return (
    "🔔 Recordatorio: tenés " + pendientes.length + (pendientes.length === 1 ? " materia" : " materias") +
    " sin notas (" + nombres + "). Cargalas antes de cerrar el acta."
  );
};

const programarRecordatorio = () => {
  clearTimeout(temporizadorRecordatorio);
  ocultarRecordatorio();
  temporizadorRecordatorio = setTimeout(() => mostrarRecordatorio(armarTextoRecordatorio()), DEMORA_RECORDATORIO_MS);
};

const ofrecerCargarOCrearMaterias = async () => {
  const { isConfirmed, isDenied } = await Swal.fire({
    icon: "info",
    title: "No hay materias cargadas",
    text: "Podés volver a intentar la carga o crear tu primera materia.",
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Cargar materias",
    denyButtonText: "Crear materia",
    cancelButtonText: "Cerrar",
    confirmButtonColor: COLOR_PRIMARIO,
    denyButtonColor: "#3d5a66",
  });

  if (isConfirmed) await cargarMaterias({ priorizarStorage: false });
  if (isDenied) enfocarFormularioMateria();
};

const notificarErrorDeCarga = async () => {
  if (materias.length > 0) {
    mostrarFeedback("Se muestran las materias guardadas.", "info");
    return;
  }
  await ofrecerCargarOCrearMaterias();
};

// Por defecto el progreso guardado en localStorage tiene prioridad sobre los datos del JSON
const cargarMaterias = async ({ priorizarStorage = true } = {}) => {
  let huboErrorDeCarga = false;
  cargandoDatos = true;
  mostrarCargando(true);

  try {
    await esperar(DEMORA_RED_SIMULADA_MS);
    const materiasDelServidor = await obtenerMateriasDesdeJSON();
    const materiasGuardadas = priorizarStorage ? leerMateriasGuardadas() : null;

    materias = materiasGuardadas || materiasDelServidor;
    idsEnActa = leerListaDeStorage(STORAGE_KEYS.actaEnCurso) || [];
    historialActas = leerListaDeStorage(STORAGE_KEYS.historial) || [];
    sincronizarActa();
    guardarEstado();

    actualizarEstadoCarga("✅ " + materias.length + " materias listas para gestionar.", "ok");
    mostrarFeedback(
      materiasGuardadas ? "Se recuperó tu progreso guardado." : "Materias cargadas (" + materias.length + ").",
      "ok"
    );
  } catch {
    huboErrorDeCarga = true;
    actualizarEstadoCarga("", "");
    materias = leerMateriasGuardadas() || [];
    idsEnActa = leerListaDeStorage(STORAGE_KEYS.actaEnCurso) || [];
    historialActas = leerListaDeStorage(STORAGE_KEYS.historial) || [];
    sincronizarActa();
  } finally {
    cargandoDatos = false;
    mostrarCargando(false);
    renderizarTodo();
  }

  huboErrorDeCarga ? await notificarErrorDeCarga() : programarRecordatorio();
};

const agregarMateria = (event) => {
  event.preventDefault();
  if (cargandoDatos) return;

  const nombre = inputNombre.value.trim();
  const categoria = inputCategoria.value.trim();

  if (!esTextoValido(nombre) || !esTextoValido(categoria)) {
    mostrarFeedback("El nombre y la categoría deben ser textos válidos.", "error");
    return;
  }

  const yaExiste = materias.some((materia) => normalizarTexto(materia.nombre) === normalizarTexto(nombre));
  if (yaExiste) {
    mostrarFeedback('Ya existe una materia llamada "' + nombre + '".', "warn");
    return;
  }

  const nuevaMateria = new Materia(calcularProximoId(materias), nombre, categoria, PROFESOR_POR_DEFECTO);
  materias.push(nuevaMateria);
  idResaltado = nuevaMateria.id;
  guardarEstado();

  formMateria.reset();
  inputNombre.focus();
  renderizarTodo();
  mostrarFeedback('Se agregó "' + nombre + '" al listado.', "ok");

  setTimeout(() => {
    idResaltado = null;
    renderizarMateriasFiltradas();
  }, DURACION_RESALTADO_MS);
};

const guardarNotas = (id, nota1, nota2) => {
  const materia = buscarMateria(id);
  if (!materia) throw new Error("La materia ya no existe en el listado.");
  if (materia.estaCerrada()) throw new Error("La materia pertenece a un acta cerrada.");
  if (!esNotaValida(nota1) || !esNotaValida(nota2)) {
    throw new RangeError("Las notas deben ser números entre 1 y 10.");
  }

  materia.registrarNotas(nota1, nota2);
  guardarEstado();
  mostrarFeedback(
    "Notas guardadas en " + materia.nombre + ". Promedio: " + formatearPromedio(materia.calcularPromedio()),
    "ok"
  );
};

const alternarMateriaEnActa = (id) => {
  const materia = buscarMateria(id);
  if (!materia || materia.estaCerrada()) return;

  const { nombre } = materia;
  const estaEnActa = idsEnActa.includes(id);
  idsEnActa = estaEnActa ? idsEnActa.filter((idEnActa) => idEnActa !== id) : [...idsEnActa, id];
  guardarEstado();
  renderizarTodo();

  if (estaEnActa) {
    mostrarFeedback('Se quitó "' + nombre + '" del acta.', "info");
  } else {
    mostrarFeedback(
      materia.tieneNotas()
        ? 'Se agregó "' + nombre + '" al acta.'
        : '"' + nombre + '" se agregó al acta, pero todavía no tiene notas.',
      materia.tieneNotas() ? "ok" : "warn"
    );
  }
};

const eliminarMateria = async (id) => {
  const materia = buscarMateria(id);
  if (!materia) return;

  const { nombre } = materia;
  const confirmado = await confirmarAccion({
    titulo: "¿Eliminar materia?",
    contenidoHTML: 'Se eliminará <strong>"' + escaparHTML(nombre) + '"</strong> del listado y del acta en curso.',
    textoBoton: "Sí, eliminar",
    esPeligrosa: true,
  });
  if (!confirmado) return;

  materias = materias.filter((item) => item.id !== id);
  sincronizarActa();
  guardarEstado();
  renderizarTodo();
  mostrarFeedback('Se eliminó "' + nombre + '".', "warn");
};

const vaciarActa = async () => {
  const confirmado = await confirmarAccion({
    titulo: "¿Vaciar el acta en curso?",
    contenidoHTML: "Las materias vuelven al listado sin cambios en sus notas.",
    textoBoton: "Sí, vaciar",
    esPeligrosa: true,
  });
  if (!confirmado) return;

  idsEnActa = [];
  guardarEstado();
  renderizarTodo();
  mostrarFeedback("Se vació el acta en curso.", "warn");
};

const confirmarCierreDeActa = async () => {
  const materiasDelActa = obtenerMateriasDelActa();
  if (materiasDelActa.length === 0) return;

  const sinNotas = materiasDelActa.filter((materia) => !materia.tieneNotas());
  if (sinNotas.length > 0) {
    await Swal.fire({
      icon: "warning",
      title: "Faltan notas",
      html:
        "Para cerrar el acta primero cargá las notas de: <strong>" +
        sinNotas.map(({ nombre }) => escaparHTML(nombre)).join(", ") +
        "</strong>.",
      confirmButtonColor: COLOR_PRIMARIO,
    });
    return;
  }

  const numeroActa = calcularProximoNumeroActa(historialActas);
  const resumen = calcularResumen(materiasDelActa);

  const confirmado = await confirmarAccion({
    titulo: "¿Cerrar el acta N° " + numeroActa + "?",
    contenidoHTML:
      plantillaResumen(resumen) + '<p class="detalle-meta">Las materias quedarán cerradas y no podrán modificarse.</p>',
    textoBoton: "Confirmar cierre",
    icono: "question",
  });
  if (!confirmado) return;

  const actaCerrada = {
    numero: numeroActa,
    fecha: new Date().toISOString(),
    materias: materiasDelActa.map((materia) => {
      const { id, nombre, categoria, nota1, nota2 } = materia;
      return {
        id,
        nombre,
        categoria,
        nota1,
        nota2,
        promedio: materia.calcularPromedio(),
        estado: materia.obtenerEstado(),
      };
    }),
    resumen,
  };

  materiasDelActa.forEach((materia) => {
    materia.numeroActa = numeroActa;
  });
  historialActas.push(actaCerrada);
  idsEnActa = [];
  guardarEstado();
  renderizarTodo();

  await Swal.fire({
    title: "¡Acta N° " + numeroActa + " cerrada!",
    imageUrl: "assets/img/acta-cerrada.svg",
    imageWidth: 88,
    imageHeight: 88,
    imageAlt: "Acta cerrada",
    html: plantillaDetalleActa(actaCerrada),
    width: 640,
    confirmButtonText: "Listo",
    confirmButtonColor: COLOR_PRIMARIO,
  });
};

const verDetalleActa = (numero) => {
  const acta = historialActas.find((item) => item.numero === numero);
  if (!acta) return;

  Swal.fire({
    title: "Detalle del acta",
    html: plantillaDetalleActa(acta),
    width: 640,
    confirmButtonText: "Cerrar",
    confirmButtonColor: COLOR_PRIMARIO,
  });
};

const reabrirMateriasDeActas = (numerosDeActa) => {
  materias
    .filter(({ numeroActa }) => numerosDeActa.includes(numeroActa))
    .forEach((materia) => {
      materia.numeroActa = null;
    });
};

const anularActa = async (numero) => {
  const confirmado = await confirmarAccion({
    titulo: "¿Anular el acta N° " + numero + "?",
    contenidoHTML: "Se borrará del historial y sus materias volverán a quedar abiertas para editar.",
    textoBoton: "Sí, anular",
    esPeligrosa: true,
  });
  if (!confirmado) return;

  reabrirMateriasDeActas([numero]);
  historialActas = historialActas.filter((acta) => acta.numero !== numero);
  guardarEstado();
  renderizarTodo();
  mostrarFeedback("Se anuló el acta N° " + numero + ".", "warn");
};

const vaciarHistorial = async () => {
  const confirmado = await confirmarAccion({
    titulo: "¿Vaciar el historial?",
    contenidoHTML: "Se anularán todas las actas cerradas y sus materias volverán a quedar abiertas.",
    textoBoton: "Sí, vaciar",
    esPeligrosa: true,
  });
  if (!confirmado) return;

  reabrirMateriasDeActas(historialActas.map(({ numero }) => numero));
  historialActas = [];
  guardarEstado();
  renderizarTodo();
  mostrarFeedback("Se vació el historial de actas.", "warn");
};

const reiniciarSimulador = async () => {
  const confirmado = await confirmarAccion({
    titulo: "¿Reiniciar el simulador?",
    contenidoHTML:
      "Se borrarán todos los datos guardados en el navegador (notas, acta en curso e historial) y se volverán a cargar las materias del servidor.",
    textoBoton: "Sí, reiniciar",
    esPeligrosa: true,
  });
  if (!confirmado) return;

  vaciarStorage();
  inputBusqueda.value = "";
  selectCategoria.value = "todas";
  await cargarMaterias();
};

formMateria.addEventListener("submit", agregarMateria);
inputBusqueda.addEventListener("input", renderizarMateriasFiltradas);
selectCategoria.addEventListener("change", renderizarMateriasFiltradas);
btnReiniciar.addEventListener("click", reiniciarSimulador);
btnVaciarActa.addEventListener("click", vaciarActa);
btnConfirmarActa.addEventListener("click", confirmarCierreDeActa);
btnVaciarHistorial.addEventListener("click", vaciarHistorial);
btnCerrarAviso.addEventListener("click", ocultarRecordatorio);

contenedorMaterias.addEventListener("click", (event) => {
  const boton = event.target.closest("button[data-accion]");
  if (!boton) return;

  const { accion } = boton.dataset;
  if (accion === "cargar-materias") cargarMaterias({ priorizarStorage: false });
  if (accion === "crear-materia") enfocarFormularioMateria();

  const tarjeta = boton.closest(".item-materia");
  if (!tarjeta) return;

  const id = Number(tarjeta.dataset.id);
  if (accion === "acta") alternarMateriaEnActa(id);
  if (accion === "eliminar") eliminarMateria(id);
});

contenedorMaterias.addEventListener("submit", (event) => {
  const formulario = event.target.closest("form[data-accion='notas']");
  if (!formulario) return;

  event.preventDefault();
  const id = Number(formulario.closest(".item-materia").dataset.id);
  const { nota1, nota2 } = Object.fromEntries(new FormData(formulario));

  try {
    guardarNotas(id, nota1, nota2);
  } catch (error) {
    mostrarFeedback("⚠️ " + error.message, "error");
  } finally {
    // Re-sincroniza el DOM con el estado: descarta valores inválidos que hayan quedado en los inputs
    renderizarTodo();
  }
});

contenedorActa.addEventListener("click", (event) => {
  const boton = event.target.closest("button[data-accion='quitar']");
  if (!boton) return;
  alternarMateriaEnActa(Number(boton.closest(".fila-acta").dataset.id));
});

contenedorHistorial.addEventListener("click", (event) => {
  const boton = event.target.closest("button[data-accion]");
  if (!boton) return;

  const numero = Number(boton.closest(".fila-historial").dataset.numero);
  const { accion } = boton.dataset;

  if (accion === "detalle") verDetalleActa(numero);
  if (accion === "anular") anularActa(numero);
});

cargarMaterias();
