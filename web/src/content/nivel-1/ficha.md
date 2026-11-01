---
nivel: 1
titulo: "Ficha técnica · El motor de Spring Boot: auto-configuración, IoC/DI y Tomcat embebido"
criterio: "Criterio 1: comprensión (20 pts)"
fuentes: ["F01", "F02", "F05", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F26", "F27", "F28"]
---

### 1. ¿Qué hace internamente `@SpringBootApplication` al iniciar?

La clase principal del proyecto (`cl.ipss.reservamedica.ReservaMedicaApplication`) lleva la anotación `@SpringBootApplication`, una meta-anotación que combina tres directivas complementarias ([VMware/Broadcom, s. f.-t](/fuentes#F14)):

| Meta-anotación | Función técnica | Consecuencia en el caso Reserva de Horas Médicas |
|---|---|---|
| `@SpringBootConfiguration` | Especialización de `@Configuration` que declara la clase principal como fuente de definiciones de *beans* ([VMware/Broadcom, s. f.-t](/fuentes#F14)) | Permite registrar *beans* adicionales con `@Bean` dentro de la propia configuración del proyecto ([VMware/Broadcom, s. f.-t](/fuentes#F14)). |
| `@EnableAutoConfiguration` | Activa el motor de auto-configuración de Spring Boot a partir de los artefactos presentes en el *classpath* ([VMware/Broadcom, s. f.-t](/fuentes#F14); [VMware/Broadcom, s. f.-a](/fuentes#F15)) | Registra `DispatcherServlet`, `DataSource` (`HikariDataSource`), `EntityManagerFactory` (Hibernate) y `JsonMapper` (Jackson 3) ([VMware/Broadcom, s. f.-a](/fuentes#F15); [VMware/Broadcom, s. f.-u](/fuentes#F19); [Spring Boot Team, 2025a](/fuentes#F27)). |
| `@ComponentScan` | Escanea `@Component`, `@Service`, `@Repository` y `@RestController` desde el paquete de la clase principal hacia sus subpaquetes ([VMware/Broadcom, s. f.-t](/fuentes#F14)) | Exige que `ReservaMedicaApplication` viva en `cl.ipss.reservamedica` para descubrir `controller`, `service`, `repository` y `exception` ([VMware/Broadcom, s. f.-t](/fuentes#F14)). |

#### Secuencia de eventos en `SpringApplication.run(...)`

Al invocar el método `main`, `SpringApplication` publica una secuencia ordenada de eventos del ciclo de vida antes de aceptar peticiones HTTP ([VMware/Broadcom, s. f.-s](/fuentes#F17)):
1. `ApplicationStartingEvent`: se emite al comenzar el arranque, antes de crear el contexto ([VMware/Broadcom, s. f.-s](/fuentes#F17)).
2. `ApplicationEnvironmentPreparedEvent`: el `Environment` (propiedades de `application.properties` y perfil activo `dev` o `prod`) ya fue cargado ([VMware/Broadcom, s. f.-s](/fuentes#F17)).
3. `ApplicationContextInitializedEvent` y `ApplicationPreparedEvent`: se instancia el `ApplicationContext` web de servlets y se cargan las definiciones de *beans* ([VMware/Broadcom, s. f.-s](/fuentes#F17)).
4. **Refresco del contexto y arranque de Tomcat:** se crean los *beans* singleton, se inicia el servidor embebido en el puerto `8080` y se emite `ContextRefreshedEvent` ([VMware/Broadcom, s. f.-s](/fuentes#F17); [VMware/Broadcom, s. f.-i](/fuentes#F18)).
5. `ApplicationStartedEvent` (`LivenessState.CORRECT`) → ejecución de inicializadores como `DatosInicialesDev` (`CommandLineRunner`) → `ApplicationReadyEvent` (`ReadinessState.ACCEPTING_TRAFFIC`) ([VMware/Broadcom, s. f.-s](/fuentes#F17)).

#### Evidencia real de arranque (`web/src/data/evidencia/arranque.log`)

```text
2026-11-01T15:59:38.910-03:00  INFO 34856 --- [reserva-medica] [           main] c.i.r.ReservaMedicaApplication           : The following 1 profile is active: "dev"
2026-11-01T15:59:40.462-03:00  INFO 34856 --- [reserva-medica] [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2026-11-01T15:59:40.603-03:00  INFO 34856 --- [reserva-medica] [           main] com.zaxxer.hikari.pool.HikariPool        : HikariPool-1 - Added connection conn0: url=jdbc:h2:mem:reservamedica user=SA
2026-11-01T15:59:40.605-03:00  INFO 34856 --- [reserva-medica] [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
2026-11-01T15:59:42.146-03:00  INFO 34856 --- [reserva-medica] [           main] o.s.b.h.a.H2ConsoleAutoConfiguration     : H2 console available at '/h2-console'. Database available at 'jdbc:h2:mem:reservamedica'
2026-11-01T15:59:42.273-03:00  INFO 34856 --- [reserva-medica] [           main] o.s.boot.tomcat.TomcatWebServer          : Tomcat started on port 8080 (http) with context path '/'
2026-11-01T15:59:42.283-03:00  INFO 34856 --- [reserva-medica] [           main] c.i.r.ReservaMedicaApplication           : Started ReservaMedicaApplication in 3.661 seconds (process running for 3.974)
```

---

### 2. ¿Por qué basta agregar un *starter* para que todo quede listo?

La guía de auto-configuración señala que un *starter* "es realmente un jar vacío" cuyo propósito es reunir descriptores de dependencias compatibles gobernadas por el BOM de Spring Boot ([VMware/Broadcom, s. f.-g](/fuentes#F16)). Las clases candidatas `@AutoConfiguration` se declaran en `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` y nunca se cargan mediante `@ComponentScan` ([VMware/Broadcom, s. f.-g](/fuentes#F16)).

La **cadena causal completa** opera en seis eslabones verificables ([VMware/Broadcom, s. f.-a](/fuentes#F15); [VMware/Broadcom, s. f.-g](/fuentes#F16)):
1. **Declaración del *starter*:** se incluye `spring-boot-starter-webmvc` o `spring-boot-starter-data-jpa` en `backend/pom.xml`.
2. **Resolución en el *classpath*:** Maven descarga `tomcat-embed-core:11.0.27`, `jackson-databind:3.1.7` (`tools.jackson.core`), `hibernate-core:7.4.13.Final` y `HikariCP:7.0.2` ([Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)).
3. **Lectura de candidatas:** `@EnableAutoConfiguration` lee las configuraciones listadas en `AutoConfiguration.imports` ([VMware/Broadcom, s. f.-g](/fuentes#F16)).
4. **Evaluación de condiciones (`@ConditionalOn…`):** cada candidata comprueba si existen las clases requeridas (`@ConditionalOnClass`), si el contexto es web (`@ConditionalOnWebApplication`) o si una propiedad está activa (`@ConditionalOnBooleanProperty`) ([VMware/Broadcom, s. f.-a](/fuentes#F15); [VMware/Broadcom, s. f.-g](/fuentes#F16)).
5. **Retroceso no invasivo (*back-off*):** mediante `@ConditionalOnMissingBean`, "si agregas tu propio bean `DataSource`, el soporte por defecto se retira" ([VMware/Broadcom, s. f.-a](/fuentes#F15)).
6. **Ajuste por propiedades:** las claves de `application.properties` y `application-dev.properties` parametrizan los *beans* creados ([VMware/Broadcom, s. f.-a](/fuentes#F15); [VMware/Broadcom, s. f.-u](/fuentes#F19)).

#### Salida real del informe de condiciones (`web/src/data/evidencia/condiciones.txt`)

Al ejecutar el backend con `--debug`, Spring Boot 4.1.2 imprime un `CONDITIONS EVALUATION REPORT` con todas las auto-configuraciones candidatas y si cumplieron sus condiciones (*Positive matches*) o no (*Negative matches*) ([VMware/Broadcom, s. f.-a](/fuentes#F15)). El extracto real capturado en `condiciones.txt` (300 líneas, solo *Positive matches*) muestra, entre otras, estas cinco auto-configuraciones activadas para `reserva-medica`:

```text
CONDITIONS EVALUATION REPORT
============================

Positive matches:
-----------------
   DataJpaRepositoriesAutoConfiguration matched:
      - @ConditionalOnClass found required class 'org.springframework.data.jpa.repository.JpaRepository' (OnClassCondition)
      - @ConditionalOnBooleanProperty (spring.data.jpa.repositories.enabled=true) matched (OnPropertyCondition)

   DataSourceConfiguration.Hikari matched:
      - @ConditionalOnClass found required class 'com.zaxxer.hikari.HikariDataSource' (OnClassCondition)
      - @ConditionalOnProperty (spring.datasource.type=com.zaxxer.hikari.HikariDataSource) matched (OnPropertyCondition)
      - @ConditionalOnMissingBean (types: javax.sql.DataSource; SearchStrategy: all) did not find any beans (OnBeanCondition)

   DispatcherServletAutoConfiguration matched:
      - @ConditionalOnClass found required class 'org.springframework.web.servlet.DispatcherServlet' (OnClassCondition)
      - found 'session' scope (OnWebApplicationCondition)

   H2ConsoleAutoConfiguration matched:
      - @ConditionalOnClass found required class 'org.h2.server.web.JakartaWebServlet' (OnClassCondition)
      - @ConditionalOnBooleanProperty (spring.h2.console.enabled=true) matched (OnPropertyCondition)

   JacksonAutoConfiguration matched:
      - @ConditionalOnClass found required class 'tools.jackson.databind.json.JsonMapper' (OnClassCondition)
```

---

### 3. Inversión de Control (IoC), `ApplicationContext`, *bean* e Inyección de Dependencias (DI)

- **Inversión de Control (IoC):** en lugar de que un componente cree sus dependencias con `new`, delega esa responsabilidad al contenedor externo ([VMware/Broadcom, s. f.-l](/fuentes#F20); [Fowler, 2004](/fuentes#F26)). Martin Fowler (2004) introdujo el nombre *Dependency Injection* para precisar que el contenedor ensambla y provee los colaboradores desde afuera ([Fowler, 2004](/fuentes#F26)).
- **Qué es un *bean*:** la documentación de Spring Framework lo define como "un objeto que es instanciado, ensamblado y administrado por un contenedor IoC" ([VMware/Broadcom, s. f.-l](/fuentes#F20)).
- **Qué es el `ApplicationContext`:** es la interfaz central del contenedor de Spring que gestiona el ciclo de vida completo de los *beans*, inyecta sus colaboradores, publica eventos y aplica *proxies* de programación orientada a aspectos (AOP) como `@Transactional` ([VMware/Broadcom, s. f.-l](/fuentes#F20)).

#### Inyección por constructor en el código real (`CitaService.java`)

```java
@Service
public class CitaService {

    private final CitaRepository citaRepository;
    private final PacienteRepository pacienteRepository;
    private final MedicoRepository medicoRepository;

    public CitaService(CitaRepository citaRepository, PacienteRepository pacienteRepository,
            MedicoRepository medicoRepository) {
        this.citaRepository = citaRepository;
        this.pacienteRepository = pacienteRepository;
        this.medicoRepository = medicoRepository;
    }
}
```

La inyección por constructor garantiza referencias inmutables (`final`), impide construir el servicio en estado incompleto (falla al arrancar si falta un colaborador) y permite instanciar `CitaService` con `new` en pruebas unitarias (`CitaServiceTest`) pasando simulaciones de Mockito sin levantar el contenedor ([VMware/Broadcom, s. f.-l](/fuentes#F20); [Fowler, 2004](/fuentes#F26)).

---

### 4. Servidor web integrado (Tomcat embebido) frente al despliegue tradicional WAR

En la arquitectura tradicional de Java EE, el administrador instalaba un servidor de aplicaciones externo (Tomcat o WildFly), compilaba un archivo `.war` y lo desplegaba en un directorio compartido. En Spring Boot, **Tomcat 11.0.27 viaja embebido como librería** dentro de `spring-boot-starter-tomcat` (traído por `spring-boot-starter-webmvc`) ([VMware/Broadcom, s. f.-r](/fuentes#F02); [VMware/Broadcom, s. f.-i](/fuentes#F18); [Spring Boot Team, 2025a](/fuentes#F27)):

| Criterio | Forma antigua: archivo `.war` en servidor externo | Forma Spring Boot: `.jar` con Tomcat 11.0.27 embebido |
|---|---|---|
| Requisitos en el servidor | Instalar y mantener un servidor de aplicaciones externo | Solo contar con Java 21 (JRE/JDK) instalado ([VMware/Broadcom, s. f.-i](/fuentes#F18)) |
| Artefacto y comando de inicio | `.war` copiado en la carpeta `webapps/` | `.jar` autónomo ejecutado mediante `java -jar` ([VMware/Broadcom, s. f.-i](/fuentes#F18); [Spring Boot Team, 2025a](/fuentes#F27)) |
| Configuración del servidor | Archivos XML externos (`server.xml`, `web.xml`) | Propiedades de aplicación (`server.port`, `server.error.*`) ([VMware/Broadcom, s. f.-r](/fuentes#F02); [VMware/Broadcom, s. f.-i](/fuentes#F18)) |
| Aislamiento operativo | Múltiples aplicaciones comparten el mismo motor de servlets | Cada servicio corre en su propio proceso autocontenido ([VMware/Broadcom, s. f.-i](/fuentes#F18)) |

---

### 5. Evolución confirmada de Spring Boot 3.x a 4.x en el motor y las pruebas

La migración del backend a **Spring Boot 4.1.2** (sobre Spring Framework 7.0.10) introduce cinco cambios verificados en la documentación oficial y en `dependency-tree.txt` ([Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)):
1. **Nuevo nombre del *starter* web MVC:** `spring-boot-starter-web` pasa a llamarse `spring-boot-starter-webmvc` (junto con `spring-boot-starter-webmvc-test`, donde `@WebMvcTest` vive en `org.springframework.boot.webmvc.test.autoconfigure`) ([Spring Boot Team, 2025a](/fuentes#F27)).
2. **Adopción de Jackson 3:** el serializador JSON por defecto migra al paquete `tools.jackson` (`tools.jackson.core:jackson-databind:3.1.7`), conservando `com.fasterxml.jackson.annotation` (`2.21`) para anotaciones ([Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)).
3. **Reemplazo de `@MockBean` por `@MockitoBean`:** en las pruebas de contexto como `CitaControllerTest`, se utiliza `@MockitoBean` del paquete `org.springframework.test.context.bean.override.mockito` (`spring-test`) ([Spring Boot Team, 2025a](/fuentes#F27)).
4. **Módulo separado para la consola H2:** habilitar `/h2-console` en `dev` requiere declarar explícitamente el artefacto `org.springframework.boot:spring-boot-h2console` además de `com.h2database:h2` ([Spring Boot Team, 2025a](/fuentes#F27)).
5. **Servidores embebidos sobre Servlet 6.1:** Spring Boot 4 utiliza Tomcat 11.0 (`11.0.27` en este proyecto) o Jetty 12.1 y elimina el soporte para Undertow por no implementar Jakarta Servlet 6.1 ([Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)).

---

### 6. Lectura paso a paso de la figura de este tema

- **Lectura de la Figura 1 (`D01` — Cadena causal *starter* → *classpath* → condición → *bean*):** sigue los seis nodos de arriba hacia abajo: al declarar `spring-boot-starter-data-jpa` en `pom.xml`, Maven descarga `Hibernate 7.4.13.Final` y `HikariCP 7.0.2` al *classpath*; `@SpringBootApplication` activa `@EnableAutoConfiguration`, que lee `AutoConfiguration.imports` y evalúa `@ConditionalOnClass` y `@ConditionalOnMissingBean` para registrar el *bean* `DataSource` (`HikariPool-1`) listo para inyectar por constructor ([VMware/Broadcom, s. f.-t](/fuentes#F14); [VMware/Broadcom, s. f.-a](/fuentes#F15); [VMware/Broadcom, s. f.-g](/fuentes#F16); [VMware/Broadcom, s. f.-l](/fuentes#F20)).
