# Simulador de Materias — Pre-Entrega 10: APIs, Peticiones y Librerías

Simulador para que un profesor gestione sus materias (notas, promedios, estado) con datos obtenidos mediante `fetch` desde un JSON local.

## Cómo ejecutarlo

`fetch` no funciona abriendo el HTML con doble clic (`file://`). Usá un servidor local, por ejemplo la extensión **Live Server** o:

```bash
npx http-server .
```

Credenciales: usuario `Agustin`, contraseña `1234`.

## Fuente de datos

`data/materias.json` simula la base de datos del servidor. Cada materia tiene `id`, `nombre`, `categoria`, `profesorAsignado`, `nota1`, `nota2` y `lograda`.

## Flujo de datos

1. Al cargar la página se ejecuta `cargarMaterias()` (`async`).
2. Mientras se resuelve la petición se muestra un spinner ("Cargando materias…") y el botón de ingreso queda deshabilitado.
3. `obtenerMateriasDesdeJSON()` hace `await fetch("./data/materias.json")`, valida `response.ok`, parsea con `await response.json()` y transforma cada objeto en una instancia de `Materia`.
4. Si hay progreso guardado en `localStorage`, tiene prioridad sobre los datos del servidor; si no, se usan los del JSON y se persisten.
5. `try / catch / finally`:
   - **try**: éxito → toast de Toastify "Materias cargadas con éxito".
   - **catch**: falla de red, respuesta no exitosa (404/500) o JSON inválido → modal de SweetAlert2 con el detalle del error y botón **Reintentar**. Si había datos en `localStorage`, se muestran como respaldo.
   - **finally**: siempre se oculta el estado de carga, se reactivan los botones y se vuelve a renderizar el DOM.
6. El botón **Restaurar del servidor** vuelve a pedir el JSON y reemplaza el listado actual (con confirmación).

## Librerías (vía CDN)

- **Toastify JS**: notificaciones de éxito, advertencia y error en cada acción (login, agregar, eliminar, guardar notas, etc.).
- **SweetAlert2**: confirmaciones (vaciar listado, restaurar datos) y errores de carga, reemplazando `window.confirm`.
