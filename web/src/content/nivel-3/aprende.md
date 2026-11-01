---
nivel: 3
titulo: "La sala de máquinas"
criterio: "Criterio 2: aplicación práctica (30 pts)"
fuentes: ["F02", "F15", "F17", "F18", "F19", "F27", "F28"]
---

> **En una frase:** El programa separa las herramientas externas y las opciones del entorno para funcionar en pruebas o en el servidor sin cambiar el código.

Antes de atender pacientes, la clínica define qué herramientas necesita en su archivo `pom.xml`. También establece los parámetros de cada ambiente en su archivo de configuración ([VMware/Broadcom, s. f.-a](/fuentes#F15); [VMware/Broadcom, s. f.-u](/fuentes#F19)).

El mismo código del sistema puede funcionar en el computador de trabajo con una base de datos de prueba y en el servidor clínico con PostgreSQL. Para cambiar de un entorno a otro solo se activa el perfil correspondiente, sin modificar el código fuente ([VMware/Broadcom, s. f.-u](/fuentes#F19)).

Separar la configuración del código protege datos sensibles como contraseñas y permite ajustar el sistema sin volver a compilarlo.

<div class="conceptos-clave">
<h3>Conceptos clave de este tema</h3>
<ul class="conceptos-grid">
<li class="concepto"><strong>pom.xml</strong><span>Lista de herramientas externas que necesita el proyecto.</span><small>(<a href="/fuentes#F15">VMware/Broadcom, s. f.-a</a>, <a href="/fuentes#F19">s. f.-u</a>)</small></li>
<li class="concepto"><strong>application.properties</strong><span>Archivo con los parámetros de cada ambiente, separados del código.</span><small>(<a href="/fuentes#F15">VMware/Broadcom, s. f.-a</a>, <a href="/fuentes#F19">s. f.-u</a>)</small></li>
<li class="concepto"><strong>Perfil</strong><span>Conjunto de opciones para un entorno (dev o prod). Se cambia activando el perfil, sin modificar el código.</span><small>(<a href="/fuentes#F19">VMware/Broadcom, s. f.-u</a>)</small></li>
<li class="concepto"><strong>Configuración fuera del código</strong><span>Protege datos sensibles como las contraseñas y permite ajustar el sistema sin volver a compilarlo.</span><small>(<a href="/fuentes#F19">VMware/Broadcom, s. f.-u</a>)</small></li>
</ul>
</div>
