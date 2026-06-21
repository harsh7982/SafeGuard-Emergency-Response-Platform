package com.womensafety.dto;

import com.womensafety.model.EmergencyContact;

public class ContactResponse {

    private Long id;
    private String name;
    private String phoneNumber;
    private String relationship;

    public ContactResponse(EmergencyContact contact) {
        this.id = contact.getId();
        this.name = contact.getName();
        this.phoneNumber = contact.getPhoneNumber();
        this.relationship = contact.getRelationship();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getRelationship() {
        return relationship;
    }
}
