package com.gharpoch.dto;

import jakarta.validation.constraints.Min;

public class AcceptOrderRequest {
    @Min(value = 10, message = "Preparation time must be at least 10 minutes")
    private int estimatedPrepMinutes = 30;

    public AcceptOrderRequest() {}

    public AcceptOrderRequest(int estimatedPrepMinutes) {
        this.estimatedPrepMinutes = estimatedPrepMinutes;
    }

    public int getEstimatedPrepMinutes() { return estimatedPrepMinutes; }
    public void setEstimatedPrepMinutes(int estimatedPrepMinutes) { this.estimatedPrepMinutes = estimatedPrepMinutes; }
}
