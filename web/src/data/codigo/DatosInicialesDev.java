package cl.ipss.reservamedica.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import cl.ipss.reservamedica.model.Medico;
import cl.ipss.reservamedica.model.Paciente;
import cl.ipss.reservamedica.repository.MedicoRepository;
import cl.ipss.reservamedica.repository.PacienteRepository;

@Configuration
@Profile("dev")
public class DatosInicialesDev {

    @Bean
    CommandLineRunner cargarDatosDePrueba(MedicoRepository medicoRepository, PacienteRepository pacienteRepository) {
        return args -> {
            medicoRepository.save(new Medico("Dra. Fernanda Rojas", "Medicina General"));
            medicoRepository.save(new Medico("Dr. Ignacio Torres", "Pediatría"));
            medicoRepository.save(new Medico("Dra. Carla Muñoz", "Dermatología"));

            pacienteRepository.save(new Paciente("11111111-1", "Ana Soto", "ana.soto@mail.com", "+56911111111"));
            pacienteRepository.save(new Paciente("22222222-2", "Pedro Ramírez", "pedro.ramirez@mail.com", "+56922222222"));
        };
    }
}
