import React, { useState, useEffect, useRef } from 'react';

export const CAPAS_RECORRIDO = [
  { id: 'cliente', c: 'var(--cliente)', t: 'Cliente', s: 'Navegador, Postman o app', cls: 'HTTP' },
  { id: 'disp', c: 'var(--dispatcher)', t: 'DispatcherServlet', s: 'El recepcionista: recibe y reparte', cls: 'Tomcat' },
  { id: 'ctrl', c: 'var(--controller)', t: 'Controlador', s: 'Recibe el DTO y delega', cls: '@RestController' },
  { id: 'serv', c: 'var(--service)', t: 'Servicio', s: 'Reglas del negocio', cls: '@Service' },
  { id: 'repo', c: 'var(--repo)', t: 'Repositorio y BD', s: 'Habla con la base de datos', cls: '@Repository' },
];

export interface StepInfo {
  layer: number;
  label: string;
  mode: '' | 'back' | 'bad';
  desc: string;
  detail: string;
}

export interface ScenarioInfo {
  id: string;
  badge: string;
  title: string;
  isError: boolean;
  steps: StepInfo[];
}

export const HERO_SCENARIOS: ScenarioInfo[] = [
  {
    id: '201',
    badge: '201 Created',
    title: 'Camino Feliz · Agendamiento exitoso',
    isError: false,
    steps: [
      { layer: 0, label: 'POST /api/v1/citas', mode: '', desc: 'Ana pulsa "Confirmar reserva" en la interfaz web.', detail: 'Se emite la solicitud HTTP POST con cuerpo JSON que incluye pacienteId, medicoId, fechaHora y motivo.' },
      { layer: 1, label: 'Tomcat → Dispatcher', mode: '', desc: 'Tomcat asigna un hilo y entrega la petición al DispatcherServlet.', detail: 'RequestMappingHandlerMapping localiza el método CitaController.agendar() y Jackson deserializa el JSON.' },
      { layer: 2, label: '@Valid AgendarCitaRequest', mode: '', desc: 'CitaController recibe el DTO record inmutable y valida restricciones.', detail: '@Valid comprueba que los IDs no sean nulos y la fecha esté en el futuro antes de delegar.' },
      { layer: 3, label: 'RN-01 a RN-04 OK', mode: '', desc: 'CitaService ejecuta las cuatro reglas clínicas dentro de @Transactional.', detail: 'Verifica médico activo, paciente registrado, antelación mínima de 2 horas y ausencia de conflicto horario.' },
      { layer: 4, label: 'INSERT INTO CITAS', mode: '', desc: 'CitaRepository y Hibernate ejecutan el INSERT en la base de datos.', detail: 'Hibernate genera la sentencia SQL INSERT INTO CITAS (...) VALUES (...). La base de datos asigna ID.' },
      { layer: 3, label: 'Entidad → CitaResponse', mode: 'back', desc: 'CitaService transforma la entidad persistida en el record DTO seguro.', detail: 'Se ocultan campos sensibles o relaciones perezosas y se retorna únicamente la información clínica pública.' },
      { layer: 2, label: '201 Created', mode: 'back', desc: 'CitaController envuelve el resultado en ResponseEntity.created(location).', detail: 'Se incluye la cabecera Location: /api/v1/citas/{id} indicando el recurso recién creado.' },
      { layer: 1, label: 'DTO → JSON', mode: 'back', desc: 'DispatcherServlet serializa el DTO a bytes JSON con Jackson.', detail: 'Genera el cuerpo HTTP de salida y establece Content-Type: application/json.' },
      { layer: 0, label: '201 + Location Header', mode: 'back', desc: 'Ana recibe la confirmación con su hora agendada.', detail: 'El navegador muestra el comprobante de cita con médico, fecha y hora confirmada.' },
    ],
  },
  {
    id: '400',
    badge: '400 Bad Request',
    title: 'Validación @Valid · Datos incompletos',
    isError: true,
    steps: [
      { layer: 0, label: 'POST /citas (pacienteId: null)', mode: '', desc: 'Ana envía la petición pero falta el identificador del paciente.', detail: 'El JSON enviado omite el campo obligatorio "pacienteId" (@NotNull).' },
      { layer: 1, label: 'Dispatcher → Controller', mode: '', desc: 'DispatcherServlet enruta la petición hacia el controlador.', detail: 'Jackson deserializa el JSON incompleto en la instancia del record AgendarCitaRequest.' },
      { layer: 2, label: '@Valid detecta error', mode: 'bad', desc: 'Hibernate Validator detecta la violación de @NotNull en CitaController.', detail: 'Se dispara MethodArgumentNotValidException antes de invocar a la capa de servicio.' },
      { layer: 1, label: '@RestControllerAdvice', mode: 'bad', desc: 'GlobalExceptionHandler intercepta la excepción de validación.', detail: 'Construye un ProblemDetail RFC 9457 con status 400 y el desglose de los campos fallidos.' },
      { layer: 0, label: '400 ProblemDetail', mode: 'bad', desc: 'El cliente recibe el mensaje de error normalizado sin tocar la BD.', detail: 'La interfaz resalta los campos faltantes en rojo para que el usuario los corrija.' },
    ],
  },
  {
    id: '404',
    badge: '404 Not Found',
    title: 'RN-01 · Médico o paciente no existe',
    isError: true,
    steps: [
      { layer: 0, label: 'POST /citas (medicoId: 999)', mode: '', desc: 'Se solicita una cita con un identificador de médico inexistente.', detail: 'El cliente envía un identificador que no figura en el registro clínico activo.' },
      { layer: 1, label: 'Dispatcher → Controller', mode: '', desc: 'El DispatcherServlet procesa la cabecera y el cuerpo HTTP.', detail: 'La petición avanza al controlador al cumplir con el formato JSON.' },
      { layer: 2, label: 'CitaController delega', mode: '', desc: 'El controlador delega al servicio para verificar al especialista.', detail: 'Invoca citaService.agendar(request) dentro del contexto transaccional.' },
      { layer: 3, label: 'RN-01: Recurso no encontrado', mode: 'bad', desc: 'CitaService invoca medicoRepository.findById(999) y retorna Optional.empty().', detail: 'Al no existir el médico, el servicio arroja RecursoNoEncontradoException abortando la operación.' },
      { layer: 1, label: 'Traducción a RFC 9457', mode: 'bad', desc: 'El advice centralizado traduce el error a HTTP 404 Not Found.', detail: 'Genera ProblemDetail indicando que el recurso solicitado no existe en la clínica.' },
      { layer: 0, label: '404 Not Found', mode: 'bad', desc: 'El cliente recibe respuesta 404 con diagnóstico asistencial claro.', detail: 'Se orienta al usuario para que seleccione un médico del listado vigente.' },
    ],
  },
  {
    id: '409',
    badge: '409 Conflict',
    title: 'RN-04 · Bloque ocupado',
    isError: true,
    steps: [
      { layer: 0, label: 'POST /citas (horario duplicado)', mode: '', desc: 'Ana solicita un cupo que otro paciente acaba de reservar.', detail: 'La petición contiene datos con formato válido pero el horario ya no está disponible.' },
      { layer: 1, label: 'Dispatcher → Controller', mode: '', desc: 'DispatcherServlet enruta la llamada sin errores sintácticos.', detail: 'Se superan las validaciones de formato iniciales y se pasa el control.' },
      { layer: 2, label: 'agendar() delega a servicio', mode: '', desc: 'CitaController pasa el DTO a CitaService.agendar().', detail: 'Se inicia la transacción de negocio gestionada por Spring (@Transactional).' },
      { layer: 3, label: 'RN-04: Conflicto detectado', mode: 'bad', desc: 'CitaService consulta al repositorio y descubre el conflicto horario.', detail: 'existsByMedicoIdAndFechaHoraAndEstado() retorna true. CitaService lanza HorarioNoDisponibleException.' },
      { layer: 1, label: 'ExceptionResolver captura 409', mode: 'bad', desc: 'GlobalExceptionHandler captura la excepción de negocio.', detail: 'Mapea HorarioNoDisponibleException a un ProblemDetail con status 409 y mensaje asistencial claro.' },
      { layer: 0, label: '409 Conflict', mode: 'bad', desc: 'Ana es informada que el bloque horario ya está ocupado.', detail: 'El sistema le sugiere seleccionar el siguiente cupo disponible del especialista.' },
    ],
  },
  {
    id: '422',
    badge: '422 Unprocessable',
    title: 'RN-03 · Solo lunes a viernes',
    isError: true,
    steps: [
      { layer: 0, label: 'POST /citas (domingo 2026-11-08)', mode: '', desc: 'Ana solicita una cita para un día domingo.', detail: 'La fecha es futura y el JSON está bien formado, pero cae fuera de los días de atención.' },
      { layer: 1, label: 'Dispatcher → Controller', mode: '', desc: 'DispatcherServlet enruta la petición hacia el controlador.', detail: 'Jackson deserializa el JSON en AgendarCitaRequest y @Valid aprueba las restricciones de formato.' },
      { layer: 2, label: 'agendar() delega a servicio', mode: '', desc: 'CitaController pasa el DTO a CitaService.agendar().', detail: 'La verificación del día y horario de atención médica corresponde a la capa de servicio.' },
      { layer: 3, label: 'RN-03: Fuera de horario hábil', mode: 'bad', desc: 'validarHorarioDeAtencion() detecta que la fecha solicitada es domingo.', detail: 'CitaService lanza ReglaNegocioException("Solo se atiende de lunes a viernes").' },
      { layer: 1, label: 'Traducción a RFC 9457', mode: 'bad', desc: 'GlobalExceptionHandler captura ReglaNegocioException.', detail: 'Construye un ProblemDetail RFC 9457 con status 422 y título "Fuera de las reglas de atención".' },
      { layer: 0, label: '422 ProblemDetail', mode: 'bad', desc: 'Ana recibe la notificación de que la atención es solo de lunes a viernes.', detail: 'El sistema le orienta a agendar entre lunes y viernes de 08:00 a 18:00.' },
    ],
  },
];

