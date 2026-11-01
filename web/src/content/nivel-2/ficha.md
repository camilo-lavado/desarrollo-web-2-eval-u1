---
nivel: 2
titulo: "Ficha técnica · Arquitectura MVC en capas y recorrido de una petición"
criterio: "Criterio 1: comprensión (20 pts)"
fuentes: ["F02", "F03", "F04", "F06", "F07", "F19", "F21", "F22", "F23", "F24", "F25", "F27", "F28"]
---

### 1. Paso 1: El recepcionista (`DispatcherServlet`) y el patrón *Front Controller*

Spring MVC organiza el procesamiento web en torno al patrón *front controller*: un único servlet central (`DispatcherServlet`) concentra la entrada de todas las peticiones HTTP y coordina un flujo compartido, mientras delega las tareas concretas en componentes configurables del contenedor de Spring ([VMware/Broadcom, s. f.-h](/fuentes#F03)). A diferencia de las aplicaciones tradicionales que dependían del archivo `web.xml`, Spring Boot se inicia a sí mismo y levanta el contenedor embebido mediante configuración propia de Spring ([VMware/Broadcom, s. f.-r](/fuentes#F02); [VMware/Broadcom, s. f.-h](/fuentes#F03)).

En cada petición entrante, la secuencia de despacho (`doDispatch`) ejecuta pasos bien delimitados ([VMware/Broadcom, s. f.-m](/fuentes#F21)):
1. **Vinculación del contexto:** asocia el `WebApplicationContext` y los resolutores regionales a la petición actual ([VMware/Broadcom, s. f.-m](/fuentes#F21)).
2. **Búsqueda del *handler* (`HandlerMapping`):** consulta el mapa de rutas construido durante el arranque para localizar el método controlador que corresponde a la combinación de ruta, verbo HTTP (`@GetMapping`, `@PostMapping`, `@PatchMapping`) y cabeceras `consumes`/`produces` ([VMware/Broadcom, s. f.-m](/fuentes#F21); [VMware/Broadcom, s. f.-o](/fuentes#F23)). Para evaluar las rutas, Spring MVC emplea patrones pre-analizados con `PathPattern` ([VMware/Broadcom, s. f.-o](/fuentes#F23)).
3. **Ejecución de la cadena (`HandlerAdapter`):** atraviesa los interceptores configurados, convierte el cuerpo JSON entrante al objeto Java esperado mediante un `HttpMessageConverter` y aplica las validaciones de formato (`@Valid`) antes de invocar el método del controlador ([VMware/Broadcom, s. f.-m](/fuentes#F21); [VMware/Broadcom, s. f.-p](/fuentes#F22)).
4. **Procesamiento del retorno o de errores:** serializa el valor devuelto o renderiza una vista si existe un modelo; si ocurre una excepción en cualquier punto del camino, la delega en la cadena de `HandlerExceptionResolver` ([VMware/Broadcom, s. f.-m](/fuentes#F21); [VMware/Broadcom, s. f.-j](/fuentes#F24)).

| En la clínica (analogía) | En Spring MVC | Cuándo actúa | Responsabilidad técnica |
|---|---|---|---|
| Mesón único de entrada | `DispatcherServlet` | En cada petición | Coordina el algoritmo general de despacho ([VMware/Broadcom, s. f.-h](/fuentes#F03)) |
| Directorio de atención | `HandlerMapping` | Se construye al arrancar; se consulta en cada petición | Relaciona ruta y verbo HTTP con el método destino ([VMware/Broadcom, s. f.-m](/fuentes#F21); [VMware/Broadcom, s. f.-o](/fuentes#F23)) |
| Asistente que pasa al box | `HandlerAdapter` | En cada petición | Resuelve argumentos, ejecuta `@Valid` e invoca el método ([VMware/Broadcom, s. f.-m](/fuentes#F21)) |
| Transcriptor de formularios | `HttpMessageConverter` | En cada petición | Transforma entre texto JSON y objetos Java (DTO) ([VMware/Broadcom, s. f.-p](/fuentes#F22)) |
| Protocolo de urgencias | `HandlerExceptionResolver` | Cuando se lanza una excepción | Traduce fallos a respuestas HTTP estandarizadas ([VMware/Broadcom, s. f.-m](/fuentes#F21); [VMware/Broadcom, s. f.-j](/fuentes#F24)) |

---

### 2. Paso 2: Capa Controlador (`@Controller` vs. `@RestController`)

La capa controladora actúa como traductor entre el protocolo HTTP y el lenguaje interno de la aplicación: recibe el DTO de entrada, verifica su estructura formal, invoca al servicio y empaqueta la salida en un `ResponseEntity` con el código de estado y las cabeceras correspondientes ([VMware/Broadcom, s. f.-p](/fuentes#F22)). No debe contener consultas directas a repositorios ni reglas del dominio médico.

La diferencia entre `@Controller` y `@RestController` radica en cómo se procesa el valor que devuelve el método ([VMware/Broadcom, s. f.-p](/fuentes#F22)):

| Criterio | `@Controller` (orientado a vistas) | `@RestController` (orientado a API REST) |
|---|---|---|
| Valor devuelto habitual | `String` con el nombre lógico de la plantilla ([VMware/Broadcom, s. f.-p](/fuentes#F22)) | Record DTO o `ResponseEntity<T>` ([VMware/Broadcom, s. f.-p](/fuentes#F22)) |
| Componente que procesa la salida | `ViewResolver` + motor de plantillas (Thymeleaf) ([VMware/Broadcom, s. f.-m](/fuentes#F21); [VMware/Broadcom, s. f.-p](/fuentes#F22)) | `HttpMessageConverter` (Jackson) directamente al cuerpo HTTP ([VMware/Broadcom, s. f.-p](/fuentes#F22)) |
| Paso de datos a la interfaz | A través del objeto `Model` inyectado en el método ([VMware/Broadcom, s. f.-p](/fuentes#F22)) | Serialización directa del objeto retornado a JSON ([VMware/Broadcom, s. f.-p](/fuentes#F22)) |
| Cabecera `Content-Type` | `text/html` | `application/json` o `application/problem+json` ([VMware/Broadcom, s. f.-j](/fuentes#F24)) |

Extracto de MedicoVistaController.java y CitaController.java; se omiten imports y getters, y se reduce la sangría para leerlo.

```java
@Controller
public class MedicoVistaController {

    private final MedicoService medicoService;

    public MedicoVistaController(MedicoService medicoService) {
        this.medicoService = medicoService;
    }

    @GetMapping("/medicos")
    public String verMedicos(Model model) {
        model.addAttribute("medicos", medicoService.listar(null));
        return "medicos";
    }
}

@RestController
@RequestMapping("/api/v1/citas")
public class CitaController {

    private final CitaService citaService;

    public CitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    @PostMapping
    public ResponseEntity<CitaResponse> agendar(@Valid @RequestBody AgendarCitaRequest request) {
        Cita cita = citaService.agendar(request);
        return ResponseEntity.created(URI.create("/api/v1/citas/" + cita.getId()))
                .body(CitaResponse.desde(cita));
    }
}
```

---

### 3. Paso 3: Capa de Servicio (`@Service`) y reglas del negocio

Colocar los cálculos, comprobaciones de disponibilidad y validaciones médicas en `@Service` —y nunca en el controlador— responde a cuatro razones técnicas:
1. **Separación de responsabilidades:** el controlador solo conoce verbos, rutas y códigos HTTP; el servicio concentra las invariantes del negocio clínico.
2. **Demarcación transaccional (`@Transactional`):** agendar una hora exige verificar existencia de paciente y médico, comprobar que el bloque no esté ocupado y persistir el registro como una unidad indivisible.
3. **Reutilización y desacoplamiento de transporte:** la misma operación `citaService.agendar(...)` puede llamarse desde un *endpoint* REST, una vista Thymeleaf o una tarea programada sin duplicar validaciones.
4. **Pruebas unitarias rápidas:** permite verificar las reglas de negocio con objetos simulados sin levantar el servidor web.

| Regla del caso Reserva de Horas Médicas | Capa donde se verifica | Respuesta HTTP cuando falla |
|---|---|---|
| Validación sintáctica DTO: campos obligatorios y fecha futura (`@NotNull`, `@Future`) | Formato del DTO en la entrada del controlador (`@Valid`) | `400 Bad Request` con `ProblemDetail` ([VMware/Broadcom, s. f.-j](/fuentes#F24)) |
| RN-01: El paciente y el médico deben existir en el sistema | Capa de servicio (`CitaService`) consultando repositorios | `404 Not Found` con `ProblemDetail` ([VMware/Broadcom, s. f.-j](/fuentes#F24)) |
| RN-03: Horario de atención permitido (solo lunes a viernes, 08:00 a 18:00 en bloques de 30 min) | Capa de servicio (`CitaService`) | `422 Unprocessable Content` con `ProblemDetail` ([VMware/Broadcom, s. f.-j](/fuentes#F24)) |
| RN-04: Bloque horario no ocupado por otra cita activa del médico | Capa de servicio (`CitaService`) + restricción en base de datos | `409 Conflict` con `ProblemDetail` ([VMware/Broadcom, s. f.-j](/fuentes#F24)) |

---

### 4. Paso 4: Capa de Repositorio (`@Repository`), Modelo (`@Entity`) y regreso al cliente

En la capa de persistencia, las clases anotadas con `@Entity` (`Paciente`, `Medico`, `Cita`) representan las tablas relacionales mediante Jakarta Persistence e Hibernate ([VMware/Broadcom, s. f.-u](/fuentes#F19); [Spring Boot Team, 2025b](/fuentes#F28)). Para acceder a los datos sin escribir código JDBC repetitivo, `CitaRepository` extiende `JpaRepository<Cita, Long>`, que hereda de `CrudRepository` y `Repository` ([VMware/Broadcom, s. f.-f](/fuentes#F25)). Spring Data genera en tiempo de ejecución la implementación y traduce métodos declarativos como `existsByMedicoIdAndFechaHoraAndEstado(...)` en consultas SQL parametrizadas ([VMware/Broadcom, s. f.-f](/fuentes#F25)).

Para ejecutar ese SQL, Spring Boot selecciona por defecto el *pool* de conexiones **HikariCP** ("preferimos HikariCP por su rendimiento y concurrencia" ([VMware/Broadcom, s. f.-u](/fuentes#F19))), incluido transitivamente en el *starter* de datos ([VMware/Broadcom, s. f.-u](/fuentes#F19)). Además, en aplicaciones web Spring Boot activa por defecto el interceptor `OpenEntityManagerInViewInterceptor` (`spring.jpa.open-in-view=true`); desactivarlo (`false`) evita que las vistas o controladores disparen consultas perezosas fuera de la capa de servicio y refuerza el uso de DTOs cerrados ([VMware/Broadcom, s. f.-u](/fuentes#F19)).

En el **camino de vuelta**, Hibernate hidrata la entidad `Cita` con el identificador generado por la base de datos; `CitaService` la transforma en el record inmutable `CitaResponse` (de modo que la `@Entity` jamás salga de la capa de negocio); `CitaController` envuelve el DTO en un `ResponseEntity` con estado `201 Created` y cabecera `Location`; y el `HttpMessageConverter` (Jackson) lo convierte en el texto JSON final que entrega Tomcat ([VMware/Broadcom, s. f.-p](/fuentes#F22)).

---

### 5. Diferencias clave entre Spring Boot 3.x y 4.x en el recorrido web

| Aspecto | Spring Boot 3.x | Spring Boot 4.x (usado en el proyecto: 4.1.x) |
|---|---|---|
| *Starter* para aplicaciones web MVC | `spring-boot-starter-web` | `spring-boot-starter-webmvc` (`starter-web` queda en desuso como puente) ([Spring Boot Team, 2025a](/fuentes#F27)) |
| Especificaciones Jakarta EE | Jakarta EE 10 (Servlet 6.0, Persistence 3.1) | Servlet 6.1, Persistence 3.2 y Validation 3.1 ([Spring Boot Team, 2025b](/fuentes#F28)) |
| Motor ORM por defecto | Hibernate 6.x | Hibernate 7.1 ([Spring Boot Team, 2025b](/fuentes#F28)) |
| Librería JSON por defecto | Jackson 2 (`com.fasterxml.jackson`) | Jackson 3 (`tools.jackson`) con `JsonMapper` auto-configurado ([Spring Boot Team, 2025a](/fuentes#F27)) |
| Servidor de contenedores embebido | Tomcat 10.1 | Tomcat 11.0 ([Spring Boot Team, 2025b](/fuentes#F28)) |
| Pruebas del estrato web | `spring-boot-starter-test` único | Modularizado en `spring-boot-starter-webmvc-test` ([Spring Boot Team, 2025a](/fuentes#F27)) |

---

### 6. Lectura paso a paso de las figuras de este tema

- **Lectura de la Figura D08 (Recorrido por las 5 capas y paneles A, B y C):** sigue las flechas continuas numeradas del **1 al 4** para el viaje de ida: (1) el cliente envía `POST /api/v1/citas` a Tomcat y al `DispatcherServlet`; (2) tras consultar `HandlerMapping`, el `HandlerAdapter` deserializa el JSON a `AgendarCitaRequest`, valida `@Valid` y llama a `CitaController`; (3) el controlador delega en `CitaService`; (4) el servicio verifica las reglas y ordena a `CitaRepository` guardar la entidad en la base de datos a través de Hibernate y HikariCP ([VMware/Broadcom, s. f.-u](/fuentes#F19); [VMware/Broadcom, s. f.-m](/fuentes#F21); [VMware/Broadcom, s. f.-f](/fuentes#F25)). Luego sigue las flechas punteadas del **5 al 8** para el regreso: (5) la base de datos devuelve la fila insertada; (6) el servicio convierte la entidad `Cita` en el record `CitaResponse`; (7) el controlador construye el `ResponseEntity` con estado `201 Created`; (8) Jackson serializa el DTO a JSON y Tomcat lo entrega al cliente ([VMware/Broadcom, s. f.-p](/fuentes#F22)). Si una validación o regla falla, el flujo toma el desvío inferior hacia `@RestControllerAdvice`, que emite un `ProblemDetail` (RFC 9457) con código 400, 404, 409 o 422 ([VMware/Broadcom, s. f.-j](/fuentes#F24)). Los paneles inferiores A, B y C conectan el flujo con el motor IoC, los archivos de configuración y las buenas prácticas.
- **Lectura de la Figura D09 (Secuencia de `POST /api/v1/citas` con alternativas):** lee de arriba hacia abajo la línea de vida temporal entre el Cliente, Tomcat, `DispatcherServlet`, `CitaController`, `CitaService`, `CitaRepository` y la Base de Datos. El primer bloque `alt` muestra la detención temprana en el `DispatcherServlet` cuando `@Valid` rechaza una fecha pasada (`400 Bad Request`). El segundo bloque `alt` ocurre dentro de `CitaService` cuando el médico o paciente no existe (`404 Not Found`). El tercer bloque `alt` verifica con un `SELECT` si el bloque horario ya está ocupado (`409 Conflict`) antes de autorizar el `INSERT` definitivo (`201 Created`) ([VMware/Broadcom, s. f.-m](/fuentes#F21); [VMware/Broadcom, s. f.-j](/fuentes#F24)).
- **Lectura de la Figura D10 (Interior del `DispatcherServlet`):** detalla la tubería interna de `doDispatch`: la petición entra al servlet, consulta a `HandlerMapping` para ubicar el método destino, atraviesa los `HandlerInterceptor`, pasa al `HandlerAdapter` donde los `HandlerMethodArgumentResolver` y `HttpMessageConverter` construyen y validan el DTO, ejecuta el método del controlador y procesa el retorno mediante `HandlerMethodReturnValueHandler` (hacia JSON) o `ViewResolver` (hacia HTML), manteniendo un canal lateral hacia `HandlerExceptionResolver` en caso de excepción ([VMware/Broadcom, s. f.-h](/fuentes#F03); [VMware/Broadcom, s. f.-m](/fuentes#F21); [VMware/Broadcom, s. f.-p](/fuentes#F22)).
- **Lectura de la Figura D13 (Qué ocurre al arrancar vs. en cada petición):** compara los dos momentos del ciclo de vida. En el carril izquierdo (**Al arrancar**, una sola vez), Spring Boot evalúa las condiciones del *classpath*, crea los *beans* singleton, levanta el *pool* HikariCP, construye la tabla de rutas en `RequestMappingHandlerMapping` e inicia el conector de Tomcat ([VMware/Broadcom, s. f.-a](/fuentes#F15); [VMware/Broadcom, s. f.-s](/fuentes#F17); [VMware/Broadcom, s. f.-m](/fuentes#F21)). En el carril derecho (**En cada petición**, repetido por cada usuario), Tomcat asigna un hilo y el `DispatcherServlet` solo consulta en memoria las estructuras ya preparadas, logrando respuestas rápidas sin reconstruir el grafo de objetos ([VMware/Broadcom, s. f.-h](/fuentes#F03); [VMware/Broadcom, s. f.-m](/fuentes#F21)).
