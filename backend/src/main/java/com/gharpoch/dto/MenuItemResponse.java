package com.gharpoch.dto;

import java.util.UUID;

public class MenuItemResponse {
    private UUID id;
    private UUID categoryId;
    private String nameMr;
    private String nameEn;
    private String descriptionMr;
    private String descriptionEn;
    private long pricePaise;
    private String imageUrl;
    private boolean veg;
    private boolean available;
    private String portionSize;
    private int sortOrder;

    public MenuItemResponse() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public String getNameMr() { return nameMr; }
    public void setNameMr(String nameMr) { this.nameMr = nameMr; }

    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public String getDescriptionMr() { return descriptionMr; }
    public void setDescriptionMr(String descriptionMr) { this.descriptionMr = descriptionMr; }

    public String getDescriptionEn() { return descriptionEn; }
    public void setDescriptionEn(String descriptionEn) { this.descriptionEn = descriptionEn; }

    public long getPricePaise() { return pricePaise; }
    public void setPricePaise(long pricePaise) { this.pricePaise = pricePaise; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public boolean isVeg() { return veg; }
    public void setVeg(boolean veg) { this.veg = veg; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public String getPortionSize() { return portionSize; }
    public void setPortionSize(String portionSize) { this.portionSize = portionSize; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
