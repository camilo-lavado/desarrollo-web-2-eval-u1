---
nivel: 5
titulo: "Buenas prácticas y errores reales"
criterio: "Criterio 3: análisis y argumentación (30 pts)"
fuentes: ["F14", "F19", "F20", "F21", "F22", "F24", "F25", "F26", "F27"]
---

> **En una frase:** El sistema protege los datos personales filtrando lo que responde y entrega mensajes de error claros cuando una regla no se cumple.

Un sistema clínico comete un error grave cuando expone datos privados del paciente en una respuesta web o cuando confirma una cita en un horario no disponible ([VMware/Broadcom, s. f.-u](/fuentes#F19); [VMware/Broadcom, s. f.-m](/fuentes#F21)).

Para evitar estos problemas, los controladores nunca devuelven las entidades directas de la base de datos. En su lugar utilizan objetos DTO que seleccionan únicamente los campos públicos para el paciente ([VMware/Broadcom, s. f.-p](/fuentes#F22)).

Además, las validaciones rechazan solicitudes incompletas y un manejador central de excepciones transforma los errores en respuestas estandarizadas con códigos HTTP apropiados ([VMware/Broadcom, s. f.-t](/fuentes#F14); [VMware/Broadcom, s. f.-j](/fuentes#F24)).

<div class="conceptos-clave">
<h3>Conceptos clave de este tema</h3>
<ul class="conceptos-grid">
<li class="concepto"><strong>DTO</strong><span>Objeto que lleva solo los campos que el paciente puede ver. Así no se devuelve la entidad completa.</span><small>(<a href="/fuentes#F22">VMware/Broadcom, s. f.-p</a>)</small></li>
<li class="concepto"><strong>Validación</strong><span>Rechaza las solicitudes incompletas antes de que lleguen al servicio.</span><small>(<a href="/fuentes#F14">VMware/Broadcom, s. f.-t</a>, <a href="/fuentes#F24">s. f.-j</a>)</small></li>
<li class="concepto"><strong>Manejador central de errores</strong><span>Una sola clase convierte las excepciones en respuestas estandarizadas con el código HTTP correcto.</span><small>(<a href="/fuentes#F14">VMware/Broadcom, s. f.-t</a>, <a href="/fuentes#F24">s. f.-j</a>)</small></li>
<li class="concepto"><strong>Datos privados</strong><span>Un sistema clínico no debe exponer datos del paciente en una respuesta web.</span><small>(<a href="/fuentes#F19">VMware/Broadcom, s. f.-u</a>, <a href="/fuentes#F21">s. f.-m</a>)</small></li>
</ul>
</div>
