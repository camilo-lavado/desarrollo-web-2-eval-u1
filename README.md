# Evaluación Unidad 1: Spring Boot por dentro (caso Reserva de Horas Médicas)

Asignatura: Desarrollo de Software Web II · IP San Sebastián
Autor: Camilo Lavado

Este repositorio tiene las dos partes del trabajo:

| Carpeta | Qué es |
|---|---|
| [`backend/`](backend/) | Proyecto Spring Boot 4.1.2 (Java 21, Maven) del caso **Reserva de Horas Médicas**. Es el código real que se explica en el trabajo. |
| [`web/`](web/) | Sitio web (Astro + React) que explica cómo funciona Spring Boot, con el código y las salidas reales del backend. |
| `scripts/` | Dos scripts que usa el sitio al compilarse (render de diagramas y verificación de citas). |

**Sitio publicado:** https://mision-spring-u1.vercel.app

## Backend (`backend/`)

Requisitos: Java 21 o superior. No hace falta instalar Maven (se usa el *wrapper* `mvnw`).

```bash
cd backend
./mvnw test                      # 6 pruebas automáticas
./mvnw spring-boot:run           # perfil dev, base H2 en memoria, puerto 8080
```

En Windows: `mvnw.cmd test` y `mvnw.cmd spring-boot:run`.

Rutas principales (perfil `dev`):

| Método y ruta | Qué hace |
|---|---|
| `POST /api/v1/citas` | Agenda una cita. Responde 201, o un error 400, 404, 409 o 422 en formato `ProblemDetail`. |
| `GET /api/v1/citas/{id}` | Consulta una cita. |
| `GET /api/v1/medicos` | Lista médicos (acepta `?especialidad=`). |
| `GET /medicos` | Vista HTML con la lista de médicos (Thymeleaf). |
| `GET /actuator/health` | Estado de salud del sistema. |
| `/h2-console` | Consola de la base H2 (solo en `dev`). |

Ejemplo:

```bash
curl -i -X POST http://localhost:8080/api/v1/citas \
  -H 'Content-Type: application/json' \
  -d '{"pacienteId":1,"medicoId":1,"fechaHora":"2026-11-02T09:30:00","motivo":"Control"}'
```

Perfiles:

- `dev` (por defecto): H2 en memoria, SQL visible, consola H2 activa.
- `prod`: PostgreSQL con las variables de entorno `DB_URL`, `DB_USER` y `DB_PASSWORD` (ver `backend/.env.example`; no hay claves reales en el repositorio).

## Sitio web (`web/`)

Requisitos: Node.js 20 o superior.

```bash
cd web
npm install
npm run dev        # desarrollo
npm run build      # compila en web/dist
npm run verificar  # comprueba que los bloques de código y salidas del sitio coinciden con los archivos reales
```

Las salidas reales del backend (arranque, informe de condiciones, SQL, respuestas HTTP, pruebas) están en `web/src/data/evidencia/`, y las clases Java que muestra el sitio en `web/src/data/codigo/`. El script `backend/scripts/capturar-evidencia.sh` sirve para volver a capturarlas con el backend corriendo.
