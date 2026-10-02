# Bitácora de uso de IA

## Registro 1

**Prompt enviado:** Fragmento literal del usuario: «lee el documento completo y entregame una propuesta de desarrollo, no programes nada aun». El mismo mensaje pidió almacenamiento local, código fuente en GitHub y comprobación del acceso para hacer commits.

**Modelo utilizado:** Codex basado en GPT 6.

**Respuesta y código generado:** Se produjo una propuesta con funciones arquitectura entregables y riesgos de guardar datos solo en el navegador. No se generó código en esta etapa.

**Ajustes manuales del equipo:** Ninguno registrado.

**Reflexión:** La lectura completa permitió detectar que el reto exige también documentación una presentación y una exposición. La frase sobre JSON y XLS se resolvió como respaldo JSON y exportación adicional XLS.

## Registro 2

**Prompt enviado:** «ok, haz todo, si funcionaria en github pages, hazlo, apurate».

**Modelo utilizado:** Codex basado en GPT 6.

**Respuesta y código generado:** Se generaron la interfaz adaptable la gestión de tareas los filtros las estadísticas el almacenamiento local los respaldos JSON la exportación XLS y la caché para uso sin conexión. El código principal está en `src/main.ts` y `src/style.css`.

**Ajustes manuales del equipo:** Ninguno registrado hasta esta entrega.

**Reflexión:** El nombre del proyecto menciona inteligencia pero el reto propone usar IA como apoyo durante el desarrollo. La aplicación no necesita llamar a un modelo ni transmitir tareas a un servicio externo.

## Registro 3

**Prompt enviado:** «continua y apurate a deployar, se ve muy ia».

**Modelo utilizado:** Codex basado en GPT 6.

**Respuesta y código generado:** Se reemplazó el diseño promocional por una agenda más sobria. Se generaron pruebas de interacción capturas documentación técnica bitácora presentación y guion de exposición. Las pruebas detectaron que un campo llamado `id` interfería con la identificación del formulario. Se cambió la comprobación del evento y se repitieron las pruebas.

**Ajustes manuales del equipo:** Ninguno registrado hasta esta entrega. La corrección del formulario la realizó Codex tras observar el fallo en el navegador.

**Reflexión:** Una compilación correcta no demuestra que una tarea pueda guardarse. La prueba real del formulario detectó un problema que no aparecía al compilar.

## Uso responsable

La bitácora describe las interacciones realizadas en este proyecto. No atribuye al equipo cambios que no constan en la conversación. Antes de la exposición el equipo puede añadir sus decisiones correcciones y aprendizajes propios.
