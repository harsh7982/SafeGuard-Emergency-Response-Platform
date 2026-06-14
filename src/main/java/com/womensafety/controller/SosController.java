package com.womensafety.controller;
import com.womensafety.dto.SosResponse;
import com.womensafety.dto.ApiResponse;
import com.womensafety.dto.SosRequest;
import com.womensafety.model.EmergencyContact;
import com.womensafety.model.Incident;
import com.womensafety.model.User;
import com.womensafety.repository.EmergencyContactRepository;
import com.womensafety.repository.IncidentRepository;
import com.womensafety.repository.UserRepository;
import com.womensafety.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/sos")
public class SosController {

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final EmergencyContactRepository contactRepository;
    private final NotificationService notificationService;

    public SosController(IncidentRepository incidentRepository,
                         UserRepository userRepository,
                         EmergencyContactRepository contactRepository,
                         NotificationService notificationService) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
        this.contactRepository = contactRepository;
        this.notificationService = notificationService;
    }

    @PostMapping
    public ResponseEntity<?> sendSos(@Valid @RequestBody SosRequest request,
                                     Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();

        Incident sosIncident = new Incident(
                user,
                "SOS",
                request.getMessage(),
                request.getLatitude(),
                request.getLongitude()
        );

        incidentRepository.save(sosIncident);

        List<EmergencyContact> targets = request.getContactId() != null
                ? contactRepository.findById(request.getContactId())
                    .filter(contact -> contact.getUser().getId().equals(user.getId()))
                    .map(Collections::singletonList)
                    .orElse(Collections.emptyList())
                : contactRepository.findByUser(user);

        for (EmergencyContact contact : targets) {
            notificationService.sendEmergencyAlert(
                    contact,
                    request.getMessage(),
                    request.getLatitude(),
                    request.getLongitude()
            );
        }

        String message = targets.isEmpty()
                ? "SOS alert registered. No emergency contact was notified."
                : "SOS alert registered. Notified " + targets.size() + " contact(s).";

        return ResponseEntity.ok(new SosResponse(true, message, sosIncident.getId()));
    }
}