export default function HeroPipe() {
  const [escenarioId, setEscenarioId] = useState<string>('201');
  const [stepIdx, setStepIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [pktPos, setPktPos] = useState<{ left: string; top: string }>({ left: '10%', top: '' });
  const pipeRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const timersRef = useRef<number[]>([]);

  const escenario = HERO_SCENARIOS.find((s) => s.id === escenarioId) || HERO_SCENARIOS[0];
  const steps = escenario.steps;
  const currentStep = steps[stepIdx] || steps[0];
  const activeLayer = currentStep.layer;
  const pktLabel = currentStep.label;
  const pktMode = currentStep.mode;

  const updatePosition = (layerIndex: number) => {
    const pipeEl = pipeRef.current;
    const nodeEl = nodeRefs.current[layerIndex];
    if (!pipeEl || !nodeEl) return;
    const isSingleCol = window.getComputedStyle(pipeEl).gridTemplateColumns.split(' ').length === 1;
    const left = `${nodeEl.offsetLeft + nodeEl.offsetWidth / 2}px`;
    const top = isSingleCol ? `${nodeEl.offsetTop + nodeEl.offsetHeight / 2 - 14}px` : '';
    setPktPos({ left, top });
  };

  useEffect(() => {
    updatePosition(activeLayer);
    const onResize = () => updatePosition(activeLayer);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeLayer, escenarioId]);

  const stopSequence = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setRunning(false);
  };

  const runSequence = () => {
    stopSequence();
    setRunning(true);
    steps.forEach((_, idx) => {
      const t = window.setTimeout(() => {
        setStepIdx(idx);
        if (idx === steps.length - 1) {
          setRunning(false);
        }
      }, idx * 750);
      timersRef.current.push(t);
    });
  };

  const seleccionarEscenario = (id: string) => {
    stopSequence();
    setEscenarioId(id);
    setStepIdx(0);
  };

  const pasoAnterior = () => {
    stopSequence();
    setStepIdx((prev) => Math.max(0, prev - 1));
  };

  const pasoSiguiente = () => {
    stopSequence();
    setStepIdx((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const reiniciar = () => {
    stopSequence();
    setStepIdx(0);
  };

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      const initTimer = window.setTimeout(() => {
        runSequence();
      }, 600);
      return () => {
        window.clearTimeout(initTimer);
        stopSequence();
      };
    }
    return () => stopSequence();
  }, [escenarioId]);

  return (
    <div className="hero-pipe-container">
      {/* Selector de escenarios interactivos */}
      <div className="hero-pipe-selector" role="tablist" aria-label="Seleccionar escenario de la petición">
        {HERO_SCENARIOS.map((sc) => {
          const isSelected = sc.id === escenarioId;
          return (
            <button
              key={sc.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`hero-sc-btn ${isSelected ? 'active' : ''} ${sc.isError ? 'is-err' : ''}`}
              onClick={() => seleccionarEscenario(sc.id)}
            >
              <span className={`sc-badge ${sc.isError ? 'err' : 'ok'}`}>{sc.badge}</span>
              <span className="sc-name">{sc.title}</span>
            </button>
          );
        })}
      </div>

      {/* Tubería visual de 5 capas */}
      <div
        className="pipe"
        ref={pipeRef}
        aria-label="Recorrido de la petición por las cinco capas (Simulación didáctica)"
      >
        {CAPAS_RECORRIDO.map((c, i) => (
          <div
            key={c.id}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            className={`node ${activeLayer === i ? 'on' : ''} ${pktMode === 'bad' && activeLayer === i ? 'err' : ''}`}
            style={{ '--c': c.c } as React.CSSProperties}
          >
            <h4>{c.t}</h4>
            <small>{c.s}</small>
            <em>{c.cls}</em>
          </div>
        ))}
        <div
          className={`pkt ${pktMode === 'back' ? 'back' : pktMode === 'bad' ? 'bad' : ''}`}
          style={{ left: pktPos.left, top: pktPos.top || undefined }}
        >
          {pktLabel}
        </div>
      </div>

      {/* Explicación en tiempo real del paso actual */}
      <div className="hero-step-card" aria-live="polite">
        <div className="hero-step-meta">
          <span className={`step-mode-badge ${pktMode === 'bad' ? 'err' : pktMode === 'back' ? 'ret' : 'ida'}`}>
            {pktMode === 'bad' ? '⚠ Desvío de error' : pktMode === 'back' ? '← Respuesta de vuelta' : '→ Petición de ida'}
          </span>
          <span className="step-counter">
            Paso {stepIdx + 1} de {steps.length} · Capa activa: <strong>{CAPAS_RECORRIDO[activeLayer]?.t}</strong>
          </span>
        </div>
        <h4 className="hero-step-title">{currentStep.desc}</h4>
        <p className="hero-step-detail">{currentStep.detail}</p>
      </div>

      {/* Controles de reproducción */}
      <div className="hero-pipe-controls">
        <div className="ctrl-btn-group">
          <button
            type="button"
            className="btn"
            onClick={runSequence}
            disabled={running}
            title="Reproducir animación automática"
          >
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {running ? 'Animando...' : 'Reproducir'}
          </button>
          <button
            type="button"
            className="btn sec"
            onClick={pasoAnterior}
            disabled={stepIdx === 0}
            title="Paso anterior"
          >
            ← Anterior
          </button>
          <button
            type="button"
            className="btn sec"
            onClick={pasoSiguiente}
            disabled={stepIdx === steps.length - 1}
            title="Paso siguiente"
          >
            Siguiente →
          </button>
          <button
            type="button"
            className="btn sec"
            onClick={reiniciar}
            disabled={stepIdx === 0}
            title="Reiniciar al paso 1"
          >
            ↺ Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
}
