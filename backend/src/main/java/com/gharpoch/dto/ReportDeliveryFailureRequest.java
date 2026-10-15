package com.gharpoch.dto;

import jakarta.validation.constraints.NotBlank;

public class ReportDeliveryFailureRequest {
    @NotBlank(message = "Failure reason is required")
    private String reason;

    public ReportDeliveryFailureRequest() {}

    public ReportDeliveryFailureRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
