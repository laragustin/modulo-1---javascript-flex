// Pre-entrega nº 3 - Funciones e integración de lógica

//Mantengo el mismo ejemplo que la pre-entrega nº 2 pero con funciones.

//Declaro las constantes para ingresar al sistema.

const profesor = "Agustin";
const contraseña = "1234";

// Función declarada: valida las credenciales (parámetros + return)
function validarCredenciales(usuarioIngresado, claveIngresada, usuarioCorrecto, claveCorrecta) {
  return usuarioIngresado === usuarioCorrecto && claveIngresada === claveCorrecta;
}

// Función flecha: calcula el promedio (proceso simple)
const calcularPromedio = (nota1, nota2) => (Number(nota1) + Number(nota2)) / 2;

// Función declarada: muestra el resultado (salida con parámetros)
function mostrarResultado(materia, promedio) {
  alert("El promedio de " + materia + " es: " + promedio);
  console.log("El promedio de " + materia + " es: " + promedio);
}

// Función expresada: controla el acceso al sistema (entrada + ciclos + return)
const iniciarSesion = function (usuarioCorrecto, claveCorrecta) {
  let acceso = false;
  let intento = 0;

  while (intento < 3) {
    let profe = prompt("Ingrese el nombre del profesor:");

    // validacion de entrada: debe ser texto (string), no numero ni vacio
    while (profe === null || profe === "" || !isNaN(profe)) {
      alert("El nombre del profesor debe ser un texto.");
      console.log("Nombre invalido");
      profe = prompt("Ingrese el nombre del profesor:");
    }

    const contra = prompt("Ingrese la contraseña:");

    if (validarCredenciales(profe, contra, usuarioCorrecto, claveCorrecta)) {
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

// Función declarada: procesa la materia, pide notas y muestra el promedio
function procesarMateria(nombreMateria) {
  let nota1 = prompt("Ingrese la primera nota:");

  // validacion de entrada: debe ser un numero mayor a 0
  while (!(Number(nota1) > 0)) {
    alert("La nota debe ser un numero mayor a 0.");
    console.log("Nota invalida");
    nota1 = prompt("Ingrese la primera nota:");
  }

  let nota2 = prompt("Ingrese la segunda nota:");

  while (!(Number(nota2) > 0)) {
    alert("La nota debe ser un numero mayor a 0.");
    console.log("Nota invalida");
    nota2 = prompt("Ingrese la segunda nota:");
  }

  const promedio = calcularPromedio(nota1, nota2);
  mostrarResultado(nombreMateria, promedio);
}

// Algoritmo principal: entrada → procesamiento → salida
const acceso = iniciarSesion(profesor, contraseña);

if (acceso === true) {
  let materiaValida = false;

  while (!materiaValida) {
    const materia = prompt("Ingrese el nombre de la materia:");

    switch (materia) {
      case "fisica":
      case "matematica":
        procesarMateria(materia);
        materiaValida = true;
        break;
      default:
        alert("La materia no es valida. Intente de nuevo.");
        console.log("La materia no es valida");
        break;
    }
  }
}
