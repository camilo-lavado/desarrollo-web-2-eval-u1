package cl.ipss.reservamedica.service;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import cl.ipss.reservamedica.dto.AgendarCitaRequest;
import cl.ipss.reservamedica.exception.HorarioNoDisponibleException;
import cl.ipss.reservamedica.exception.ReglaNegocioException;
import cl.ipss.reservamedica.exception.RecursoNoEncontradoException;
import cl.ipss.reservamedica.model.Cita;
import cl.ipss.reservamedica.model.EstadoCita;
import cl.ipss.reservamedica.model.Medico;
import cl.ipss.reservamedica.model.Paciente;
import cl.ipss.reservamedica.repository.CitaRepository;
import cl.ipss.reservamedica.repository.MedicoRepository;
import cl.ipss.reservamedica.repository.PacienteRepository;

@Service
public class CitaService {

    private static final LocalTime INICIO_ATENCION = LocalTime.of(8, 0);
    private static final LocalTime ULTIMO_BLOQUE = LocalTime.of(17, 30);

    private final CitaRepository citaRepository;
    private final PacienteRepository pacienteRepository;
    private final MedicoRepository medicoRepository;

    public CitaService(CitaRepository citaRepository, PacienteRepository pacienteRepository,
            MedicoRepository medicoRepository) {
        this.citaRepository = citaRepository;
        this.pacienteRepository = pacienteRepository;
        this.medicoRepository = medicoRepository;
    }

    @Transactional
    public Cita agendar(AgendarCitaRequest request) {
        Paciente paciente = pacienteRepository.findById(request.pacienteId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe el paciente " + request.pacienteId()));
        Medico medico = medicoRepository.findById(request.medicoId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe el médico " + request.medicoId()));

        validarHorarioDeAtencion(request.fechaHora());

        boolean bloqueOcupado = citaRepository.existsByMedicoIdAndFechaHoraAndEstado(
                medico.getId(), request.fechaHora(), EstadoCita.AGENDADA);
        if (bloqueOcupado) {
            throw new HorarioNoDisponibleException(
                    "El médico ya tiene una cita agendada en ese bloque horario");
        }

        Cita cita = new Cita(paciente, medico, request.fechaHora(), request.motivo());
        return citaRepository.save(cita);
    }

    @Transactional(readOnly = true)
    public Cita obtenerPorId(Long id) {
        return citaRepository.buscarConPacienteYMedicoPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la cita " + id));
    }

    private void validarHorarioDeAtencion(LocalDateTime fechaHora) {
        DayOfWeek dia = fechaHora.getDayOfWeek();
        if (dia == DayOfWeek.SATURDAY || dia == DayOfWeek.SUNDAY) {
            throw new ReglaNegocioException("Solo se atiende de lunes a viernes");
        }
        LocalTime hora = fechaHora.toLocalTime();
        if (hora.isBefore(INICIO_ATENCION) || hora.isAfter(ULTIMO_BLOQUE)) {
            throw new ReglaNegocioException("El horario de atención es de 08:00 a 18:00");
        }
        boolean minutoValido = hora.getMinute() == 0 || hora.getMinute() == 30;
        if (!minutoValido || hora.getSecond() != 0 || hora.getNano() != 0) {
            throw new ReglaNegocioException(
                    "Las citas se agendan en bloques de 30 minutos (minuto 00 o 30)");
        }
    }
}
