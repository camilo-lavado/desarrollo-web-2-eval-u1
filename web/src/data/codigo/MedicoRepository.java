package cl.ipss.reservamedica.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import cl.ipss.reservamedica.model.Medico;

public interface MedicoRepository extends JpaRepository<Medico, Long> {

    List<Medico> findByEspecialidadIgnoreCase(String especialidad);
}
