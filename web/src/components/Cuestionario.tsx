import React, { useState } from 'react';

export interface PreguntaItem {
  id: string;
  enunciado?: string;
  pregunta?: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
  fuente?: string;
  fuenteId?: string;
}

interface Props {
  nivel: number;
  titulo?: string;
  preguntas: PreguntaItem[];
}

export default function Cuestionario({ nivel, titulo, preguntas }: Props) {
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});

  const seleccionar = (preguntaId: string, idx: number) => {
    const nuevas = { ...respuestas, [preguntaId]: idx };
    setRespuestas(nuevas);
  };

  const aciertos = preguntas.filter((p) => respuestas[p.id] === p.correcta).length;
  const respondidas = Object.keys(respuestas).length;

  return (
    <div className="panel cuestionario-card" aria-label={titulo || `Preguntas de comprobación del Tema ${nivel}`}>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 0, alignItems: 'center' }}>
        <div>
          <span className="kicker">Comprobación conceptual</span>
          <h3 style={{ margin: 0 }}>
            {titulo || `Comprobación de conceptos · Tema ${nivel}`}
          </h3>
        </div>
        <div className="cuestionario-stat">
          <span className="tag" style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>
            Aciertos: {aciertos}/{preguntas.length}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '16px', marginTop: '14px' }}>
        {preguntas.map((p, index) => {
          const elegida = respuestas[p.id];
          const respondida = elegida !== undefined;
          const esCorrecta = elegida === p.correcta;
          const textoPregunta = p.enunciado || p.pregunta || '';
          const codigoFuente = p.fuente || p.fuenteId || '';

          return (
            <div
              key={p.id}
              className={`quiz-item ${respondida ? (esCorrecta ? 'item-correct' : 'item-incorrect') : ''}`}
            >
              <div className="quiz-question-head">
                <span className="quiz-q-num">P{index + 1}</span>
                <p className="quiz-q-text">{textoPregunta}</p>
              </div>

              <div className="opts">
                {p.opciones.map((op, idx) => {
                  const estaElegida = elegida === idx;
                  const esLaCorrecta = idx === p.correcta;

                  let estadoClase = '';
                  if (respondida) {
                    if (estaElegida) {
                      estadoClase = esCorrecta ? 'ok' : 'no';
                    } else if (!esCorrecta && esLaCorrecta) {
                      // Señalizar sutilmente la correcta cuando el usuario se equivocó
                      estadoClase = 'hint-correct';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`opt ${estadoClase}`}
                      onClick={() => seleccionar(p.id, idx)}
                      aria-pressed={estaElegida}
                    >
                      <strong className="opt-letter">
                        {String.fromCharCode(65 + idx)}.
                      </strong>
                      <span className="opt-text">{op}</span>
                      {respondida && estaElegida && (
                        <span className="opt-icon-feedback">
                          {esCorrecta ? '✓' : '✗'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {respondida && (
                <div
                  className={`quiz-feedback-box ${esCorrecta ? 'fb-ok' : 'fb-warn'}`}
                  role="status"
                  aria-live="polite"
                >
                  <div className="fb-header">
                    <strong>{esCorrecta ? '✓ Respuesta Correcta:' : '⚠ Explicación técnica:'}</strong>
                  </div>
                  <p className="fb-body">
                    {p.explicacion}{' '}
                    {codigoFuente && (
                      <a
                        href={`/fuentes#${codigoFuente}`}
                        className="fuente-link-pill"
                        title={`Ver referencia ${codigoFuente} en bibliografía`}
                      >
                        [{codigoFuente}]
                      </a>
                    )}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
