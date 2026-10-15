package com.gharpoch.dto;

public class UpdateItemAvailabilityRequest {
    private boolean available;

    public UpdateItemAvailabilityRequest() {}

    public UpdateItemAvailabilityRequest(boolean available) {
        this.available = available;
    }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
}
