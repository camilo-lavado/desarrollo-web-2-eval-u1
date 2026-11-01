# Índice de evidencia real — backend `reserva-medica`

Todo lo de esta carpeta proviene de ejecutar el backend real (Spring Boot 4.1.2, perfil `dev`, H2 en memoria) el **1 de noviembre de 2026, entre las 15:18 y las 15:21** (hora de Chile), salvo `arranque.log`, regenerado el mismo día a las **15:59** en un arranque aparte. Nada fue escrito a mano; donde se recortó un log muy largo, se indica con `sed`/`grep` sobre el archivo fuente real.

| Archivo | Contenido | Cómo se generó |
|---|---|---|
| `arranque-completo.log` | Log completo de arranque en `dev` con `--debug` (15:18) | `./mvnw spring-boot:run -Dspring-boot.run.arguments=--debug > arranque-completo.log 2>&1` |
| `arranque.log` | Extracto: perfil activo, HikariCP, consola H2, Tomcat, arranque completo (regenerado a las 15:59, arranque nuevo e independiente) | `grep -E "^20[0-9]{2}-.*(Tomcat started\|profile is active\|No active profile\|Started ReservaMedica\|HikariPool\|H2 console)" <log de arranque>`. El patrón anterior (sin anclar `^20[0-9]{2}-`) hacía falso positivo con una línea del informe de condiciones que contiene la subcadena `HikariPool` (`DataSourcePoolMetadataProvidersConfiguration.HikariPoolDataSourceMetadataProviderConfiguration`); se corrigió también en `backend/scripts/capturar-evidencia.sh`. |
| `condiciones.txt` | Informe `--debug` de evaluación de condiciones (primeras 300 líneas) | `awk '/CONDITIONS EVALUATION REPORT/{f=1} f{print}' arranque-completo.log \| head -300` |
| `dependency-tree.txt` | Árbol de dependencias real, filtrado a los starters del caso | `./mvnw dependency:tree` (Boot 4.1.2), filtrado por starter/tomcat-embed/hibernate-core/HikariCP/jackson/h2/postgresql/validator |
| `mappings.txt` | Rutas HTTP reales mapeadas por el *dispatcher servlet* | `GET /actuator/mappings` con la app corriendo, reformateado a una línea por ruta |
| `http-201.txt` | `POST /api/v1/citas` válido → `201 Created` + `Location` | `curl -i -X POST .../api/v1/citas` con fecha futura válida |
| `http-409.txt` | Mismo médico/bloque ya agendado → `409 Conflict` (RN-04) | Mismo `curl` repetido sobre el bloque recién ocupado |
| `http-400.txt` | Fecha pasada → `400 Bad Request` con `errores[].campo="fechaHora"` | `curl -i -X POST .../api/v1/citas` con fecha en 2020 |
| `http-404.txt` | `medicoId` inexistente → `404 Not Found` (RN-01) | `curl -i -X POST .../api/v1/citas` con `medicoId:999` |
| `http-422.txt` | Fecha en domingo → `422 Unprocessable Entity` (RN-03) | `curl -i -X POST .../api/v1/citas` con fecha de domingo futuro |
| `http-200-cita.txt` | `GET /api/v1/citas/{id}` de la cita creada en el 201 | `curl -i GET .../api/v1/citas/<id tomado de Location>` |
| `http-200-medicos.txt` | `GET /api/v1/medicos` sin filtro | `curl -i GET .../api/v1/medicos` |
| `http-200-medicos-filtro.txt` | `GET /api/v1/medicos?especialidad=...` con filtro real | `curl -i GET` con la especialidad del primer médico devuelto arriba |
| `sql-insert.txt` | SQL real de Hibernate al agendar (`INSERT INTO citas`) | Extraído de `arranque-completo.log` (bloque `Hibernate:` del `POST` que dio 201) |
| `sql-exists.txt` | SQL real de la comprobación RN-04 (`existsByMedicoIdAndFechaHoraAndEstado`) | Extraído de `arranque-completo.log` (bloque `Hibernate:` justo antes del insert) |
| `actuator-health.json` | Respuesta real de `/actuator/health` | `curl .../actuator/health` |
| `junit-resumen.txt` | Resumen real de `./mvnw test` (6 pruebas, 0 fallos) | `./mvnw test` |
| `arranque-prod-sin-env.log` | Arranque fallido en perfil `prod` sin `DB_URL`/`DB_USER`/`DB_PASSWORD` (respalda A12) | `./mvnw spring-boot:run -Dspring-boot.run.profiles=prod` sin esas variables |

Las rutas locales de `arranque-completo.log`, `actuator-health.json` y `arranque-prod-sin-env.log` se anonimizaron reemplazando los segmentos de ruta del computador (`C:\Users\...`) por `<ruta local omitida>`; el resto del contenido es literal.

## Cómo reproducirlo

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.arguments=--debug > ../web/src/data/evidencia/arranque-completo.log 2>&1 &
bash scripts/capturar-evidencia.sh
```
