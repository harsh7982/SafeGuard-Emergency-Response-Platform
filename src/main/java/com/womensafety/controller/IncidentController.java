package com.womensafety.controller;

import com.womensafety.dto.ApiResponse;
import com.womensafety.dto.IncidentRequest;
import com.womensafety.model.Incident;
import com.womensafety.model.User;
import com.womensafety.repository.IncidentRepository;
import com.womensafety.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;

    public IncidentController(IncidentRepository incidentRepository, UserRepository userRepository) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> createIncident(@Valid @RequestBody IncidentRequest request,
                                            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();

        Incident incident = new Incident(
                user,
                request.getIncidentType(),
                request.getDescription(),
                request.getLatitude(),
                request.getLongitude()
        );

        incidentRepository.save(incident);

        return ResponseEntity.ok(new ApiResponse(true, "Incident reported successfully."));
    }

    @GetMapping
    public ResponseEntity<List<Incident>> getMyIncidents(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();

        return ResponseEntity.ok(incidentRepository.findByUser(user));
    }
}