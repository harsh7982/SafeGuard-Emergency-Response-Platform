package com.womensafety.controller;

import com.womensafety.dto.ContactRequest;
import com.womensafety.dto.ContactResponse;
import com.womensafety.model.EmergencyContact;
import com.womensafety.model.User;
import com.womensafety.repository.EmergencyContactRepository;
import com.womensafety.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contacts")
public class EmergencyContactController {

    private final EmergencyContactRepository contactRepository;
    private final UserRepository userRepository;

    public EmergencyContactController(EmergencyContactRepository contactRepository,
                                      UserRepository userRepository) {
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    @GetMapping
    public ResponseEntity<List<ContactResponse>> getContacts(Authentication authentication) {
        User user = getCurrentUser(authentication);

        List<ContactResponse> contacts = contactRepository.findByUser(user).stream()
                .map(ContactResponse::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(contacts);
    }

    @PostMapping
    public ResponseEntity<ContactResponse> createContact(@Valid @RequestBody ContactRequest request,
                                                         Authentication authentication) {
        User user = getCurrentUser(authentication);

        EmergencyContact contact = new EmergencyContact(
                user,
                request.getName(),
                request.getPhoneNumber(),
                request.getRelationship()
        );

        contactRepository.save(contact);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ContactResponse(contact));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContactResponse> updateContact(@PathVariable Long id,
                                                         @Valid @RequestBody ContactRequest request,
                                                         Authentication authentication) {
        User user = getCurrentUser(authentication);

        EmergencyContact contact = contactRepository.findById(id)
                .filter(item -> item.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));

        contact.setName(request.getName());
        contact.setPhoneNumber(request.getPhoneNumber());
        contact.setRelationship(request.getRelationship());

        contactRepository.save(contact);
        return ResponseEntity.ok(new ContactResponse(contact));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id,
                                              Authentication authentication) {
        User user = getCurrentUser(authentication);

        EmergencyContact contact = contactRepository.findById(id)
                .filter(item -> item.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));

        contactRepository.delete(contact);
        return ResponseEntity.noContent().build();
    }
}