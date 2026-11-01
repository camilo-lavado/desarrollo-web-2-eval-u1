package cl.ipss.reservamedica.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import cl.ipss.reservamedica.dto.AgendarCitaRequest;
import cl.ipss.reservamedica.exception.HorarioNoDisponibleException;
import cl.ipss.reservamedica.exception.ReglaNegocioException;
import cl.ipss.reservamedica.model.Cita;
import cl.ipss.reservamedica.model.EstadoCita;
import cl.ipss.reservamedica.model.Medico;
import cl.ipss.reservamedica.model.Paciente;
import cl.ipss.reservamedica.repository.CitaRepository;
import cl.ipss.reservamedica.repository.MedicoRepository;
import cl.ipss.reservamedica.repository.PacienteRepository;

@ExtendWith(MockitoExtension.class)
class CitaServiceTest {

    @Mock
    private CitaRepository citaRepository;

    @Mock
    private PacienteRepository pacienteRepository;

    @Mock
    private MedicoRepository medicoRepository;

    @InjectMocks
    private CitaService citaService;

    private final Paciente paciente = new Paciente("11111111-1", "Ana Soto", "ana@mail.com", "+56911111111");
    private final Medico medico = new Medico("Dr. Pérez", "Medicina General");

    @Test
    void agendarEnBloqueOcupadoLanza409() {
        LocalDateTime fechaHora = proximoLunesA(10, 0);
        when(pacienteRepository.findById(1L)).thenReturn(java.util.Optional.of(paciente));
        when(medicoRepository.findById(1L)).thenReturn(java.util.Optional.of(medico));
        when(citaRepository.existsByMedicoIdAndFechaHoraAndEstado(any(), any(), any())).thenReturn(true);

        AgendarCitaRequest request = new AgendarCitaRequest(1L, 1L, fechaHora, "Control");

        assertThatThrownBy(() -> citaService.agendar(request))
                .isInstanceOf(HorarioNoDisponibleException.class);
    }

    @Test
    void agendarFueraDeHorarioLanza422() {
        LocalDateTime fechaHora = proximoLunesA(19, 0);
        when(pacienteRepository.findById(1L)).thenReturn(java.util.Optional.of(paciente));
        when(medicoRepository.findById(1L)).thenReturn(java.util.Optional.of(medico));

        AgendarCitaRequest request = new AgendarCitaRequest(1L, 1L, fechaHora, "Control");

        assertThatThrownBy(() -> citaService.agendar(request))
                .isInstanceOf(ReglaNegocioException.class);
    }

    @Test
    void agendarDentroDeHorarioYSinChoqueGuardaLaCita() {
        LocalDateTime fechaHora = proximoLunesA(9, 30);
        when(pacienteRepository.findById(1L)).thenReturn(java.util.Optional.of(paciente));
        when(medicoRepository.findById(1L)).thenReturn(java.util.Optional.of(medico));
        when(citaRepository.existsByMedicoIdAndFechaHoraAndEstado(any(), any(), any())).thenReturn(false);
        when(citaRepository.save(any(Cita.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        AgendarCitaRequest request = new AgendarCitaRequest(1L, 1L, fechaHora, "Control");

        Cita cita = citaService.agendar(request);

        assertThat(cita.getEstado()).isEqualTo(EstadoCita.AGENDADA);
        assertThat(cita.getFechaHora()).isEqualTo(fechaHora);
    }

    private LocalDateTime proximoLunesA(int hora, int minuto) {
        LocalDateTime base = LocalDateTime.now().plusWeeks(1);
        while (base.getDayOfWeek() != java.time.DayOfWeek.MONDAY) {
            base = base.plusDays(1);
        }
        return base.withHour(hora).withMinute(minuto).withSecond(0).withNano(0);
    }
}
