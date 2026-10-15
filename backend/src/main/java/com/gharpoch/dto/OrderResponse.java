package com.gharpoch.dto;

import java.util.List;
import java.util.UUID;

public class OrderResponse {
    private UUID id;
    private String publicOrderNumber;
    private UUID restaurantId;
    private String restaurantName;
    private String restaurantNameMr;
    private String restaurantPhone;
    private String status;
    private String statusDisplay;
    private String statusDisplayMr;
    private String paymentMethod;
    private String paymentStatus;
    private long subtotalPaise;
    private long deliveryFeePaise;
    private long platformFeePaise;
    private long discountPaise;
    private long totalPaise;
    private String customerName;
    private String customerPhone;
    private String village;
    private String addressLine;
    private String landmark;
    private String specialInstructions;
    private String cancellationReason;
    private String deliveryOtp;
    private String assignedPartnerName;
    private String assignedPartnerPhone;
    private List<OrderItemResponse> items;
    private String createdAt;
    private String updatedAt;

    public OrderResponse() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getPublicOrderNumber() { return publicOrderNumber; }
    public void setPublicOrderNumber(String publicOrderNumber) { this.publicOrderNumber = publicOrderNumber; }

    public UUID getRestaurantId() { return restaurantId; }
    public void setRestaurantId(UUID restaurantId) { this.restaurantId = restaurantId; }

    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }

    public String getRestaurantNameMr() { return restaurantNameMr; }
    public void setRestaurantNameMr(String restaurantNameMr) { this.restaurantNameMr = restaurantNameMr; }

    public String getRestaurantPhone() { return restaurantPhone; }
    public void setRestaurantPhone(String restaurantPhone) { this.restaurantPhone = restaurantPhone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getStatusDisplay() { return statusDisplay; }
    public void setStatusDisplay(String statusDisplay) { this.statusDisplay = statusDisplay; }

    public String getStatusDisplayMr() { return statusDisplayMr; }
    public void setStatusDisplayMr(String statusDisplayMr) { this.statusDisplayMr = statusDisplayMr; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public long getSubtotalPaise() { return subtotalPaise; }
    public void setSubtotalPaise(long subtotalPaise) { this.subtotalPaise = subtotalPaise; }

    public long getDeliveryFeePaise() { return deliveryFeePaise; }
    public void setDeliveryFeePaise(long deliveryFeePaise) { this.deliveryFeePaise = deliveryFeePaise; }

    public long getPlatformFeePaise() { return platformFeePaise; }
    public void setPlatformFeePaise(long platformFeePaise) { this.platformFeePaise = platformFeePaise; }

    public long getDiscountPaise() { return discountPaise; }
    public void setDiscountPaise(long discountPaise) { this.discountPaise = discountPaise; }

    public long getTotalPaise() { return totalPaise; }
    public void setTotalPaise(long totalPaise) { this.totalPaise = totalPaise; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getVillage() { return village; }
    public void setVillage(String village) { this.village = village; }

    public String getAddressLine() { return addressLine; }
    public void setAddressLine(String addressLine) { this.addressLine = addressLine; }

    public String getLandmark() { return landmark; }
    public void setLandmark(String landmark) { this.landmark = landmark; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public String getDeliveryOtp() { return deliveryOtp; }
    public void setDeliveryOtp(String deliveryOtp) { this.deliveryOtp = deliveryOtp; }

    public String getAssignedPartnerName() { return assignedPartnerName; }
    public void setAssignedPartnerName(String assignedPartnerName) { this.assignedPartnerName = assignedPartnerName; }

    public String getAssignedPartnerPhone() { return assignedPartnerPhone; }
    public void setAssignedPartnerPhone(String assignedPartnerPhone) { this.assignedPartnerPhone = assignedPartnerPhone; }

    public List<OrderItemResponse> getItems() { return items; }
    public void setItems(List<OrderItemResponse> items) { this.items = items; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
