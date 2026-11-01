package cl.ipss.reservamedica.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import cl.ipss.reservamedica.service.MedicoService;

@Controller
public class MedicoVistaController {

    private final MedicoService medicoService;

    public MedicoVistaController(MedicoService medicoService) {
        this.medicoService = medicoService;
    }

    @GetMapping("/medicos")
    public String verMedicos(Model model) {
        model.addAttribute("medicos", medicoService.listar(null));
        return "medicos";
    }
}
