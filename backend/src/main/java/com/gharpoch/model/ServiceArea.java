package com.gharpoch.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "service_areas")
public class ServiceArea {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "village_name", nullable = false, unique = true, length = 100)
    private String villageName;

    @Column(name = "village_name_mr", length = 100)
    private String villageNameMr;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "delivery_fee_paise", nullable = false)
    private long deliveryFeePaise = 3000L; // ₹30 default

    @Column(name = "min_order_paise", nullable = false)
    private long minOrderPaise = 10000L; // ₹100 default

    public ServiceArea() {}

    public ServiceArea(String villageName, String villageNameMr, long deliveryFeePaise, long minOrderPaise) {
        this.villageName = villageName;
        this.villageNameMr = villageNameMr;
        this.deliveryFeePaise = deliveryFeePaise;
        this.minOrderPaise = minOrderPaise;
        this.active = true;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getVillageName() { return villageName; }
    public void setVillageName(String villageName) { this.villageName = villageName; }

    public String getVillageNameMr() { return villageNameMr; }
    public void setVillageNameMr(String villageNameMr) { this.villageNameMr = villageNameMr; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public long getDeliveryFeePaise() { return deliveryFeePaise; }
    public void setDeliveryFeePaise(long deliveryFeePaise) { this.deliveryFeePaise = deliveryFeePaise; }

    public long getMinOrderPaise() { return minOrderPaise; }
    public void setMinOrderPaise(long minOrderPaise) { this.minOrderPaise = minOrderPaise; }
}
