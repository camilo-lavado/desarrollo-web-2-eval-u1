import React, { useState } from 'react';

interface RamaDetalle {
  id: string;
  titulo: string;
  verbo: string;
  nivelHref: string;
  nivelLabel: string;
  resumen: string;
  nodosHijos: string[];
}

const RAMAS: RamaDetalle[] = [
  {
    id: 'ioc',
    titulo: 'IoC / DI',
    verbo: 'invierte el control con',
    nivelHref: '/nivel/1',
    nivelLabel: 'Tema 1 · El motor oculto',
    resumen:
      'El ApplicationContext instancia, configura y ensambla los beans mediante inyección por constructor, permitiendo contratos inmutables (final) y pruebas unitarias sin contenedor.',
    nodosHijos: ['ApplicationContext', 'Beans por constructor'],
  },
  {
    id: 'auto',
    titulo: 'Autoconfiguración',
    verbo: 'configura por defecto con',
    nivelHref: '/nivel/1',
    nivelLabel: 'Tema 1 · Autoconfiguración',
    resumen:
      'Los starters agrupan dependencias compatibles en el pom.xml y las condiciones @ConditionalOnClass / @ConditionalOnMissingBean registran infraestructura automática que cede el paso ante tus propios @Bean.',
    nodosHijos: ['Starters Maven', '@ConditionalOn...'],
  },
  {
    id: 'capas',
    titulo: 'Capas MVC',
    verbo: 'organiza peticiones en',
    nivelHref: '/nivel/2',
    nivelLabel: 'Temas 2 y 4 · Petición y Código',
    resumen:
      'Toda solicitud HTTP entra por Tomcat 11.0.27 y el DispatcherServlet, valida su contrato en @RestController, ejecuta reglas RN-01..RN-04 bajo @Transactional en @Service y persiste la entidad @Entity mediante @Repository.',
    nodosHijos: ['DispatcherServlet', 'Controller · Service · Repo'],
  },
  {
    id: 'cfg',
    titulo: 'Configuración',
    verbo: 'se adapta al entorno con',
    nivelHref: '/nivel/3',
    nivelLabel: 'Tema 3 · La sala de máquinas',
    resumen:
      'Un mismo artefacto separa el entorno dev (H2 en memoria, trazas SQL) del entorno prod (PostgreSQL, ddl-auto=validate y credenciales inyectadas por variables de entorno ${DB_PASSWORD}).',
    nodosHijos: ['application.properties', 'Perfiles dev / prod'],
  },
  {
    id: 'eco',
    titulo: 'Ecosistema 2026',
    verbo: 'evoluciona hacia',
    nivelHref: '/nivel/6',
    nivelLabel: 'Temas 5 y 6 · Buenas prácticas y Radar 2026',
    resumen:
      'Spring Boot 4.1.2 sobre Spring Framework 7.0.10 incorpora Java Records para DTOs inmutables, Hilos Virtuales de Java 21, ProblemDetail RFC 9457 y monitoreo con Spring Boot Actuator (/actuator/health).',
    nodosHijos: ['Spring Boot 4.1.2 + Java 21', 'Records · Virtual Threads · Actuator'],
  },
];

