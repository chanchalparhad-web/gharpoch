package com.gharpoch.dto;

public class DashboardStatsResponse {
    private long totalOrders;
    private long pendingOrders;
    private long activeRestaurants;
    private long availableDeliveryPartners;
    private long grossMerchandiseValuePaise;
    private long totalDeliveryFeesPaise;
    private long platformCommissionsPaise;

    public DashboardStatsResponse() {}

    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }

    public long getPendingOrders() { return pendingOrders; }
    public void setPendingOrders(long pendingOrders) { this.pendingOrders = pendingOrders; }

    public long getActiveRestaurants() { return activeRestaurants; }
    public void setActiveRestaurants(long activeRestaurants) { this.activeRestaurants = activeRestaurants; }

    public long getAvailableDeliveryPartners() { return availableDeliveryPartners; }
    public void setAvailableDeliveryPartners(long availableDeliveryPartners) { this.availableDeliveryPartners = availableDeliveryPartners; }

    public long getGrossMerchandiseValuePaise() { return grossMerchandiseValuePaise; }
    public void setGrossMerchandiseValuePaise(long grossMerchandiseValuePaise) { this.grossMerchandiseValuePaise = grossMerchandiseValuePaise; }

    public long getTotalDeliveryFeesPaise() { return totalDeliveryFeesPaise; }
    public void setTotalDeliveryFeesPaise(long totalDeliveryFeesPaise) { this.totalDeliveryFeesPaise = totalDeliveryFeesPaise; }

    public long getPlatformCommissionsPaise() { return platformCommissionsPaise; }
    public void setPlatformCommissionsPaise(long platformCommissionsPaise) { this.platformCommissionsPaise = platformCommissionsPaise; }
}
