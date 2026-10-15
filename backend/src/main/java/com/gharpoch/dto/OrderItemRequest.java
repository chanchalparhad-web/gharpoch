package com.gharpoch.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class OrderItemRequest {
    @NotNull(message = "menuItemId is required")
    private UUID menuItemId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;

    private String portionSize;

    public OrderItemRequest() {}

    public OrderItemRequest(UUID menuItemId, int quantity, String portionSize) {
        this.menuItemId = menuItemId;
        this.quantity = quantity;
        this.portionSize = portionSize;
    }

    public UUID getMenuItemId() { return menuItemId; }
    public void setMenuItemId(UUID menuItemId) { this.menuItemId = menuItemId; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public String getPortionSize() { return portionSize; }
    public void setPortionSize(String portionSize) { this.portionSize = portionSize; }
}
