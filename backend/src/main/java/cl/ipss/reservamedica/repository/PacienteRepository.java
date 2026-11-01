package cl.ipss.reservamedica.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import cl.ipss.reservamedica.model.Paciente;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {
}
