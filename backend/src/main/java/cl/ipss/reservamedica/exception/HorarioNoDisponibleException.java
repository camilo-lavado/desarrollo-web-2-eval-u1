package cl.ipss.reservamedica.exception;

/** RN-04: el médico ya tiene una cita AGENDADA en ese bloque (409). */
public class HorarioNoDisponibleException extends RuntimeException {

    public HorarioNoDisponibleException(String mensaje) {
        super(mensaje);
    }
}
