# Cierre de Actas — Proyecto Final JavaScript (Coderhouse)

Simulador docente que completa el circuito de **cierre de cursada**: el profesor revisa sus materias, carga o modifica las notas, arma el acta con las materias a cerrar, ve el resumen calculado (aprobadas, desaprobadas y promedio general) y confirma el cierre. Las actas cerradas quedan en un historial donde se pueden consultar o anular.


## Cómo ejecutarlo localmente

Abrir `index.html` con la extensión **Live Server** de VS Code, o desde la carpeta del proyecto:

```bash
npx http-server .
```

## Circuito del simulador

1. **Ver materias**: se cargan con `fetch` desde `data/materias.json` (o desde `localStorage` si hay progreso guardado). Se pueden buscar por nombre y filtrar por categoría.
2. **Cargar / modificar notas**: cada materia abierta tiene un formulario para sus dos notas; el promedio y el estado se recalculan al guardar.
3. **Armar el acta**: con "Agregar al acta" se suman materias al acta en curso (se pueden quitar o vaciar el acta completa).
4. **Calcular**: el panel del acta muestra en vivo la cantidad de materias, aprobadas, desaprobadas, pendientes y el promedio general.
5. **Confirmar cierre**: valida que todas las materias tengan notas, pide confirmación y genera el acta numerada. Las materias quedan cerradas (no editables).
6. **Historial**: cada acta cerrada se puede ver en detalle o anular (sus materias vuelven a quedar abiertas). También se puede vaciar el historial completo.

## Estructura

index.html
assets/img/     logo, favicon e ilustraciones (SVG)
css/style.css   estilos propios
data/materias.json   base de datos simulada
js/datos.js     modelo (clase Materia), fetch del JSON y helpers de localStorage
js/interfaz.js  referencias al DOM, renderizado, Toastify y SweetAlert2
js/main.js      estado del simulador, circuito de cierre de actas y eventos


 **Librerías usadas**: [Toastify JS](https://github.com/apvarun/toastify-js) para notificaciones y [SweetAlert2](https://sweetalert2.github.io/) para confirmaciones, errores y el comprobante del acta.
