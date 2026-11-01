---
nivel: 6
titulo: "Ficha técnica · Evolución de Spring Boot 3.x a 4.x, Java 21, Records, Hilos Virtuales, Actuator, OpenAPI y Docker"
criterio: "Criterio 3: análisis y argumentación (30 pts)"
fuentes: ["F05", "F12", "F13", "F15", "F17", "F18", "F19", "F20", "F22", "F24", "F27", "F28"]
---

### 1. Evolución confirmada de Spring Boot 3.x a 4.x sobre Java 21

La generación **Spring Boot 3.x** fijó **Java 17** como línea base e introdujo el cambio del espacio de nombres `javax.*` hacia **`jakarta.*`** ([Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)). La generación **Spring Boot 4.x** (`4.1.2` en el proyecto `reserva-medica`, ejecutada sobre **Java 21** y Spring Framework `7.0.10`) consolida una arquitectura modular sobre Jakarta EE 11 (`jakarta.servlet` 6.1, `jakarta.persistence-api` 3.2.0 y `jakarta.validation-api` 3.1.1), Hibernate ORM `7.4.13.Final` y HikariCP `7.0.2` ([Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)).

| Eje técnico confirmado | En Spring Boot 3.x | En Spring Boot 4.1.2 (`backend/` real) |
|---|---|---|
| Artefacto *starter* web MVC | `spring-boot-starter-web` | **`spring-boot-starter-webmvc`** y **`spring-boot-starter-webmvc-test`** (`@WebMvcTest` en `org.springframework.boot.webmvc.test.autoconfigure`) ([Spring Boot Team, 2025a](/fuentes#F27)) |
| Serialización JSON por defecto | Jackson 2 (`com.fasterxml.jackson.databind`) | **Jackson 3** (`tools.jackson.core:jackson-databind:3.1.7` con `JsonMapper`; conserva `jackson-annotations:2.21`) ([Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)) |
| Sustitución de *beans* en pruebas | `@MockBean` (de `spring-boot-test`) | **`@MockitoBean`** en `org.springframework.test.context.bean.override.mockito` (`spring-test:7.0.10`) ([Spring Boot Team, 2025a](/fuentes#F27)) |
| Consola H2 en desarrollo | Incluida al usar `h2` y `starter-web` | Requiere el módulo separado **`org.springframework.boot:spring-boot-h2console:4.1.2`** junto con `spring.h2.console.enabled=true` ([Spring Boot Team, 2025a](/fuentes#F27)) |
| Servidores web embebidos | Tomcat, Jetty o Undertow | **Tomcat 11.0.27** o Jetty 12.1; **Undertow fue eliminado** por no soportar Jakarta Servlet 6.1 ([VMware/Broadcom, s. f.-i](/fuentes#F18); [Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)) |

---

### 2. Java Records: contratos DTO inmutables sin código repetitivo

Un **Java Record** declara en su encabezado los componentes de un portador de datos inmutable, generando de forma automática campos `private final`, constructor canónico, métodos de acceso (`pacienteId()`, `medicoId()`, `fechaHora()`), `equals()`, `hashCode()` y `toString()` sin depender de Lombok.

| Característica | Clase POJO tradicional | Java Record (`record` en Java 21) |
|---|---|---|
| Mutabilidad | Mutable si expone métodos `set...()` | **Inmutable** (`private final` en todos sus componentes) |
| Verbosidad | Exige escribir constructores, *getters*, `equals` y `hashCode` | Declaración compacta de una sola firma en el encabezado |
| Integración con `@Valid` y Jackson 3 | Mediante *getters/setters* o constructores anotados | Soportado nativamente por Hibernate Validator `9.1.5.Final` y `tools.jackson` ([VMware/Broadcom, s. f.-p](/fuentes#F22); [Spring Boot Team, 2025b](/fuentes#F28)) |
| ¿Puede usarse como `@Entity` JPA? | **Sí**: JPA requiere constructor sin argumentos y estado mutable para el *dirty checking* ([VMware/Broadcom, s. f.-u](/fuentes#F19)) | **No**: un `record` es `final` e inmutable; se emplea en **DTOs** (`AgendarCitaRequest`, `CitaResponse`, `MedicoResponse`), nunca como `@Entity` |

```java
// Record real de salida en web/src/data/codigo/CitaResponse.java
public record CitaResponse(
        Long id,
        String nombrePaciente,
        String nombreMedico,
        String especialidad,
        LocalDateTime fechaHora,
        EstadoCita estado) {

    public static CitaResponse desde(Cita cita) {
        return new CitaResponse(
                cita.getId(),
                cita.getPaciente().getNombre(),
                cita.getMedico().getNombre(),
                cita.getMedico().getEspecialidad(),
                cita.getFechaHora(),
                cita.getEstado());
    }
}
```

---

### 3. Hilos Virtuales (*Virtual Threads*) en Java 21 y su impacto en reservas simultáneas

En el modelo tradicional de servidor de servlets (*thread-per-request*), cada petición HTTP que entra a Tomcat ocupa un **hilo de plataforma** vinculado directamente a un hilo del sistema operativo ([VMware/Broadcom, s. f.-i](/fuentes#F18)). Mientras `CitaService.agendar(...)` espera que la base de datos responda el `SELECT` de disponibilidad o el `INSERT INTO citas`, ese hilo del sistema operativo permanece bloqueado sin poder procesar otras solicitudes.

Con los **Hilos Virtuales** de Java 21, la máquina virtual JVM ejecuta hilos livianos sobre un conjunto acotado de hilos portadores (*carrier threads*): apenas una operación JDBC entra en espera de entrada/salida, la JVM **desmonta** el hilo virtual y libera el hilo del sistema operativo para atender a otro paciente. En Spring Boot se activan mediante configuración declarativa ([VMware/Broadcom, s. f.-i](/fuentes#F18); [Spring Boot Team, 2025b](/fuentes#F28)):

```properties
spring.threads.virtual.enabled=true
```

> **Alcance técnico de los hilos virtuales:** escalan la cantidad de peticiones concurrentes que esperan operaciones de entrada/salida (consultas SQL o llamadas de red), pero no aceleran tareas intensivas de CPU ni reemplazan el límite físico de conexiones del *pool* `HikariCP` ni la necesidad de control transaccional en la base de datos ([VMware/Broadcom, s. f.-u](/fuentes#F19)).

---

### 4. Observabilidad con Actuator, documentación de contratos y contenedores

#### A. Spring Boot Actuator y salida real de `/actuator/health`

El *starter* `spring-boot-starter-actuator:4.1.2` incorpora *endpoints* operativos que exponen el estado de salud (`health`), las sondas de disponibilidad (`livenessState` y `readinessState`), las rutas registradas (`mappings`) y el informe de condiciones (`conditions`) ([VMware/Broadcom, s. f.-s](/fuentes#F17)).

Al consultar `GET http://localhost:8080/actuator/health` sobre el backend en ejecución (`web/src/data/evidencia/actuator-health.json`, con **ruta local omitida** en `diskSpace.details.path`), Actuator confirma que la base H2 y las sondas de tráfico están operativas (`"UP"`):

Respuesta real de GET /actuator/health (actuator-health.json), formateada en varias líneas para leerla; la ruta local de disco se reemplazó por "<ruta local omitida>" por privacidad.

```json
{
  "components": {
    "db": {
      "details": {
        "database": "H2",
        "validationQuery": "isValid()"
      },
      "status": "UP"
    },
    "diskSpace": {
      "details": {
        "total": 1023140220928,
        "free": 206455128064,
        "threshold": 10485760,
        "path": "<ruta local omitida>",
        "exists": true
      },
      "status": "UP"
    },
    "livenessState": {
      "status": "UP"
    },
    "ping": {
      "status": "UP"
    },
    "readinessState": {
      "status": "UP"
    },
    "ssl": {
      "details": {
        "expiringChains": [],
        "invalidChains": [],
        "validChains": []
      },
      "status": "UP"
    }
  },
  "groups": [
    "liveness",
    "readiness"
  ],
  "status": "UP"
}
```

#### B. Especificación de contratos con OpenAPI / Swagger y empaquetado con Docker

> **Fuera de alcance en `backend/`:** ni `springdoc-openapi` ni un `Dockerfile` se incorporaron al proyecto real (decisión de alcance del proyecto); lo que sigue explica el concepto general de cada herramienta, no una salida capturada de este backend.

- **OpenAPI / Swagger:** permite describir de forma estandarizada las rutas REST (`/api/v1/citas`, `/api/v1/medicos`), los esquemas de los *records* (`AgendarCitaRequest`, `CitaResponse`) y las respuestas de error RFC 9457 (`ProblemDetail`) para que equipos de *frontend* o integradores prueben el contrato sin leer el código interno ([VMware/Broadcom, s. f.-p](/fuentes#F22); [VMware/Broadcom, s. f.-j](/fuentes#F24)).
- **Contenedores Docker:** dado que el artefacto compilado ya contiene **Tomcat 11.0.27 embebido** ([VMware/Broadcom, s. f.-i](/fuentes#F18); [Spring Boot Team, 2025a](/fuentes#F27)), una imagen de contenedor solo requeriría un entorno de ejecución Java 21 (`eclipse-temurin:21-jre`), ejecutar `java -jar app.jar` con `--spring.profiles.active=prod` y recibir las variables de entorno `DB_URL`, `DB_USER` y `DB_PASSWORD` desde el orquestador ([VMware/Broadcom, s. f.-s](/fuentes#F17); [VMware/Broadcom, s. f.-i](/fuentes#F18); [VMware/Broadcom, s. f.-u](/fuentes#F19)).

---

### 5. Juicio ingenieril frente a la generación automática de código con IA

Los asistentes de inteligencia artificial aceleran la escritura de código, pero su conocimiento se desactualiza en cada versión mayor del framework. En este mismo proyecto, el código semilla generado por un asistente de IA (usado solo como punto de partida y nunca como verdad final) traía tres patrones ya obsoletos para Spring Boot 4.1, detectados al compilar y ejecutar el backend real: declaraba el *starter* `spring-boot-starter-web` en vez de `spring-boot-starter-webmvc`; importaba `@WebMvcTest` desde el paquete de la serie 3.x en lugar de `org.springframework.boot.webmvc.test.autoconfigure`; y, apoyado en artículos de blog en vez de la documentación oficial, asumía que la consola H2 no necesitaba un módulo adicional, cuando Boot 4.1 exige declarar `spring-boot-h2console` por separado. Verificar cada afirmación del asistente contra la documentación oficial ([Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)) o contra la ejecución real del proyecto —y no contra lo que "suena plausible"— es lo que permite al ingeniero auditar, corregir y responsabilizarse del código antes de llevarlo a producción ([VMware/Broadcom, s. f.-a](/fuentes#F15); [VMware/Broadcom, s. f.-l](/fuentes#F20)).
