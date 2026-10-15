package com.gharpoch.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class AssignDeliveryRequest {
    @NotNull(message = "partnerId is required")
    private UUID partnerId;

    public AssignDeliveryRequest() {}

    public AssignDeliveryRequest(UUID partnerId) {
        this.partnerId = partnerId;
    }

    public UUID getPartnerId() { return partnerId; }
    public void setPartnerId(UUID partnerId) { this.partnerId = partnerId; }
}
