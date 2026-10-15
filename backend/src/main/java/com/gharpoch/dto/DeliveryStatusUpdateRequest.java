package com.gharpoch.dto;

import jakarta.validation.constraints.NotBlank;

public class DeliveryStatusUpdateRequest {
    @NotBlank(message = "Availability status is required (ONLINE, OFFLINE)")
    private String availabilityStatus;

    public DeliveryStatusUpdateRequest() {}

    public DeliveryStatusUpdateRequest(String availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }
}
