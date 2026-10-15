package com.gharpoch.dto;

import java.util.UUID;

public class OrderItemResponse {
    private UUID id;
    private UUID menuItemId;
    private String itemNameMr;
    private String itemNameEn;
    private long unitPricePaise;
    private int quantity;
    private long lineTotalPaise;
    private String portionSize;

    public OrderItemResponse() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getMenuItemId() { return menuItemId; }
    public void setMenuItemId(UUID menuItemId) { this.menuItemId = menuItemId; }

    public String getItemNameMr() { return itemNameMr; }
    public void setItemNameMr(String itemNameMr) { this.itemNameMr = itemNameMr; }

    public String getItemNameEn() { return itemNameEn; }
    public void setItemNameEn(String itemNameEn) { this.itemNameEn = itemNameEn; }

    public long getUnitPricePaise() { return unitPricePaise; }
    public void setUnitPricePaise(long unitPricePaise) { this.unitPricePaise = unitPricePaise; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public long getLineTotalPaise() { return lineTotalPaise; }
    public void setLineTotalPaise(long lineTotalPaise) { this.lineTotalPaise = lineTotalPaise; }

    public String getPortionSize() { return portionSize; }
    public void setPortionSize(String portionSize) { this.portionSize = portionSize; }
}
