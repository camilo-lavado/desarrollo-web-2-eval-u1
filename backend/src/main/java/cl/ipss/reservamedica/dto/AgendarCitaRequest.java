package cl.ipss.reservamedica.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AgendarCitaRequest(
        @NotNull(message = "el paciente es obligatorio") Long pacienteId,
        @NotNull(message = "el médico es obligatorio") Long medicoId,
        @NotNull(message = "la fecha y hora son obligatorias")
        @Future(message = "la fecha debe ser futura") LocalDateTime fechaHora,
        @NotBlank(message = "el motivo es obligatorio")
        @Size(max = 200, message = "el motivo no puede superar 200 caracteres") String motivo) {
}
