package com.gharpoch.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class RestaurantDetailResponse {
    private UUID id;
    private String name;
    private String nameMr;
    private String village;
    private String address;
    private String contactPhone;
    private String coverImageUrl;
    private String logoUrl;
    private String openingTime;
    private String closingTime;
    private boolean open;
    private int prepTimeMinutes;
    private long minOrderPaise;
    private String cuisineTypes;
    private List<MenuCategoryResponse> categories = new ArrayList<>();

    public RestaurantDetailResponse() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

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

    public int getPrepTimeMinutes() { return prepTimeMinutes; }
    public void setPrepTimeMinutes(int prepTimeMinutes) { this.prepTimeMinutes = prepTimeMinutes; }

    public long getMinOrderPaise() { return minOrderPaise; }
    public void setMinOrderPaise(long minOrderPaise) { this.minOrderPaise = minOrderPaise; }

    public String getCuisineTypes() { return cuisineTypes; }
    public void setCuisineTypes(String cuisineTypes) { this.cuisineTypes = cuisineTypes; }

    public List<MenuCategoryResponse> getCategories() { return categories; }
    public void setCategories(List<MenuCategoryResponse> categories) { this.categories = categories; }
}
