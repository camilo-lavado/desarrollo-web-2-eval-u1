package cl.ipss.reservamedica.dto;

import java.time.LocalDateTime;

import cl.ipss.reservamedica.model.Cita;
import cl.ipss.reservamedica.model.EstadoCita;

public record CitaResponse(
        Long id,
        String nombrePaciente,
        String nombreMedico,
        String especialidad,
        LocalDateTime fechaHora,
        EstadoCita estado) {

    public static CitaResponse desde(Cita cita) {
        return new CitaResponse(
                cita.getId(),
                cita.getPaciente().getNombre(),
                cita.getMedico().getNombre(),
                cita.getMedico().getEspecialidad(),
                cita.getFechaHora(),
                cita.getEstado());
    }
}
