package com.womensafety.service;

import com.womensafety.model.EmergencyContact;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    public void sendEmergencyAlert(EmergencyContact contact, String message, Double latitude, Double longitude) {
        String locationUrl = String.format("https://maps.google.com/?q=%s,%s", latitude, longitude);
        logger.info("Emergency alert to {} ({}) at {}: {}. Map: {}",
                contact.getName(), contact.getPhoneNumber(), contact.getRelationship(), message, locationUrl);

        // TODO: replace this log with Twilio/SMS or email integration for production.
    }
}
