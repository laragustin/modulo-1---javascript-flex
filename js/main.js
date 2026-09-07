// Pre-entrega nº 6 - Funciones de Orden Superior

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
    const textoPromedio = promedio !== null ? promedio : "sin notas cargadas";
    return "Materia: " + this.nombre + " | Categoria: " + this.categoria + " | Promedio: " + textoPromedio;
  }
}

const materiaFisica = new Materia(1, "fisica", "ciencias", profesor);
const materiaMatematica = new Materia(2, "matematica", "ciencias", profesor);
const materiaQuimica = new Materia(3, "quimica", "ciencias", profesor);
const materiaHistoria = new Materia(4, "historia", "humanidades", profesor);
const materiaIngles = new Materia(5, "ingles", "idiomas", profesor);

let materias = [materiaFisica, materiaMatematica, materiaQuimica, materiaHistoria, materiaIngles];

// Verificacion: metodos sobre instancias creadas con new
materiaFisica.registrarNotas(8, 9);
console.log(materiaFisica.informarEstado());
materiaMatematica.registrarNotas(7, 6);
console.log(materiaMatematica.informarEstado());
materiaQuimica.registrarNotas(10, 9);
console.log(materiaQuimica.informarEstado());

function mostrarResultado(materia, promedio) {
  alert("El promedio de " + materia.nombre + " es: " + promedio);
  console.log("El promedio de " + materia.nombre + " es: " + promedio);
}

const iniciarSesion = function (usuarioCorrecto, claveCorrecta) {
  let acceso = false;
  let intento = 0;

  while (intento < 3) {
    let profe = prompt("Ingrese el nombre del profesor:");
    while (profe === null || profe === "" || !isNaN(profe)) {
      alert("El nombre del profesor debe ser un texto.");
      console.log("Nombre invalido");
      profe = prompt("Ingrese el nombre del profesor:");
    }

    const contra = prompt("Ingrese la contraseña:");

    if (profe === usuarioCorrecto && contra === claveCorrecta) {
      acceso = true;
      alert("Acceso permitido");
      console.log("Acceso permitido");
      break;
    } else {
      intento++;
      alert("Error de credenciales, le quedan " + (3 - intento) + " intentos");
      console.log("Error de Credenciales");
    }
  }

  return acceso;
};

function procesarMateria(materia) {
  let nota1 = prompt("Ingrese la primera nota para " + materia.nombre + ":");
  while (!(Number(nota1) > 0)) {
    alert("La nota debe ser un numero mayor a 0.");
    console.log("Nota invalida");
    nota1 = prompt("Ingrese la primera nota:");
  }

  let nota2 = prompt("Ingrese la segunda nota para " + materia.nombre + ":");
  while (!(Number(nota2) > 0)) {
    alert("La nota debe ser un numero mayor a 0.");
    console.log("Nota invalida");
    nota2 = prompt("Ingrese la segunda nota:");
  }

  materia.registrarNotas(nota1, nota2);
  const promedio = materia.calcularPromedio();
  mostrarResultado(materia, promedio);
  console.log(materia.informarEstado());
}

function listarMaterias(lista) {
  console.log("--- Listado de materias ---");
  let reporte = "Materias cargadas:\n";
  for (const materia of lista) {
    console.log(materia.informarEstado());
    reporte += "- " + materia.informarEstado() + "\n";
  }
  alert(reporte);
}

function agregarMateriaAlFinal(lista) {
  const nombreMateria = prompt("Ingrese el nombre de la materia para agregar al final:");
  if (nombreMateria === null || nombreMateria === "" || !isNaN(nombreMateria)) {
    alert("Nombre de materia invalido.");
    return;
  }
  const categoria = prompt("Ingrese la categoria de la materia (ej: ciencias, humanidades):") || "general";
  const nuevaMateria = new Materia(lista.length + 1, nombreMateria, categoria, profesor);
  lista.push(nuevaMateria);
  alert("Se agrego al final: " + nombreMateria);
  console.log("push:", lista.map(function (m) { return m.nombre; }));
}

function agregarMateriaAlInicio(lista) {
  const nombreMateria = prompt("Ingrese el nombre de la materia prioritaria (al inicio):");
  if (nombreMateria === null || nombreMateria === "" || !isNaN(nombreMateria)) {
    alert("Nombre de materia invalido.");
    return;
  }
  const categoria = prompt("Ingrese la categoria de la materia (ej: ciencias, humanidades):") || "general";
  const nuevaMateria = new Materia(lista.length + 1, nombreMateria, categoria, profesor);
  lista.unshift(nuevaMateria);
  alert("Se agrego al inicio: " + nombreMateria);
  console.log("unshift:", lista.map(function (m) { return m.nombre; }));
}

function eliminarUltimaMateria(lista) {
  if (lista.length === 0) {
    alert("No hay materias para eliminar.");
    return;
  }
  const eliminada = lista.pop();
  alert("Se ha eliminado el elemento: " + eliminada.nombre);
  console.log("pop:", eliminada.nombre, lista.map(function (m) { return m.nombre; }));
}

