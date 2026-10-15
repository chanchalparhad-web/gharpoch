package com.gharpoch.dto;

import jakarta.validation.constraints.NotBlank;

public class CompleteDeliveryRequest {
    @NotBlank(message = "4-digit delivery OTP is required")
    private String deliveryOtp;

    public CompleteDeliveryRequest() {}

    public CompleteDeliveryRequest(String deliveryOtp) {
        this.deliveryOtp = deliveryOtp;
    }

    public String getDeliveryOtp() { return deliveryOtp; }
    public void setDeliveryOtp(String deliveryOtp) { this.deliveryOtp = deliveryOtp; }
}
