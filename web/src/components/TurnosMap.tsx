import React from 'react';
import { useProgreso, isNivelCompletado } from '../store/progreso';

export const TURNOS_DATA = [
  {
    n: 1,
    titulo: 'El motor oculto',
    subtitulo: 'Starters, contenedor IoC, autoconfiguración y Tomcat embebido',
    criterio: 'Criterio 1: comprensión (20 pts)',
    tema: 'IoC & Starters',
    colorCapa: 'var(--dispatcher)',
    xp: 10,
    href: '/nivel/1',
  },
  {
    n: 2,
    titulo: 'Sigue a la petición',
    subtitulo: 'De DispatcherServlet a la base de datos y vuelta como HTTP 201',
    criterio: 'Criterio 1: comprensión (20 pts)',
    tema: 'MVC & 5 Capas',
    colorCapa: 'var(--controller)',
    xp: 25,
    href: '/nivel/2',
  },
  {
    n: 3,
    titulo: 'La sala de máquinas',
    subtitulo: 'pom.xml, perfiles dev/prod, YAML vs Properties y seguridad',
    criterio: 'Criterio 2: aplicación práctica (30 pts)',
    tema: 'Maven & Perfiles',
    colorCapa: 'var(--cliente)',
    xp: 25,
    href: '/nivel/3',
  },
  {
    n: 4,
    titulo: 'El código por dentro',
    subtitulo: 'Anotaciones por capa, cinco clases de dominio y SQL Hibernate real',
    criterio: 'Criterio 2: aplicación práctica (30 pts)',
    tema: 'Anotaciones & JPA',
    colorCapa: 'var(--repo)',
    xp: 25,
    href: '/nivel/4',
  },
  {
    n: 5,
    titulo: 'Buenas prácticas y errores reales',
    subtitulo: 'Records DTO, ProblemDetail RFC 9457 y prevención de fugas de datos',
    criterio: 'Criterio 3: análisis y argumentación (30 pts)',
    tema: 'Buenas Prácticas',
    colorCapa: 'var(--service)',
    xp: 10,
    href: '/nivel/5',
  },
  {
    n: 6,
    titulo: 'El radar 2026',
    subtitulo: 'Spring Boot 4.1, Java 21 Virtual Threads, Actuator y rol del ingeniero',
    criterio: 'Criterio 3: análisis y argumentación (30 pts)',
    tema: 'Tendencias & IA',
    colorCapa: 'var(--purple)',
    xp: 10,
    href: '/nivel/6',
  },
];

export const FASES_TURNOS = [
  {
    faseId: 'fase-1',
    tituloFase: 'Fase 1 · Comprensión de la arquitectura y flujo HTTP',
    turnos: [TURNOS_DATA[0], TURNOS_DATA[1]],
  },
  {
    faseId: 'fase-2',
    tituloFase: 'Fase 2 · Configuración de proyectos y código real en capas',
    turnos: [TURNOS_DATA[2], TURNOS_DATA[3]],
  },
  {
    faseId: 'fase-3',
    tituloFase: 'Fase 3 · Buenas prácticas de diseño, errores y tendencias 2026',
    turnos: [TURNOS_DATA[4], TURNOS_DATA[5]],
  },
];

export default function TurnosMap() {
  const { state } = useProgreso();

  return (
    <div className="fases-turnos-container" id="trilha">
      {FASES_TURNOS.map((fase) => (
        <section key={fase.faseId} className="fase-bloque" style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', margin: '0 0 12px', color: 'var(--ink)' }}>
            {fase.tituloFase}
          </h3>
          <ol className="turnos" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {fase.turnos.map((t) => {
              const completado = isNivelCompletado(t.n, state);
              return (
                <li key={t.n}>
                  <a
                    className={`turno ${completado ? 'done' : ''}`}
                    href={t.href}
                    style={{ '--turno-accent': t.colorCapa } as React.CSSProperties}
                  >
                    <div className="turno-top-row">
                      <span className="n">0{t.n}</span>
                      <div className="turno-badges">
                        <span className="turno-tema-pill">{t.tema}</span>
                      </div>
                    </div>

                    <b>{t.titulo}</b>
                    <span className="turno-desc">{t.subtitulo}</span>

                    {completado && (
                      <span className="st">
                        <span className="st-completado">
                          <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Completado
                        </span>
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
