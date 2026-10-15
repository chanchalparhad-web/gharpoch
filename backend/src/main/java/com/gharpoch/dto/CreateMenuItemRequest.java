package com.gharpoch.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class CreateMenuItemRequest {
    @NotNull(message = "Category ID is required")
    private UUID categoryId;

    @NotBlank(message = "Dish name (Marathi) is required")
    private String nameMr;

    @NotBlank(message = "Dish name (English) is required")
    private String nameEn;

    private String descriptionMr;
    private String descriptionEn;

    @Min(value = 100, message = "Price must be at least ₹1 (100 paise)")
    private long pricePaise;

    private String imageUrl;
    private boolean veg = true;
    private String portionSize;
    private int sortOrder = 0;

    public CreateMenuItemRequest() {}

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

    public String getPortionSize() { return portionSize; }
    public void setPortionSize(String portionSize) { this.portionSize = portionSize; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
