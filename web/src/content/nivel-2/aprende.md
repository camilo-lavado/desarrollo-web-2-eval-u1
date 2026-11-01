---
nivel: 2
titulo: "Sigue a la petición"
criterio: "Criterio 1: comprensión (20 pts)"
fuentes: ["F02", "F03", "F19", "F21", "F22", "F23", "F24", "F25", "F27", "F28"]
---

> **En una frase:** Cada solicitud del usuario llega a un coordinador central que valida los datos, ejecuta las reglas médicas y devuelve una confirmación ordenada.

Cuando Ana pide una hora médica, su solicitud entra por una sola puerta: el `DispatcherServlet`. Este componente recibe la petición web y busca qué controlador debe atenderla ([VMware/Broadcom, s. f.-h](/fuentes#F03)).

El controlador recibe los datos en un formato simple, valida que la información básica esté completa y la entrega al servicio ([VMware/Broadcom, s. f.-p](/fuentes#F22)).

En el servicio residen las reglas de negocio. Comprueba que el médico atienda en ese horario y que el bloque esté libre ([VMware/Broadcom, s. f.-j](/fuentes#F24)). Una vez validada, el repositorio guarda la cita en la base de datos y la respuesta regresa como confirmación al paciente ([VMware/Broadcom, s. f.-u](/fuentes#F19); [VMware/Broadcom, s. f.-f](/fuentes#F25)).

<div class="conceptos-clave">
<h3>Conceptos clave de este tema</h3>
<ul class="conceptos-grid">
<li class="concepto"><strong>DispatcherServlet</strong><span>Puerta de entrada única: recibe cada petición web y busca qué controlador la atiende.</span><small>(<a href="/fuentes#F03">VMware/Broadcom, s. f.-h</a>)</small></li>
<li class="concepto"><strong>Controlador</strong><span>Recibe los datos, revisa que estén completos y se los entrega al servicio.</span><small>(<a href="/fuentes#F22">VMware/Broadcom, s. f.-p</a>)</small></li>
<li class="concepto"><strong>Servicio</strong><span>Es la capa de las reglas del negocio: por ejemplo, que el médico atienda en ese horario y que el bloque esté libre.</span><small>(<a href="/fuentes#F24">VMware/Broadcom, s. f.-j</a>)</small></li>
<li class="concepto"><strong>Repositorio</strong><span>Guarda y consulta las citas en la base de datos.</span><small>(<a href="/fuentes#F19">VMware/Broadcom, s. f.-u</a>, <a href="/fuentes#F25">s. f.-f</a>)</small></li>
</ul>
</div>
