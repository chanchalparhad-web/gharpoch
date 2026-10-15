package com.gharpoch.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AdminOverrideOrderRequest {
    @NotNull(message = "New order status is required")
    private String newStatus;

    @NotBlank(message = "Mandatory override reason must be recorded for audit")
    private String reason;

    public AdminOverrideOrderRequest() {}

    public AdminOverrideOrderRequest(String newStatus, String reason) {
        this.newStatus = newStatus;
        this.reason = reason;
    }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
