---
nivel: 3
titulo: "Ficha técnica · Gestión de dependencias (pom.xml), propiedades y perfiles"
criterio: "Criterio 2: aplicación práctica (30 pts)"
fuentes: ["F02", "F08", "F09", "F10", "F15", "F17", "F18", "F19", "F25", "F27", "F28"]
---

### 1. Pregunta 1 de la pauta: El archivo `pom.xml` y los *starters* del caso

El archivo `pom.xml` (*Project Object Model* de Apache Maven) declara la identidad del proyecto (`cl.ipss:reserva-medica`), la versión de Java (`21`), el padre de gestión de versiones y los *starters* que activan la auto-configuración de Spring Boot ([VMware/Broadcom, s. f.-a](/fuentes#F15); [Spring Boot Team, 2025a](/fuentes#F27)).

Al heredar de `spring-boot-starter-parent` (versión `4.1.2` en el backend del caso), el proyecto incorpora un *Bill of Materials* (BOM) que alinea las versiones compatibles de Spring MVC, Hibernate, Jackson, Tomcat y los conectores JDBC sin necesidad de escribir etiquetas `<version>` en cada dependencia ([VMware/Broadcom, s. f.-a](/fuentes#F15); [Spring Boot Team, 2025b](/fuentes#F28)).

#### Extracto real de `backend/pom.xml`

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.1.2</version>
    <relativePath/>
</parent>
<groupId>cl.ipss</groupId>
<artifactId>reserva-medica</artifactId>
<version>0.0.1-SNAPSHOT</version>
<properties>
    <java.version>21</java.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webmvc</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-h2console</artifactId>
    </dependency>
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

#### Qué hace cada dependencia principal en el caso Reserva de Horas Médicas

| Dependencia en `pom.xml` | Qué problema resuelve en la clínica | Qué librerías trae y qué activa | Cambio 3.x → 4.x |
|---|---|---|---|
| `spring-boot-starter-webmvc` | Expone los *endpoints* REST (`/api/v1/citas`, `/api/v1/medicos`) y procesa peticiones HTTP ([VMware/Broadcom, s. f.-r](/fuentes#F02); [Spring Boot Team, 2025a](/fuentes#F27)) | Trae **Tomcat 11 embebido**, Spring WebMVC y **Jackson 3** (`tools.jackson`); activa el `DispatcherServlet` y los conversores JSON ([VMware/Broadcom, s. f.-r](/fuentes#F02); [Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)) | En Boot 3.x se llamaba `spring-boot-starter-web`; en Boot 4.0 se renombró a `spring-boot-starter-webmvc` (`starter-web` quedó deprecado como puente) ([Spring Boot Team, 2025a](/fuentes#F27)) |
| `spring-boot-starter-data-jpa` | Conecta las entidades médicas con la base de datos mediante repositorios sin escribir SQL manual ([VMware/Broadcom, s. f.-u](/fuentes#F19); [VMware/Broadcom, s. f.-f](/fuentes#F25)) | Trae **Hibernate 7.1**, Spring Data JPA, Jakarta Persistence 3.2 y el *pool* de conexiones **HikariCP**; activa el `EntityManagerFactory` y las transacciones ([VMware/Broadcom, s. f.-u](/fuentes#F19); [Spring Boot Team, 2025b](/fuentes#F28)) | En Boot 4 actualiza a Jakarta Persistence 3.2 e Hibernate 7.1, con starter de prueba separado (`spring-boot-starter-data-jpa-test`) ([Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)) |
| `spring-boot-starter-validation` | Valida el formato de los DTO de entrada (`@NotBlank`, `@Future`, `@Email`) antes de entrar al negocio | Trae Jakarta Bean Validation 3.1 e Hibernate Validator; activa el validador que responde ante `@Valid` ([Spring Boot Team, 2025b](/fuentes#F28)) | Actualiza a Jakarta Validation 3.1 y separa `spring-boot-starter-validation-test` ([Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)) |
| `com.h2database:h2` y `org.postgresql:postgresql` | Proveen los controladores JDBC para desarrollo en memoria (`H2`) y producción persistente (`PostgreSQL`) ([VMware/Broadcom, s. f.-u](/fuentes#F19)) | Implementan el protocolo JDBC en `scope=runtime` (el código Java compila contra interfaces estándar `jakarta.persistence` y `javax.sql.DataSource`) ([VMware/Broadcom, s. f.-u](/fuentes#F19)) | En Boot 4, la consola web `/h2-console` se desacopló al módulo explícito `spring-boot-h2console` ([Spring Boot Team, 2025a](/fuentes#F27)) |

---

### 2. Pregunta 2 de la pauta: `application.properties` vs. `application.yml`, análisis línea por línea y perfiles

#### Comparación visual y de orden entre `.properties` y `.yml`

| Aspecto | `application.properties` | `application.yml` (YAML) |
|---|---|---|
| Estructura visual | Pares planos `clave=valor` línea por línea | Árbol jerárquico organizado por sangría de espacios |
| Repetición de prefijos | Alta: repite `spring.datasource.*` y `spring.jpa.*` en cada línea | Nula: agrupa claves bajo un mismo nodo (`spring:` → `jpa:`) |
| Riesgo de formato | Tolerante a espacios en blanco | Estricto con la indentación (no admite caracteres de tabulación) |

#### Explicación línea por línea de la configuración del caso

| Propiedad | Valor en `dev` | Valor en `prod` | Qué hace exactamente en Spring Boot |
|---|---|---|---|
| `spring.application.name` | `reserva-medica` | `reserva-medica` | Identifica el nombre lógico del servicio en registros de consola y métricas. |
| `server.port` | *(no se define)* | *(no se define)* | Ninguno de los tres archivos `.properties` del caso fija esta propiedad: el servidor arranca en el `8080` por ser el valor por defecto de **Tomcat embebido**, no porque se haya configurado explícitamente ([VMware/Broadcom, s. f.-i](/fuentes#F18)). |
| `spring.datasource.url` | `jdbc:h2:mem:reservamedica` | `${DB_URL}` | Indica la dirección JDBC de la base de datos que administrará el *pool* **HikariCP** ([VMware/Broadcom, s. f.-u](/fuentes#F19)). |
| `spring.datasource.username` | `sa` | `${DB_USER}` | Usuario de conexión entregado al `DataSource` auto-configurado ([VMware/Broadcom, s. f.-u](/fuentes#F19)). |
| `spring.datasource.password` | *(vacía)* | `${DB_PASSWORD}` | Contraseña de acceso. En producción se inyecta desde una variable de entorno para no exponer secretos en Git. |
| `spring.jpa.show-sql` | `true` | `false` | Imprime en la salida estándar las sentencias SQL generadas por Hibernate (útil en desarrollo; se apaga en producción). |
| `spring.jpa.hibernate.ddl-auto` | `create-drop` | `validate` | Controla qué hace Hibernate con el esquema al arrancar: en memoria crea y destruye las tablas (`create-drop`); en producción solo verifica que las tablas coincidan con las `@Entity` (`validate`) sin borrar datos ([VMware/Broadcom, s. f.-u](/fuentes#F19)). |
| `spring.jpa.open-in-view` | `false` | `false` | Desactiva `OpenEntityManagerInViewInterceptor` para que la sesión JPA se cierre al salir de `@Service` y no retenga conexiones de HikariCP durante la serialización JSON ([VMware/Broadcom, s. f.-u](/fuentes#F19)). |

#### Cómo funcionan los perfiles (`application-dev.properties` y `application-prod.properties`)

Los perfiles permiten que el mismo artefacto `.jar` adapte su infraestructura según el entorno donde se ejecuta:
- **`application.properties` (base):** contiene las directivas comunes a toda la clínica (`spring.application.name=reserva-medica`, `spring.jpa.open-in-view=false`) y fija el perfil por defecto para desarrollo local (`spring.profiles.active=dev`).
- **`application-dev.properties` (desarrollo):** configura la base en memoria `H2` (`jdbc:h2:mem:reservamedica`), activa la consola `/h2-console`, muestra el SQL por pantalla (`show-sql=true`) y recrea el esquema en cada inicio (`ddl-auto=create-drop`) ([VMware/Broadcom, s. f.-u](/fuentes#F19)).
- **`application-prod.properties` (producción):** conecta con `PostgreSQL` leyendo credenciales desde variables de entorno (`${DB_URL}`, `${DB_USER}`, `${DB_PASSWORD}`), desactiva la impresión de SQL por consola y exige `ddl-auto=validate` para proteger las citas históricas registradas.

---

### 3. Caso real: qué ocurre si falta una variable de entorno en producción

Al levantar el backend real del caso con el perfil `prod` activo, pero sin definir en el sistema `DB_URL`, `DB_USER` ni `DB_PASSWORD`, se comprobó algo que no es evidente a primera vista: Spring Boot **no** detiene el arranque en el momento en que carga `application-prod.properties`. El marcador `${DB_PASSWORD}` que no logra resolverse no queda "vacío" ni genera un error inmediato; sigue viajando como el texto literal `"${DB_PASSWORD}"` a través de la cadena de configuración hasta que algún componente más abajo lo rechaza por su cuenta (hallazgo A12, anotado en el registro de verificación del proyecto, 01-nov-2026).

En la prueba realizada, quien terminó rechazando ese valor fue el *pool* de conexiones **HikariCP**, al intentar pasarle la URL literal `${DB_URL}` al controlador JDBC de PostgreSQL: el error que arroja no habla de "falta una variable de entorno", sino de un driver que "claims to not accept jdbcUrl". El resultado práctico sigue siendo el esperado para el caso: el servidor no arranca sin credenciales reales y nunca cae de vuelta a un valor por defecto. Pero el mecanismo exacto es la lección de fondo: la sustitución de `${...}` en los `.properties` no tiene una validación temprana propia que garantice que todos los *placeholders* quedaron resueltos antes de entregarse a los *beans* que los usan; el chequeo ocurre más abajo, en el componente que efectivamente intenta usar ese valor (hallazgo A12 del registro de verificación del proyecto, 01-nov-2026).

---

### 4. Lectura paso a paso de las figuras de este tema

- **Lectura de la Figura D14 (Mapa conceptual de la anatomía del `pom.xml`):** responde a la pregunta de foco *¿Cómo gestiona un proyecto Spring Boot sus librerías y su empaquetado sin conflictos de versiones?*. Parte del nodo central `pom.xml`, que **hereda de** `spring-boot-starter-parent` (`4.1.2`), el cual **importa** el BOM `spring-boot-dependencies` que **gobierna versiones de** Tomcat 11, Hibernate 7.1 y Jackson 3 ([Spring Boot Team, 2025a](/fuentes#F27); [Spring Boot Team, 2025b](/fuentes#F28)). A la vez, el `pom.xml` **declara** los *starters* (`webmvc`, `data-jpa`, `validation`, `actuator`) con alcance `compile`, **aísla en runtime** los conectores `h2` y `postgresql`, y **empaqueta con** `spring-boot-maven-plugin` el JAR ejecutable autónomo.
- **Lectura de la Figura D16 (Comparación de perfiles `dev` vs. `prod`):** contrasta lado a lado cómo un mismo código fuente conmuta cinco dimensiones críticas al cambiar `spring.profiles.active`: (1) motor de datos (`H2` en memoria frente a `PostgreSQL` persistente), (2) ciclo del esquema (`create-drop` frente a `validate`), (3) origen de credenciales (valores locales de prueba frente a variables de entorno `${DB_PASSWORD}`), (4) trazas SQL en consola (`show-sql=true` frente a `false`) y (5) herramientas de inspección (`/h2-console` habilitada solo en desarrollo) ([VMware/Broadcom, s. f.-u](/fuentes#F19)).
