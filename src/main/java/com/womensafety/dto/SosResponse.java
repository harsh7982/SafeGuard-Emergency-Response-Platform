package com.womensafety.dto;

public class SosResponse {

    private boolean success;
    private String message;
    private Long incidentId;

    public SosResponse(boolean success, String message, Long incidentId) {
        this.success = success;
        this.message = message;
        this.incidentId = incidentId;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public Long getIncidentId() {
        return incidentId;
    }
}