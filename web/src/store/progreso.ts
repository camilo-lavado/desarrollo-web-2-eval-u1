import { useState, useEffect, useCallback } from 'react';

export const MAX_XP = 100;
const STORAGE_KEY = 'mision-spring-progreso';
const EVENT_NAME = 'mision-spring-update';

export interface ProgresoState {
  xp: number;
  done: Record<string, boolean>;
  escenarios: Record<string, boolean>;
  estudio: boolean;
  tema: 'light' | 'dark';
}

const defaultState: ProgresoState = {
  xp: 0,
  done: {},
  escenarios: {},
  estudio: false,
  tema: 'light',
};

export function loadProgreso(): ProgresoState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return { ...defaultState, tema: prefersDark ? 'dark' : 'light' };
    }
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      done: { ...(parsed.done || {}) },
      escenarios: { ...(parsed.escenarios || {}) },
    };
  } catch {
    return defaultState;
  }
}

export function saveProgreso(next: ProgresoState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // El progreso guardado es comodidad; nunca bloquea el sitio
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
}

export const XP_TOAST_EVENT = 'mision-spring-xp-toast';

export function grantXp(points: number, key: string, markScenario?: string): void {
  const cur = loadProgreso();
  const next: ProgresoState = {
    ...cur,
    done: { ...cur.done },
    escenarios: { ...cur.escenarios },
  };
  if (markScenario) {
    next.escenarios[markScenario] = true;
  }
  let gained = false;
  if (!next.done[key]) {
    next.done[key] = true;
    if (points > 0) {
      next.xp = Math.min(MAX_XP, next.xp + points);
      gained = true;
    }
  }
  saveProgreso(next);

  if (gained && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(XP_TOAST_EVENT, {
        detail: { points, key, total: next.xp },
      })
    );
  }
}

export function isNivelCompletado(n: number, state: ProgresoState): boolean {
  if (n === 1) return !!state.done['nivel1'];
  if (n === 2) return Object.keys(state.escenarios || {}).length >= 4 || !!state.done['nivel2'];
  if (n === 3) return !!state.done['perfiles'] || !!state.done['nivel3'];
  if (n === 4) return !!state.done['nivel4'];
  if (n === 5) return !!state.done['nivel5'];
  if (n === 6) return !!state.done['nivel6'];
  return false;
}

export function useProgreso() {
  const [state, setState] = useState<ProgresoState>(defaultState);

  useEffect(() => {
    const initial = loadProgreso();
    setState(initial);

    const onUpdate = (e: Event) => {
      const custom = e as CustomEvent<ProgresoState>;
      if (custom.detail) {
        setState(custom.detail);
      } else {
        setState(loadProgreso());
      }
    };
    window.addEventListener(EVENT_NAME, onUpdate);
    return () => window.removeEventListener(EVENT_NAME, onUpdate);
  }, []);

  const toggleTema = useCallback(() => {
    const cur = loadProgreso();
    const nuevoTema: 'light' | 'dark' = cur.tema === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nuevoTema;
    saveProgreso({ ...cur, tema: nuevoTema });
  }, []);

  const toggleEstudio = useCallback(() => {
    const cur = loadProgreso();
    const nuevoEstudio = !cur.estudio;
    document.querySelectorAll<HTMLDetailsElement>('details.ficha').forEach((d) => {
      d.open = nuevoEstudio;
    });
    saveProgreso({ ...cur, estudio: nuevoEstudio });
  }, []);

  return {
    state,
    addXp: grantXp,
    toggleTema,
    toggleEstudio,
  };
}
