import React, { useState, useEffect, useRef } from 'react';
import simData from '../data/simulador.json';

import http201Raw from '../data/evidencia/http-201.txt?raw';
import http400Raw from '../data/evidencia/http-400.txt?raw';
import http404Raw from '../data/evidencia/http-404.txt?raw';
import http409Raw from '../data/evidencia/http-409.txt?raw';
import http422Raw from '../data/evidencia/http-422.txt?raw';

type CodigoEscenario = '201' | '400' | '404' | '409' | '422';

const SALIDAS_REALES: Record<CodigoEscenario, string> = {
  '201': http201Raw.trim(),
  '400': http400Raw.trim(),
  '404': http404Raw.trim(),
  '409': http409Raw.trim(),
  '422': http422Raw.trim(),
};

export default function Simulador() {
  const [esc, setEsc] = useState<CodigoEscenario>('201');
  const [idx, setIdx] = useState(0);
  const [respuestaDiseno, setRespuestaDiseno] = useState<number | null>(null);
  const [pktPos, setPktPos] = useState<{ left: string; top: string }>({ left: '10%', top: '' });

  const pipeRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);

  const escenarioActual = simData.escenarios[esc];
  const pasos = escenarioActual.pasos;
  const pasoActual = pasos[idx] || pasos[0];

  const updatePacketPosition = (capaIndex: number) => {
    const pipeEl = pipeRef.current;
    const nodeEl = nodeRefs.current[capaIndex];
    if (!pipeEl || !nodeEl) return;
    const isSingleCol = window.getComputedStyle(pipeEl).gridTemplateColumns.split(' ').length === 1;
    const left = `${nodeEl.offsetLeft + nodeEl.offsetWidth / 2}px`;
    const top = isSingleCol ? `${nodeEl.offsetTop + nodeEl.offsetHeight / 2 - 14}px` : '';
    setPktPos({ left, top });
  };

  useEffect(() => {
    updatePacketPosition(pasoActual.capa);
    const onResize = () => updatePacketPosition(pasoActual.capa);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pasoActual.capa, esc, idx]);

  const cambiarEscenario = (nuevo: CodigoEscenario) => {
    setEsc(nuevo);
    setIdx(0);
  };

  const irAnterior = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  const irSiguiente = () => {
    if (idx < pasos.length - 1) setIdx(idx + 1);
  };

  const reiniciar = () => {
    setIdx(0);
  };

  const responderPreguntaDiseno = (opcionIdx: number) => {
    setRespuestaDiseno(opcionIdx);
  };

  const dirClass =
    pasoActual.direccion === 'ida'
      ? 'ida'
      : pasoActual.direccion === 'vuelta'
        ? 'vuelta'
        : 'error';

  const salidaReal = SALIDAS_REALES[esc];

  return (
    <div>
      {/* Tubería de las 5 capas */}
      <div
        className="pipe"
        ref={pipeRef}
        aria-label="Simulador del recorrido de la petición por las 5 capas"
      >
        {simData.capas.map((c, i) => (
          <div
            key={c.id}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            className={`node ${pasoActual.capa === i ? 'on' : ''} ${
              pasoActual.modo === 'bad' && pasoActual.capa === i ? 'err' : ''
            }`}
            style={{ '--c': c.color } as React.CSSProperties}
          >
            <h4>{c.titulo}</h4>
            <small>{c.subtitulo}</small>
            <em>{c.clase}</em>
          </div>
        ))}
        <div
          className={`pkt ${
            pasoActual.modo === 'back' ? 'back' : pasoActual.modo === 'bad' ? 'bad' : ''
          }`}
          style={{ left: pktPos.left, top: pktPos.top || undefined }}
        >
          {pasoActual.etiquetaPaquete}
        </div>
      </div>

      {/* Selector de escenarios */}
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '14px' }}>
        <div className="seg" role="group" aria-label="Elegir escenario HTTP">
          {(['201', '400', '404', '409', '422'] as CodigoEscenario[]).map((k) => {
            const item = simData.escenarios[k];
            return (
              <button
                key={k}
                type="button"
                className={item.esError ? 'bad' : ''}
                aria-pressed={esc === k}
                onClick={() => cambiarEscenario(k)}
              >
                {item.etiqueta}
              </button>
            );
          })}
        </div>
        <span className="contador">
          Paso {idx + 1} de {pasos.length}
        </span>
      </div>

      {/* Caja del paso actual */}
      <div className="panel step" aria-live="polite">
        <span className={`dir ${dirClass}`}>
          {dirClass === 'error' ? 'camino de error' : dirClass}
        </span>
        <h3>{pasoActual.titulo}</h3>
        <p>{pasoActual.explicacion}</p>

        <div className="io">
          <div>
            <b>Entra a la capa</b>
            {pasoActual.entra}
          </div>
          <div>
            <b>Sale de la capa</b>
            {pasoActual.sale}
          </div>
        </div>

        {/* Pregunta de diseño en el servicio */}
        {pasoActual.mostrarPregunta && (
          <div className="pregunta">
            <p>{simData.preguntaDiseno.enunciado}</p>
            <div className="opts">
              {simData.preguntaDiseno.opciones.map((op, k) => {
                const seleccionada = respuestaDiseno === k;
                const esCorrecta = k === simData.preguntaDiseno.correcta;
                const claseEstado = seleccionada ? (esCorrecta ? 'ok' : 'no') : '';
                return (
                  <button
                    key={k}
                    type="button"
                    className={`opt ${claseEstado}`}
                    onClick={() => responderPreguntaDiseno(k)}
                  >
                    {op}
                  </button>
                );
              })}
            </div>
            {respuestaDiseno !== null && (
              <p className="fb" role="status">
                {respuestaDiseno === simData.preguntaDiseno.correcta
                  ? simData.preguntaDiseno.feedbackOk
                  : simData.preguntaDiseno.feedbackError}
              </p>
            )}
          </div>
        )}

        {/* Comando y respuesta HTTP real capturada */}
        <div style={{ marginTop: '14px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '6px',
            }}
          >
            <span className="kicker">
              web/src/data/evidencia/http-{esc}.txt
            </span>
            <span className="pill" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
              Respuesta real capturada el 1-nov-2026
            </span>
          </div>
          <pre className="code-out" aria-label={`Comando y respuesta HTTP ${esc} real`}>
            {salidaReal}
          </pre>
        </div>
      </div>

      {/* Botones de avance */}
      <div className="row" style={{ marginTop: '12px' }}>
        <button type="button" className="btn sec" onClick={irAnterior} disabled={idx === 0}>
          Paso anterior
        </button>
        <button
          type="button"
          className="btn"
          onClick={irSiguiente}
          disabled={idx === pasos.length - 1}
        >
          Siguiente paso
        </button>
        <button type="button" className="btn sec" onClick={reiniciar}>
          Reiniciar escenario
        </button>
      </div>
    </div>
  );
}
