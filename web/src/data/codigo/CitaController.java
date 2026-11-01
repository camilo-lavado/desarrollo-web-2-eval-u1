package cl.ipss.reservamedica.controller;

import java.net.URI;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import cl.ipss.reservamedica.dto.AgendarCitaRequest;
import cl.ipss.reservamedica.dto.CitaResponse;
import cl.ipss.reservamedica.model.Cita;
import cl.ipss.reservamedica.service.CitaService;

@RestController
@RequestMapping("/api/v1/citas")
public class CitaController {

    private final CitaService citaService;

    public CitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    @PostMapping
    public ResponseEntity<CitaResponse> agendar(@Valid @RequestBody AgendarCitaRequest request) {
        Cita cita = citaService.agendar(request);
        return ResponseEntity.created(URI.create("/api/v1/citas/" + cita.getId()))
                .body(CitaResponse.desde(cita));
    }

    @GetMapping("/{id}")
    public CitaResponse obtener(@PathVariable Long id) {
        Cita cita = citaService.obtenerPorId(id);
        return CitaResponse.desde(cita);
    }
}
