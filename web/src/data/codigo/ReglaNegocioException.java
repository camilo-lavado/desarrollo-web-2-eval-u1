package cl.ipss.reservamedica.exception;

/** RN-03: la petición está bien formada pero no se puede procesar (422), p. ej. fuera del horario de atención. */
public class ReglaNegocioException extends RuntimeException {

    public ReglaNegocioException(String mensaje) {
        super(mensaje);
    }
}
