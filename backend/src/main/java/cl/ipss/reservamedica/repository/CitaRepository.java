package cl.ipss.reservamedica.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import cl.ipss.reservamedica.model.Cita;
import cl.ipss.reservamedica.model.EstadoCita;

public interface CitaRepository extends JpaRepository<Cita, Long> {

    boolean existsByMedicoIdAndFechaHoraAndEstado(Long medicoId, LocalDateTime fechaHora, EstadoCita estado);

    @Query("SELECT c FROM Cita c JOIN FETCH c.paciente JOIN FETCH c.medico WHERE c.id = :id")
    Optional<Cita> buscarConPacienteYMedicoPorId(@Param("id") Long id);
}
