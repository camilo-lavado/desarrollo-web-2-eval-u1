package cl.ipss.reservamedica.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import cl.ipss.reservamedica.model.Medico;
import cl.ipss.reservamedica.repository.MedicoRepository;

@Service
public class MedicoService {

    private final MedicoRepository medicoRepository;

    public MedicoService(MedicoRepository medicoRepository) {
        this.medicoRepository = medicoRepository;
    }

    @Transactional(readOnly = true)
    public List<Medico> listar(String especialidad) {
        if (StringUtils.hasText(especialidad)) {
            return medicoRepository.findByEspecialidadIgnoreCase(especialidad);
        }
        return medicoRepository.findAll();
    }
}
