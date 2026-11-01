package cl.ipss.reservamedica.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import cl.ipss.reservamedica.dto.MedicoResponse;
import cl.ipss.reservamedica.service.MedicoService;

@RestController
@RequestMapping("/api/v1/medicos")
public class MedicoController {

    private final MedicoService medicoService;

    public MedicoController(MedicoService medicoService) {
        this.medicoService = medicoService;
    }

    @GetMapping
    public List<MedicoResponse> listar(@RequestParam(required = false) String especialidad) {
        return medicoService.listar(especialidad).stream()
                .map(MedicoResponse::desde)
                .toList();
    }
}
