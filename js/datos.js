// Modelo de datos, carga del JSON con fetch y persistencia en localStorage

const DATA_URL = "./data/materias.json";
const PROFESOR_POR_DEFECTO = "Agustin";
const NOTA_APROBACION = 7;
const DEMORA_RED_SIMULADA_MS = 900;

const STORAGE_KEYS = {
  materias: "cierreActas.materias",
  actaEnCurso: "cierreActas.actaEnCurso",
  historial: "cierreActas.historial",
};

const ESTADOS = {
  aprobada: "Aprobada",
  desaprobada: "Desaprobada",
  pendiente: "Pendiente",
};

class Materia {
  constructor(id, nombre, categoria, profesorAsignado) {
    this.id = id;
    this.nombre = nombre;
    this.categoria = categoria;
    this.profesorAsignado = profesorAsignado;
    this.nota1 = null;
    this.nota2 = null;
    this.numeroActa = null;
  }

  registrarNotas(nota1, nota2) {
    this.nota1 = Number(nota1);
    this.nota2 = Number(nota2);
  }

  tieneNotas() {
    return this.nota1 !== null && this.nota2 !== null;
  }

  calcularPromedio() {
    return this.tieneNotas() ? (this.nota1 + this.nota2) / 2 : null;
  }

  obtenerEstado() {
    const promedio = this.calcularPromedio();
    if (promedio === null) return ESTADOS.pendiente;
    return promedio >= NOTA_APROBACION ? ESTADOS.aprobada : ESTADOS.desaprobada;
  }

  estaCerrada() {
    return this.numeroActa !== null;
  }
}

const materiaDesdeObjeto = ({
  id,
  nombre,
  categoria,
  profesorAsignado,
  nota1 = null,
  nota2 = null,
  numeroActa = null,
}) => {
  const materia = new Materia(id, nombre, categoria, profesorAsignado || PROFESOR_POR_DEFECTO);
  if (nota1 !== null && nota2 !== null) materia.registrarNotas(nota1, nota2);
  materia.numeroActa = numeroActa;
  return materia;
};

const normalizarTexto = (texto) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const esTextoValido = (valor) => valor.trim() !== "" && Number.isNaN(Number(valor));

const esNotaValida = (valor) => {
  const numero = Number(valor);
  return valor !== "" && !Number.isNaN(numero) && numero >= 1 && numero <= 10;
};

const calcularProximoId = (lista) => lista.reduce((mayor, { id }) => Math.max(mayor, id), 0) + 1;

const calcularProximoNumeroActa = (historial) =>
  historial.reduce((mayor, { numero }) => Math.max(mayor, numero), 0) + 1;

const calcularResumen = (lista) => {
  const conNotas = lista.filter((materia) => materia.tieneNotas());
  const aprobadas = conNotas.filter((materia) => materia.obtenerEstado() === ESTADOS.aprobada).length;
  const sumaPromedios = conNotas.reduce((acumulado, materia) => acumulado + materia.calcularPromedio(), 0);

  return {
    cantidad: lista.length,
    aprobadas,
    desaprobadas: conNotas.length - aprobadas,
    pendientes: lista.length - conNotas.length,
    promedioGeneral: conNotas.length > 0 ? sumaPromedios / conNotas.length : null,
  };
};

// Simula la latencia de una red real para que el estado "cargando" sea visible
const esperar = (milisegundos) => new Promise((resolve) => setTimeout(resolve, milisegundos));

const obtenerMateriasDesdeJSON = async () => {
  let respuesta;
  try {
    respuesta = await fetch(DATA_URL);
  } catch {
    throw new Error("No se pudo conectar con el servidor de datos. Revisá tu conexión.");
  }

  if (!respuesta.ok) {
    throw new Error("El servidor respondió con un error (" + respuesta.status + ").");
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

const guardarEnStorage = (clave, valor) => localStorage.setItem(clave, JSON.stringify(valor));

const borrarDeStorage = (clave) => localStorage.removeItem(clave);

const vaciarStorage = () => Object.values(STORAGE_KEYS).forEach(borrarDeStorage);

// Devuelve null si no hay nada guardado o si el contenido estaba dañado
const leerListaDeStorage = (clave) => {
  try {
    const guardado = JSON.parse(localStorage.getItem(clave));
    return Array.isArray(guardado) ? guardado : null;
  } catch {
    borrarDeStorage(clave);
    return null;
  }
};

const leerMateriasGuardadas = () => {
  const guardadas = leerListaDeStorage(STORAGE_KEYS.materias);
  return guardadas ? guardadas.map(materiaDesdeObjeto) : null;
};
