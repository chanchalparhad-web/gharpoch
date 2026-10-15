package com.gharpoch.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class CreateRestaurantRequest {
    @NotBlank(message = "Restaurant name (English) is required")
    private String name;

    @NotBlank(message = "Restaurant name (Marathi) is required")
    private String nameMr;

    @NotBlank(message = "Village is required")
    private String village;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "Contact phone is required")
    private String contactPhone;

    private String openingTime = "10:30 AM";
    private String closingTime = "11:00 PM";
    private int prepTimeMinutes = 30;
    private long minOrderPaise = 10000L;
    private BigDecimal commissionPct = new BigDecimal("10.00");
    private String cuisineTypes = "Maharashtrian, Veg & Non-Veg";
    private String coverImageUrl;
    private String ownerPassword = "hotel123";

    public CreateRestaurantRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNameMr() { return nameMr; }
    public void setNameMr(String nameMr) { this.nameMr = nameMr; }

    public String getVillage() { return village; }
    public void setVillage(String village) { this.village = village; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getOpeningTime() { return openingTime; }
    public void setOpeningTime(String openingTime) { this.openingTime = openingTime; }

    public String getClosingTime() { return closingTime; }
    public void setClosingTime(String closingTime) { this.closingTime = closingTime; }

    public int getPrepTimeMinutes() { return prepTimeMinutes; }
    public void setPrepTimeMinutes(int prepTimeMinutes) { this.prepTimeMinutes = prepTimeMinutes; }

    public long getMinOrderPaise() { return minOrderPaise; }
    public void setMinOrderPaise(long minOrderPaise) { this.minOrderPaise = minOrderPaise; }

    public BigDecimal getCommissionPct() { return commissionPct; }
    public void setCommissionPct(BigDecimal commissionPct) { this.commissionPct = commissionPct; }

    public String getCuisineTypes() { return cuisineTypes; }
    public void setCuisineTypes(String cuisineTypes) { this.cuisineTypes = cuisineTypes; }

    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }

    public String getOwnerPassword() { return ownerPassword; }
    public void setOwnerPassword(String ownerPassword) { this.ownerPassword = ownerPassword; }
}
