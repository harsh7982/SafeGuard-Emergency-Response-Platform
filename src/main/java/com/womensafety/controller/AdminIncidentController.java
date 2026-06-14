package com.womensafety.controller;

import com.womensafety.model.Incident;
import com.womensafety.model.IncidentStatus;
import com.womensafety.repository.IncidentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/incidents")
public class AdminIncidentController {

    private final IncidentRepository incidentRepository;

    public AdminIncidentController(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    @GetMapping
    public ResponseEntity<List<Incident>> getAllIncidents(
            @RequestParam(required = false) IncidentStatus status) {

        if (status != null) {
            return ResponseEntity.ok(incidentRepository.findByStatus(status));
        }

        return ResponseEntity.ok(incidentRepository.findAll());
    }
}