export default function MapaGlobal() {
  const [ramaActiva, setRamaActiva] = useState<string>('capas');

  const detalle = RAMAS.find((r) => r.id === ramaActiva) || RAMAS[2];

  return (
    <div>
      {/* Mapa conceptual global interactivo (SVG D00) */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 0 }}>
          <h3 style={{ margin: 0 }}>
            D00 · Mapa conceptual interactivo (haz clic o usa Tab/Enter en cada rama)
          </h3>
          <span className="tag">5 ramas · verbos en cada arista</span>
        </div>

        <div className="mapa" style={{ marginTop: '10px' }}>
          <svg
            viewBox="0 0 920 390"
            role="img"
            aria-label="Mapa conceptual de Spring Boot con cinco ramas: IoC y DI, Autoconfiguración, Capas MVC, Configuración y Ecosistema 2026"
          >
            {/* Aristas principales */}
            <line x1="460" y1="190" x2="170" y2="75" stroke="#475569" strokeWidth="1.5" />
            <line x1="460" y1="190" x2="750" y2="75" stroke="#475569" strokeWidth="1.5" />
            <line x1="460" y1="190" x2="150" y2="230" stroke="#475569" strokeWidth="1.5" />
            <line x1="460" y1="190" x2="770" y2="230" stroke="#475569" strokeWidth="1.5" />
            <line x1="460" y1="190" x2="460" y2="330" stroke="#475569" strokeWidth="1.5" />

            {/* Aristas secundarias */}
            <line x1="170" y1="75" x2="75" y2="25" stroke="#475569" strokeWidth="1.3" />
            <line x1="170" y1="75" x2="275" y2="25" stroke="#475569" strokeWidth="1.3" />
            <line x1="750" y1="75" x2="640" y2="25" stroke="#475569" strokeWidth="1.3" />
            <line x1="750" y1="75" x2="845" y2="25" stroke="#475569" strokeWidth="1.3" />
            <line x1="150" y1="230" x2="68" y2="315" stroke="#475569" strokeWidth="1.3" />
            <line x1="150" y1="230" x2="235" y2="315" stroke="#475569" strokeWidth="1.3" />
            <line x1="770" y1="230" x2="680" y2="315" stroke="#475569" strokeWidth="1.3" />
            <line x1="770" y1="230" x2="845" y2="315" stroke="#475569" strokeWidth="1.3" />

            {/* Verbos en aristas */}
            <text className="lb" x="305" y="125" fill="#16302B" stroke="#FFFFFF" strokeWidth="4">
              invierte el control con
            </text>
            <text className="lb" x="615" y="125" fill="#16302B" stroke="#FFFFFF" strokeWidth="4">
              configura por defecto con
            </text>
            <text className="lb" x="300" y="208" fill="#16302B" stroke="#FFFFFF" strokeWidth="4">
              organiza peticiones en
            </text>
            <text className="lb" x="620" y="208" fill="#16302B" stroke="#FFFFFF" strokeWidth="4">
              se adapta al entorno con
            </text>
            <text className="lb" x="460" y="272" fill="#16302B" stroke="#FFFFFF" strokeWidth="4">
              evoluciona hacia
            </text>

            {/* Nodo central */}
            <g className="nd centro" transform="translate(385,163)">
              <rect width="150" height="54" rx="8" fill="#FF6B00" stroke="#FF6B00" strokeWidth="2" />
              <text x="75" y="28" fill="#FFFFFF">
                Spring Boot 4.1
              </text>
            </g>

            {/* Rama 1: IoC / DI */}
            <g
              className={`nd rama ${ramaActiva === 'ioc' ? 'active-branch' : ''}`}
              transform="translate(105,52)"
              tabIndex={0}
              role="button"
              aria-label="Seleccionar rama IoC y DI"
              onClick={() => setRamaActiva('ioc')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setRamaActiva('ioc')}
            >
              <rect width="130" height="44" rx="6" fill="#FFF1E6" stroke="#FF6B00" strokeWidth="2.5" />
              <text x="65" y="22" fill="#16302B">
                IoC / DI (T1)
              </text>
            </g>
            <g className="nd" transform="translate(10,5)">
              <rect width="130" height="36" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <text x="65" y="18" fill="#16302B">
                ApplicationContext
              </text>
            </g>
            <g className="nd" transform="translate(210,5)">
              <rect width="135" height="36" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <text x="67" y="18" fill="#16302B">
                Beans por constructor
              </text>
            </g>

            {/* Rama 2: Autoconfiguración */}
            <g
              className={`nd rama ${ramaActiva === 'auto' ? 'active-branch' : ''}`}
              transform="translate(675,52)"
              tabIndex={0}
              role="button"
              aria-label="Seleccionar rama Autoconfiguración"
              onClick={() => setRamaActiva('auto')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setRamaActiva('auto')}
            >
              <rect width="155" height="44" rx="6" fill="#FFF1E6" stroke="#FF6B00" strokeWidth="2.5" />
              <text x="77" y="22" fill="#16302B">
                Autoconfiguración (T1)
              </text>
            </g>
            <g className="nd" transform="translate(575,5)">
              <rect width="130" height="36" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <text x="65" y="18" fill="#16302B">
                Starters Maven
              </text>
            </g>
            <g className="nd" transform="translate(775,5)">
              <rect width="135" height="36" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <text x="67" y="18" fill="#16302B">
                @ConditionalOn...
              </text>
            </g>

            {/* Rama 3: Capas MVC */}
            <g
              className={`nd rama ${ramaActiva === 'capas' ? 'active-branch' : ''}`}
              transform="translate(80,208)"
              tabIndex={0}
              role="button"
              aria-label="Seleccionar rama Capas MVC"
              onClick={() => setRamaActiva('capas')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setRamaActiva('capas')}
            >
              <rect width="145" height="44" rx="6" fill="#FFF1E6" stroke="#FF6B00" strokeWidth="2.5" />
              <text x="72" y="22" fill="#16302B">
                Capas MVC (T2·T4)
              </text>
            </g>
            <g className="nd" transform="translate(5,298)">
              <rect width="128" height="38" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <text x="64" y="19" fill="#16302B">
                DispatcherServlet
              </text>
            </g>
            <g className="nd" transform="translate(155,298)">
              <rect width="160" height="38" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <text x="80" y="19" fill="#16302B">
                Controller·Service·Repo
              </text>
            </g>

            {/* Rama 4: Configuración */}
            <g
              className={`nd rama ${ramaActiva === 'cfg' ? 'active-branch' : ''}`}
              transform="translate(698,208)"
              tabIndex={0}
              role="button"
              aria-label="Seleccionar rama Configuración"
              onClick={() => setRamaActiva('cfg')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setRamaActiva('cfg')}
            >
              <rect width="145" height="44" rx="6" fill="#FFF1E6" stroke="#FF6B00" strokeWidth="2.5" />
              <text x="72" y="22" fill="#16302B">
                Configuración (T3)
              </text>
            </g>
            <g className="nd" transform="translate(608,298)">
              <rect width="142" height="38" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <text x="71" y="19" fill="#16302B">
                application.properties
              </text>
            </g>
            <g className="nd" transform="translate(770,298)">
              <rect width="140" height="38" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <text x="70" y="19" fill="#16302B">
                Perfiles dev / prod
              </text>
            </g>

            {/* Rama 5: Ecosistema 2026 */}
            <g
              className={`nd rama ${ramaActiva === 'eco' ? 'active-branch' : ''}`}
              transform="translate(335,322)"
              tabIndex={0}
              role="button"
              aria-label="Seleccionar rama Ecosistema 2026"
              onClick={() => setRamaActiva('eco')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setRamaActiva('eco')}
            >
              <rect width="250" height="48" rx="6" fill="#FFF1E6" stroke="#FF6B00" strokeWidth="2.5" />
              <text x="125" y="24" fill="#16302B">
                Ecosistema 2026 (T5·T6)
              </text>
            </g>
          </svg>
        </div>

        {/* Selector accesible en botones + tarjeta de detalle de la rama activa */}
        <div
          style={{
            marginTop: '14px',
            padding: '14px 16px',
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-card)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
          aria-live="polite"
        >
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <div className="row" style={{ margin: '0 0 6px' }}>
              <span className="tag">
                Spring Boot <em>{detalle.verbo}</em> <strong>{detalle.titulo}</strong>
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--muted)' }}>
                {detalle.nodosHijos.join(' · ')}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', maxWidth: 'none' }}>{detalle.resumen}</p>
          </div>
          <a href={detalle.nivelHref} className="btn">
            Ir a {detalle.nivelLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
