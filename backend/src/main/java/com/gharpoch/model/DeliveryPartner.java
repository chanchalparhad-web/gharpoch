package com.gharpoch.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "delivery_partners")
public class DeliveryPartner {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_area_id")
    private ServiceArea serviceArea;

    @Column(name = "vehicle_type", length = 50)
    private String vehicleType = "Motorcycle";

    @Column(name = "vehicle_number", length = 30)
    private String vehicleNumber;

    @Column(name = "availability_status", nullable = false, length = 30)
    private String availabilityStatus = "ONLINE"; // ONLINE, BUSY, OFFLINE

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "total_deliveries", nullable = false)
    private int totalDeliveries = 0;

    @Column(name = "total_earnings_paise", nullable = false)
    private long totalEarningsPaise = 0L;

    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt = LocalDateTime.now();

    public DeliveryPartner() {}

    public DeliveryPartner(User user, ServiceArea serviceArea, String vehicleNumber) {
        this.user = user;
        this.serviceArea = serviceArea;
        this.vehicleNumber = vehicleNumber;
        this.availabilityStatus = "ONLINE";
        this.active = true;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public ServiceArea getServiceArea() { return serviceArea; }
    public void setServiceArea(ServiceArea serviceArea) { this.serviceArea = serviceArea; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getTotalDeliveries() { return totalDeliveries; }
    public void setTotalDeliveries(int totalDeliveries) { this.totalDeliveries = totalDeliveries; }

    public long getTotalEarningsPaise() { return totalEarningsPaise; }
    public void setTotalEarningsPaise(long totalEarningsPaise) { this.totalEarningsPaise = totalEarningsPaise; }

    public LocalDateTime getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(LocalDateTime lastActiveAt) { this.lastActiveAt = lastActiveAt; }
}
