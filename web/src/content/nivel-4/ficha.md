---
nivel: 4
titulo: "Ficha técnica · Código conectado en capas y catálogo de anotaciones"
criterio: "Criterio 2: aplicación práctica (30 pts)"
fuentes: ["F01", "F06", "F11", "F19", "F20", "F22", "F23", "F24", "F25", "F26"]
---

### 1. Pregunta 3 de la pauta: Ejemplo completo conectando las capas ("Agendar una cita médica")

A continuación se muestra el recorrido en código real del caso **Reserva de Horas Médicas** (`cl.ipss.reservamedica`), usando `jakarta.*`, inyección por constructor con campos `final` y DTOs definidos como *Java Records* ([VMware/Broadcom, s. f.-l](/fuentes#F20); [Fowler, 2004](/fuentes#F26)).

#### A. Capa de Modelo (`Cita.java` — `@Entity`)

Representa la tabla `citas` en la base de datos relacional. Sus asociaciones `@ManyToOne` hacia `Paciente` y `Medico` declaran `FetchType.LAZY` para no arrastrar consultas innecesarias, y el estado se almacena como texto (`EnumType.STRING`) ([VMware/Broadcom, s. f.-u](/fuentes#F19)).

Extracto de Cita.java; se omiten imports y getters, y se reduce la sangría para leerlo.

```java
package cl.ipss.reservamedica.model;

import java.time.LocalDateTime;

@Entity
@Table(name = "citas")
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    @Column(nullable = false)
    private LocalDateTime fechaHora;

    private String motivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoCita estado;

    protected Cita() {
        // constructor exigido por JPA
    }

    public Cita(Paciente paciente, Medico medico, LocalDateTime fechaHora, String motivo) {
        this.paciente = paciente;
        this.medico = medico;
        this.fechaHora = fechaHora;
        this.motivo = motivo;
        this.estado = EstadoCita.AGENDADA;
    }
}
```

#### B. Capa de Repositorio (`CitaRepository.java` — `JpaRepository`)

Al extender `JpaRepository<Cita, Long>`, Spring Data JPA genera la implementación en tiempo de ejecución y deriva la consulta de disponibilidad a partir del nombre del método ([VMware/Broadcom, s. f.-f](/fuentes#F25)):

Extracto de CitaRepository.java; se omiten imports y getters, y se reduce la sangría para leerlo.

```java
package cl.ipss.reservamedica.repository;

import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import cl.ipss.reservamedica.model.Cita;
import cl.ipss.reservamedica.model.EstadoCita;

public interface CitaRepository extends JpaRepository<Cita, Long> {

    boolean existsByMedicoIdAndFechaHoraAndEstado(Long medicoId, LocalDateTime fechaHora, EstadoCita estado);
}
```

#### C. Capa de Transferencia (`AgendarCitaRequest.java` y `CitaResponse.java` — Java Records)

Los DTO desacoplan el contrato JSON externo del modelo interno `@Entity` y concentran las validaciones de formato con Jakarta Bean Validation:

```java
package cl.ipss.reservamedica.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AgendarCitaRequest(
        @NotNull(message = "el paciente es obligatorio") Long pacienteId,
        @NotNull(message = "el médico es obligatorio") Long medicoId,
        @NotNull(message = "la fecha y hora son obligatorias")
        @Future(message = "la fecha debe ser futura") LocalDateTime fechaHora,
        @NotBlank(message = "el motivo es obligatorio")
        @Size(max = 200, message = "el motivo no puede superar 200 caracteres") String motivo) {
}
```

#### D. Capa de Servicio (`CitaService.java` — `@Service` y `@Transactional`)

Recibe los repositorios por constructor, verifica existencia de paciente y médico (`RN-01`, `404 Not Found`), comprueba que la hora caiga de lunes a viernes entre `08:00` y `18:00` en bloques de 30 minutos (`RN-03`, `422 Unprocessable Content`) y verifica que el médico no tenga otra cita agendada en ese bloque (`RN-04`, `409 Conflict`) antes de guardar ([VMware/Broadcom, s. f.-l](/fuentes#F20); [VMware/Broadcom, s. f.-j](/fuentes#F24)):

Extracto de CitaService.java; se omiten imports y getters, y se reduce la sangría para leerlo.

```java
package cl.ipss.reservamedica.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CitaService {

    private static final LocalTime INICIO_ATENCION = LocalTime.of(8, 0);
    private static final LocalTime ULTIMO_BLOQUE = LocalTime.of(17, 30);

    private final CitaRepository citaRepository;
    private final PacienteRepository pacienteRepository;
    private final MedicoRepository medicoRepository;

    public CitaService(CitaRepository citaRepository, PacienteRepository pacienteRepository,
            MedicoRepository medicoRepository) {
        this.citaRepository = citaRepository;
        this.pacienteRepository = pacienteRepository;
        this.medicoRepository = medicoRepository;
    }

    @Transactional
    public Cita agendar(AgendarCitaRequest request) {
        Paciente paciente = pacienteRepository.findById(request.pacienteId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe el paciente " + request.pacienteId()));
        Medico medico = medicoRepository.findById(request.medicoId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe el médico " + request.medicoId()));

        validarHorarioDeAtencion(request.fechaHora());

        boolean bloqueOcupado = citaRepository.existsByMedicoIdAndFechaHoraAndEstado(
                medico.getId(), request.fechaHora(), EstadoCita.AGENDADA);
        if (bloqueOcupado) {
            throw new HorarioNoDisponibleException(
                    "El médico ya tiene una cita agendada en ese bloque horario");
        }

        Cita cita = new Cita(paciente, medico, request.fechaHora(), request.motivo());
        return citaRepository.save(cita);
    }
}
```

#### E. Capa Controladora (`CitaController.java` — `@RestController`)

Recibe el DTO validado con `@Valid @RequestBody`, delega en `CitaService`, convierte el resultado a `CitaResponse` y responde `201 Created` con la cabecera `Location` ([VMware/Broadcom, s. f.-p](/fuentes#F22); [VMware/Broadcom, s. f.-o](/fuentes#F23)):

Extracto de CitaController.java; se omiten imports y getters, y se reduce la sangría para leerlo.

```java
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

### 2. Tabla de anotaciones por capa y qué hace cada una

| Anotación | Capa donde se ubica | Dónde se coloca | Qué función cumple en Spring Boot / Jakarta EE |
|---|---|---|---|
| `@RestController` | Controlador | Clase (`CitaController`) | Registra un controlador web cuyos métodos serializan el valor devuelto directo al cuerpo HTTP (JSON) ([VMware/Broadcom, s. f.-p](/fuentes#F22)). |
| `@RequestMapping` / `@PostMapping` / `@GetMapping` | Controlador | Clase o método | Asocia una ruta URL y un verbo HTTP específico al método manejador ([VMware/Broadcom, s. f.-o](/fuentes#F23)). |
| `@RequestBody` | Controlador | Parámetro del método | Indica que el cuerpo JSON de la petición debe deserializarse hacia el DTO con un `HttpMessageConverter` ([VMware/Broadcom, s. f.-p](/fuentes#F22)). |
| `@Valid` | Controlador / DTO | Parámetro del método | Dispara la validación de restricciones (`@NotNull`, `@Future`, `@NotBlank`) antes de ejecutar el controlador. |
| `@Service` | Servicio | Clase (`CitaService`) | Especialización de `@Component` que registra un *bean* con la lógica de negocio en el `ApplicationContext` ([VMware/Broadcom, s. f.-l](/fuentes#F20)). |
| `@Transactional` | Servicio | Clase o método | Ejecuta el método dentro de una transacción de base de datos (`readOnly = true` optimiza consultas). |
| `@Repository` | Repositorio | Interfaz o clase DAO | Estereotipo de acceso a datos; las interfaces que extienden `JpaRepository` son detectadas automáticamente por Spring Data ([VMware/Broadcom, s. f.-f](/fuentes#F25)). |
| `@Entity` y `@Table` | Modelo | Clase (`Cita`, `Medico`, `Paciente`) | Mapea la clase de dominio a una tabla relacional gestionada por Jakarta Persistence e Hibernate ([VMware/Broadcom, s. f.-u](/fuentes#F19)). |
| `@Id` y `@GeneratedValue` | Modelo | Campo identificador | Declara la clave primaria de la tabla y su estrategia de auto-incremento (`IDENTITY`). |
| `@ManyToOne` y `@JoinColumn` | Modelo | Campo de relación | Define la asociación muchos-a-uno y la columna de clave foránea (`paciente_id`, `medico_id`). |
| `@RestControllerAdvice` y `@ExceptionHandler` | Manejo de errores | Clase (`GlobalExceptionHandler`) | Intercepta excepciones lanzadas en cualquier controlador o servicio y las transforma en `ProblemDetail` (RFC 9457) ([VMware/Broadcom, s. f.-j](/fuentes#F24)). |

---

### 3. SQL generado por Hibernate al agendar una cita

Esta es la salida real de la ejecución del backend (`arranque-completo.log`, capturada el 01-nov-2026), tal como quedó registrada en `web/src/data/evidencia/sql-exists.txt` y `web/src/data/evidencia/sql-insert.txt`:

Extracto de sql-exists.txt y sql-insert.txt; los comentarios numerados (-- 1., -- 2.) son míos y la sangría está reducida para lectura.

```sql
-- 1. Verificación de disponibilidad del bloque (existsByMedicoIdAndFechaHoraAndEstado)
select
    c1_0.id
from
    citas c1_0
where
    c1_0.medico_id=?
    and c1_0.fecha_hora=?
    and c1_0.estado=?
fetch
    first ? rows only

-- 2. Inserción de la nueva cita médica (save)
insert
into
    citas
    (estado, fecha_hora, medico_id, motivo, paciente_id, id)
values
    (?, ?, ?, ?, ?, default)
```

Hay un detalle real que vale la pena marcar porque contradice lo que uno esperaría a primera vista: el método derivado `existsByMedicoIdAndFechaHoraAndEstado` **no** genera un `select count(*)`. Hibernate 7, al traducir un método `existsBy...` de Spring Data JPA, arma un `SELECT c1_0.id ... FETCH FIRST ? ROWS ONLY`: le pide a la base de datos como máximo una fila que cumpla la condición, no que cuente todas las que cumplen. Para la pregunta "¿hay al menos una cita en ese bloque?" esto es más barato que un conteo completo, porque el motor puede detenerse en la primera coincidencia en lugar de recorrer y sumar todas las filas que calzan ([VMware/Broadcom, s. f.-f](/fuentes#F25)).

---

### 4. Caso real: por qué `GET /api/v1/citas/{id}` necesitó una consulta con `JOIN FETCH`

La entidad `Cita` declara `paciente` y `medico` como `@ManyToOne(fetch = FetchType.LAZY)` (ver sección 1.A), y el proyecto corre con `spring.jpa.open-in-view=false`: la sesión de Hibernate se cierra al salir de la capa `@Service`, no queda abierta durante toda la petición HTTP ([VMware/Broadcom, s. f.-u](/fuentes#F19)).

La primera versión de `CitaService.obtenerPorId` llamaba directo a `citaRepository.findById(id)`. Esa consulta trae la cita, pero `paciente` y `medico` quedan como referencias LAZY sin inicializar: son proxies que recién ejecutan su propia consulta cuando alguien llama a un *getter* sobre ellos. El problema es que `CitaController` construye `CitaResponse.desde(cita)` leyendo `cita.getPaciente().getNombre()` ya fuera del `@Service`, con la sesión de Hibernate cerrada por el `open-in-view=false`. Al probar el *endpoint* real, el resultado fue un `500` (`LazyInitializationException` envuelta), un hallazgo confirmado y documentado como bug real (el registro de verificación del proyecto, hallazgo A13).

La corrección fue declarar en `CitaRepository` una consulta explícita con `JOIN FETCH` (`buscarConPacienteYMedicoPorId`), que trae la cita junto con su paciente y su médico en una sola ejecución SQL, y usarla desde `CitaService.obtenerPorId` dentro de la misma transacción de lectura (`@Transactional(readOnly = true)`) ([VMware/Broadcom, s. f.-f](/fuentes#F25)):

Extracto de CitaRepository.java; se omiten imports y getters, y se reduce la sangría para leerlo.

```java
    @Query("SELECT c FROM Cita c JOIN FETCH c.paciente JOIN FETCH c.medico WHERE c.id = :id")
    Optional<Cita> buscarConPacienteYMedicoPorId(@Param("id") Long id);
```

Con ese cambio, el mismo `arranque-completo.log` registra la consulta corregida (líneas 1733-1758): un único `SELECT` con dos `JOIN` hacia `pacientes` y `medicos`, y el `GET /api/v1/citas/1` responde `200 OK` en vez de `500`.

La lección de fondo: declarar una relación como LAZY (buena práctica para no cargar datos de más) traslada la responsabilidad a quien escribe el caso de uso: hay que diseñar, consulta por consulta, qué datos relacionados hacen falta. No es un defecto de LAZY ni de `open-in-view=false`; es justamente la razón de que existan ambos. La alternativa fácil, `open-in-view=true`, evita este error dejando la sesión abierta durante toda la petición, pero a costa de disimular el problema de rendimiento N+1 (cada relación LAZY que se toca dispara una consulta adicional, sin que nadie la haya pedido a propósito).

---

### 5. Lectura paso a paso de la Figura D18 (Mapa conceptual de anotaciones por capa)

- **Lectura de la Figura D18:** responde a la pregunta de foco *¿Cómo declara cada anotación la responsabilidad de una clase dentro de la arquitectura en capas?*. El mapa organiza las anotaciones desde la frontera HTTP hacia la base de datos: `@RestController` **expone rutas con** `@GetMapping` y `@PostMapping`, **recibe y valida con** `@RequestBody` y `@Valid`, y **delega en** `@Service`; a su vez, `@Service` **demarca transacciones con** `@Transactional` e **invoca a** `JpaRepository` (`@Repository`), el cual **persiste entidades marcadas con** `@Entity`, `@Id` y `@ManyToOne`. En paralelo, `@RestControllerAdvice` **captura fallos con** `@ExceptionHandler` y **emite** `ProblemDetail` ([VMware/Broadcom, s. f.-l](/fuentes#F20); [VMware/Broadcom, s. f.-p](/fuentes#F22); [VMware/Broadcom, s. f.-o](/fuentes#F23); [VMware/Broadcom, s. f.-j](/fuentes#F24); [VMware/Broadcom, s. f.-f](/fuentes#F25)).
