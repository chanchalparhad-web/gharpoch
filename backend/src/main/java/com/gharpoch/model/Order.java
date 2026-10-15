package com.gharpoch.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "public_order_number", nullable = false, unique = true, length = 32)
    private String publicOrderNumber;

    @Column(name = "idempotency_key", length = 64)
    private String idempotencyKey;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 35)
    private OrderStatus status = OrderStatus.PLACED;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod = PaymentMethod.COD;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "subtotal_paise", nullable = false)
    private long subtotalPaise;

    @Column(name = "delivery_fee_paise", nullable = false)
    private long deliveryFeePaise;

    @Column(name = "platform_fee_paise", nullable = false)
    private long platformFeePaise = 500L; // ₹5

    @Column(name = "discount_paise", nullable = false)
    private long discountPaise = 0L;

    @Column(name = "total_paise", nullable = false)
    private long totalPaise;

    @Column(name = "customer_name_snapshot", nullable = false, length = 100)
    private String customerNameSnapshot;

    @Column(name = "customer_phone_snapshot", nullable = false, length = 20)
    private String customerPhoneSnapshot;

    @Column(name = "address_snapshot_json", columnDefinition = "TEXT", nullable = false)
    private String addressSnapshotJson;

    @Column(name = "restaurant_name_snapshot", nullable = false, length = 150)
    private String restaurantNameSnapshot;

    @Column(name = "restaurant_phone_snapshot", nullable = false, length = 20)
    private String restaurantPhoneSnapshot;

    @Column(name = "special_instructions", length = 500)
    private String specialInstructions;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "delivery_otp", length = 6)
    private String deliveryOtp;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_partner_id")
    private DeliveryPartner assignedPartner;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Order() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getPublicOrderNumber() { return publicOrderNumber; }
    public void setPublicOrderNumber(String publicOrderNumber) { this.publicOrderNumber = publicOrderNumber; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }

    public Restaurant getRestaurant() { return restaurant; }
    public void setRestaurant(Restaurant restaurant) { this.restaurant = restaurant; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

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

    public String getCustomerNameSnapshot() { return customerNameSnapshot; }
    public void setCustomerNameSnapshot(String customerNameSnapshot) { this.customerNameSnapshot = customerNameSnapshot; }

    public String getCustomerPhoneSnapshot() { return customerPhoneSnapshot; }
    public void setCustomerPhoneSnapshot(String customerPhoneSnapshot) { this.customerPhoneSnapshot = customerPhoneSnapshot; }

    public String getAddressSnapshotJson() { return addressSnapshotJson; }
    public void setAddressSnapshotJson(String addressSnapshotJson) { this.addressSnapshotJson = addressSnapshotJson; }

    public String getRestaurantNameSnapshot() { return restaurantNameSnapshot; }
    public void setRestaurantNameSnapshot(String restaurantNameSnapshot) { this.restaurantNameSnapshot = restaurantNameSnapshot; }

    public String getRestaurantPhoneSnapshot() { return restaurantPhoneSnapshot; }
    public void setRestaurantPhoneSnapshot(String restaurantPhoneSnapshot) { this.restaurantPhoneSnapshot = restaurantPhoneSnapshot; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public String getDeliveryOtp() { return deliveryOtp; }
    public void setDeliveryOtp(String deliveryOtp) { this.deliveryOtp = deliveryOtp; }

    public DeliveryPartner getAssignedPartner() { return assignedPartner; }
    public void setAssignedPartner(DeliveryPartner assignedPartner) { this.assignedPartner = assignedPartner; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
