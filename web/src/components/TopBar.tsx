import React, { useState, useEffect } from 'react';
import { useProgreso } from '../store/progreso';

interface TopBarProps {
  currentPath?: string;
}

export default function TopBar({ currentPath = '/' }: TopBarProps) {
  const { state, toggleTema } = useProgreso();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cerrar menú al presionar Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header className="top">
      <div className="wrap top-wrap">
        <a className="brand" href="/" aria-label="Ir a la portada">
          <b></b>
          <span>Spring Boot · Reserva Médica</span>
        </a>

        {/* Navegación Desktop agrupada por Fases de la pauta */}
        <nav className="nav-links desktop-only" aria-label="Navegación principal">
          <a className="nav-link" href="/" aria-current={currentPath === '/' ? 'page' : undefined}>
            Inicio
          </a>
          <a
            className="nav-link"
            href="/nivel/1"
            aria-current={currentPath.startsWith('/nivel/1') || currentPath.startsWith('/nivel/2') ? 'page' : undefined}
            title="Fase 1: Arquitectura y flujo HTTP (Temas 1 y 2)"
          >
            Fase 1
          </a>
          <a
            className="nav-link"
            href="/nivel/3"
            aria-current={currentPath.startsWith('/nivel/3') || currentPath.startsWith('/nivel/4') ? 'page' : undefined}
            title="Fase 2: Configuración y código en capas (Temas 3 y 4)"
          >
            Fase 2
          </a>
          <a
            className="nav-link"
            href="/nivel/5"
            aria-current={currentPath.startsWith('/nivel/5') || currentPath.startsWith('/nivel/6') ? 'page' : undefined}
            title="Fase 3: Buenas prácticas y radar 2026 (Temas 5 y 6)"
          >
            Fase 3
          </a>
          <a
            className="nav-link"
            href="/cierre"
            aria-current={currentPath.startsWith('/cierre') ? 'page' : undefined}
            title="Conclusiones y aprendizajes principales"
          >
            Conclusiones
          </a>
          <a
            className="nav-link"
            href="/glosario"
            aria-current={currentPath.startsWith('/glosario') ? 'page' : undefined}
            title="Glosario técnico con 10 términos clave"
          >
            Glosario
          </a>
          <a
            className="nav-link"
            href="/fuentes"
            aria-current={currentPath.startsWith('/fuentes') ? 'page' : undefined}
            title="Bibliografía APA 7.ª edición"
          >
            Bibliografía
          </a>
        </nav>

        {/* Acciones Rápidas (Tema claro / oscuro) */}
        <div className="tools">
          <button
            type="button"
            className="chip chip-icon"
            onClick={toggleTema}
            aria-label={state.tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={state.tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {state.tema === 'dark' ? (
              <svg
                className="ico"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                className="ico"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Botón Hamburguesa Mobile */}
          <button
            type="button"
            className="chip chip-icon mobile-only"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <svg
              className="ico"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {menuAbierto ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menú Desplegable Lateral para Móviles */}
      {menuAbierto && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMenuAbierto(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          <div className="mobile-drawer-card" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <span className="brand-mini">Spring Boot · Reserva Médica</span>
              <button
                type="button"
                className="btn-icon-close"
                onClick={() => setMenuAbierto(false)}
                aria-label="Cerrar menú"
              >
                ✕
              </button>
            </div>

            <nav className="mobile-nav-list">
              <a
                href="/"
                className={`mobile-nav-item ${currentPath === '/' ? 'active' : ''}`}
                onClick={() => setMenuAbierto(false)}
              >
                <div className="mobile-nav-num">✦</div>
                <div className="mobile-nav-content">
                  <strong>Inicio</strong>
                  <small>Introducción y tubería de la petición</small>
                </div>
              </a>

              <a
                href="/nivel/1"
                className={`mobile-nav-item ${currentPath.startsWith('/nivel/1') || currentPath.startsWith('/nivel/2') ? 'active' : ''}`}
                onClick={() => setMenuAbierto(false)}
              >
                <div className="mobile-nav-num">F1</div>
                <div className="mobile-nav-content">
                  <strong>Fase 1 · Arquitectura y flujo HTTP</strong>
                  <small>Temas 1 y 2: Autoconfiguración y Dispatcher</small>
                </div>
              </a>

              <a
                href="/nivel/3"
                className={`mobile-nav-item ${currentPath.startsWith('/nivel/3') || currentPath.startsWith('/nivel/4') ? 'active' : ''}`}
                onClick={() => setMenuAbierto(false)}
              >
                <div className="mobile-nav-num">F2</div>
                <div className="mobile-nav-content">
                  <strong>Fase 2 · Configuración y código en capas</strong>
                  <small>Temas 3 y 4: Perfiles y clases de dominio</small>
                </div>
              </a>

              <a
                href="/nivel/5"
                className={`mobile-nav-item ${currentPath.startsWith('/nivel/5') || currentPath.startsWith('/nivel/6') ? 'active' : ''}`}
                onClick={() => setMenuAbierto(false)}
              >
                <div className="mobile-nav-num">F3</div>
                <div className="mobile-nav-content">
                  <strong>Fase 3 · Buenas prácticas y radar 2026</strong>
                  <small>Temas 5 y 6: DTOs, ProblemDetail y Radar</small>
                </div>
              </a>

              <a
                href="/cierre"
                className={`mobile-nav-item ${currentPath.startsWith('/cierre') ? 'active' : ''}`}
                onClick={() => setMenuAbierto(false)}
              >
                <div className="mobile-nav-num">✦</div>
                <div className="mobile-nav-content">
                  <strong>Conclusiones</strong>
                  <small>Organizador gráfico y aprendizajes principales</small>
                </div>
              </a>

              <a
                href="/glosario"
                className={`mobile-nav-item ${currentPath.startsWith('/glosario') ? 'active' : ''}`}
                onClick={() => setMenuAbierto(false)}
              >
                <div className="mobile-nav-num">📖</div>
                <div className="mobile-nav-content">
                  <strong>Glosario</strong>
                  <small>10 conceptos esenciales con ejemplos del proyecto</small>
                </div>
              </a>

              <a
                href="/fuentes"
                className={`mobile-nav-item ${currentPath.startsWith('/fuentes') ? 'active' : ''}`}
                onClick={() => setMenuAbierto(false)}
              >
                <div className="mobile-nav-num">📚</div>
                <div className="mobile-nav-content">
                  <strong>Bibliografía</strong>
                  <small>15 fuentes oficiales en formato APA 7.ª edición</small>
                </div>
              </a>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
