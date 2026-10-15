package com.gharpoch.dto;

import jakarta.validation.constraints.NotBlank;

public class RejectOrderRequest {
    @NotBlank(message = "Rejection reason is required")
    private String reason;

    public RejectOrderRequest() {}

    public RejectOrderRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
