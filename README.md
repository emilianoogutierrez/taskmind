# TaskMind

Gestor de tareas estudiantiles que funciona en el navegador. Guarda las tareas en `localStorage` sin cuenta ni servicio de datos.

## Funciones

1. Crear consultar editar y eliminar tareas
2. Filtrar por estado materia y prioridad
3. Ordenar por la fecha de entrega más cercana
4. Ver tareas próximas a vencer y vencidas
5. Consultar el avance en el panel de estadísticas
6. Exportar e importar respaldos JSON
7. Descargar una hoja de cálculo XLS válida
8. Usar la aplicación sin conexión después de cargarla por primera vez

## Ejecutar en local

Se necesita Node.js y pnpm.

```text
pnpm install
pnpm dev
```

Para generar la versión de producción

```text
pnpm build
```

La aplicación se publica en [GitHub Pages](https://emilianoogutierrez.github.io/taskmind/).

## Datos y privacidad

TaskMind guarda las tareas en `localStorage` bajo la clave `taskminddata1`. Cada navegador y cada dirección web tienen su propio espacio de datos. Cambiar de dispositivo o borrar los datos del navegador puede causar pérdida definitiva. Descarga un respaldo JSON con frecuencia y consérvalo fuera del navegador.

No hay cuentas bases de datos funciones de servidor ni analítica. Los recursos necesarios para abrir la aplicación se guardan en la caché del navegador después de la primera visita.

## Material del reto

La [documentación técnica](material/DocumentacionTecnica.md) incluye contexto arquitectura wireframes capturas herramientas y conclusiones. La [bitácora de IA](material/BitacoraIA.md) registra la interacción utilizada durante el desarrollo. El [guion de exposición](material/GuionExposicion.md) acompaña la [presentación en PowerPoint](material/TaskMindPresentacion.pptx).
