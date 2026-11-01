---
nivel: 1
titulo: "El motor oculto"
criterio: "Criterio 1: comprensión (20 pts)"
fuentes: ["F02", "F05", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F26", "F27", "F28"]
---

> **En una frase:** El sistema prepara y conecta automáticamente los componentes necesarios al encender la aplicación para que no tengamos que configurarlos a mano.

Abrir la clínica por la mañana exige revisar qué especialistas e instrumentos están en el edificio. También requiere habilitar los consultorios antes de atender al primer paciente ([VMware/Broadcom, s. f.-a](/fuentes#F15); [VMware/Broadcom, s. f.-s](/fuentes#F17)).

En `ReservaMedicaApplication`, la anotación `@SpringBootApplication` inicia este proceso. Su función es explorar el paquete del sistema, inspeccionar las librerías disponibles y configurar cada componente necesario ([VMware/Broadcom, s. f.-t](/fuentes#F14); [VMware/Broadcom, s. f.-a](/fuentes#F15)).

El contenedor de Spring aplica inversión de control. Crea los objetos y entrega sus dependencias directamente por el constructor ([VMware/Broadcom, s. f.-l](/fuentes#F20); [Fowler, 2004](/fuentes#F26)). Cuando agregamos los módulos web y de base de datos en Maven, Spring Boot levanta un servidor Tomcat interno y prepara la conexión a la base de datos de manera automática ([VMware/Broadcom, s. f.-a](/fuentes#F15); [VMware/Broadcom, s. f.-i](/fuentes#F18); [Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)).

### ¿Por qué Spring Boot?

En el proyecto de reserva médica, Spring Boot resuelve la infraestructura base para concentrarnos en la atención clínica ([VMware/Broadcom, s. f.-d](/fuentes#F05); [VMware/Broadcom, s. f.-t](/fuentes#F14)). Sin el framework, construir una API REST operativa exige configurar manualmente cada librería externa, levantar un servidor y coordinar transacciones y formatos ([VMware/Broadcom, s. f.-r](/fuentes#F02); [VMware/Broadcom, s. f.-a](/fuentes#F15); [VMware/Broadcom, s. f.-s](/fuentes#F17); [VMware/Broadcom, s. f.-i](/fuentes#F18)).

| Aspecto resuelto | Con Java solo | Con Spring Boot en este proyecto |
|---|---|---|
| Servidor web | Instalar, configurar y desplegar un Tomcat externo | Servidor Tomcat 11.0.27 incluido y autoconfigurado |
| Conexión a datos | Abrir y cerrar conexiones JDBC a mano | Pool de conexiones HikariCP administrado automáticamente |
| Transacciones | Gestionar `commit` y `rollback` con código repetitivo | Control declarativo mediante la anotación `@Transactional` |
| Conversión y validación | Parsear JSON y comprobar reglas manualmente | Conversión con Jackson 3 y validación con `@Valid` |
| Formato de errores | Armar estructuras de error propietarias en cada ruta | Respuestas estandarizadas RFC 9457 con `ProblemDetail` |

<div class="conceptos-clave">
<h3>Conceptos clave de este tema</h3>
<ul class="conceptos-grid">
<li class="concepto"><strong>@SpringBootApplication</strong><span>Anotación de la clase principal. Al encender el sistema, explora el paquete, revisa las librerías y configura lo necesario.</span><small>(<a href="/fuentes#F14">VMware/Broadcom, s. f.-t</a>, <a href="/fuentes#F15">s. f.-a</a>)</small></li>
<li class="concepto"><strong>Starter</strong><span>Paquete que reúne librerías que funcionan bien juntas. Con agregarlo al pom.xml ya queda lo necesario.</span><small>(<a href="/fuentes#F16">VMware/Broadcom, s. f.-g</a>)</small></li>
<li class="concepto"><strong>Contenedor de Spring</strong><span>Crea los objetos del sistema (beans) y le entrega a cada uno lo que necesita por el constructor.</span><small>(<a href="/fuentes#F20">VMware/Broadcom, s. f.-l</a>; <a href="/fuentes#F26">Fowler, 2004</a>)</small></li>
<li class="concepto"><strong>Tomcat embebido</strong><span>El servidor web viene dentro del programa: no hay que instalar uno aparte.</span><small>(<a href="/fuentes#F18">VMware/Broadcom, s. f.-i</a>; <a href="/fuentes#F27">Spring Boot Team, 2025a</a>)</small></li>
</ul>
</div>
