package cl.ipss.reservamedica.dto;

import cl.ipss.reservamedica.model.Medico;

public record MedicoResponse(Long id, String nombre, String especialidad) {

    public static MedicoResponse desde(Medico medico) {
        return new MedicoResponse(medico.getId(), medico.getNombre(), medico.getEspecialidad());
    }
}
