import React, { useState } from 'react';
import cfgData from '../data/config.json';

import appBaseRaw from '../data/codigo/application.properties?raw';
import appDevRaw from '../data/codigo/application-dev.properties?raw';
import appProdRaw from '../data/codigo/application-prod.properties?raw';
import depTreeRaw from '../data/evidencia/dependency-tree.txt?raw';

type Perfil = 'dev' | 'prod';
type Formato = 'props' | 'yml';
type DdlAuto = 'create' | 'update' | 'validate';

export default function LabConfig() {
  const [perfil, setPerfil] = useState<Perfil>('dev');
  const [fmt, setFmt] = useState<Formato>('props');
  const [ddl, setDdl] = useState<DdlAuto>('validate');
  const [pwdHardcoded, setPwdHardcoded] = useState(false);
  const [vistos, setVistos] = useState<Record<string, boolean>>({ dev: true });
  const [depSel, setDepSel] = useState<string>(cfgData.dependenciasPom[0].id);

  const cambiarPerfil = (nuevo: Perfil) => {
    setPerfil(nuevo);
    setVistos({ ...vistos, [nuevo]: true });
  };

  const valorEfectivo = (clave: string, baseDev: string, baseProd: string) => {
    let v = perfil === 'dev' ? baseDev : baseProd;
    if (perfil === 'prod') {
      if (clave === 'spring.jpa.hibernate.ddl-auto') v = ddl;
      if (clave === 'spring.datasource.password' && pwdHardcoded) v = 'Cl4ve-Real-Hospital-123';
    }
    return v;
  };

  const pares = cfgData.propiedades.map((p) => ({
    ...p,
    actual: valorEfectivo(p.clave, p.dev, p.prod),
  }));

  const getVal = (clave: string) => pares.find((p) => p.clave === clave)?.actual ?? '';

  const prodModificado =
    appProdRaw
      .trim()
      .replace(
        'spring.jpa.hibernate.ddl-auto=validate',
        `spring.jpa.hibernate.ddl-auto=${ddl}`
      )
      .replace(
        'spring.datasource.password=${DB_PASSWORD}',
        `spring.datasource.password=${pwdHardcoded ? 'Cl4ve-Real-Hospital-123' : '${DB_PASSWORD}'}`
      );

  const textoArchivo =
    fmt === 'props'
      ? `# --- web/src/data/codigo/application.properties ---\n${appBaseRaw.trim()}\n\n` +
        `# --- web/src/data/codigo/application-${perfil}.properties ---\n` +
        (perfil === 'dev' ? appDevRaw.trim() : prodModificado)
      : `# Equivalente jerárquico en YAML de application.properties + application-${perfil}.properties\n` +
        `spring:\n` +
        `  application:\n` +
        `    name: ${getVal('spring.application.name')}\n` +
        `  profiles:\n` +
        `    active: ${getVal('spring.profiles.active')}\n` +
        `  datasource:\n` +
        `    url: ${getVal('spring.datasource.url')}\n` +
        `    driver-class-name: ${getVal('spring.datasource.driver-class-name')}\n` +
        `    username: ${getVal('spring.datasource.username')}\n` +
        `    password: ${getVal('spring.datasource.password') === '(vacía)' ? "''" : getVal('spring.datasource.password')}\n` +
        `  h2:\n` +
        `    console:\n` +
        `      enabled: ${getVal('spring.h2.console.enabled')}\n` +
        `  jpa:\n` +
        `    open-in-view: ${getVal('spring.jpa.open-in-view')}\n` +
        `    show-sql: ${getVal('spring.jpa.show-sql')}\n` +
        `    hibernate:\n` +
        `      ddl-auto: ${getVal('spring.jpa.hibernate.ddl-auto')}\n` +
        `  mvc:\n` +
        `    problemdetails:\n` +
        `      enabled: ${getVal('spring.mvc.problemdetails.enabled')}\n` +
        `server:\n` +
        `  error:\n` +
        `    include-stacktrace: ${getVal('server.error.include-stacktrace')}\n` +
        `management:\n` +
        `  endpoints:\n` +
        `    web:\n` +
        `      exposure:\n` +
        `        include: ${getVal('management.endpoints.web.exposure.include')}`;

  const depActual =
    cfgData.dependenciasPom.find((d) => d.id === depSel) || cfgData.dependenciasPom[0];

  return (
    <div>
      {/* Controles de perfil y formato */}
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row" style={{ margin: 0 }}>
          <div className="seg" role="group" aria-label="Seleccionar perfil de ejecución">
            <button
              type="button"
              aria-pressed={perfil === 'dev'}
              onClick={() => cambiarPerfil('dev')}
            >
              Perfil dev (H2)
            </button>
            <button
              type="button"
              aria-pressed={perfil === 'prod'}
              onClick={() => cambiarPerfil('prod')}
            >
              Perfil prod (PostgreSQL)
            </button>
          </div>

          <div className="seg" role="group" aria-label="Seleccionar formato de configuración">
            <button
              type="button"
              aria-pressed={fmt === 'props'}
              onClick={() => setFmt('props')}
            >
              .properties (real)
            </button>
            <button
              type="button"
              aria-pressed={fmt === 'yml'}
              onClick={() => setFmt('yml')}
            >
              .yml (equivalente)
            </button>
          </div>
        </div>
        <span className="pill" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          application*.properties
        </span>
      </div>

      {/* Visor del archivo */}
      <pre className="code-out" aria-label="Archivo de configuración resultante">
        {textoArchivo}
      </pre>

      {/* Experimento de errores en producción */}
      <div className="panel" style={{ marginTop: '14px' }}>
        <h3>Experimento: ¿qué pasa si configuramos mal producción?</h3>
        <p style={{ marginBottom: '8px' }}>
          1. Elige el valor de <code>spring.jpa.hibernate.ddl-auto</code> en <code>prod</code>:
        </p>
        <div className="seg" role="group" aria-label="Elegir valor de ddl-auto">
          {(['create', 'update', 'validate'] as DdlAuto[]).map((val) => (
            <button
              key={val}
              type="button"
              className={val !== 'validate' ? 'bad' : ''}
              aria-pressed={ddl === val}
              onClick={() => {
                cambiarPerfil('prod');
                setDdl(val);
              }}
            >
              {val}
            </button>
          ))}
        </div>
        <p
          className="fb"
          style={{
            color: perfil === 'prod' && ddl !== 'validate' ? 'var(--warn)' : 'var(--ok)',
            fontWeight: 500,
          }}
        >
          {perfil === 'prod'
            ? cfgData.feedbackDdl[ddl]
            : 'Al pulsar una opción se activa el perfil prod para observar su efecto.'}
        </p>

        <label
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            marginTop: '12px',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={pwdHardcoded}
            onChange={(e) => {
              cambiarPerfil('prod');
              setPwdHardcoded(e.target.checked);
            }}
          />
          2. Escribir la contraseña real directamente en el archivo en lugar de{' '}
          <code>{'${DB_PASSWORD}'}</code>
        </label>
        <p
          className="fb"
          style={{ color: pwdHardcoded ? 'var(--warn)' : 'var(--muted)' }}
        >
          {pwdHardcoded
            ? 'Riesgo crítico: esa contraseña quedaría guardada en el historial de commits de Git aunque la borres después. En cambio, con ${DB_URL} y ${DB_PASSWORD}, si faltan las variables de entorno al arrancar en prod, el driver PostgreSQL rechaza la URL literal "${DB_URL}" con RuntimeException y detiene el arranque.'
            : 'Seguro: las credenciales reales nunca se escriben en el repositorio; se leen desde variables de entorno (${DB_URL}, ${DB_USER}, ${DB_PASSWORD}).'}
        </p>
      </div>

      {/* Tabla comparativa línea por línea */}
      <div className="scroll" style={{ marginTop: '16px' }}>
        <table>
          <thead>
            <tr>
              <th>Propiedad</th>
              <th>Qué hace</th>
              <th>Valor en dev</th>
              <th>Valor en prod</th>
            </tr>
          </thead>
          <tbody>
            {pares.map((r) => (
              <tr key={r.clave}>
                <td>
                  <code>{r.clave}</code>
                </td>
                <td>{r.descripcion}</td>
                <td className={perfil === 'dev' ? 'd' : ''}>
                  <code>{r.dev}</code>
                </td>
                <td className={perfil === 'prod' ? 'd' : ''}>
                  <code>{perfil === 'prod' ? r.actual : r.prod}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explorador de pom.xml + árbol real de dependency-tree.txt */}
      <div className="panel" style={{ marginTop: '20px' }}>
        <div className="panel-head">
          <div>
            <span className="kicker">Árbol real de Maven · ./mvnw dependency:tree</span>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.05rem' }}>
              Explorador de <code>pom.xml</code> y versiones reales de Spring Boot 4.1.2
            </h3>
          </div>
          <span className="pill" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
            web/src/data/evidencia/dependency-tree.txt
          </span>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
          Selecciona cada dependencia del proyecto para inspeccionar las versiones exactas resueltas por el BOM de <code>spring-boot-starter-parent:4.1.2</code>:
        </p>
        <div className="chips" role="group" aria-label="Dependencias del pom.xml">
          {cfgData.dependenciasPom.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`an ${depSel === d.id ? 'sel' : ''}`}
              onClick={() => setDepSel(d.id)}
            >
              {d.artifactId}
            </button>
          ))}
        </div>

        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            padding: '12px 14px',
            marginTop: '10px',
          }}
          aria-live="polite"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <strong>
              <code>{depActual.artifactId}</code>
            </strong>
            <span className="tag">scope: {depActual.scope}</span>
          </div>
          <p style={{ margin: '8px 0 6px', fontSize: '0.9rem' }}>
            <strong>Qué resuelve:</strong> {depActual.resuelve}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: '0.9rem' }}>
            <strong>Librerías y versiones reales que trae:</strong> {depActual.trae}
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Qué activa en el arranque:</strong> {depActual.activa}
          </p>
        </div>

        <details open style={{ marginTop: '14px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
            Ver árbol completo de dependencias Maven (./mvnw dependency:tree)
          </summary>
          <pre className="code-out" style={{ marginTop: '8px' }}>
            {depTreeRaw.trim()}
          </pre>
        </details>
      </div>
    </div>
  );
}
