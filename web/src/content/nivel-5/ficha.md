---
nivel: 5
titulo: "Ficha técnica · Buenas prácticas: paquetes, DTOs, validación, errores HTTP y secretos"
criterio: "Criterio 3: análisis y argumentación (30 pts)"
fuentes: ["F11", "F14", "F19", "F20", "F21", "F22", "F24", "F25", "F26", "F27"]
---

### 1. Estructura de paquetes y dirección unidireccional de dependencias

La guía oficial recomienda ubicar la clase principal (`ReservaMedicaApplication`) en el paquete raíz (`cl.ipss.reservamedica`) y colgar desde allí los subpaquetes del dominio, ya que `@ComponentScan` registra componentes desde ese paquete base hacia abajo ([VMware/Broadcom, s. f.-t](/fuentes#F14)).

El proyecto impone un flujo de dependencias **estrictamente unidireccional** ([VMware/Broadcom, s. f.-l](/fuentes#F20); [Fowler, 2004](/fuentes#F26)):
- `controller/` (`CitaController`, `MedicoController`) → solo conoce a `service/` y `dto/`.
- `service/` (`CitaService`, `MedicoService`) → coordina `repository/`, `model/`, `dto/` y `exception/`.
- `repository/` (`CitaRepository`, `MedicoRepository`, `PacienteRepository`) → solo depende de `model/`.
- `model/` (`Cita`, `Medico`, `Paciente`, `EstadoCita`) → no importa clases web ni de servicios.

Respetar esta jerarquía impide que un controlador invoque directamente a `CitaRepository.save(...)` saltándose las reglas `RN-01..RN-04` y la demarcación `@Transactional` de `CitaService` ([VMware/Broadcom, s. f.-l](/fuentes#F20); [VMware/Broadcom, s. f.-f](/fuentes#F25)).

---

### 2. Por qué nunca se debe devolver ni recibir la `@Entity` y cómo actúa el patrón DTO

Un **DTO** (*Data Transfer Object*) transporta únicamente los datos que requiere una operación de entrada o salida, desacoplando el contrato JSON del esquema relacional ([VMware/Broadcom, s. f.-p](/fuentes#F22)). En el backend se implementa con *records* de Java 21 (`AgendarCitaRequest`, `CitaResponse`, `MedicoResponse`).

Exponer directamente las entidades `@Entity` (`Cita` o `Paciente`) en `@RestController` introduce cuatro problemas técnicos comprobables ([VMware/Broadcom, s. f.-u](/fuentes#F19); [VMware/Broadcom, s. f.-p](/fuentes#F22)):
1. **Exposición de atributos internos del paciente:** `Paciente.java` almacena `rut`, `telefono` y `email`. Si el controlador devolviera `Cita` directamente, Jackson serializaría el grafo completo filtrando esos datos privados; `CitaResponse` publica solo seis campos (`id`, `nombrePaciente`, `nombreMedico`, `especialidad`, `fechaHora`, `estado`).
2. **Modificación indebida de estado en la entrada:** si `@PostMapping` recibiera `Cita` como cuerpo JSON, un cliente podría enviar un `id` arbitrario o fijar `"estado": "CANCELADA"`. En cambio, `AgendarCitaRequest` solo acepta `pacienteId`, `medicoId`, `fechaHora` y `motivo`, y el constructor de `Cita` fuerza `this.estado = EstadoCita.AGENDADA`.
3. **Acoplamiento entre esquema SQL y clientes HTTP:** cualquier ajuste interno en las columnas de `citas` o `pacientes` rompería las integraciones externas si no existiera la traducción `CitaResponse.desde(cita)` ([VMware/Broadcom, s. f.-p](/fuentes#F22)).
4. **Fallo real `LazyInitializationException` con `open-in-view=false`:** en `application.properties` desactivamos `spring.jpa.open-in-view=false` para no retener conexiones JDBC durante la vista web ([VMware/Broadcom, s. f.-u](/fuentes#F19)). Como `Cita.paciente` y `Cita.medico` son `@ManyToOne(fetch = FetchType.LAZY)`, al invocar `CitaResponse.desde(cita)` en `GET /api/v1/citas/{id}` fuera de la sesión se producía `LazyInitializationException`. Se resolvió diseñando la consulta explícita con `JOIN FETCH` en `CitaRepository` ([VMware/Broadcom, s. f.-u](/fuentes#F19); [VMware/Broadcom, s. f.-f](/fuentes#F25)):

```java
// web/src/data/codigo/CitaRepository.java
@Query("SELECT c FROM Cita c JOIN FETCH c.paciente JOIN FETCH c.medico WHERE c.id = :id")
Optional<Cita> buscarConPacienteYMedicoPorId(@Param("id") Long id);
```

---

### 3. Validación con `@Valid` y manejo centralizado en `GlobalExceptionHandler` (`ProblemDetail` RFC 9457)

La defensa del backend opera en dos barreras sucesivas ([VMware/Broadcom, s. f.-m](/fuentes#F21); [VMware/Broadcom, s. f.-j](/fuentes#F24)):
1. **Barrera sintáctica en la entrada (`@Valid`):** el *record* `AgendarCitaRequest` declara `@NotNull`, `@Future`, `@NotBlank` y `@Size(max = 200)`. Cuando llega una fecha pasada, `RequestMappingHandlerAdapter` lanza `MethodArgumentNotValidException` antes de entrar al método del controlador ([VMware/Broadcom, s. f.-m](/fuentes#F21)).
2. **Barrera semántica en `@Service`:** `CitaService` verifica existencia de paciente y médico (`RecursoNoEncontradoException`), horario hábil de lunes a viernes de 08:00 a 18:00 en bloques de 30 minutos (`ReglaNegocioException`) y disponibilidad del bloque (`HorarioNoDisponibleException`).

Para traducir cualquier fallo a respuestas HTTP semánticas sin bloques `try/catch` repetidos, `GlobalExceptionHandler` usa `@RestControllerAdvice` y extiende `ResponseEntityExceptionHandler`, que "resuelve excepciones de Spring MVC mediante `ProblemDetail`" conforme al estándar **RFC 9457** (`Content-Type: application/problem+json`) ([VMware/Broadcom, s. f.-j](/fuentes#F24)):

```java
// Extracto real de web/src/data/codigo/GlobalExceptionHandler.java
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "La solicitud no pasó las validaciones de formato");
        problema.setTitle("Solicitud inválida");
        List<ErrorDeCampo> errores = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> new ErrorDeCampo(error.getField(), mensaje(error)))
                .toList();
        problema.setProperty("errores", errores);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problema);
    }

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ProblemDetail manejarRecursoNoEncontrado(RecursoNoEncontradoException ex) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problema.setTitle("Recurso no encontrado");
        return problema;
    }

    @ExceptionHandler(HorarioNoDisponibleException.class)
    public ProblemDetail manejarHorarioNoDisponible(HorarioNoDisponibleException ex) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problema.setTitle("Bloque horario ocupado");
        return problema;
    }

    @ExceptionHandler(ReglaNegocioException.class)
    public ProblemDetail manejarReglaNegocio(ReglaNegocioException ex) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        problema.setTitle("Fuera de las reglas de atención");
        return problema;
    }
}
```

#### Evidencia real de los cuatro errores HTTP capturados (`web/src/data/evidencia/http-400/404/409/422.txt`)

- **`400 Bad Request` (`http-400.txt` — fecha pasada en `@Valid`):**
  ```json
  {"detail":"La solicitud no pasó las validaciones de formato","instance":"/api/v1/citas","status":400,"title":"Solicitud inválida","errores":[{"campo":"fechaHora","mensaje":"la fecha debe ser futura"}]}
  ```
- **`404 Not Found` (`http-404.txt` — `medicoId: 999` inexistente, RN-01):**
  ```json
  {"detail":"No existe el médico 999","instance":"/api/v1/citas","status":404,"title":"Recurso no encontrado"}
  ```
- **`409 Conflict` (`http-409.txt` — mismo médico y bloque ya reservado, RN-04):**
  ```json
  {"detail":"El médico ya tiene una cita agendada en ese bloque horario","instance":"/api/v1/citas","status":409,"title":"Bloque horario ocupado"}
  ```
- **`422 Unprocessable Entity` (`http-422.txt` — solicitud en domingo `2026-11-08`, RN-03):**
  ```json
  {"detail":"Solo se atiende de lunes a viernes","instance":"/api/v1/citas","status":422,"title":"Fuera de las reglas de atención"}
  ```

---

### 4. Seguridad de credenciales y qué ocurre realmente con `${DB_PASSWORD}` sin resolver

Escribir contraseñas reales en `application.properties` deja el secreto expuesto de forma permanente en el historial de commits de Git. Por ello, `application-prod.properties` externaliza las credenciales mediante marcadores de variables de entorno:

```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver
```

Al verificar el arranque real del backend con el perfil `prod` sin definir `DB_URL`, `DB_USER` ni `DB_PASSWORD` en el sistema operativo, se comprobó el mecanismo exacto de fallo: **Spring Boot procesa el archivo `.properties` aun con *placeholders* sin resolver** y entrega el texto literal `"${DB_URL}"` y `"${DB_PASSWORD}"` al `DataSource` ([VMware/Broadcom, s. f.-u](/fuentes#F19)). Inmediatamente después, al inicializar `HikariCP`, el controlador `org.postgresql.Driver` rechaza la cadena con `RuntimeException: Driver org.postgresql.Driver claims to not accept jdbcUrl, ${DB_URL}`, abortando el inicio antes de abrir el puerto `8080` ([VMware/Broadcom, s. f.-s](/fuentes#F17); [VMware/Broadcom, s. f.-u](/fuentes#F19)).

---

### 5. Lectura paso a paso de la figura de este tema

- **Lectura de la Figura 9 (`D22` — Entidad `@Entity` vs. *record* DTO):** compara el antipatrón superior (donde devolver `Paciente`/`Cita` expone `rut`, `telefono` y `email` o dispara `LazyInitializationException` fuera de la sesión) frente al flujo inferior implementado en `CitaController`: el servicio carga la cita mediante `JOIN FETCH` y `CitaResponse.desde(cita)` construye un `record` inmutable con los seis campos públicos del comprobante ([VMware/Broadcom, s. f.-u](/fuentes#F19); [VMware/Broadcom, s. f.-p](/fuentes#F22); [VMware/Broadcom, s. f.-f](/fuentes#F25)).
