package cl.ipss.reservamedica.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import cl.ipss.reservamedica.model.Cita;
import cl.ipss.reservamedica.model.Medico;
import cl.ipss.reservamedica.model.Paciente;
import cl.ipss.reservamedica.service.CitaService;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CitaController.class)
class CitaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CitaService citaService;

    @Test
    void postValidoDevuelve201YLocation() throws Exception {
        Paciente paciente = new Paciente("11111111-1", "Ana Soto", "ana@mail.com", "+56911111111");
        Medico medico = new Medico("Dr. Pérez", "Medicina General");
        Cita cita = new Cita(paciente, medico, LocalDateTime.now().plusDays(1), "Control");
        setId(cita, 1L);
        when(citaService.agendar(any())).thenReturn(cita);

        String cuerpo = """
                {"pacienteId":1,"medicoId":1,"fechaHora":"2027-01-04T10:00:00","motivo":"Control"}
                """;

        mockMvc.perform(post("/api/v1/citas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/citas/1"))
                .andExpect(jsonPath("$.nombrePaciente").value("Ana Soto"));
    }

    @Test
    void postConFechaPasadaDevuelve400() throws Exception {
        String cuerpo = """
                {"pacienteId":1,"medicoId":1,"fechaHora":"2020-01-01T10:00:00","motivo":"Control"}
                """;

        mockMvc.perform(post("/api/v1/citas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores[0].campo").value("fechaHora"));
    }

    private void setId(Cita cita, Long id) throws Exception {
        var campo = Cita.class.getDeclaredField("id");
        campo.setAccessible(true);
        campo.set(cita, id);
    }
}
