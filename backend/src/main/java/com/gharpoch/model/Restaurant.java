package com.gharpoch.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "restaurants")
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "name_mr", nullable = false, length = 150)
    private String nameMr;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_area_id")
    private ServiceArea serviceArea;

    @Column(nullable = false, length = 100)
    private String village;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(name = "contact_phone", nullable = false, length = 20)
    private String contactPhone;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "opening_time", length = 20)
    private String openingTime = "10:00 AM";

    @Column(name = "closing_time", length = 20)
    private String closingTime = "11:00 PM";

    @Column(name = "is_open", nullable = false)
    private boolean open = true;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "prep_time_minutes", nullable = false)
    private int prepTimeMinutes = 30;

    @Column(name = "commission_pct", precision = 5, scale = 2, nullable = false)
    private BigDecimal commissionPct = new BigDecimal("10.00"); // 10% commission

    @Column(name = "min_order_paise", nullable = false)
    private long minOrderPaise = 10000L; // ₹100

    @Column(name = "cuisine_types", length = 200)
    private String cuisineTypes = "Maharashtrian, Veg & Non-Veg";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Restaurant() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNameMr() { return nameMr; }
    public void setNameMr(String nameMr) { this.nameMr = nameMr; }

    public ServiceArea getServiceArea() { return serviceArea; }
    public void setServiceArea(ServiceArea serviceArea) { this.serviceArea = serviceArea; }

    public String getVillage() { return village; }
    public void setVillage(String village) { this.village = village; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getOpeningTime() { return openingTime; }
    public void setOpeningTime(String openingTime) { this.openingTime = openingTime; }

    public String getClosingTime() { return closingTime; }
    public void setClosingTime(String closingTime) { this.closingTime = closingTime; }

    public boolean isOpen() { return open; }
    public void setOpen(boolean open) { this.open = open; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getPrepTimeMinutes() { return prepTimeMinutes; }
    public void setPrepTimeMinutes(int prepTimeMinutes) { this.prepTimeMinutes = prepTimeMinutes; }

    public BigDecimal getCommissionPct() { return commissionPct; }
    public void setCommissionPct(BigDecimal commissionPct) { this.commissionPct = commissionPct; }

    public long getMinOrderPaise() { return minOrderPaise; }
    public void setMinOrderPaise(long minOrderPaise) { this.minOrderPaise = minOrderPaise; }

    public String getCuisineTypes() { return cuisineTypes; }
    public void setCuisineTypes(String cuisineTypes) { this.cuisineTypes = cuisineTypes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
