package com.womensafety.controller;

import com.womensafety.dto.ApiResponse;
import com.womensafety.dto.UpdateIncidentStatusRequest;
import com.womensafety.model.Incident;
import com.womensafety.repository.IncidentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final IncidentRepository incidentRepository;

    public AdminController(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }


    @PutMapping("/incidents/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OFFICER')")
    public ResponseEntity<ApiResponse> updateIncidentStatus(@PathVariable Long id,
                                                            @Valid @RequestBody UpdateIncidentStatusRequest request) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found"));
        incident.setStatus(request.getStatus());
        incidentRepository.save(incident);
        return ResponseEntity.ok(new ApiResponse(true, "Incident status updated to " + request.getStatus()));
    }
}