function buscarMateria(lista) {
  const buscada = prompt("Ingrese el nombre de la materia a buscar:");
  if (buscada === null || buscada === "") {
    alert("Busqueda cancelada.");
    return;
  }
  const posicion = lista.findIndex(function (materia) { return materia.nombre === buscada; });
  if (posicion !== -1) {
    alert("La materia \"" + buscada + "\" existe en el indice: " + posicion);
    console.log("findIndex:", buscada, posicion, lista[posicion].informarEstado());
  } else {
    alert("La materia \"" + buscada + "\" no existe en la lista.");
    console.log("Materia no encontrada:", buscada);
  }
}

function actualizarMateria(lista) {
  const indiceTexto = prompt("Ingrese el indice de la materia a actualizar:");
  const indice = Number(indiceTexto);
  if (!(indice >= 0) || indice >= lista.length) {
    alert("Indice invalido.");
    return;
  }
  const nuevoNombre = prompt("Ingrese el nuevo nombre para el indice " + indice + ":");
  if (nuevoNombre === null || nuevoNombre === "" || !isNaN(nuevoNombre)) {
    alert("Nombre invalido.");
    return;
  }
  lista[indice].nombre = nuevoNombre;
  alert("Se actualizo el indice " + indice + " por: " + nuevoNombre);
  console.log("splice (nombre):", lista.map(function (m) { return m.nombre; }));
}

function calcularPromedioDeMateria(lista) {
  const nombreBuscado = prompt("Ingrese el nombre de la materia para calcular el promedio:");
  const materiaEncontrada = lista.find(function (materia) { return materia.nombre === nombreBuscado; });
  if (materiaEncontrada) {
    procesarMateria(materiaEncontrada);
  } else {
    alert("La materia no esta en la lista. Use la opcion de busqueda o agreguela primero.");
  }
}

function filtrarPorCategoria(lista) {
  const categoria = prompt("Ingrese la categoria a filtrar (ciencias, humanidades, idiomas):");
  if (categoria === null || categoria === "") {
    alert("Filtro cancelado.");
    return;
  }
  const filtradas = lista.filter(function (materia) {
    return materia.categoria.toLowerCase() === categoria.toLowerCase();
  });
  if (filtradas.length === 0) {
    alert("No hay materias en la categoria: " + categoria);
    console.log("filter: sin resultados para", categoria);
    return;
  }
  let reporte = "Materias de \"" + categoria + "\":\n";
  for (const materia of filtradas) {
    reporte += "- " + materia.informarEstado() + "\n";
  }
  alert(reporte);
  console.log("filter:", filtradas.map(function (m) { return m.informarEstado(); }));
}

function listarPromedios(lista) {
  const reporte = lista.map(function (materia) {
    const promedio = materia.calcularPromedio();
    return materia.nombre + ": " + (promedio !== null ? promedio : "sin notas");
  });
  alert("Promedios por materia:\n" + reporte.join("\n"));
  console.log("map:", reporte);
}

function promedioGeneral(lista) {
  const conNotas = lista.filter(function (materia) {
    return materia.calcularPromedio() !== null;
  });
  if (conNotas.length === 0) {
    alert("No hay materias con notas cargadas.");
    console.log("reduce: no hay notas para calcular");
    return;
  }
  const suma = conNotas.reduce(function (acc, materia) {
    return acc + materia.calcularPromedio();
  }, 0);
  const general = suma / conNotas.length;
  alert("Promedio general del curso: " + general);
  console.log("reduce - promedio general:", general, "| materias con notas:", conNotas.length);
}

function mostrarMenu() {
  return prompt(
    "Simulador de materias\n" +
    "1 - Listar materias\n" +
    "2 - Agregar materia al final (push)\n" +
    "3 - Agregar materia al inicio (unshift)\n" +
    "4 - Eliminar ultima materia (pop)\n" +
    "5 - Buscar materia (findIndex)\n" +
    "6 - Actualizar materia\n" +
    "7 - Calcular promedio de una materia (find)\n" +
    "8 - Filtrar por categoria (filter)\n" +
    "9 - Listar promedios (map)\n" +
    "10 - Promedio general del curso (reduce)\n" +
    "11 - Salir"
  );
}

const acceso = iniciarSesion(profesor, contraseña);

if (acceso) {
  let opcion = "";
  while (opcion !== "11") {
    opcion = mostrarMenu();
    switch (opcion) {
      case "1": listarMaterias(materias); break;
      case "2": agregarMateriaAlFinal(materias); break;
      case "3": agregarMateriaAlInicio(materias); break;
      case "4": eliminarUltimaMateria(materias); break;
      case "5": buscarMateria(materias); break;
      case "6": actualizarMateria(materias); break;
      case "7": calcularPromedioDeMateria(materias); break;
      case "8": filtrarPorCategoria(materias); break;
      case "9": listarPromedios(materias); break;
      case "10": promedioGeneral(materias); break;
      case "11":
        alert("Fin del simulador.");
        console.log("Simulador finalizado. Materias:", materias.map(function (m) { return m.informarEstado(); }));
        break;
      default: alert("Opcion no valida."); break;
    }
  }
}
