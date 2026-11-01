---
nivel: 4
titulo: "El código por dentro"
criterio: "Criterio 2: aplicación práctica (30 pts)"
fuentes: ["F19", "F20", "F22", "F23", "F24", "F25", "F26"]
---

> **En una frase:** Cada clase del programa cumple una tarea exclusiva: recibir peticiones, aplicar reglas del negocio o guardar la información en la base de datos.

En una clínica organizada cada persona cumple una función clara. En Spring Boot las anotaciones identifican el rol de cada clase en el sistema ([VMware/Broadcom, s. f.-l](/fuentes#F20); [VMware/Broadcom, s. f.-o](/fuentes#F23); [VMware/Broadcom, s. f.-f](/fuentes#F25)).

Las entidades representan las tablas de pacientes y citas. Los repositorios realizan las consultas a la base de datos. Los servicios aplican las reglas clínicas y los controladores atienden las solicitudes web.

Al conectar estas piezas mediante inyección por constructor, el flujo de agendamiento queda ordenado y cada capa mantiene su responsabilidad ([VMware/Broadcom, s. f.-l](/fuentes#F20); [Fowler, 2004](/fuentes#F26)).

<div class="conceptos-clave">
<h3>Conceptos clave de este tema</h3>
<ul class="conceptos-grid">
<li class="concepto"><strong>Entidad</strong><span>Clase que representa una tabla de la base de datos, como pacientes o citas.</span><small>(<a href="/fuentes#F20">VMware/Broadcom, s. f.-l</a>, <a href="/fuentes#F23">s. f.-o</a>, <a href="/fuentes#F25">s. f.-f</a>)</small></li>
<li class="concepto"><strong>Anotación</strong><span>Marca el rol de cada clase en el sistema: controlador, servicio, repositorio o entidad.</span><small>(<a href="/fuentes#F20">VMware/Broadcom, s. f.-l</a>, <a href="/fuentes#F23">s. f.-o</a>, <a href="/fuentes#F25">s. f.-f</a>)</small></li>
<li class="concepto"><strong>Inyección por constructor</strong><span>Cada clase pide en su constructor lo que necesita y Spring se lo entrega.</span><small>(<a href="/fuentes#F20">VMware/Broadcom, s. f.-l</a>; <a href="/fuentes#F26">Fowler, 2004</a>)</small></li>
<li class="concepto"><strong>Capa</strong><span>Cada capa cumple una sola tarea: recibir peticiones, aplicar reglas o guardar información.</span><small>(<a href="/fuentes#F20">VMware/Broadcom, s. f.-l</a>; <a href="/fuentes#F26">Fowler, 2004</a>)</small></li>
</ul>
</div>
